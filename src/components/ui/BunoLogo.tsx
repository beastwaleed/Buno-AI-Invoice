import React from "react";

interface BunoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | number;
  showText?: boolean;
  variant?: "primary" | "white" | "monochrome";
}

export const BunoLogo: React.FC<BunoLogoProps> = ({
  className = "",
  size = "md",
  showText = true,
  variant = "primary",
}) => {
  // Determine pixel size
  let dimension = 36;
  if (typeof size === "number") dimension = size;
  else if (size === "sm") dimension = 28;
  else if (size === "md") dimension = 36;
  else if (size === "lg") dimension = 44;
  else if (size === "xl") dimension = 56;

  const isWhite = variant === "white";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric SVG Brand Mark */}
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        <defs>
          {/* Main Gradient */}
          <linearGradient
            id="buno-primary-grad"
            x1="4"
            y1="4"
            x2="44"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#4F6EF7" />
            <stop offset="60%" stopColor="#3854E0" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Accent Facet Gradient */}
          <linearGradient
            id="buno-facet-grad"
            x1="18"
            y1="10"
            x2="38"
            y2="34"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.6" />
          </linearGradient>

          {/* Golden Sparkle Gradient */}
          <linearGradient
            id="buno-spark-grad"
            x1="26"
            y1="12"
            x2="38"
            y2="24"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <filter id="buno-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="3"
              floodColor="#4F6EF7"
              floodOpacity="0.25"
            />
          </filter>
        </defs>

        {/* Base Squircle Container */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill={isWhite ? "#FFFFFF" : "url(#buno-primary-grad)"}
          filter={isWhite ? undefined : "url(#buno-glow)"}
        />

        {/* Subtle Inner Border */}
        <rect
          x="3.5"
          y="3.5"
          width="41"
          height="41"
          rx="11.5"
          stroke={isWhite ? "#E2E8F0" : "#FFFFFF"}
          strokeOpacity={isWhite ? "1" : "0.2"}
          strokeWidth="1"
        />

        {/* Geometric Folding Document / Stylized "B" Structure */}
        {/* Left Vertical Spine */}
        <rect
          x="13"
          y="12"
          width="5"
          height="24"
          rx="2.5"
          fill={isWhite ? "#3B82F6" : "#FFFFFF"}
        />

        {/* Top Loop / Fold of the B */}
        <path
          d="M15 12H26.5C29.5376 12 32 14.4624 32 17.5C32 20.5376 29.5376 23 26.5 23H15V12Z"
          fill={isWhite ? "#2563EB" : "url(#buno-facet-grad)"}
        />
        <circle
          cx="23.5"
          cy="17.5"
          r="2.5"
          fill={isWhite ? "#FFFFFF" : "#1E3A8A"}
          fillOpacity={isWhite ? "1" : "0.5"}
        />

        {/* Bottom Loop / Ledger Sheet of the B */}
        <path
          d="M15 22H28C31.3137 22 34 24.6863 34 28C34 31.3137 31.3137 34 28 34H15V22Z"
          fill={isWhite ? "#1D4ED8" : "#FFFFFF"}
          fillOpacity={isWhite ? "1" : "0.95"}
        />
        <circle
          cx="24.5"
          cy="28"
          r="3"
          fill={isWhite ? "#FFFFFF" : "#3854E0"}
        />

        {/* Micro Diamond AI Spark Facet at the Intersection */}
        <path
          d="M33 13L34.5 16.5L38 18L34.5 19.5L33 23L31.5 19.5L28 18L31.5 16.5L33 13Z"
          fill={isWhite ? "#60A5FA" : "url(#buno-spark-grad)"}
        />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span
              className={`font-serif font-black tracking-tight ${
                dimension >= 44
                  ? "text-2xl"
                  : dimension <= 28
                  ? "text-base"
                  : "text-xl"
              } ${isWhite ? "text-white" : "text-[#202124]"}`}
            >
              Buno
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4468E8] shrink-0 self-baseline mt-1.5" />
          </div>
          <span
            className={`text-[10px] font-sans font-medium uppercase tracking-widest -mt-0.5 ${
              isWhite ? "text-blue-100/70" : "text-[#70757A]"
            }`}
          >
            Studio Invoicing
          </span>
        </div>
      )}
    </div>
  );
};
