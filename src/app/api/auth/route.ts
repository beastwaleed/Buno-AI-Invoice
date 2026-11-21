import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, setSessionCookie, clearSessionCookie, getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, name } = body;

    if (action === "logout") {
      await clearSessionCookie();
      return NextResponse.json({ success: true });
    }

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { profile: true },
      });

      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      await setSessionCookie(user.id);
      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
      });
    }

    if (action === "register") {
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          profile: {
            create: {
              businessName: `${name}'s Business`,
              ownerName: name,
              email: email.toLowerCase().trim(),
              defaultCurrency: "USD",
              defaultTaxRate: 0,
              defaultPaymentTerms: "Net 14 Days",
              invoicePrefix: "INV-",
              nextInvoiceNumber: 1001,
            },
          },
          settings: {
            create: {
              defaultTemplate: "modern",
              currency: "USD",
            },
          },
        },
      });

      await setSessionCookie(newUser.id);
      return NextResponse.json({
        success: true,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
