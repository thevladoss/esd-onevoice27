/**
 * Единственный источник параметров появления блоков при скролле.
 * Те же значения лежат в CSS-токенах `--dur-reveal`, `--ease-reveal`, `--stagger-reveal`
 * и `--reveal-shift`; расходиться им нельзя.
 */

/** Длительность появления блока, секунды: motion считает время в секундах, CSS — в миллисекундах. */
export const REVEAL_DURATION = 0.7;

/** Кривая появления, она же `--ease-ui` фазы 1. Кортеж изменяемый: `as const` motion не принимает,
 *  его `ease` объявлен как `[number, number, number, number]`. */
export const REVEAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Шаг каскада внутри группы карточек, секунды. */
export const REVEAL_STAGGER = 0.08;

/** Пауза между появлением контейнера и первой карточкой, секунды. */
export const REVEAL_DELAY_CHILDREN = 0.05;

/** Сдвиг блока до появления, px, от 768px. */
export const REVEAL_SHIFT_DESKTOP = 24;

/** Сдвиг блока до появления, px, ниже 768px. */
export const REVEAL_SHIFT_MOBILE = 16;

/** Длительность проявления текста hero, секунды. */
export const HERO_FADE_DURATION = 0.6;

/** Задержки надзаголовка, H1 и подзаголовка hero, секунды. */
export const HERO_FADE_DELAYS = [0, 0.08, 0.16] as const;
