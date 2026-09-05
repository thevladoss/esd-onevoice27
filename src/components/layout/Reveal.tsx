import { useMemo, useState } from "react";
import type { AriaAttributes, ReactNode, Ref } from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  REVEAL_DELAY_CHILDREN,
  REVEAL_DURATION,
  REVEAL_EASE,
  REVEAL_SHIFT_DESKTOP,
  REVEAL_SHIFT_MOBILE,
  REVEAL_STAGGER,
} from "./reveal.constants";

const MOBILE_QUERY = "(max-width: 767px)";

/** Готовые motion-компоненты лежат в модуле: тип, созданный в рендере, перемонтировал бы детей
 *  вместе с их состоянием, и react-hooks на такой код ругается. */
const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  figure: motion.figure,
  ul: motion.ul,
  li: motion.li,
  p: motion.p,
} as const;

/** Семантика обёртки. Список закрыт: обёртка появляется только вокруг блоков и карточек. */
export type RevealTag = keyof typeof MOTION_TAGS;

/** Общие пропы трёх обёрток. Aria-атрибуты и ref проходят насквозь: секции держат на этих же
 *  узлах живые регионы и измеряют их через IntersectionObserver.
 *  На месте передачи ref приводится к `never`: объединение тегов пересекает типы ref
 *  (`HTMLDivElement & HTMLLIElement & …`), и общего надтипа у них нет. */
type RevealBaseProps = AriaAttributes & {
  as?: RevealTag;
  className?: string;
  children: ReactNode;
  ref?: Ref<HTMLElement>;
};

type RevealProps = RevealBaseProps & { delay?: number };

/** Ширину читаем один раз при монтировании: reveal играет один раз, ресайз его не перезапускает. */
function useRevealSetup() {
  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches,
  );

  return useMemo(
    () =>
      isMobile
        ? {
            shift: REVEAL_SHIFT_MOBILE,
            viewport: { once: true, amount: 0.15, margin: "0px 0px -6% 0px" } as const,
          }
        : {
            shift: REVEAL_SHIFT_DESKTOP,
            viewport: { once: true, amount: 0.2, margin: "0px 0px -10% 0px" } as const,
          },
    [isMobile],
  );
}

/**
 * Блок появляется при первом попадании в область просмотра: opacity 0 → 1 и сдвиг снизу.
 * Двигаются только `opacity` и `y`. Масштаб, размытие и тени сломали бы выборку фона
 * у стеклянных карточек, поэтому в обёртке их нет.
 * При `prefers-reduced-motion: reduce` рендерится обычный элемент без inline-стилей.
 */
export function Reveal({ as = "div", className, delay = 0, children, ref, ...aria }: RevealProps) {
  const reduce = useReducedMotion();
  const { shift, viewport } = useRevealSetup();
  const Tag = as;
  const MotionTag = MOTION_TAGS[as];

  if (reduce) {
    return (
      <Tag className={className} ref={ref as never} {...aria}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      ref={ref as never}
      {...aria}
      initial={{ opacity: 0, y: shift }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: REVEAL_DURATION, ease: REVEAL_EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

const groupVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: REVEAL_STAGGER, delayChildren: REVEAL_DELAY_CHILDREN },
  },
};

/**
 * Контейнер каскада: сам ничего не двигает, только раздаёт детям состояние `hidden` → `visible`.
 * Больше шести `RevealItem` в одной группе не кладём: последняя карточка стартует на 0.4s,
 * и волна перестаёт читаться как одно движение.
 */
export function RevealGroup({ as = "div", className, children, ref, ...aria }: RevealBaseProps) {
  const reduce = useReducedMotion();
  const { viewport } = useRevealSetup();
  const Tag = as;
  const MotionTag = MOTION_TAGS[as];

  if (reduce) {
    return (
      <Tag className={className} ref={ref as never} {...aria}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      ref={ref as never}
      {...aria}
      variants={groupVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </MotionTag>
  );
}

/** Карточка внутри `RevealGroup`: состояние приходит от группы, своего `whileInView` нет. */
export function RevealItem({ as = "div", className, children, ref, ...aria }: RevealBaseProps) {
  const reduce = useReducedMotion();
  const { shift } = useRevealSetup();
  const Tag = as;
  const MotionTag = MOTION_TAGS[as];

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: shift },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE },
      },
    }),
    [shift],
  );

  if (reduce) {
    return (
      <Tag className={className} ref={ref as never} {...aria}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag className={className} ref={ref as never} {...aria} variants={itemVariants}>
      {children}
    </MotionTag>
  );
}
