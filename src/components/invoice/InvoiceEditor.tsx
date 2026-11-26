"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Save,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Building,
  Building2,
  Upload,
  User,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Crop as CropIcon,
  Type,
  RotateCcw,
  Sliders,
  X,
  MoveDiagonal2,
} from "lucide-react";
import { toast } from "sonner";
import { InvoiceData, InvoiceItemData, CustomerData, TemplateId } from "@/types/invoice";
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/calculations";
import { InvoiceRenderer, TEMPLATE_LIST } from "@/components/templates";
import { ExportMenu } from "@/components/ExportMenu";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ImageCropModal } from "@/components/common/ImageCropModal";
import { CURRENCIES } from "@/lib/currencies";
import { VoiceAssistantButton } from "@/components/invoice/VoiceAssistantButton";

export type CategoryKey = "logo" | "header" | "body" | "table" | "total";

export const FONT_CATEGORIES = [
  {
    key: "logo" as const,
    label: "Business Logo",
    sub: "Company logo size & visual prominence",
    presets: [0.75, 1.0, 1.25, 1.5],
  },
  {
    key: "header" as const,
    label: "Header & Title",
    sub: "Invoice title, company name, invoice #",
    presets: [1.0, 1.15, 1.3, 1.5],
  },
  {
    key: "body" as const,
    label: "Body & Addresses",
    sub: "Billed to, dates, metadata, contact info",
    presets: [0.9, 1.0, 1.15, 1.3],
  },
  {
    key: "table" as const,
    label: "Table & Items",
    sub: "Line item descriptions, rates, totals",
    presets: [0.9, 1.0, 1.15, 1.3],
  },
  {
    key: "total" as const,
    label: "Totals & Summary",
    sub: "Subtotal, tax, balance due, terms",
    presets: [0.9, 1.0, 1.15, 1.3],
  },
];

interface InvoiceEditorProps {
  initialInvoice?: InvoiceData;
  customers: CustomerData[];
  businessProfile: any;
  isNew?: boolean;
  initialTemplate?: string;
  initialMode?: string;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  initialInvoice,
  customers: initialCustomers,
  businessProfile,
  isNew = false,
  initialTemplate,
  initialMode,
}) => {
  const router = useRouter();

  // Mobile Tab view: 'edit' or 'preview'
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [customers, setCustomers] = useState<CustomerData[]>(initialCustomers || []);
  const [isSaving, setIsSaving] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fontPanelOpen, setFontPanelOpen] = useState(false);
  const [fontModalOpen, setFontModalOpen] = useState(false);

  // Active selected category for on-canvas visual drag resizing
  const [activeVisualCat, setActiveVisualCat] = useState<CategoryKey | null>(null);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [selectedBox, setSelectedBox] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const handleUpdateFontSize = (
    category: CategoryKey,
    delta: number
  ) => {
    setInvoice((prev) => {
      const current = prev.fontSizeConfig || {
        logo: 1.0,
        header: 1.0,
        body: 1.0,
        table: 1.0,
        total: 1.0,
      };
      const currentVal = current[category] || 1.0;
      const nextVal = Math.max(0.55, Math.min(2.1, Math.round((currentVal + delta) * 20) / 20));
      return {
        ...prev,
        fontSizeConfig: {
          ...current,
          [category]: nextVal,
        },
      };
    });
  };

  const handleSetCategoryScale = (
    category: CategoryKey,
    scale: number
  ) => {
    setInvoice((prev) => ({
      ...prev,
      fontSizeConfig: {
        ...(prev.fontSizeConfig || {
          logo: 1.0,
          header: 1.0,
          body: 1.0,
          table: 1.0,
          total: 1.0,
        }),
        [category]: Math.round(scale * 100) / 100,
      },
    }));
  };

  const handleResetFontSizes = () => {
    setInvoice((prev) => ({
      ...prev,
      fontSizeConfig: { logo: 1.0, header: 1.0, body: 1.0, table: 1.0, total: 1.0 },
    }));
    toast.success("All sizes reset to 100%");
  };

  // Auto-calculate exact scale to fit mobile or desktop screen width without overflow
  const handleFitScreen = () => {
    if (typeof window !== "undefined") {
      const screenW = window.innerWidth;
      const availableW = screenW < 1024 ? screenW - 36 : 560;
      const fit = Math.min(100, Math.max(38, Math.floor((availableW / 760) * 100)));
      setZoomLevel(fit);
    }
  };

  useEffect(() => {
    handleFitScreen();
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        handleFitScreen();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // AI Modal States
  const [aiModalOpen, setAiModalOpen] = useState(initialMode === "ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStepMessage, setAiStepMessage] = useState("Analyzing request...");
  const [polishingIndex, setPolishingIndex] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Inline New Customer modal state
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustTaxNumber, setNewCustTaxNumber] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Master Invoice Form State
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    if (initialInvoice) {
      return {
        ...initialInvoice,
        templateId:
          initialInvoice.templateId === "modern" || initialInvoice.templateId === "elegant"
            ? "classic"
            : initialInvoice.templateId,
        fontSizeConfig: {
          logo: initialInvoice.fontSizeConfig?.logo ?? 1.0,
          header: initialInvoice.fontSizeConfig?.header ?? 1.0,
          body: initialInvoice.fontSizeConfig?.body ?? 1.0,
          table: initialInvoice.fontSizeConfig?.table ?? 1.0,
          total: initialInvoice.fontSizeConfig?.total ?? 1.0,
        },
        business: {
          ...initialInvoice.business,
          businessName: initialInvoice.business?.businessName || businessProfile?.businessName || "My Business",
          logoUrl: initialInvoice.business?.logoUrl || businessProfile?.logoUrl || "",
        },
      };
    }

    const defaultCurrency = businessProfile?.defaultCurrency || "USD";
    const defaultTax = businessProfile?.defaultTaxRate || 0;
    const defaultTerms = businessProfile?.defaultPaymentTerms || "Net 14 Days";
    const prefix = businessProfile?.invoicePrefix || "INV-";
    const nextNum = businessProfile?.nextInvoiceNumber || 1001;

    const defaultItems: InvoiceItemData[] = [
      {
        description: "Website Design & Development Services",
        quantity: 1,
        unit: "project",
        unitPrice: 2500,
        discount: 0,
        taxRate: defaultTax,
        lineTotal: 2500,
        sortOrder: 1,
      },
    ];

    const totals = calculateInvoiceTotals(defaultItems, 0, "percentage", defaultTax, 0);

    return {
      invoiceNumber: `${prefix}${nextNum}`,
      templateId: (initialTemplate as TemplateId) || businessProfile?.defaultTemplate || "classic",
      fontSizeConfig: {
        logo: 1.0,
        header: 1.0,
        body: 1.0,
        table: 1.0,
        total: 1.0,
      },
      status: "draft",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      currency: defaultCurrency,
      subtotal: totals.subtotal,
      discount: 0,
      discountType: "percentage",
      taxRate: defaultTax,
      taxTotal: totals.taxTotal,
      total: totals.grandTotal,
      amountPaid: 0,
      balanceDue: totals.balanceDue,
      notes: "Thank you for choosing to partner with us! Please reach out if you have any questions.",
      paymentTerms: defaultTerms,
      business: {
        ...(businessProfile || {}),
        businessName: businessProfile?.businessName || "My Business",
        logoUrl: businessProfile?.logoUrl || "",
        email: businessProfile?.email || "billing@example.com",
      },
      customer: customers[0] || null,
      customerId: customers[0]?.id || "",
      items: defaultItems,
    };
  });

  const isFontCustomized =
    Boolean(invoice.fontSizeConfig) &&
    ((invoice.fontSizeConfig?.logo ?? 1.0) !== 1.0 ||
      (invoice.fontSizeConfig?.header ?? 1.0) !== 1.0 ||
      (invoice.fontSizeConfig?.body ?? 1.0) !== 1.0 ||
      (invoice.fontSizeConfig?.table ?? 1.0) !== 1.0 ||
      (invoice.fontSizeConfig?.total ?? 1.0) !== 1.0);

  // Measure and position visual bounding box around selected category on canvas
  const updateSelectedBox = React.useCallback(() => {
    if (!activeVisualCat) {
      setSelectedBox(null);
      return;
    }
    const container = document.getElementById("invoice-preview-document");
    if (!container) return;

    const target = container.querySelector(
      `[data-invoice-cat="${activeVisualCat}"]`
    ) as HTMLElement | null;

    if (!target) {
      setSelectedBox(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const scale = Math.max(0.35, (zoomLevel || 100) / 100);
    const padding = 4;
    const top = Math.max(0, (targetRect.top - containerRect.top) / scale - padding);
    const left = Math.max(0, (targetRect.left - containerRect.left) / scale - padding);
    const width = targetRect.width / scale + padding * 2;
    const height = targetRect.height / scale + padding * 2;

    setSelectedBox({ top, left, width, height });
  }, [activeVisualCat, zoomLevel, invoice.fontSizeConfig, invoice.templateId]);

  useEffect(() => {
    updateSelectedBox();
    const timer = setTimeout(updateSelectedBox, 40);
    window.addEventListener("resize", updateSelectedBox);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateSelectedBox);
    };
  }, [updateSelectedBox]);

  const handleDragHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!activeVisualCat) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialScale =
      invoice.fontSizeConfig?.[activeVisualCat] || 1.0;

    setIsDraggingHandle(true);
    const zoomFactor = Math.max(0.35, (zoomLevel || 100) / 100);

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaX = moveEvt.clientX - startX;
      const deltaY = moveEvt.clientY - startY;
      const delta = (deltaX + deltaY) / (150 * zoomFactor);
      const newScale = Math.max(
        0.55,
        Math.min(2.1, Math.round((initialScale + delta) * 20) / 20)
      );

      setInvoice((prev) => ({
        ...prev,
        fontSizeConfig: {
          ...(prev.fontSizeConfig || {
            logo: 1.0,
            header: 1.0,
            body: 1.0,
            table: 1.0,
            total: 1.0,
          }),
          [activeVisualCat]: newScale,
        },
      }));
    };

    const onPointerUp = () => {
      setIsDraggingHandle(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handlePreviewDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest("[data-invoice-cat]") as HTMLElement | null;
    if (target) {
      const cat = target.getAttribute("data-invoice-cat") as CategoryKey | null;
      if (cat) {
        setActiveVisualCat(cat);
        return;
      }
    }
  };

  // Recompute deterministic totals on any item or tax/discount change
  const recalculate = (
    items: InvoiceItemData[],
    discount: number,
    discountType: "percentage" | "fixed",
    taxRate: number,
    amountPaid: number
  ) => {
    const updatedItems = items.map((item) => ({
      ...item,
      lineTotal: calculateLineTotal(item),
    }));

    const totals = calculateInvoiceTotals(
      updatedItems,
      discount,
      discountType,
      taxRate,
      amountPaid
    );

    setInvoice((prev) => ({
      ...prev,
      items: updatedItems,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.grandTotal,
      balanceDue: totals.balanceDue,
    }));
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [editorCropModalOpen, setEditorCropModalOpen] = useState(false);
  const [editorSelectedImageForCrop, setEditorSelectedImageForCrop] = useState<string>("");

  const handleEditorLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Logo file size must be less than 10MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setEditorSelectedImageForCrop(objectUrl);
    setEditorCropModalOpen(true);
    e.target.value = "";
  };

  const handleEditorReCrop = () => {
    if (!invoice.business?.logoUrl) return;
    setEditorSelectedImageForCrop(invoice.business.logoUrl);
    setEditorCropModalOpen(true);
  };

  const handleEditorApplyCroppedLogo = async (croppedFile: File) => {
    setIsUploadingLogo(true);
    const uploadToast = toast.loading("Uploading cropped logo...");

    try {
      const formData = new FormData();
      formData.append("file", croppedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        const newLogoUrl = data.url;
        setInvoice((prev) => ({
          ...prev,
          business: {
            ...prev.business,
            logoUrl: newLogoUrl,
          },
        }));

        // Persist logo to business profile in database
        await fetch("/api/business-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(businessProfile || {}),
            businessName: invoice.business?.businessName || businessProfile?.businessName || "My Business",
            logoUrl: newLogoUrl,
          }),
        });

        toast.success("Logo cropped and updated!", { id: uploadToast });
      } else {
        toast.error(data.error || "Failed to upload logo", { id: uploadToast });
      }
    } catch {
      toast.error("Upload failed. Please try again.", { id: uploadToast });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleEditorRemoveLogo = async () => {
    setInvoice((prev) => ({
      ...prev,
      business: {
        ...prev.business,
        logoUrl: "",
      },
    }));

    try {
      await fetch("/api/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(businessProfile || {}),
          logoUrl: "",
        }),
      });
      toast.success("Logo removed");
    } catch {
      // Ignored
    }
  };

  // Item handlers
  const handleItemChange = (index: number, field: keyof InvoiceItemData, value: any) => {
    const newItems = [...invoice.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    recalculate(
      newItems,
      invoice.discount,
      invoice.discountType,
      invoice.taxRate,
      invoice.amountPaid
    );
  };

  const addItem = () => {
    const newItem: InvoiceItemData = {
      description: "",
      quantity: 1,
      unit: "hrs",
      unitPrice: 0,
      discount: 0,
      taxRate: invoice.taxRate,
      lineTotal: 0,
      sortOrder: invoice.items.length + 1,
    };
    const newItems = [...invoice.items, newItem];
    recalculate(
      newItems,
      invoice.discount,
      invoice.discountType,
      invoice.taxRate,
      invoice.amountPaid
    );
  };

  const removeItem = (index: number) => {
    if (invoice.items.length <= 1) {
      toast.error("Invoice must have at least one line item.");
      return;
    }
    const newItems = invoice.items.filter((_, i) => i !== index);
    recalculate(
      newItems,
      invoice.discount,
      invoice.discountType,
      invoice.taxRate,
      invoice.amountPaid
    );
  };

  const duplicateItem = (index: number) => {
    const itemToDup = invoice.items[index];
    const duplicated: InvoiceItemData = {
      ...itemToDup,
      id: undefined,
      description: `${itemToDup.description} (Copy)`,
    };
    const newItems = [
      ...invoice.items.slice(0, index + 1),
      duplicated,
      ...invoice.items.slice(index + 1),
    ];
    recalculate(
      newItems,
      invoice.discount,
      invoice.discountType,
      invoice.taxRate,
      invoice.amountPaid
    );
  };

  // Polish item description via AI
  const handlePolishDescription = async (index: number) => {
    const current = invoice.items[index]?.description;
    if (!current || current.trim().length < 3) {
      toast.error("Please enter a short description to improve.");
      return;
    }

    setPolishingIndex(index);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "improve-description",
          description: current,
        }),
      });
      const data = await res.json();
      if (data.improved) {
        handleItemChange(index, "description", data.improved);
        toast.success("Description enhanced with AI!");
      }
    } catch {
      toast.error("Could not enhance description.");
    } finally {
      setPolishingIndex(null);
    }
  };

  // AI Prompt-to-Invoice Generation
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter an invoice description.");
      return;
    }

    setAiLoading(true);
    setAiProgress(18);
    setAiStepMessage("Analyzing natural language specifications...");

    // Staged progress ticker to keep user informed and engaged
    const stages = [
      { progress: 38, message: "Extracting client deliverables & line items..." },
      { progress: 64, message: "Structuring quantities, pricing & unit rates..." },
      { progress: 86, message: "Validating tax calculations & financial arithmetic..." },
      { progress: 95, message: "Composing structured invoice document..." },
    ];

    let currentStep = 0;
    const progressTimer = setInterval(() => {
      if (currentStep < stages.length) {
        setAiProgress(stages[currentStep].progress);
        setAiStepMessage(stages[currentStep].message);
        currentStep++;
      }
    }, 700);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "parse-prompt",
          prompt: aiPrompt,
          currency: invoice.currency,
        }),
      });
      const result = await res.json();
      clearInterval(progressTimer);

      if (result.success && result.data) {
        setAiProgress(100);
        setAiStepMessage("Invoice synthesized successfully!");

        const parsed = result.data;

        // Auto customer creation or selection
        let matchedCust = result.customer || customers.find(
          (c) => c.name.toLowerCase() === (parsed.customerName || "").toLowerCase()
        );

        if (result.customer) {
          matchedCust = result.customer;
          setCustomers((prev) => [
            result.customer,
            ...prev.filter((c) => c.id !== result.customer.id),
          ]);
          try {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
          } catch {}
        } else if (!matchedCust && parsed.customerName) {
          matchedCust = {
            id: "",
            name: parsed.customerName,
            email: parsed.customerEmail || "",
            address: parsed.customerAddress || "",
          };
        }

        const newItems: InvoiceItemData[] = (parsed.items || []).map(
          (item: any, i: number) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unit: item.unit || "unit",
            unitPrice: item.unitPrice || 0,
            discount: 0,
            taxRate: parsed.taxRate || 0,
            lineTotal: (item.quantity || 1) * (item.unitPrice || 0),
            sortOrder: i + 1,
          })
        );

        const newTaxRate = parsed.taxRate || invoice.taxRate;
        const newDiscount = parsed.discount || invoice.discount;

        setInvoice((prev) => ({
          ...prev,
          currency: parsed.currency || prev.currency,
          taxRate: newTaxRate,
          discount: newDiscount,
          customer: matchedCust || prev.customer,
          customerId: matchedCust?.id || prev.customerId,
          notes: parsed.notes || prev.notes,
          paymentTerms: parsed.paymentTerms || prev.paymentTerms,
        }));

        recalculate(newItems, newDiscount, invoice.discountType, newTaxRate, invoice.amountPaid);

        setTimeout(() => {
          toast.success("AI generated invoice details! Review before saving.");
          setAiModalOpen(false);
          setAiPrompt("");
          setAiLoading(false);
          setAiProgress(0);
        }, 500);
      } else {
        toast.error("Could not parse invoice prompt.");
        setAiLoading(false);
        setAiProgress(0);
      }
    } catch (e) {
      clearInterval(progressTimer);
      toast.error("AI service error.");
      setAiLoading(false);
      setAiProgress(0);
    }
  };

  // Inline Customer Creation directly inside Invoice Editor
  const handleCreateCustomerInline = async () => {
    if (!newCustName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setIsCreatingCustomer(true);
    const createToast = toast.loading("Saving customer...");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustName.trim(),
          companyName: newCustCompany.trim() || undefined,
          email: newCustEmail.trim() || undefined,
          phone: newCustPhone.trim() || undefined,
          address: newCustAddress.trim() || undefined,
          taxNumber: newCustTaxNumber.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.customer) {
        setCustomers((prev) => [data.customer, ...prev.filter((c) => c.id !== data.customer.id)]);
        setInvoice((prev) => ({
          ...prev,
          customer: data.customer,
          customerId: data.customer.id,
        }));
        setNewCustomerModal(false);
        setNewCustName("");
        setNewCustCompany("");
        setNewCustEmail("");
        setNewCustPhone("");
        setNewCustAddress("");
        setNewCustTaxNumber("");
        try {
          queryClient.invalidateQueries({ queryKey: ["customers"] });
        } catch {}
        toast.success(`Customer "${data.customer.name}" created and selected!`, { id: createToast });
      } else {
        toast.error(data.error || "Failed to create customer", { id: createToast });
      }
    } catch {
      toast.error("Failed to add customer", { id: createToast });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Save invoice persistently via API
  const handleSaveInvoice = async (statusOverride?: string) => {
    if (!invoice.invoiceNumber?.trim()) {
      toast.error("Invoice number is required");
      return;
    }

    setIsSaving(true);
    const saveToast = toast.loading("Saving invoice...");

    try {
      const url = initialInvoice?.id ? `/api/invoices/${initialInvoice.id}` : "/api/invoices";
      const method = initialInvoice?.id ? "PUT" : "POST";

      const payload = {
        ...invoice,
        status: statusOverride || invoice.status,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Invoice saved successfully!", { id: saveToast });
        router.push("/invoices");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save invoice", { id: saveToast });
      }
    } catch {
      toast.error("Failed to save invoice", { id: saveToast });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Toolbar */}
      <div className="flex flex-col gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E8E5] shadow-subtle">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/invoices"
              className="p-1.5 sm:p-2 text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] rounded-lg transition-colors shrink-0"
              title="Back to invoices"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-serif font-bold text-[#202124] truncate">
                {isNew ? "Create Invoice" : `Edit ${invoice.invoiceNumber}`}
              </h2>
              <p className="text-[11px] text-[#70757A] truncate hidden xs:block">
                Real-time synchronization & automatic calculations
              </p>
            </div>
          </div>

          {/* Mobile View Toggle Pills */}
          <div className="flex lg:hidden bg-[#FAFAF8] p-1 rounded-lg border border-[#E8E8E5] shrink-0">
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "edit"
                  ? "bg-white text-[#4468E8] shadow-2xs font-semibold"
                  : "text-[#70757A]"
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "preview"
                  ? "bg-white text-[#4468E8] shadow-2xs font-semibold"
                  : "text-[#70757A]"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Action Buttons: 2 rows on mobile (Row 1: AI Studio & Fonts, Row 2: Export & Save), inline-flex on sm+ screens */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-[#F0F0EE] sm:border-0 sm:pt-0 sm:justify-end">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4468E8] bg-[#EEF2FF] hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>AI Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setFontModalOpen(true)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors border ${
                isFontCustomized
                  ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                  : "bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]"
              }`}
              title="Adjust font size for each text category on the invoice"
            >
              <Type className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <span>Fonts</span>
              {isFontCustomized && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <ExportMenu
              invoice={invoice}
              elementId="invoice-preview-document"
              className="w-full sm:w-auto"
              buttonClassName="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-lg shadow-sm transition-all focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleSaveInvoice("sent")}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#202124] hover:bg-black rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Form / Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Editor */}
        <div
          className={`lg:col-span-6 space-y-6 ${
            activeTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {/* 0. Business Branding & Logo Card */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E8E5] shadow-subtle space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EE]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#70757A] flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#4468E8]" />
                Company Branding & Logo
              </h3>
              <Link
                href="/business"
                className="text-[11px] text-[#4468E8] hover:underline font-medium"
              >
                Edit Full Profile
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {invoice.business?.logoUrl ? (
                  <div className="h-12 w-16 bg-[#FAFAF8] border border-[#E8E8E5] rounded-lg p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    <img
                      src={invoice.business.logoUrl}
                      alt={invoice.business?.businessName || "Company Logo"}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-16 bg-[#FAFAF8] border border-dashed border-[#D1D5DB] rounded-lg flex items-center justify-center shrink-0 text-[#9CA3AF]">
                    <Upload className="w-5 h-5 opacity-60" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs text-[#202124] truncate">
                    {invoice.business?.businessName || "My Business"}
                  </p>
                  <p className="text-[11px] text-[#70757A] truncate">
                    {invoice.business?.email || "No email configured"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t border-[#F5F5F3] sm:border-0 shrink-0">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAFAF8] hover:bg-[#F0F0EE] text-[#202124] rounded-lg text-xs font-medium border border-[#E8E8E5] transition-colors">
                  <Upload className="w-3 h-3 text-[#4468E8]" />
                  <span>{invoice.business?.logoUrl ? "Change Logo" : "Upload Logo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditorLogoFileSelect}
                    disabled={isUploadingLogo}
                    className="hidden"
                  />
                </label>
                {invoice.business?.logoUrl && (
                  <>
                    <button
                      type="button"
                      onClick={handleEditorReCrop}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#4468E8] rounded-lg text-xs font-medium border border-blue-100 transition-colors"
                      title="Crop and frame logo"
                    >
                      <CropIcon className="w-3 h-3" />
                      <span>Crop</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEditorRemoveLogo}
                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 1. General Invoice Metadata Card */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E8E5] shadow-subtle space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#70757A] flex items-center gap-2 pb-2 border-b border-[#F0F0EE]">
              <Calendar className="w-3.5 h-3.5 text-[#4468E8]" />
              Invoice Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) =>
                    setInvoice({ ...invoice, invoiceNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20 focus:border-[#4468E8] font-mono"
                  placeholder="INV-1001"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Currency
                </label>
                <select
                  value={invoice.currency}
                  onChange={(e) => {
                    const c = e.target.value;
                    setInvoice({ ...invoice, currency: c });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20 bg-white font-medium"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol}) — {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoice.invoiceDate?.split("T")[0]}
                  onChange={(e) =>
                    setInvoice({ ...invoice, invoiceDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoice.dueDate?.split("T")[0]}
                  onChange={(e) =>
                    setInvoice({ ...invoice, dueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Status
                </label>
                <select
                  value={invoice.status}
                  onChange={(e) =>
                    setInvoice({ ...invoice, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20 bg-white capitalize"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={invoice.paymentTerms || ""}
                  onChange={(e) =>
                    setInvoice({ ...invoice, paymentTerms: e.target.value })
                  }
                  placeholder="Net 14 Days"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                />
              </div>
            </div>
          </div>

          {/* 2. Customer Selection Card */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E8E5] shadow-subtle space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#F0F0EE]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#70757A] flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#4468E8]" />
                Customer Information
              </h3>
              <button
                type="button"
                onClick={() => setNewCustomerModal(true)}
                className="text-xs text-[#4468E8] font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add New
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#202124] mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <select
                  value={invoice.customerId || ""}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value);
                    setInvoice({
                      ...invoice,
                      customerId: e.target.value,
                      customer: cust || null,
                    });
                  }}
                  className="w-full sm:flex-1 min-w-0 px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20 bg-white"
                >
                  <option value="">-- Choose existing customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setNewCustomerModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-lg shrink-0 shadow-xs transition-colors"
                  title="Directly create and select a new customer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Customer</span>
                </button>
              </div>
            </div>

            {invoice.customer && (
              <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E8E8E5] text-xs space-y-1">
                <div className="font-semibold text-[#202124]">{invoice.customer.name}</div>
                {invoice.customer.companyName && (
                  <div className="text-[#70757A]">{invoice.customer.companyName}</div>
                )}
                {invoice.customer.email && (
                  <div className="text-[#70757A]">{invoice.customer.email}</div>
                )}
                {invoice.customer.address && (
                  <div className="text-[#70757A] whitespace-pre-line">
                    {invoice.customer.address}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Line Items Card */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E8E5] shadow-subtle space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#F0F0EE]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#70757A] flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-[#4468E8]" />
                Products & Services
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-medium text-[#4468E8] hover:text-[#3455D1] flex items-center gap-1 bg-[#EEF2FF] px-2.5 py-1 rounded-md"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {invoice.items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-3.5 rounded-lg border border-[#E8E8E5] bg-[#FAFAF8] space-y-2.5 relative group overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
                    <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#70757A] shrink-0">
                        #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        placeholder="Description of work, service, or deliverable..."
                        className="flex-1 min-w-0 px-2.5 sm:px-3 py-1.5 text-xs bg-white rounded-md border border-[#E8E8E5] focus:outline-none focus:ring-1 focus:ring-[#4468E8]"
                      />
                      <button
                        type="button"
                        onClick={() => handlePolishDescription(index)}
                        disabled={polishingIndex === index}
                        title="Improve description with AI"
                        className="p-1.5 text-[#4468E8] hover:bg-white rounded-md border border-transparent hover:border-blue-200 transition-colors shrink-0"
                      >
                        <Sparkles
                          className={`w-3.5 h-3.5 ${
                            polishingIndex === index ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 pl-1">
                      <button
                        type="button"
                        onClick={() => duplicateItem(index)}
                        title="Duplicate item"
                        className="p-1.5 text-[#70757A] hover:text-[#202124] hover:bg-white rounded transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        title="Remove item"
                        className="p-1.5 text-[#70757A] hover:text-red-600 hover:bg-white rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity, Unit, Rate, Discount, Line Total */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div>
                      <label className="text-[10px] text-[#70757A] block">Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1 bg-white rounded border border-[#E8E8E5] font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#70757A] block">Unit</label>
                      <input
                        type="text"
                        value={item.unit || ""}
                        onChange={(e) =>
                          handleItemChange(index, "unit", e.target.value)
                        }
                        placeholder="hrs / unit"
                        className="w-full px-2 py-1 bg-white rounded border border-[#E8E8E5] text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#70757A] block">Unit Price</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1 bg-white rounded border border-[#E8E8E5] font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#70757A] block text-right">
                        Line Total
                      </label>
                      <div className="px-2 py-1 font-mono text-xs font-semibold text-[#202124] text-right">
                        {invoice.currency} {item.lineTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Financial Adjustments & Notes */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E8E5] shadow-subtle space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#70757A] pb-2 border-b border-[#F0F0EE]">
              Tax, Discounts & Notes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={invoice.taxRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value) || 0;
                    setInvoice({ ...invoice, taxRate: rate });
                    recalculate(
                      invoice.items,
                      invoice.discount,
                      invoice.discountType,
                      rate,
                      invoice.amountPaid
                    );
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Discount
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={invoice.discount}
                    onChange={(e) => {
                      const disc = parseFloat(e.target.value) || 0;
                      setInvoice({ ...invoice, discount: disc });
                      recalculate(
                        invoice.items,
                        disc,
                        invoice.discountType,
                        invoice.taxRate,
                        invoice.amountPaid
                      );
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] font-mono"
                  />
                  <select
                    value={invoice.discountType}
                    onChange={(e) => {
                      const dt = e.target.value as "percentage" | "fixed";
                      setInvoice({ ...invoice, discountType: dt });
                      recalculate(
                        invoice.items,
                        invoice.discount,
                        dt,
                        invoice.taxRate,
                        invoice.amountPaid
                      );
                    }}
                    className="px-2 py-2 text-xs rounded-lg border border-[#E8E8E5] bg-white"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">{invoice.currency}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Amount Paid
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={invoice.amountPaid}
                  onChange={(e) => {
                    const paid = parseFloat(e.target.value) || 0;
                    setInvoice({ ...invoice, amountPaid: paid });
                    recalculate(
                      invoice.items,
                      invoice.discount,
                      invoice.discountType,
                      invoice.taxRate,
                      paid
                    );
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#202124] mb-1">
                Client Notes & Payment Instructions
              </label>
              <textarea
                rows={3}
                value={invoice.notes || ""}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                placeholder="Thank you for your business..."
              />
            </div>
          </div>

          {/* Template & Category Typography Card (Available directly in Form for Mobile & Desktop) */}
          <div className="bg-white p-5 rounded-xl border border-[#E8E8E5] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EE]">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#4468E8]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#70757A]">
                  Template & Font Sizing
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetFontSizes}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
                title="Reset all font sizes to 100%"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Sizes</span>
              </button>
            </div>

            {/* Template Selector inside Form */}
            <div>
              <label className="block text-xs font-medium text-[#202124] mb-1.5">
                Invoice Template Design
              </label>
              <select
                value={invoice.templateId}
                onChange={(e) =>
                  setInvoice({ ...invoice, templateId: e.target.value as TemplateId })
                }
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-[#E8E8E5] bg-white text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
              >
                {TEMPLATE_LIST.map((tpl) => (
                  <option key={tpl.slug} value={tpl.slug}>
                    {tpl.name} — {tpl.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Font Controls */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-[#0F172A]">
                    Category Font Sizes
                  </span>
                  {isFontCustomized && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      Customized
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#70757A]">
                  Scale each section independently
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {FONT_CATEGORIES.map((cat) => {
                  const currentScale = invoice.fontSizeConfig?.[cat.key] || 1.0;
                  return (
                    <div
                      key={cat.key}
                      className="p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-xs text-[#0F172A] block">
                            {cat.label}
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            {cat.sub}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-600 bg-white px-2 py-0.5 rounded-md border border-[#E2E8F0] shadow-2xs">
                          {Math.round(currentScale * 100)}%
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateFontSize(cat.key, -0.1)}
                            className="h-8 w-9 min-h-[32px] min-w-[36px] flex items-center justify-center rounded-lg bg-white border border-[#CBD5E1] text-sm font-bold active:bg-blue-100 text-[#0F172A] shadow-2xs transition-colors"
                            title={`Decrease ${cat.label} font size`}
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateFontSize(cat.key, 0.1)}
                            className="h-8 w-9 min-h-[32px] min-w-[36px] flex items-center justify-center rounded-lg bg-white border border-[#CBD5E1] text-sm font-bold active:bg-blue-100 text-[#0F172A] shadow-2xs transition-colors"
                            title={`Increase ${cat.label} font size`}
                          >
                            +
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 ml-auto">
                          {cat.presets.map((scale) => (
                            <button
                              key={scale}
                              type="button"
                              onClick={() => handleSetCategoryScale(cat.key, scale)}
                              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors shadow-2xs ${
                                currentScale === scale
                                  ? "bg-blue-600 text-white font-bold"
                                  : "bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-[#F1F5F9] active:bg-blue-50"
                              }`}
                            >
                              {Math.round(scale * 100)}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick switch to preview on mobile */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#64748B]">
                  Scales persist in PDF exports & live previews
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="inline-flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EEF2FF] text-[#4468E8] hover:bg-blue-100 transition-colors"
                >
                  <span>See Live Preview →</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Invoice Preview */}
        <div
          className={`lg:col-span-6 space-y-4 ${
            activeTab === "edit" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Template Selector & Zoom Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E8E8E5] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 min-w-0">
                <Palette className="w-4 h-4 text-[#4468E8] shrink-0" />
                <span className="text-xs font-medium text-[#202124] shrink-0">Template:</span>
                <select
                  value={invoice.templateId}
                  onChange={(e) =>
                    setInvoice({ ...invoice, templateId: e.target.value as TemplateId })
                  }
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E8E8E5] bg-white text-[#202124] focus:outline-none focus:ring-1 focus:ring-[#4468E8] max-w-[150px] sm:max-w-none truncate"
                >
                  {TEMPLATE_LIST.map((tpl) => (
                    <option key={tpl.slug} value={tpl.slug}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Font Sizes Button in Preview bar */}
              <button
                type="button"
                onClick={() => setFontModalOpen(true)}
                className={`sm:hidden inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  isFontCustomized
                    ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                    : "bg-[#F8FAFC] text-[#334155] border-[#CBD5E1]"
                }`}
                title="Adjust font sizes"
              >
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>Fonts</span>
                {isFontCustomized && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-[#F0F0EE] sm:border-0">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(35, z - 10))}
                  className="p-1.5 text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-medium text-[#70757A] w-9 text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                  className="p-1.5 text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFitScreen}
                  className="px-2 py-1 text-[11px] font-medium text-[#4468E8] hover:bg-[#EEF2FF] rounded transition-colors"
                  title="Fit to Screen"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1.5 text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] rounded"
                  title="100% Size"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Desktop Font Sizes Toggle Button */}
              <div className="hidden sm:flex items-center gap-1 border-l border-[#E8E8E5] pl-2">
                <button
                  type="button"
                  onClick={() => setFontPanelOpen(!fontPanelOpen)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    fontPanelOpen
                      ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                      : "bg-white text-[#475569] border-[#E8E8E5] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                  title="Adjust font size for each text category on the invoice"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Font Sizes</span>
                  {isFontCustomized && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Font Sizes Customization Panel for Each Text Category (Desktop inline) */}
          {fontPanelOpen && (
            <div className="p-4 rounded-xl bg-white border border-[#E8E8E5] shadow-card space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#F0F0EE] pb-2.5">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-[#0F172A]">
                    Invoice Font Scaling (Per Category)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetFontSizes}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
                  title="Reset all font scales to 100%"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {FONT_CATEGORIES.map((cat) => {
                  const currentScale = invoice.fontSizeConfig?.[cat.key] || 1.0;
                  return (
                    <div
                      key={cat.key}
                      className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#0F172A] block">
                            {cat.label}
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            {cat.sub}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {Math.round(currentScale * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateFontSize(cat.key, -0.1)}
                          className="h-7 w-7 flex items-center justify-center rounded bg-white border border-[#E2E8F0] text-xs font-bold hover:bg-[#F1F3F5] text-[#0F172A] transition-colors"
                          title={`Decrease ${cat.label} font size`}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFontSize(cat.key, 0.1)}
                          className="h-7 w-7 flex items-center justify-center rounded bg-white border border-[#E2E8F0] text-xs font-bold hover:bg-[#F1F3F5] text-[#0F172A] transition-colors"
                          title={`Increase ${cat.label} font size`}
                        >
                          +
                        </button>
                        <div className="flex items-center gap-1 ml-auto">
                          {cat.presets.map((scale) => (
                            <button
                              key={scale}
                              type="button"
                              onClick={() => handleSetCategoryScale(cat.key, scale)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                                currentScale === scale
                                  ? "bg-blue-600 text-white font-bold"
                                  : "bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F3F5]"
                              }`}
                            >
                              {Math.round(scale * 100)}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visual Drag Instruction Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/70 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs text-blue-950 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <MoveDiagonal2 className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="truncate sm:whitespace-normal">
                <strong>Visual Canvas:</strong> Tap the logo or text below to drag-resize directly.
              </p>
            </div>
            {activeVisualCat ? (
              <button
                type="button"
                onClick={() => setActiveVisualCat(null)}
                className="text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 shrink-0 transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveVisualCat("logo")}
                className="text-[11px] font-medium text-blue-700 hover:underline shrink-0"
              >
                Select Logo
              </button>
            )}
          </div>

          {/* Sticky Document Wrapper */}
          <div className="lg:sticky lg:top-24 overflow-x-auto pb-12 w-full">
            <div
              style={{
                width: `${760 * (zoomLevel / 100)}px`,
                minHeight: `${980 * (zoomLevel / 100)}px`,
              }}
              className="mx-auto relative transition-all duration-150"
            >
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top left",
                  width: "760px",
                }}
                className="shadow-invoice rounded-lg overflow-hidden border border-[#E8E8E5] bg-white origin-top-left"
              >
                {/* Document Element targeted by PDF and PNG exporter */}
                <div
                  id="invoice-preview-document"
                  onClick={handlePreviewDocumentClick}
                  className="w-[760px] bg-white relative select-none"
                >
                  <InvoiceRenderer
                    invoice={invoice}
                    templateId={invoice.templateId}
                    fontSizeConfig={invoice.fontSizeConfig}
                  />

                  {/* Visual Bounding Box & Interactive Corner Drag Handle */}
                  {activeVisualCat && selectedBox && (
                    <div
                      style={{
                        top: `${selectedBox.top}px`,
                        left: `${selectedBox.left}px`,
                        width: `${selectedBox.width}px`,
                        height: `${selectedBox.height}px`,
                      }}
                      className="absolute border-2 border-blue-600 rounded-lg pointer-events-none z-30 transition-all duration-75 shadow-lg shadow-blue-500/20"
                    >
                      {/* Corner Dots */}
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full" />

                      {/* Interactive Drag Handle on Corner */}
                      <div
                        onPointerDown={handleDragHandlePointerDown}
                        className={`pointer-events-auto absolute -bottom-4 -right-4 h-8 w-8 rounded-full flex items-center justify-center shadow-lg cursor-nwse-resize touch-none select-none transition-transform ${
                          isDraggingHandle
                            ? "bg-blue-700 scale-125 text-white ring-4 ring-blue-300"
                            : "bg-blue-600 hover:bg-blue-700 hover:scale-110 text-white"
                        }`}
                        title="Drag outward to increase size, inward to decrease size"
                      >
                        <MoveDiagonal2 className="w-4 h-4" />
                      </div>

                      {/* Floating Badge Indicator */}
                      <div className="pointer-events-auto absolute -top-7 left-0 bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded shadow-sm flex items-center gap-1.5">
                        <span>
                          {FONT_CATEGORIES.find((c) => c.key === activeVisualCat)?.label}
                        </span>
                        <span className="opacity-90 font-mono">
                          {Math.round((invoice.fontSizeConfig?.[activeVisualCat] || 1.0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Floating Mobile/Desktop Tactile Drag Bar for Active Selection */}
          {activeVisualCat && (
            <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md border-2 border-blue-600/30 shadow-elevated rounded-2xl p-3.5 space-y-2 max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MoveDiagonal2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">
                    {FONT_CATEGORIES.find((c) => c.key === activeVisualCat)?.label}
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {Math.round((invoice.fontSizeConfig?.[activeVisualCat] || 1.0) * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetCategoryScale(activeVisualCat, 1.0)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVisualCat(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                    title="Deselect"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tactile Drag Scrubber Track */}
              <div className="flex items-center gap-2.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleUpdateFontSize(activeVisualCat, -0.05)}
                  className="h-8 w-8 min-w-[32px] flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                  title="Decrease"
                >
                  −
                </button>

                <div className="flex-1 relative flex items-center">
                  <input
                    type="range"
                    min="0.55"
                    max="2.0"
                    step="0.05"
                    value={invoice.fontSizeConfig?.[activeVisualCat] || 1.0}
                    onChange={(e) =>
                      handleSetCategoryScale(activeVisualCat, parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateFontSize(activeVisualCat, 0.05)}
                  className="h-8 w-8 min-w-[32px] flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                  title="Increase"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  💡 Drag corner on canvas or slide above
                </span>
                <div className="flex items-center gap-1">
                  {[0.85, 1.0, 1.25, 1.5].map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => handleSetCategoryScale(activeVisualCat, scale)}
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                        (invoice.fontSizeConfig?.[activeVisualCat] || 1.0) === scale
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {Math.round(scale * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Prompt Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-[#E8E8E5] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4468E8]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#202124]">
                  Create Invoice with Buno AI
                </h3>
                <p className="text-xs text-[#70757A]">
                  Type your invoice requirements naturally in plain English
                </p>
              </div>
            </div>

            {aiLoading ? (
              <div className="py-3 space-y-4">
                {/* Real-time Staged Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-[#202124]">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4468E8] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4468E8]"></span>
                      </span>
                      {aiStepMessage}
                    </span>
                    <span className="font-mono font-bold text-[#4468E8]">{aiProgress}%</span>
                  </div>
                  <div className="w-full bg-[#EEF2FF] h-2.5 rounded-full overflow-hidden p-0.5 border border-blue-100">
                    <div
                      className="bg-gradient-to-r from-[#4468E8] via-[#5B7BF8] to-[#34D399] h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                      style={{ width: `${aiProgress}%` }}
                    />
                  </div>
                </div>

                {/* Engaging Multi-Step Checklist */}
                <div className="bg-[#FAFAF8] rounded-xl p-3.5 border border-[#E8E8E5] space-y-2 text-xs">
                  <div className={`flex items-center gap-2.5 transition-colors ${aiProgress >= 30 ? "text-emerald-700 font-medium" : "text-[#70757A]"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${aiProgress >= 30 ? "text-emerald-600" : "text-[#CBD5E1]"}`} />
                    <span>Analyzing deliverables & customer details</span>
                  </div>
                  <div className={`flex items-center gap-2.5 transition-colors ${aiProgress >= 60 ? "text-emerald-700 font-medium" : "text-[#70757A]"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${aiProgress >= 60 ? "text-emerald-600" : "text-[#CBD5E1]"}`} />
                    <span>Extracting line items, itemized quantities & rates</span>
                  </div>
                  <div className={`flex items-center gap-2.5 transition-colors ${aiProgress >= 85 ? "text-emerald-700 font-medium" : "text-[#70757A]"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${aiProgress >= 85 ? "text-emerald-600" : "text-[#CBD5E1]"}`} />
                    <span>Calculating deterministic financial totals & tax rates</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#70757A]">
                    <Sparkles className="w-3.5 h-3.5 text-[#4468E8]" />
                    <span>Type or use Voice Assistance in any language:</span>
                  </div>
                  <VoiceAssistantButton
                    onTranscript={(text) => setAiPrompt(text)}
                    currentValue={aiPrompt}
                    disabled={aiLoading}
                  />
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your invoice in English, Urdu (اردو / Roman Urdu), Hindi (हिन्दी / Hinglish), or Arabic.&#10;e.g. 'Ali Khan k liye 50 hazar rupay web development k aur due date 15 din baad ki ho'&#10;or 'Create an invoice for Nexus Corp, 10 hours of UX consulting at $95/hr'"
                    className="w-full p-3 text-xs rounded-xl border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20 leading-relaxed"
                  />
                </div>

                {/* Multilingual Voice Quick Sample Chips */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-[#70757A] uppercase tracking-wider">
                    Quick Multilingual Examples (Click to insert):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setAiPrompt(
                          "Ali Khan k liye 1 invoice banao, 50,000 rupay web design k aur due date 14 din baad ki ho"
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-[#FAFAF8] hover:bg-[#EEF2FF] hover:text-[#4468E8] border border-[#E8E8E5] text-[#202124] transition-colors flex items-center gap-1"
                    >
                      <span>🇵🇰</span>
                      <span>Ali Khan k liye 50,000 PKR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAiPrompt(
                          "Sharma Enterprises ke liye bill banao, 3 logo designs 8000 rupay har ek ka aur 18% GST tax"
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-[#FAFAF8] hover:bg-[#EEF2FF] hover:text-[#4468E8] border border-[#E8E8E5] text-[#202124] transition-colors flex items-center gap-1"
                    >
                      <span>🇮🇳</span>
                      <span>Sharma Tech 3 Logos (GST)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAiPrompt(
                          "Create an invoice for Apex Studios: 5 landing pages at $1,200 each and brand book at $800, due in 15 days"
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-[#FAFAF8] hover:bg-[#EEF2FF] hover:text-[#4468E8] border border-[#E8E8E5] text-[#202124] transition-colors flex items-center gap-1"
                    >
                      <span>🇺🇸</span>
                      <span>Apex Studios: Web & Branding ($)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                disabled={aiLoading}
                className="px-4 py-2 text-xs font-medium text-[#70757A] hover:bg-[#F5F5F3] rounded-lg disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-lg disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating ({aiProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline New Customer Modal */}
      {newCustomerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-[#E8E8E5] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EE]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#202124]">
                  Add New Customer
                </h3>
                <p className="text-[11px] text-[#70757A]">
                  Saved permanently to your account and selected for this invoice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewCustomerModal(false)}
                className="text-[#70757A] hover:text-[#202124] text-xs p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#202124] mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:ring-2 focus:ring-[#4468E8]/20 focus:outline-none"
                    placeholder="e.g. Elena Rostova"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#202124] mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newCustCompany}
                    onChange={(e) => setNewCustCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:ring-2 focus:ring-[#4468E8]/20 focus:outline-none"
                    placeholder="e.g. Acme Studio"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#202124] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:ring-2 focus:ring-[#4468E8]/20 focus:outline-none"
                    placeholder="billing@client.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#202124] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:ring-2 focus:ring-[#4468E8]/20 focus:outline-none"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:ring-2 focus:ring-[#4468E8]/20 focus:outline-none resize-none"
                  placeholder="Street address, City, State/Province, ZIP, Country"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Tax Number / VAT ID
                </label>
                <input
                  type="text"
                  value={newCustTaxNumber}
                  onChange={(e) => setNewCustTaxNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:ring-2 focus:ring-[#4468E8]/20 focus:outline-none"
                  placeholder="e.g. US-94-118290"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F0EE]">
              <button
                type="button"
                onClick={() => setNewCustomerModal(false)}
                disabled={isCreatingCustomer}
                className="px-4 py-2 text-xs font-medium text-[#70757A] hover:bg-[#F5F5F3] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomerInline}
                disabled={isCreatingCustomer}
                className="px-4 py-2 text-xs font-medium text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {isCreatingCustomer ? "Saving Customer..." : "Create & Select Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business Logo Crop & Frame Modal */}
      <ImageCropModal
        isOpen={editorCropModalOpen}
        imageSrc={editorSelectedImageForCrop}
        onClose={() => setEditorCropModalOpen(false)}
        onApplyCrop={handleEditorApplyCroppedLogo}
        title="Crop & Frame Business Logo"
      />

      {/* Mobile/Responsive Font Sizes Modal & Bottom Sheet */}
      {fontModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-[#E8E8E5] space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EE] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#0F172A]">
                    Invoice Font Scaling
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Scale text categories on mobile & desktop
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFontSizes}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#64748B] hover:text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md transition-colors"
                  title="Reset all font sizes to 100%"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFontModalOpen(false)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Template Selector inside Modal */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
              <label className="block text-xs font-semibold text-[#0F172A]">
                Invoice Template Design
              </label>
              <select
                value={invoice.templateId}
                onChange={(e) =>
                  setInvoice({ ...invoice, templateId: e.target.value as TemplateId })
                }
                className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {TEMPLATE_LIST.map((tpl) => (
                  <option key={tpl.slug} value={tpl.slug}>
                    {tpl.name} — {tpl.description}
                  </option>
                ))}
              </select>
            </div>

            {/* 4 Categories */}
            <div className="space-y-3">
              {FONT_CATEGORIES.map((cat) => {
                const currentScale = invoice.fontSizeConfig?.[cat.key] || 1.0;
                return (
                  <div
                    key={cat.key}
                    className="p-3 rounded-xl bg-[#FAFAF9] border border-[#E7E5E4] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-[#0F172A] block">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          {cat.sub}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-blue-600 bg-white px-2 py-0.5 rounded-md border border-[#E2E8F0] shadow-2xs">
                        {Math.round(currentScale * 100)}%
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateFontSize(cat.key, -0.1)}
                          className="h-8 w-9 min-h-[32px] min-w-[36px] flex items-center justify-center rounded-lg bg-white border border-[#CBD5E1] text-sm font-bold active:bg-blue-100 text-[#0F172A] shadow-2xs transition-colors"
                          title={`Decrease ${cat.label} font size`}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFontSize(cat.key, 0.1)}
                          className="h-8 w-9 min-h-[32px] min-w-[36px] flex items-center justify-center rounded-lg bg-white border border-[#CBD5E1] text-sm font-bold active:bg-blue-100 text-[#0F172A] shadow-2xs transition-colors"
                          title={`Increase ${cat.label} font size`}
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 ml-auto">
                        {cat.presets.map((scale) => (
                          <button
                            key={scale}
                            type="button"
                            onClick={() => handleSetCategoryScale(cat.key, scale)}
                            className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors shadow-2xs ${
                              currentScale === scale
                                ? "bg-blue-600 text-white font-bold"
                                : "bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-[#F1F5F9] active:bg-blue-50"
                            }`}
                          >
                            {Math.round(scale * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#F0F0EE]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("preview");
                  setFontModalOpen(false);
                }}
                className="inline-flex lg:hidden items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#4468E8] bg-[#EEF2FF] hover:bg-blue-100 rounded-lg transition-colors"
              >
                <span>View in Preview →</span>
              </button>

              <button
                type="button"
                onClick={() => setFontModalOpen(false)}
                className="ml-auto px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-black rounded-lg shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
