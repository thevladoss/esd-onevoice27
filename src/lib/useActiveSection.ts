import { useEffect, useState } from "react";

/** Полоса внимания: секция считается активной, пока её часть в средней трети экрана. */
const ROOT_MARGIN = "-40% 0px -55% 0px";

/**
 * Возвращает id секции, на которую сейчас смотрит посетитель.
 *
 * Наблюдение включается флагом `enabled` (на мобильном подсветка пункта меню не
 * нужна, там меню скрыто под бургером). Пока флаг снят, наблюдатель не создаётся
 * и хук отдаёт `null`.
 */
export function useActiveSection(ids: readonly string[], enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") {
      return;
    }

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const priority = new Map(ids.map((id, index) => [id, index]));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) {
          return;
        }

        const leader = visible.reduce((winner, entry) => {
          if (entry.intersectionRatio !== winner.intersectionRatio) {
            return entry.intersectionRatio > winner.intersectionRatio ? entry : winner;
          }
          const entryOrder = priority.get(entry.target.id) ?? Number.MAX_SAFE_INTEGER;
          const winnerOrder = priority.get(winner.target.id) ?? Number.MAX_SAFE_INTEGER;
          return entryOrder < winnerOrder ? entry : winner;
        });

        setActive(leader.target.id);
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids, enabled]);

  return enabled ? active : null;
}
