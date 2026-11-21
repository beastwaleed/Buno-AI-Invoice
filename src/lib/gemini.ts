import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

async function generateWithFallback(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!genAI) throw new Error("No Gemini client initialized");

  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([systemPrompt, userPrompt]);
      return result.response.text().trim();
    } catch (e: any) {
      lastError = e;
      // continue to next model on 503 or 404
      if (e.message?.includes("503") || e.message?.includes("404")) {
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}
export const AIInvoiceSchema = z.object({
  customerName: z.string().default("Valued Client"),
  customerEmail: z.string().optional(),
  customerAddress: z.string().optional(),
  currency: z.string().default("USD"),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  taxRate: z.number().default(0),
  discount: z.number().default(0),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().default(1),
      unit: z.string().default("unit"),
      unitPrice: z.number().default(0),
    })
  ),
});

export type AIInvoiceParsed = z.infer<typeof AIInvoiceSchema>;

/**
 * 1. Prompt-to-Invoice: Extracts structured invoice data from prompt text
 */
export async function parsePromptToInvoice(
  prompt: string,
  userCurrency: string = "USD"
): Promise<AIInvoiceParsed> {
  if (!genAI) {
    // Intelligent fallback parser when API key isn't provided yet
    return fallbackPromptParser(prompt, userCurrency);
  }

  try {
    const systemPrompt = `You are an expert financial and billing AI assistant.
Extract structured invoice details from this natural language description into valid JSON conforming exactly to this structure:
{
  "customerName": "Client or Company name",
  "customerEmail": "email if mentioned",
  "customerAddress": "address if mentioned",
  "currency": "USD, EUR, GBP, PKR, INR, etc.",
  "invoiceNumber": "optional number if mentioned",
  "dueDate": "YYYY-MM-DD or relative like '14 days'",
  "paymentTerms": "e.g. Due in 14 days",
  "taxRate": 0,
  "discount": 0,
  "notes": "Thank you note or instructions",
  "items": [
    {
      "description": "Item or service name",
      "quantity": 1,
      "unit": "hrs, project, unit, etc",
      "unitPrice": 100
    }
  ]
}

DO NOT include any markdown code fence backticks (\`\`\`json or \`\`\`). Return ONLY valid raw JSON text. Default currency is ${userCurrency}.`;

    const text = await generateWithFallback(systemPrompt, `User Prompt: "${prompt}"`);
    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const rawJson = JSON.parse(cleanedText);
    return AIInvoiceSchema.parse(rawJson);
  } catch (error) {
    console.warn("Gemini API call failed or unconfigured, falling back to local extractor:", error);
    return fallbackPromptParser(prompt, userCurrency);
  }
}

/**
 * 2. Improve Item Description
 */
export async function improveDescription(rawDescription: string): Promise<string> {
  if (!genAI) {
    return `${rawDescription} — professional deliverable including QA review, documentation, and stakeholder alignment.`;
  }

  try {
    const prompt = `Rewrite this invoice item description to sound highly professional, crisp, and standard in B2B consulting/services invoices. Keep it concise (1 to 2 sentences max). Do not use quotation marks or preambles.
Original: "${rawDescription}"`;

    const text = await generateWithFallback(
      "You are a professional B2B invoicing copywriter. Output only the improved description.",
      prompt
    );
    return text.replace(/^["']|["']$/g, "");
  } catch {
    return `${rawDescription} — professional implementation and deliverable handover.`;
  }
}

/**
 * 3. Payment Reminder Writing
 */
export async function generatePaymentReminder(
  tone: "polite" | "whatsapp" | "friendly" | "firm",
  invoiceData: {
    invoiceNumber: string;
    customerName: string;
    totalFormatted: string;
    dueDateFormatted: string;
    businessName: string;
  }
): Promise<string> {
  if (!genAI) {
    switch (tone) {
      case "polite":
        return `Dear ${invoiceData.customerName},\n\nWe hope this message finds you well. This is a gentle reminder that invoice ${invoiceData.invoiceNumber} for the amount of ${invoiceData.totalFormatted} is due on ${invoiceData.dueDateFormatted}.\n\nPlease let us know if you need any additional details or assistance.\n\nWarm regards,\n${invoiceData.businessName}`;
      case "whatsapp":
        return `Hi ${invoiceData.customerName}! 👋 Hope you're doing well. Just a quick heads up regarding invoice ${invoiceData.invoiceNumber} (${invoiceData.totalFormatted}), due on ${invoiceData.dueDateFormatted}. Let us know if you need anything from our end! Thanks, ${invoiceData.businessName}`;
      case "friendly":
        return `Hey ${invoiceData.customerName},\n\nHope you're having a productive week! Just following up regarding invoice ${invoiceData.invoiceNumber} (${invoiceData.totalFormatted}) due on ${invoiceData.dueDateFormatted}.\n\nThank you so much for your partnership!\n\nBest,\n${invoiceData.businessName}`;
      case "firm":
        return `Attention: ${invoiceData.customerName},\n\nInvoice ${invoiceData.invoiceNumber} in the amount of ${invoiceData.totalFormatted} was due on ${invoiceData.dueDateFormatted} and is currently outstanding. Kindly remit payment at your earliest convenience or reply with payment confirmation.\n\nSincerely,\n${invoiceData.businessName}`;
    }
  }

  try {
    const prompt = `Draft a ${tone} payment reminder for:
Invoice Number: ${invoiceData.invoiceNumber}
Customer: ${invoiceData.customerName}
Amount: ${invoiceData.totalFormatted}
Due Date: ${invoiceData.dueDateFormatted}
Sender Business: ${invoiceData.businessName}

Tone requirements:
- polite: Courteous corporate email format
- whatsapp: Short, modern conversational message with emojis
- friendly: Warm and collaborative check-in
- firm: Professional, formal overdue reminder highlighting terms

Return ONLY the message body.`;

    const text = await generateWithFallback(
      "You are a professional receivables and billing manager.",
      prompt
    );
    return text;
  } catch {
    return `Dear ${invoiceData.customerName},\n\nThis is a reminder regarding invoice ${invoiceData.invoiceNumber} (${invoiceData.totalFormatted}) due on ${invoiceData.dueDateFormatted}.\n\nBest regards,\n${invoiceData.businessName}`;
  }
}

/**
 * Fallback parser for natural language prompts when Gemini key is not yet set
 */
function fallbackPromptParser(prompt: string, defaultCurrency: string): AIInvoiceParsed {
  const p = prompt.toLowerCase();
  
  // Extract currency
  let currency = defaultCurrency;
  if (p.includes("usd") || p.includes("$") || p.includes("dollar")) currency = "USD";
  else if (p.includes("eur") || p.includes("€") || p.includes("euro")) currency = "EUR";
  else if (p.includes("gbp") || p.includes("£") || p.includes("pound")) currency = "GBP";
  else if (p.includes("pkr") || p.includes("rs") || p.includes("rupee")) currency = "PKR";
  else if (p.includes("inr")) currency = "INR";

  // Extract customer name
  let customerName = "Client Partner";
  const forMatch = prompt.match(/for\s+([A-Za-z0-9\s&]+?)(?:\.|\,|\band\b|three|two|one|\d|\$|at)/i);
  if (forMatch && forMatch[1].trim().length > 2) {
    customerName = forMatch[1].trim();
  }

  // Extract tax
  let taxRate = 0;
  const taxMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*tax/i);
  if (taxMatch) {
    taxRate = parseFloat(taxMatch[1]);
  }

  // Extract items
  const items = [];
  const regex = /(?:(\d+)\s+)?([A-Za-z\s]+?)\s+(?:at|for|@|costing)\s+(?:rs|usd|\$|€|£)?\s*([\d,]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(prompt)) !== null) {
    const qty = match[1] ? parseInt(match[1]) : 1;
    const desc = match[2].trim();
    const price = parseFloat(match[3].replace(/,/g, ""));
    if (desc && !isNaN(price)) {
      items.push({
        description: desc.charAt(0).toUpperCase() + desc.slice(1),
        quantity: qty,
        unit: qty > 1 ? "units" : "project",
        unitPrice: price,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      description: prompt.slice(0, 80) || "Professional Consulting Services",
      quantity: 1,
      unit: "project",
      unitPrice: 1500,
    });
  }

  return {
    customerName,
    currency,
    taxRate,
    discount: 0,
    paymentTerms: "Due in 14 days",
    notes: "Generated with Buno AI. Please review line items and totals before sending.",
    items,
  };
}
