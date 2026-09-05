import type { ReactNode } from "react";
import { Component } from "react";
import "./ErrorBoundary.css";

/** Текст аварийного экрана живёт рядом с ним: copy-модули к этому моменту могли и не загрузиться. */
const FALLBACK = {
  title: "Страница не загрузилась",
  body: "Обновите страницу, чтобы попробовать снова.",
} as const;

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/**
 * Последний рубеж вокруг корня. Без него исключение в фазе рендера уносит всё
 * дерево React, и вместо восьми секций посетитель получает белый экран.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render(): ReactNode {
    if (!this.state.failed) {
      return this.props.children;
    }

    return (
      <div role="alert" className="app-error">
        <p className="app-error__title">{FALLBACK.title}</p>
        <p className="app-error__body">{FALLBACK.body}</p>
      </div>
    );
  }
}
