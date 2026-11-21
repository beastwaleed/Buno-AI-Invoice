import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const profile = await prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: data.businessName,
        ownerName: data.ownerName,
        logoUrl: data.logoUrl,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        taxNumber: data.taxNumber,
        registrationNumber: data.registrationNumber,
        bankDetails: data.bankDetails,
        paymentInstructions: data.paymentInstructions,
        defaultCurrency: data.defaultCurrency,
        defaultTaxRate: parseFloat(data.defaultTaxRate) || 0,
        defaultPaymentTerms: data.defaultPaymentTerms,
        invoicePrefix: data.invoicePrefix,
        nextInvoiceNumber: parseInt(data.nextInvoiceNumber) || 1001,
      },
      create: {
        userId: user.id,
        businessName: data.businessName || "My Business",
        ownerName: data.ownerName,
        logoUrl: data.logoUrl,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        taxNumber: data.taxNumber,
        registrationNumber: data.registrationNumber,
        bankDetails: data.bankDetails,
        paymentInstructions: data.paymentInstructions,
        defaultCurrency: data.defaultCurrency || "USD",
        defaultTaxRate: parseFloat(data.defaultTaxRate) || 0,
        defaultPaymentTerms: data.defaultPaymentTerms || "Net 14 Days",
        invoicePrefix: data.invoicePrefix || "INV-",
        nextInvoiceNumber: parseInt(data.nextInvoiceNumber) || 1001,
      },
    });

    if (data.defaultCurrency) {
      await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: { currency: data.defaultCurrency.toUpperCase() },
        create: { userId: user.id, currency: data.defaultCurrency.toUpperCase() },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Failed to update business profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
