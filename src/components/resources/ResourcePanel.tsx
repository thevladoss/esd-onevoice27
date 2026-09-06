import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ResourceKey } from "../../data/copy.resources";
import { resourcesCopy } from "../../data/copy.resources";
import { materialGroups, musicFiles, videoFiles } from "../../data/resourceFiles";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { FileCard } from "./FileCard";
import { FileGroup } from "./FileGroup";
import { VideoGrid } from "./VideoGrid";

/** Фазы шторки. `opening` живёт один кадр: он нужен, чтобы браузер увидел стартовое
 *  положение слоёв до того, как класс `is-open` переведёт их в конечное. */
type PanelPhase = "closed" | "opening" | "open" | "closing";

type PanelState = {
  /** Последнее увиденное значение пропа: по нему ловится смена активной панели. */
  tracked: ResourceKey | null;
  /** Что нарисовано сейчас. На закрытии держится до конца анимации. */
  kind: ResourceKey | null;
  phase: PanelPhase;
};

const CLOSED: PanelState = { tracked: null, kind: null, phase: "closed" };

/** Класс блокировки прокрутки висит на html и body, правило лежит в resources.css. */
const LOCK_CLASS = "resources-panel-locked";

/** Слои едут 620ms со сдвигом 90ms, содержимое гаснет 180ms: 900ms покрывают всё с запасом. */
const CLOSE_FALLBACK_MS = 900;

const FOCUSABLE = 'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** Куда может уехать фокус внутри диалога. Содержимое свёрнутой группы в jsdom остаётся
 *  доступным, поэтому закрытый `<details>` отдаёт только свой `summary`. */
function focusableNodes(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((node) => {
    const details = node.closest("details");
    if (!details || details.open) return true;
    return node.tagName === "SUMMARY" && node.parentElement === details;
  });
}

/** Куда переходит состояние при новом значении пропа `active`. */
function nextState(prev: PanelState, active: ResourceKey | null, reduced: boolean): PanelState {
  if (active) {
    // Панель закрыта или ещё уезжает: открываем её заново с нужным содержимым.
    if (prev.phase === "closed" || prev.phase === "closing") {
      return { tracked: active, kind: active, phase: reduced ? "open" : "opening" };
    }
    // Открытая панель меняет содержимое на месте: так работает hashchange поверх видео.
    return { tracked: active, kind: active, phase: prev.phase };
  }

  if (prev.phase === "opening" || prev.phase === "open") {
    return reduced ? CLOSED : { tracked: null, kind: prev.kind, phase: "closing" };
  }

  return { ...prev, tracked: null };
}

/**
 * Полноэкранная панель ресурсов. Хост живёт порталом в `document.body`: секция ресурсов
 * стоит с `isolate`, и внутри неё панель осталась бы под шапкой при любом z-index.
 * Пока панель открыта, страница под ней не прокручивается, а фокус заперт внутри диалога.
 * Escape и кнопка «Назад» отдают закрытие вызывающей секции — она же возвращает фокус
 * на карточку, которая панель открыла.
 */
export function ResourcePanel({
  active,
  onClose,
}: {
  active: ResourceKey | null;
  onClose: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<PanelState>(CLOSED);
  const containerRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const previousPhase = useRef<PanelPhase>("closed");

  // Производное состояние от пропа: смену active обрабатывает рендер, а не эффект, иначе
  // между кликом и открытием проскочил бы кадр с пустым контейнером.
  if (state.tracked !== active) {
    setState(nextState(state, active, reduced));
  }

  const { phase, kind } = state;
  const locked = phase !== "closed";

  useEffect(() => {
    if (phase !== "opening") return;

    const frame = requestAnimationFrame(() => {
      // Чтение размера заставляет браузер посчитать стили с классом is-opening. Без него
      // оба класса легли бы в один кадр, и слои оказались бы на месте сразу, без въезда.
      void containerRef.current?.offsetWidth;
      setState((prev) => (prev.phase === "opening" ? { ...prev, phase: "open" } : prev));
    });

    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase !== "closing") return;

    const container = containerRef.current;

    function finish() {
      setState((prev) => (prev.phase === "closing" ? CLOSED : prev));
    }

    /** Конец поездки верхнего слоя: он уезжает последним. */
    function onTransitionEnd(event: TransitionEvent) {
      if (event.target !== container) return;
      if (event.pseudoElement !== "::after") return;
      if (event.propertyName !== "transform") return;
      finish();
    }

    // Страховка на случай, когда transitionend не придёт: свёрнутая вкладка или погашенные
    // переходы при prefers-reduced-motion. Без неё панель осталась бы висеть в DOM с
    // заблокированной прокруткой страницы.
    const timer = window.setTimeout(finish, CLOSE_FALLBACK_MS);
    container?.addEventListener("transitionend", onTransitionEnd);

    return () => {
      container?.removeEventListener("transitionend", onTransitionEnd);
      window.clearTimeout(timer);
    };
  }, [phase]);

  useEffect(() => {
    if (!locked) return;

    const root = document.documentElement;
    const { body } = document;
    root.classList.add(LOCK_CLASS);
    body.classList.add(LOCK_CLASS);

    return () => {
      root.classList.remove(LOCK_CLASS);
      body.classList.remove(LOCK_CLASS);
    };
  }, [locked]);

  useEffect(() => {
    const wasHidden = previousPhase.current === "closed" || previousPhase.current === "closing";
    previousPhase.current = phase;

    if (!wasHidden || phase === "closed" || phase === "closing") return;
    // preventScroll: панель занимает окно целиком, и прокрутка к кнопке сдвинула бы
    // страницу под ней.
    backRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (phase !== "opening" && phase !== "open") return;

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [phase, onClose]);

  /** Ловушка Tab: пока панель открыта, клавиатура не выходит за пределы диалога. */
  function trapTab(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const dialog = event.currentTarget;
    const nodes = focusableNodes(dialog);
    if (nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const current = document.activeElement;

    if (!(current instanceof HTMLElement) || !dialog.contains(current)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (phase === "closed" || !kind) return null;

  const copy = resourcesCopy.panels[kind];

  return createPortal(
    <div ref={containerRef} className={`resources-panels is-${phase}`}>
      <div
        id="resources-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resources-panel-title"
        tabIndex={-1}
        data-kind={kind}
        className="resources-panel"
        onKeyDown={trapTab}
      >
        <div className="resources-panel__inner">
          <div className="resources-panel__header">
            <button type="button" ref={backRef} onClick={onClose} className="resources-panel__back">
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 10H4m0 0 5-5m-5 5 5 5" />
              </svg>
              {resourcesCopy.panel.back}
            </button>

            <div className="resources-panel__copy">
              <h2 id="resources-panel-title" className="resources-panel__title">
                {copy.title}
              </h2>
              <p className="resources-panel__description">{copy.description}</p>
            </div>
          </div>

          {kind === "music" ? (
            <div className="resources-panel__list">
              <ul className="resources-files">
                {musicFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </ul>
            </div>
          ) : null}

          {kind === "materials" ? (
            <div className="resources-panel__list">
              {materialGroups.map((group) => (
                <FileGroup key={group.id} group={group} />
              ))}
            </div>
          ) : null}

          {kind === "video" ? (
            <div className="resources-panel__list resources-panel__list--video">
              {/* Колонки задаёт панель: на 390px шестнадцать роликов идут в две колонки. */}
              <VideoGrid className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4" />
              <ul className="resources-files">
                {videoFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
