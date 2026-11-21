import type { Metadata } from "next";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buno — Premium AI Invoice Generator SaaS",
  description:
    "Design, customize, manage, and export studio-quality invoices in seconds. Powered by real database persistence and Buno AI.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className="min-h-screen bg-[#FAFAF8] text-[#202124] antialiased">
        <NextTopLoader
          color="#4468E8"
          initialPosition={0.12}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={220}
          shadow="0 0 10px #4468E8,0 0 5px #4468E8"
          zIndex={99999}
        />
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              color: "#202124",
              border: "1px solid #E8E8E5",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            },
          }}
        />
      </body>
    </html>
  );
}
