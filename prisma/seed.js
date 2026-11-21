const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Templates
  const templates = [
    {
      slug: "modern",
      name: "Modern Studio",
      description: "Restrained cool blue accent, clean hierarchy, and balanced whitespace.",
      previewImage: "/templates/modern.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#4468E8",
        headerStyle: "modern",
        fontStyle: "sans",
      }),
    },
    {
      slug: "minimal",
      name: "Pure Minimal",
      description: "Monochrome, ultra-clean, generous whitespace and subtle borders.",
      previewImage: "/templates/minimal.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#202124",
        headerStyle: "minimal",
        fontStyle: "sans",
      }),
    },
    {
      slug: "classic",
      name: "Classic Ledger",
      description: "Traditional business invoice with formal framing, ruled lines, and boxed summary.",
      previewImage: "/templates/classic.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#334155",
        headerStyle: "classic",
        fontStyle: "serif",
      }),
    },
    {
      slug: "elegant",
      name: "Editorial Serif",
      description: "Sophisticated Playfair serif typography with warm ivory accents and timeless styling.",
      previewImage: "/templates/elegant.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#1E293B",
        headerStyle: "elegant",
        fontStyle: "serif",
      }),
    },
    {
      slug: "corporate",
      name: "Corporate Enterprise",
      description: "Structured metadata grid, enterprise reference badges, and formal payment section.",
      previewImage: "/templates/corporate.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#1E3A5F",
        headerStyle: "corporate",
        fontStyle: "sans",
      }),
    },
    {
      slug: "compact",
      name: "High-Density Compact",
      description: "Condensed row height, optimized for invoices with many products and services.",
      previewImage: "/templates/compact.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#475569",
        headerStyle: "compact",
        fontStyle: "sans",
      }),
    },
    {
      slug: "wave",
      name: "Wave Minimal (Custom)",
      description: "Recreated from user reference: organic wave footer curve, bold header, clean itemization.",
      previewImage: "/templates/wave.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#334155",
        headerStyle: "wave",
        fontStyle: "sans",
      }),
    },
    {
      slug: "amber-grid",
      name: "Amber Grid (Custom)",
      description: "Recreated from user reference: high-contrast yellow table header, boxed grid lines, and total block.",
      previewImage: "/templates/amber-grid.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#FFD700",
        headerStyle: "grid",
        fontStyle: "sans",
      }),
    },
    {
      slug: "crimson",
      name: "Executive Crimson (Custom)",
      description: "Recreated from user reference: bold red top banner, dark navy background, sage green header, and signature.",
      previewImage: "/templates/crimson.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#D91B24",
        headerStyle: "banner",
        fontStyle: "sans",
      }),
    },
    {
      slug: "royal-blue",
      name: "Royal Blue SaaS (Custom)",
      description: "Recreated from user reference: deep royal blue banner, 5-column breakdown, formal terms, and totals.",
      previewImage: "/templates/royal-blue.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#00338D",
        headerStyle: "card",
        fontStyle: "sans",
      }),
    },
    {
      slug: "agency-sidebar",
      name: "Agency Sidebar (Custom)",
      description: "Recreated from user reference: dark charcoal left column with rounded arc, burnt orange table header, and total pill.",
      previewImage: "/templates/agency-sidebar.png",
      active: true,
      templateConfig: JSON.stringify({
        accentColor: "#E06D38",
        headerStyle: "sidebar",
        fontStyle: "sans",
      }),
    },
  ];

  for (const t of templates) {
    await prisma.invoiceTemplate.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
  }

  // 2. Demo User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("password123", salt);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@buno.app" },
    update: {},
    create: {
      name: "Alexander Wright",
      email: "demo@buno.app",
      passwordHash,
      profile: {
        create: {
          businessName: "Wright & Associates Design",
          ownerName: "Alexander Wright",
          email: "billing@wrightdesign.co",
          phone: "+1 (555) 234-8901",
          website: "https://wrightdesign.co",
          address: "580 Howard Street, Suite 400\nSan Francisco, CA 94105",
          taxNumber: "US-84-9382104",
          registrationNumber: "REG-2024-SF-88",
          bankDetails: "Silicon Valley Bank\nAccount: 4892-0193-8401\nRouting: 121000358\nSwift: SVBUS6S",
          paymentInstructions: "Please reference the invoice number in wire details. ACH and wire transfers accepted.",
          defaultCurrency: "USD",
          defaultTaxRate: 8.5,
          defaultPaymentTerms: "Net 15 Days",
          invoicePrefix: "INV-",
          nextInvoiceNumber: 1005,
        },
      },
      settings: {
        create: {
          defaultTemplate: "modern",
          currency: "USD",
          dateFormat: "YYYY-MM-DD",
          accentColor: "#4468E8",
        },
      },
    },
  });

  // 3. Demo Customers
  const customer1 = await prisma.customer.create({
    data: {
      userId: demoUser.id,
      name: "Sarah Jenkins",
      companyName: "Acme Cloud Technologies",
      email: "accounts@acmecloud.io",
      phone: "+1 (415) 890-1122",
      address: "100 Montgomery St, 18th Floor\nSan Francisco, CA 94104",
      taxNumber: "US-94-118290",
      notes: "Preferred billing contact: Sarah Jenkins (VP Operations)",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      userId: demoUser.id,
      name: "Marcus Vance",
      companyName: "Vance & Sterling Partners",
      email: "mvance@vancesterling.com",
      phone: "+1 (212) 555-7890",
      address: "350 5th Avenue, Suite 5200\nNew York, NY 10118",
      taxNumber: "US-13-908234",
      notes: "Annual retainer client.",
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      userId: demoUser.id,
      name: "Elena Rostova",
      companyName: "Lumina Health Systems",
      email: "erostova@luminahealth.org",
      phone: "+1 (617) 555-4321",
      address: "75 Francis Street\nBoston, MA 02115",
      taxNumber: "US-04-223456",
      notes: "Requires PO number on all invoices.",
    },
  });

  // 4. Demo Invoices
  // Invoice 1: Paid
  const inv1 = await prisma.invoice.create({
    data: {
      userId: demoUser.id,
      customerId: customer1.id,
      invoiceNumber: "INV-1001",
      templateId: "modern",
      status: "paid",
      invoiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      currency: "USD",
      subtotal: 7500.0,
      discount: 250.0,
      discountType: "fixed",
      taxRate: 8.5,
      taxTotal: 616.25,
      total: 7866.25,
      amountPaid: 7866.25,
      balanceDue: 0.0,
      notes: "Thank you for partnering with Wright & Associates! We appreciate your business.",
      paymentTerms: "Due in 15 days upon receipt.",
      items: {
        create: [
          {
            description: "SaaS Product Design System & Figma UI Kit",
            quantity: 1,
            unit: "project",
            unitPrice: 4500.0,
            discount: 0,
            taxRate: 8.5,
            lineTotal: 4500.0,
            sortOrder: 1,
          },
          {
            description: "User Research, Journey Mapping & Usability Testing",
            quantity: 30,
            unit: "hrs",
            unitPrice: 100.0,
            discount: 250.0,
            taxRate: 8.5,
            lineTotal: 2750.0,
            sortOrder: 2,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 7866.25,
            paymentDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
            paymentMethod: "Bank Transfer",
            reference: "WIRE-ACH-88921",
            notes: "Full payment received via ACH wire.",
          },
        ],
      },
    },
  });

  // Invoice 2: Sent (Outstanding)
  const inv2 = await prisma.invoice.create({
    data: {
      userId: demoUser.id,
      customerId: customer2.id,
      invoiceNumber: "INV-1002",
      templateId: "elegant",
      status: "sent",
      invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      currency: "USD",
      subtotal: 12000.0,
      discount: 0.0,
      discountType: "percentage",
      taxRate: 8.5,
      taxTotal: 1020.0,
      total: 13020.0,
      amountPaid: 0.0,
      balanceDue: 13020.0,
      notes: "Monthly brand advisory & creative director retainer for Q4.",
      paymentTerms: "Net 15 Days. Wire transfer instructions on footer.",
      items: {
        create: [
          {
            description: "Executive Creative Advisory & Brand Strategy (Q4 Retainer)",
            quantity: 1,
            unit: "month",
            unitPrice: 8500.0,
            discount: 0,
            taxRate: 8.5,
            lineTotal: 8500.0,
            sortOrder: 1,
          },
          {
            description: "High-fidelity Marketing Landing Pages & Asset Production",
            quantity: 35,
            unit: "hrs",
            unitPrice: 100.0,
            discount: 0,
            taxRate: 8.5,
            lineTotal: 3500.0,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  // Invoice 3: Partially Paid
  const inv3 = await prisma.invoice.create({
    data: {
      userId: demoUser.id,
      customerId: customer3.id,
      invoiceNumber: "INV-1003",
      templateId: "corporate",
      status: "partially_paid",
      invoiceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      currency: "USD",
      subtotal: 5800.0,
      discount: 5.0, // 5% discount
      discountType: "percentage",
      taxRate: 8.5,
      taxTotal: 468.35,
      total: 5978.35,
      amountPaid: 3000.0,
      balanceDue: 2978.35,
      notes: "PO: LH-2024-9981. 50% deposit received upon contract execution.",
      paymentTerms: "Remaining 50% due on delivery.",
      items: {
        create: [
          {
            description: "Patient Portal UI Redesign & Accessibility Audit (WCAG 2.1 AA)",
            quantity: 1,
            unit: "package",
            unitPrice: 5800.0,
            discount: 290.0,
            taxRate: 8.5,
            lineTotal: 5510.0,
            sortOrder: 1,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 3000.0,
            paymentDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            paymentMethod: "Credit Card",
            reference: "CC-STRIPE-40219",
            notes: "Initial deposit paid online.",
          },
        ],
      },
    },
  });

  // Invoice 4: Overdue
  const inv4 = await prisma.invoice.create({
    data: {
      userId: demoUser.id,
      customerId: customer1.id,
      invoiceNumber: "INV-1004",
      templateId: "classic",
      status: "overdue",
      invoiceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      currency: "USD",
      subtotal: 3200.0,
      discount: 0.0,
      discountType: "percentage",
      taxRate: 8.5,
      taxTotal: 272.0,
      total: 3472.0,
      amountPaid: 0.0,
      balanceDue: 3472.0,
      notes: "Late fee of 1.5% may apply after 30 days past due.",
      paymentTerms: "Due immediately upon receipt.",
      items: {
        create: [
          {
            description: "Interactive Prototype & Mobile Motion Specifications",
            quantity: 1,
            unit: "deliverable",
            unitPrice: 3200.0,
            discount: 0,
            taxRate: 8.5,
            lineTotal: 3200.0,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
