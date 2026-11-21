import { Kafka, Producer, Consumer } from "kafkajs";
import { EventEmitter } from "events";

export const KAFKA_TOPICS = {
  CUSTOMER_CREATED: "buno.customer.created",
  CUSTOMER_UPDATED: "buno.customer.updated",
  INVOICE_CREATED: "buno.invoice.created",
  INVOICE_UPDATED: "buno.invoice.updated",
  INVOICE_PAID: "buno.invoice.paid",
  AI_INVOICE_GENERATED: "buno.ai.invoice.generated",
  EXPORT_REQUESTED: "buno.export.requested",
} as const;

export type KafkaTopic = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS];

export interface KafkaEventMessage<T = any> {
  topic: KafkaTopic;
  key?: string;
  value: T;
  timestamp: string;
  partition?: number;
  headers?: Record<string, string>;
}

// In-process resilient EventBus emitter for high-throughput task parallelization
class InternalKafkaBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
}

const globalForKafka = globalThis as unknown as {
  kafkaBus?: InternalKafkaBus;
  kafkaProducer?: Producer;
  kafkaConsumer?: Consumer;
  isConsumerRunning?: boolean;
};

export const internalBus = globalForKafka.kafkaBus ?? new InternalKafkaBus();
if (process.env.NODE_ENV !== "production") globalForKafka.kafkaBus = internalBus;

// KafkaJS Client initialization if broker host is configured in .env
const kafkaBrokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(",") : null;
const kafkaClient = kafkaBrokers
  ? new Kafka({
      clientId: "buno-invoice-service",
      brokers: kafkaBrokers,
      connectionTimeout: 3000,
      retry: { retries: 2 },
    })
  : null;

/**
 * Publish a message to a Kafka topic.
 * Dispatches to external Kafka brokers (if configured) AND internal parallel worker pool.
 */
export async function produceKafkaEvent<T>(
  topic: KafkaTopic,
  value: T,
  key?: string
): Promise<void> {
  const event: KafkaEventMessage<T> = {
    topic,
    key: key || (typeof (value as any)?.id === "string" ? (value as any).id : undefined),
    value,
    timestamp: new Date().toISOString(),
    partition: 0,
    headers: {
      source: "buno-app",
      contentType: "application/json",
    },
  };

  // 1. Dispatch to in-process subscribers asynchronously in parallel (non-blocking)
  setImmediate(() => {
    internalBus.emit(topic, event);
    internalBus.emit("*", event);
  });

  // 2. Dispatch to external Kafka cluster if configured
  if (kafkaClient) {
    try {
      if (!globalForKafka.kafkaProducer) {
        globalForKafka.kafkaProducer = kafkaClient.producer();
        await globalForKafka.kafkaProducer.connect();
      }
      await globalForKafka.kafkaProducer.send({
        topic,
        messages: [
          {
            key: event.key,
            value: JSON.stringify(event.value),
            timestamp: event.timestamp,
            headers: event.headers,
          },
        ],
      });
    } catch (err) {
      console.warn(`[Kafka] Warning: Failed to publish message to external broker for topic ${topic}:`, err);
    }
  }
}

/**
 * Subscribe a worker to a Kafka topic for parallel background task execution.
 */
export function subscribeKafkaTopic<T = any>(
  topic: KafkaTopic | "*",
  handler: (message: KafkaEventMessage<T>) => Promise<void> | void
): () => void {
  const listener = (event: KafkaEventMessage<T>) => {
    // Run handler in background worker context without unhandled rejections
    Promise.resolve(handler(event)).catch((err) => {
      console.error(`[Kafka Worker] Error handling event on topic ${event.topic}:`, err);
    });
  };

  internalBus.on(topic, listener);
  return () => {
    internalBus.off(topic, listener);
  };
}

// Register default parallel background workers
if (!globalForKafka.isConsumerRunning) {
  globalForKafka.isConsumerRunning = true;

  // Worker 1: Parallel audit and metric collector
  subscribeKafkaTopic(KAFKA_TOPICS.CUSTOMER_CREATED, async (event) => {
    console.log(`[Kafka:Worker:CustomerCreated] New customer processed: ${event.value?.name} (${event.key})`);
  });

  // Worker 2: AI Invoice generation parallel handler
  subscribeKafkaTopic(KAFKA_TOPICS.AI_INVOICE_GENERATED, async (event) => {
    console.log(`[Kafka:Worker:AIGenerated] Invoice prompt parsed. Items count: ${event.value?.items?.length || 0}`);
  });

  // Worker 3: Invoice Lifecycle parallel handler
  subscribeKafkaTopic(KAFKA_TOPICS.INVOICE_CREATED, async (event) => {
    console.log(`[Kafka:Worker:InvoiceCreated] Invoice generated: ${event.value?.invoiceNumber} (${event.value?.currency} ${event.value?.total})`);
  });
}
