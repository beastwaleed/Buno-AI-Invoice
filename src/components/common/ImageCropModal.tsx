"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Crop as CropIcon,
  Sparkles,
  Layers,
} from "lucide-react";
import { getCroppedImg, PixelCrop } from "@/lib/cropImage";

export interface AspectPreset {
  label: string;
  ratio: number | undefined;
  desc: string;
}

const ASPECT_PRESETS: AspectPreset[] = [
  { label: "1:1 Square", ratio: 1 / 1, desc: "Best for badge & icon logos" },
  { label: "4:3 Classic", ratio: 4 / 3, desc: "Standard company emblems" },
  { label: "16:9 Banner", ratio: 16 / 9, desc: "Wide horizontal wordmarks" },
  { label: "3:2 Standard", ratio: 3 / 2, desc: "Balanced brand marks" },
  { label: "2:1 Wide", ratio: 2 / 1, desc: "Panoramic headers" },
  { label: "Freeform", ratio: undefined, desc: "Custom unconstrained crop" },
];

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApplyCrop: (croppedFile: File, croppedDataUrl: string) => Promise<void> | void;
  title?: string;
  initialAspect?: number;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApplyCrop,
  title = "Crop & Frame Business Logo",
  initialAspect = 1 / 1,
}) => {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState<number | undefined>(initialAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setSelectedRatio(initialAspect);
  };

  const handleApply = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const { file, dataUrl } = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      await onApplyCrop(file, dataUrl);
      onClose();
    } catch (err) {
      console.error("Failed to crop image:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#14171F] text-white w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4468E8]/20 border border-[#4468E8]/40 flex items-center justify-center text-[#4468E8]">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-[11px] text-neutral-400">
                Adjust ratio, pan & zoom to frame your brand logo perfectly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aspect Ratio Presets Bar */}
        <div className="px-6 py-3 bg-[#0E1015] border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-medium text-neutral-400 shrink-0 flex items-center gap-1 mr-1">
            <Layers className="w-3 h-3 text-[#4468E8]" />
            Aspect Ratio:
          </span>
          {ASPECT_PRESETS.map((preset) => {
            const isActive = selectedRatio === preset.ratio;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSelectedRatio(preset.ratio)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#4468E8] text-white shadow-xs font-semibold"
                    : "bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5"
                }`}
                title={preset.desc}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Cropping Canvas Viewport */}
        <div className="relative w-full h-80 sm:h-96 bg-[#0B0D13] select-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={selectedRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            showGrid={true}
            cropSize={selectedRatio === undefined ? undefined : undefined}
            style={{
              containerStyle: {
                backgroundColor: "#090A0F",
              },
              cropAreaStyle: {
                border: "2px solid #4468E8",
                boxShadow: "0 0 0 9999em rgba(0, 0, 0, 0.65)",
              },
            }}
          />
        </div>

        {/* Interactive Controls Bar: Zoom Slider + Rotation + Reset */}
        <div className="px-6 py-3.5 bg-[#0E1015] border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
            <button
              type="button"
              onClick={() => setZoom(Math.max(1, zoom - 0.2))}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-white/10"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#4468E8] h-1.5 bg-white/20 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom(Math.min(3, zoom + 0.2))}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-white/10"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-neutral-400 w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotation & Reset Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 transition-colors"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#4468E8]" />
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#14171F] border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Drag image to position • Pinch or scroll to zoom</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#4468E8] hover:bg-[#3455D1] text-white shadow-md transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply & Save Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
