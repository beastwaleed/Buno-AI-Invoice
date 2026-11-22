"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Globe, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

interface VoiceAssistantProps {
  onTranscript: (transcript: string) => void;
  currentValue?: string;
  disabled?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: "ur-PK", label: "اردو (Urdu)", flag: "🇵🇰", placeholder: "بولیں: علی ٹیک کے لیے انوائس بنائیں..." },
  { code: "hi-IN", label: "हिन्दी (Hindi)", flag: "🇮🇳", placeholder: "बोलें: शर्मा एंटरप्राइजेज के लिए बिल बनाएं..." },
  { code: "en-US", label: "English (US)", flag: "🇺🇸", placeholder: "Speak: Create invoice for Acme Corp..." },
  { code: "ar-SA", label: "العربية (Arabic)", flag: "🇸🇦", placeholder: "تحدث: أنشئ فاتورة لشركة الأمل..." },
];

export const VoiceAssistantButton: React.FC<VoiceAssistantProps> = ({
  onTranscript,
  currentValue = "",
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("ur-PK");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript + " ";
          }
        }

        if (finalTranscript.trim()) {
          const base = currentValue ? currentValue.trim() + " " : "";
          onTranscript(base + finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please allow microphone permissions.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [selectedLang, onTranscript, currentValue]);

  const toggleListening = () => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognition) {
      toast.error(
        "Speech recognition is not natively supported in this browser. Please use Chrome, Edge, or Safari, or type your prompt directly."
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = selectedLang;
          recognitionRef.current.start();
          const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang);
          toast.info(
            `Listening in ${activeLangObj?.label}... Speak your invoice details.`,
            { duration: 3000 }
          );
        }
      } catch (err) {
        console.error("Speech start error:", err);
      }
    }
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex items-center gap-2">
      {/* Voice Assistant Mic Button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
          isListening
            ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
            : "bg-white hover:bg-[#FAFAF8] text-[#202124] border border-[#E8E8E5]"
        }`}
        title="Speak invoice details in Urdu, Hindi, English, etc."
      >
        {isListening ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Mic className="w-3.5 h-3.5 animate-bounce" />
            <span>Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-[#4468E8]" />
            <span>Voice Input</span>
          </>
        )}
      </button>

      {/* Language Selector Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setLangMenuOpen(!langMenuOpen)}
          disabled={isListening}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#FAFAF8] hover:bg-[#F0F0EE] border border-[#E8E8E5] text-[#70757A] transition-colors"
          title="Change voice recognition language"
        >
          <span>{currentLangObj.flag}</span>
          <span className="text-[11px] font-medium hidden sm:inline">
            {currentLangObj.label.split(" ")[0]}
          </span>
        </button>

        {langMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setLangMenuOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-[#E8E8E5] shadow-xl z-50 py-1 text-xs">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#70757A] border-b border-[#F0F0EE]">
                Voice Language
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#FAFAF8] transition-colors ${
                    selectedLang === lang.code
                      ? "text-[#4468E8] font-semibold bg-[#EEF2FF]"
                      : "text-[#202124]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {selectedLang === lang.code && (
                    <Check className="w-3.5 h-3.5 text-[#4468E8]" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
