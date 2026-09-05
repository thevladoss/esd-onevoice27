import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { GlassCard } from "../layout/GlassCard";

const DEFAULT_DURATION = 4000;
const CLOSE_DURATION = 200;

/** Система просит меньше движения: тост убирается сразу, фазы ухода нет. */
function wantsInstantClose(): boolean {
  const query =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  return query?.matches === true;
}

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
  if (!open) {
    return null;
  }

  return <LiveToast message={message} onClose={onClose} duration={duration} />;
}

/**
 * Открытый тост живёт отдельным компонентом: закрытие снимает его с монтирования,
 * поэтому фаза ухода сбрасывается сама и второй тост стартует чистым.
 */
function LiveToast({
  message,
  onClose,
  duration,
}: {
  message: string;
  onClose: () => void;
  duration: number;
}) {
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Уход занимает 200 мс: сначала карточка гаснет, потом родитель снимает тост.
  const requestClose = useCallback(() => {
    if (closeTimer.current !== null) {
      return;
    }

    if (wantsInstantClose()) {
      onClose();
      return;
    }

    setClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onClose();
    }, CLOSE_DURATION);
  }, [onClose]);

  useEffect(() => {
    const autoTimer = setTimeout(requestClose, duration);

    return () => {
      clearTimeout(autoTimer);

      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, [duration, requestClose]);

  return createPortal(
    <div
      className="lf-toast pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center"
      data-state={closing ? "closing" : "open"}
      role="status"
      aria-live="polite"
      onClick={requestClose}
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
