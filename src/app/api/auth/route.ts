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
      const res = NextResponse.json({ success: true });
      res.cookies.set("buno_session_id", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
      return res;
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
              defaultTemplate: "classic",
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

    // Step 1 of Forgot Password: Verify email exists
    if (action === "forgot-password-check") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "No account found with this email address. Please check and try again." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        name: user.name,
        email: user.email,
      });
    }

    // Step 2 of Forgot Password: Set new password
    if (action === "reset-password") {
      const { newPassword } = body;
      if (!email || !newPassword) {
        return NextResponse.json(
          { error: "Email and new password are required" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      return NextResponse.json({
        success: true,
        message: "Password has been successfully updated. You can now sign in.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
