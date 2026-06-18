import { useEffect, useRef } from "react";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

// ── Backdrop + panel wrapper ───────────────────────────────────────────────────

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, onClose, children }: DialogProps) => {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
};

// ── Close button ──────────────────────────────────────────────────────────────

export const DialogClose = ({ onClose }: { onClose: () => void }) => (
  <button
    onClick={onClose}
    className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    aria-label="Close"
  >
    <X className="h-4 w-4" />
  </button>
);

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
// Generic yes/no confirmation with title, description, and action label.

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) => (
  <Dialog open={open} onClose={onClose}>
    <DialogClose onClose={onClose} />

    <div className="flex items-start gap-3 pr-6">
      {variant === "destructive" ? (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      )}
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>

    <div className="mt-6 flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant={variant}
        size="sm"
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Processing…" : confirmLabel}
      </Button>
    </div>
  </Dialog>
);

// ── Delay Reason Modal ─────────────────────────────────────────────────────────
// Modal with a text input for capturing a delay reason before submitting.

interface DelayModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
  loading?: boolean;
}

export const DelayModal = ({
  open,
  onClose,
  onConfirm,
  title = "Mark as Delayed",
  loading = false,
}: DelayModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reason = inputRef.current?.value.trim();
    if (!reason) return;
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogClose onClose={onClose} />

      <div className="flex items-start gap-3 pr-6">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Provide a reason. This will be visible on all affected packages.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="delay-reason">Delay Reason</Label>
          <Input
            id="delay-reason"
            ref={inputRef}
            placeholder="e.g. Weather conditions, mechanical issue…"
            required
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={loading}
          >
            {loading ? "Saving…" : "Mark Delayed"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
