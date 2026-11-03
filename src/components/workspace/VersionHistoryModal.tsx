"use client";

import { useState, useEffect } from "react";
import { History, X, RotateCcw, Clock, Check, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useToastStore } from "@/lib/store/useToastStore";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface Version {
  id: string;
  version_number: number;
  source_code: string;
  change_description?: string;
  created_at: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  onRestore: (newCode: string) => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  programId,
  onRestore,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && programId) {
      setLoading(true);
      fetch(`/api/programs/${programId}/versions`)
        .then((res) => res.json())
        .then((data) => {
          if (data.versions) {
            setVersions(data.versions);
            setSelectedVersion(data.versions[0] || null);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, programId]);

  if (!isOpen) return null;

  const handleRestore = (versionNumber: number) => {
    useToastStore.getState().openConfirm({
      title: "Restore Checkpoint",
      message: `Are you sure you want to restore Version ${versionNumber}? This will create a new current checkpoint.`,
      confirmLabel: "Restore Code",
      onConfirm: async () => {
        setRestoring(true);
        try {
          const res = await fetch(`/api/programs/${programId}/restore`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ version_number: versionNumber }),
          });
          const data = await res.json();
          if (res.ok && data.restored_code) {
            onRestore(data.restored_code);
            useToastStore.getState().addToast(`Restored to Version ${versionNumber}`, "success");
            onClose();
          } else {
            useToastStore.getState().addToast("Failed to restore version", "error");
          }
        } finally {
          setRestoring(false);
        }
      },
    });
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl h-[85vh] sm:h-[75vh] flex flex-col rounded-xl sm:rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <History className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">Code Version History</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Preview checkpoints and safely restore historical snapshots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>

        {/* Body: Split List & Code Preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
          {/* Versions List */}
          <div className="md:col-span-5 max-h-44 md:max-h-full md:h-full overflow-y-auto p-2.5 sm:p-4 space-y-1.5 sm:space-y-2 bg-secondary/10">
            {loading ? (
              <div className="h-32 sm:h-48 flex items-center justify-center">
                <Loader2 className="w-5 sm:w-6 h-5 sm:h-6 animate-spin text-primary" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-muted-foreground">
                No checkpoints found.
              </div>
            ) : (
              versions.map((ver) => (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border cursor-pointer transition-all ${
                    selectedVersion?.id === ver.id
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] sm:text-xs text-foreground">
                      Version {ver.version_number}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                      {formatRelativeTime(ver.created_at)}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                    {ver.change_description || "Checkpoint save"}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Code Preview & Restore */}
          <div className="md:col-span-7 h-full flex flex-col overflow-hidden bg-[#090d16]">
            {selectedVersion ? (
              <>
                <div className="h-9 sm:h-11 px-3 sm:px-4 border-b border-border/80 bg-secondary/30 flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-mono text-slate-300">
                    Preview: Version {selectedVersion.version_number}
                  </span>
                  <button
                    onClick={() => handleRestore(selectedVersion.version_number)}
                    disabled={restoring}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    <span>{restoring ? "Restoring..." : "Restore Version"}</span>
                  </button>
                </div>
                <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto font-mono text-[11px] sm:text-xs text-slate-200 whitespace-pre leading-relaxed select-text">
                  {selectedVersion.source_code}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs sm:text-sm text-slate-500">
                Select a version on the left to preview code.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
);
}
