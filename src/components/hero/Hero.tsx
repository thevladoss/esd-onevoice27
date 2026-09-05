import type { MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import "./hero.css";
import { heroCopy } from "../../data/copy.hero";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Button } from "../layout/Button";
import { HERO_FADE_DELAYS, HERO_FADE_DURATION, REVEAL_EASE } from "../layout/reveal.constants";
import { Starfield } from "./Starfield";
import { GlobeCanvas } from "./GlobeCanvas";
import { scrollToSection } from "../../lib/scrollToSection";

/** Текст hero проявляется при монтировании: секция видна сразу, ждать скролла нечего.
 *  Меняется только прозрачность — сдвиг увёл бы градиентный H1 в transform-контекст,
 *  и заливка по тексту поехала бы вместе с ним. */
function fadeIn(index: number) {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      duration: HERO_FADE_DURATION,
      ease: REVEAL_EASE,
      delay: HERO_FADE_DELAYS[index],
    },
  };
}

export function Hero() {
  const reduce = useReducedMotion();

  function handleCtaClick(event: MouseEvent<HTMLAnchorElement>) {
    if (scrollToSection(heroCopy.ctaHref)) {
      event.preventDefault();
    }
  }

  const eyebrow = <Eyebrow>{heroCopy.eyebrow}</Eyebrow>;
  const title = (
    <GradientTitle as="h1" variant="hero" id="hero-title">
      {heroCopy.title}
    </GradientTitle>
  );

  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <Starfield />
      <GlobeCanvas />
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__vignette" aria-hidden="true" />
      <div className="hero__content">
        {reduce ? (
          <>
            {eyebrow}
            <div className="hero__title">{title}</div>
            <p className="hero__subtitle">{heroCopy.subtitle}</p>
          </>
        ) : (
          <>
            <motion.div {...fadeIn(0)}>{eyebrow}</motion.div>
            <motion.div className="hero__title" {...fadeIn(1)}>
              {title}
            </motion.div>
            <motion.p className="hero__subtitle" {...fadeIn(2)}>
              {heroCopy.subtitle}
            </motion.p>
          </>
        )}
        <Button
          as="a"
          variant="primary"
          className="hero__cta"
          data-beam="true"
          href={heroCopy.ctaHref}
          onClick={handleCtaClick}
        >
          {heroCopy.cta}
        </Button>
      </div>
    </section>
  );
}
