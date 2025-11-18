"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { Lightbulb, Globe, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceholdersAndVanishInput } from "./placeholders-and-vanish-input";
import { cn } from "@/lib/utils";

const AI_PLACEHOLDERS = [
  "How Can I Help You?",
  "Explain the concept of cellular respiration...",
  "Help me understand Newton's laws of motion...",
  "What are the key events of World War II?",
  "Can you break down this calculus problem?",
  "Summarize this chapter for me...",
  "Create a practice quiz on this topic...",
  "What are the main themes in this literature?",
];

interface AIChatInputProps {
  onSubmit: (message: string, options?: { think?: boolean; deepSearch?: boolean }) => void | Promise<void>;
  onFileUpload?: (file: File) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function AIChatInput({ onSubmit, onFileUpload, disabled = false, placeholder }: AIChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(inputValue, {
        think: thinkActive,
        deepSearch: deepSearchActive,
      });
      setInputValue("");
      setShowControls(false);
      setThinkActive(false);
      setDeepSearchActive(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      await onFileUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full space-y-3" ref={formRef}>
      {/* Enhanced Controls Bar - Shows when input is focused */}
      <AnimatePresence>
        {(showControls || inputValue) && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex gap-3 items-center flex-wrap px-2"
          >
            {/* File Upload */}
            {onFileUpload && (
              <>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attach file"
                  type="button"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={16} />
                  <span className="text-sm">Attach</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </>
            )}

            {/* Think Toggle */}
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all font-medium group",
                thinkActive
                  ? "bg-purple-600/30 outline outline-1 outline-purple-400/60 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
              title="Enable deeper reasoning"
              type="button"
              onClick={() => setThinkActive((a) => !a)}
              disabled={disabled}
            >
              <Lightbulb
                className={cn("transition-all", thinkActive && 'fill-yellow-300 text-yellow-300')}
                size={16}
              />
              <span className="text-sm">Think</span>
            </button>

            {/* Deep Search Toggle */}
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all font-medium",
                deepSearchActive
                  ? "bg-blue-600/30 outline outline-1 outline-blue-400/60 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
              title="Search relevant study materials"
              type="button"
              onClick={() => setDeepSearchActive((a) => !a)}
              disabled={disabled}
            >
              <Globe size={16} />
              <span className="text-sm">Deep Search</span>
            </button>

            {/* Info Text */}
            <span className="text-xs text-white/40 ml-2">
              Press Enter to send
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input - PlaceholdersAndVanishInput */}
      <div className="relative" onFocus={() => setShowControls(true)}>
        <div
          className={cn(
            "rounded-full overflow-hidden transition-all duration-300",
            "bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20",
            "p-[2px]",
            showControls || inputValue ? "shadow-[0_0_30px_rgba(139,92,246,0.4)]" : "shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          )}
        >
          <div className="rounded-full bg-zinc-900/95 backdrop-blur-xl">
            <PlaceholdersAndVanishInput
              placeholders={placeholder ? [placeholder] : AI_PLACEHOLDERS}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value && !showControls) {
                  setShowControls(true);
                }
              }}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-sm z-[100]">
            <div className="flex items-center gap-3 text-white">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-sm font-medium">Sending...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
