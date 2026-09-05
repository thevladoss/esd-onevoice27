import { useEffect, useState } from "react";

/** Ниже этой отметки шапка всегда на экране: там она стоит над первым экраном. */
const THRESHOLD = 80;

/**
 * Дрожание в пару пикселей (инерция тачпада, resize адресной строки на iOS) не
 * должно переключать шапку: направление засчитывается только с этого сдвига.
 */
const STEP = 4;

type Options = {
  menuOpen: boolean;
  threshold?: number;
};

/**
 * Прячет шапку, пока посетитель уходит вниз, и возвращает её при движении вверх.
 *
 * Обработчик скролла считает только направление и складывает работу в кадр
 * анимации: без этого браузер вызывал бы его десятки раз за кадр, а результат
 * всё равно применялся бы один раз при отрисовке.
 *
 * Пока открыто мобильное меню, шапка видна всегда: в ней лежит бургер, которым
 * меню и закрывают.
 */
export function useHeaderHide({ menuOpen, threshold = THRESHOLD }: Options): boolean {
  const [hidden, setHidden] = useState(false);
  const [menuWasOpen, setMenuWasOpen] = useState(menuOpen);

  // Сброс на переключении меню, а не в эффекте: иначе шапка, спрятанная перед
  // открытием, уезжала бы вверх сразу после закрытия — вместе с бургером, на
  // который вернулся фокус.
  if (menuWasOpen !== menuOpen) {
    setMenuWasOpen(menuOpen);
    if (hidden) {
      setHidden(false);
    }
  }

  useEffect(() => {
    if (menuOpen) {
      return;
    }

    // Точка отсчёта берётся заново на каждое включение: после закрытия меню
    // страница могла уехать без единого события скролла.
    let lastY = window.scrollY;
    let frame = 0;
    // Отдельный флаг, а не сам номер кадра: номер возвращается уже после того,
    // как браузер успел вызвать колбэк, и обнулять там было бы нечего.
    let scheduled = false;

    const apply = () => {
      scheduled = false;
      const y = window.scrollY;

      if (y <= threshold) {
        setHidden(false);
      } else if (y > lastY + STEP) {
        setHidden(true);
      } else if (y > lastY - STEP) {
        // Сдвиг меньше порога: положение шапки и точку отсчёта не трогаем.
        return;
      } else {
        setHidden(false);
      }

      lastY = y;
    };

    const onScroll = () => {
      if (scheduled) {
        return;
      }

      scheduled = true;
      frame = requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scheduled) {
        cancelAnimationFrame(frame);
      }
    };
  }, [menuOpen, threshold]);

  return menuOpen ? false : hidden;
}
