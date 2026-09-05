import { useEffect } from "react";
import { createPortal } from "react-dom";

import { GlassCard } from "../layout/GlassCard";

const DEFAULT_DURATION = 4000;

/** Живая область успеха: закрывается по таймеру или по клику в любую точку, кнопки внутри нет. */
export function SuccessToast({
  open,
  message,
  onClose,
  duration = DEFAULT_DURATION,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="lf-toast pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center"
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <GlassCard className="lf-toast-card pointer-events-auto">
        <span className="lf-toast-icon" aria-hidden="true">
          <svg viewBox="0 0 12 12" focusable="false">
            <path
              d="M1 6.2 4.4 9.4 11 2.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>{message}</span>
      </GlassCard>
    </div>,
    document.body,
  );
}
