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

    // Наблюдатель присылает только изменившиеся записи, поэтому статус каждой
    // секции копится здесь: иначе секция, которая давно в полосе внимания, не
    // участвовала бы в сравнении.
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting));

        // Побеждает первая по порядку в документе, а не самая крупная по площади:
        // intersectionRatio считается от размера самой секции, поэтому короткая
        // секция закрывала полосу целиком и всегда обходила длинную.
        const leader = ids.find((id) => visible.get(id) === true);
        if (leader !== undefined) {
          setActive(leader);
        }
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids, enabled]);

  return enabled ? active : null;
}
