import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [settings, profile] = await Promise.all([
      prisma.userSettings.findUnique({
        where: { userId: user.id },
      }),
      prisma.businessProfile.findUnique({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      settings: settings || {
        currency: profile?.defaultCurrency || "USD",
        defaultTemplate: "classic",
        dateFormat: "YYYY-MM-DD",
        language: "en",
        accentColor: "#4468E8",
      },
      profile,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const currency = body.currency ? String(body.currency).toUpperCase() : "USD";
    const defaultTemplate = body.defaultTemplate || "classic";
    const dateFormat = body.dateFormat || "YYYY-MM-DD";
    const language = body.language || "en";
    const accentColor = body.accentColor || "#4468E8";

    // Atomically upsert UserSettings and sync BusinessProfile.defaultCurrency
    const [settings, profile] = await prisma.$transaction([
      prisma.userSettings.upsert({
        where: { userId: user.id },
        update: {
          currency,
          defaultTemplate,
          dateFormat,
          language,
          accentColor,
        },
        create: {
          userId: user.id,
          currency,
          defaultTemplate,
          dateFormat,
          language,
          accentColor,
        },
      }),
      prisma.businessProfile.upsert({
        where: { userId: user.id },
        update: {
          defaultCurrency: currency,
        },
        create: {
          userId: user.id,
          businessName: "My Business",
          defaultCurrency: currency,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      profile,
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
