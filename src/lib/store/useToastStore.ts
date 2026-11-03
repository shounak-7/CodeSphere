"use client";

import { create } from "zustand";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export interface DialogOptions {
  isOpen: boolean;
  type: "confirm" | "prompt";
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: (value?: string) => void;
  onCancel?: () => void;
}

interface ToastStore {
  toasts: ToastMessage[];
  dialog: DialogOptions | null;
  addToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  removeToast: (id: string) => void;
  openPrompt: (options: {
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmLabel?: string;
    onConfirm: (val: string) => void;
  }) => void;
  openConfirm: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
  closeDialog: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  dialog: null,

  addToast: (message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    // Defer state update to next macrotask to avoid React "Cannot update a component while rendering a different component"
    setTimeout(() => {
      set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    }, 0);

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  openPrompt: ({ title, message, placeholder, defaultValue = "", confirmLabel = "Confirm", onConfirm }) => {
    set({
      dialog: {
        isOpen: true,
        type: "prompt",
        title,
        message,
        placeholder,
        defaultValue,
        confirmLabel,
        isDestructive: false,
        onConfirm: (val) => {
          onConfirm(val || "");
          set({ dialog: null });
        },
        onCancel: () => set({ dialog: null }),
      },
    });
  },

  openConfirm: ({ title, message, confirmLabel = "Confirm", isDestructive = false, onConfirm }) => {
    set({
      dialog: {
        isOpen: true,
        type: "confirm",
        title,
        message,
        confirmLabel,
        isDestructive,
        onConfirm: () => {
          onConfirm();
          set({ dialog: null });
        },
        onCancel: () => set({ dialog: null }),
      },
    });
  },

  closeDialog: () => set({ dialog: null }),
}));
