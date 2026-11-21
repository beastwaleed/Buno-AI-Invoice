export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "cancelled";

export type TemplateId =
  | "modern"
  | "minimal"
  | "classic"
  | "elegant"
  | "corporate"
  | "compact";

export interface BusinessProfileData {
  id?: string;
  businessName: string;
  ownerName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  registrationNumber?: string | null;
  bankDetails?: string | null;
  paymentInstructions?: string | null;
  defaultCurrency?: string;
  defaultTaxRate?: number;
  defaultPaymentTerms?: string;
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
}

export interface CustomerData {
  id?: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  notes?: string | null;
}

export interface InvoiceItemData {
  id?: string;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
  sortOrder?: number;
}

export interface InvoicePaymentData {
  id?: string;
  amount: number;
  paymentDate: string | Date;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
}

export interface InvoiceData {
  id?: string;
  userId?: string;
  customerId?: string | null;
  invoiceNumber: string;
  templateId: TemplateId | string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  discount: number;
  discountType: "percentage" | "fixed";
  taxRate: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string | null;
  paymentTerms?: string | null;

  business: BusinessProfileData;
  customer?: CustomerData | null;
  items: InvoiceItemData[];
  payments?: InvoicePaymentData[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface TemplateDefinition {
  slug: TemplateId | string;
  name: string;
  description: string;
  previewImage?: string;
  accentColor?: string;
  fontStyle?: "serif" | "sans" | "mono";
}
