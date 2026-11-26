"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, Image, Printer, ChevronDown } from "lucide-react";
import { exportToPdf, exportToPng, exportToJpeg, triggerPrint } from "@/lib/export";
import { InvoiceData } from "@/types/invoice";

interface ExportMenuProps {
  invoice: InvoiceData;
  elementId?: string;
  className?: string;
  buttonClassName?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  invoice,
  elementId = "invoice-preview-document",
  className = "",
  buttonClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cleanName = (invoice.customer?.name || "Client")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();
  const baseFilename = `${invoice.invoiceNumber || "INV"}-${cleanName}`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative text-left ${className || "inline-block"}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Export invoice options"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={
          buttonClassName ||
          "w-full inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-xs font-medium text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">Export</span>
        <ChevronDown className="w-3 h-3 opacity-80 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-elevated border border-[#E8E8E5] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-[#70757A] uppercase tracking-wider border-b border-[#F0F0EE]">
            Export Options
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              exportToPdf({ elementId, filename: `${baseFilename}.pdf` });
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#202124] hover:bg-[#EEF2FF] hover:text-[#4468E8] transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-[#4468E8]" />
            <div>
              <div className="font-semibold">Download PDF</div>
              <div className="text-[10px] text-[#70757A]">Crisp A4 document for sharing</div>
            </div>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              exportToPng({ elementId, filename: `${baseFilename}.png` });
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#202124] hover:bg-[#EEF2FF] hover:text-[#4468E8] transition-colors text-left"
          >
            <Image className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="font-semibold">Download PNG</div>
              <div className="text-[10px] text-[#70757A]">High-resolution 2.5x graphic</div>
            </div>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              exportToJpeg({ elementId, filename: `${baseFilename}.jpg` });
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#202124] hover:bg-[#EEF2FF] hover:text-[#4468E8] transition-colors text-left"
          >
            <Image className="w-4 h-4 text-amber-600" />
            <div>
              <div className="font-semibold">Download JPEG</div>
              <div className="text-[10px] text-[#70757A]">Compact image file</div>
            </div>
          </button>

          <div className="border-t border-[#F0F0EE] my-1"></div>

          <button
            onClick={() => {
              setIsOpen(false);
              triggerPrint();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#202124] hover:bg-[#F5F5F3] transition-colors text-left"
          >
            <Printer className="w-4 h-4 text-[#70757A]" />
            <div>
              <div className="font-semibold">Print Invoice</div>
              <div className="text-[10px] text-[#70757A]">Standard system print dialog</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
