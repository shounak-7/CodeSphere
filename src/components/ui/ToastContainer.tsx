"use client";

import { useState, useEffect, useRef } from "react";
import { useToastStore } from "@/lib/store/useToastStore";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, dialog, removeToast, closeDialog } = useToastStore();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (dialog && dialog.type === "prompt") {
      setInputValue(dialog.defaultValue || "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [dialog]);

  return (
    <>
      {/* Toast Notification Popups (Top Right below Navbar, avoiding OS dock overlap) */}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.slice(-2).map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-slide-up text-xs font-medium ${
              toast.type === "success"
                ? "bg-slate-900/95 border-emerald-500/40 text-emerald-300"
                : toast.type === "error"
                ? "bg-slate-900/95 border-red-500/40 text-red-300"
                : toast.type === "warning"
                ? "bg-slate-900/95 border-amber-500/40 text-amber-300"
                : "bg-slate-900/95 border-indigo-500/40 text-indigo-300"
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              {toast.type === "warning" && <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
              {toast.type === "info" && <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
              <span className="truncate">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Custom Sleek Modal Dialog (Replacing browser window.alert, window.prompt, and window.confirm) */}
      {dialog?.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-base font-bold text-foreground mb-1">{dialog.title}</h3>
            {dialog.message && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{dialog.message}</p>
            )}

            {dialog.type === "prompt" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  dialog.onConfirm(inputValue);
                }}
                className="mt-3 mb-5"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={dialog.placeholder || "Enter value..."}
                  className="w-full h-10 px-3.5 text-xs rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </form>
            )}

            <div className="flex items-center justify-end gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => {
                  dialog.onCancel?.();
                  closeDialog();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {dialog.cancelLabel || "Cancel"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (dialog.type === "prompt") {
                    dialog.onConfirm(inputValue);
                  } else {
                    dialog.onConfirm();
                  }
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  dialog.isDestructive
                    ? "bg-red-600 hover:bg-red-500 shadow-red-600/20"
                    : "bg-primary hover:bg-primary/90 shadow-primary/20"
                }`}
              >
                {dialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
