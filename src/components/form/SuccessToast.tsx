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

/**
 * Визуальная копия успеха. Объявление скринридеру делает живой регион формы, поэтому карточка
 * помечена aria-hidden и закрывается по таймеру, по клику по карточке или по Escape.
 */
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

  // Свежий requestClose лежит в ref, поэтому автотаймеру не нужна его идентичность.
  const requestCloseRef = useRef(requestClose);
  useEffect(() => {
    requestCloseRef.current = requestClose;
  });

  // Автозакрытие отсчитывается один раз: новая ссылка onClose у родителя его не перезапускает.
  useEffect(() => {
    const autoTimer = setTimeout(() => requestCloseRef.current(), duration);

    return () => clearTimeout(autoTimer);
  }, [duration]);

  // Клавиатуре нужен свой способ убрать сообщение: кнопки внутри нет, кликнуть нечем.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestCloseRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Таймер фазы ухода живёт до размонтирования: иначе тост завис бы прозрачным и ловил клики.
  useEffect(
    () => () => {
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    },
    [],
  );

  return createPortal(
    <div
      className="lf-toast"
      data-state={closing ? "closing" : "open"}
      aria-hidden="true"
      onClick={requestClose}
    >
      <GlassCard className="lf-toast-card">
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
