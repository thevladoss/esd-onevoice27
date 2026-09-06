import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { motion } from "motion/react";
import "./hero.css";
import { heroCopy } from "../../data/copy.hero";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Button } from "../layout/Button";
import { HERO_FADE_DELAYS, HERO_FADE_DURATION, REVEAL_EASE } from "../layout/reveal.constants";
/* Расширение в пути обязательно: heroParticles.ts и HeroParticles.tsx различаются
   только регистром, macOS регистр в путях не различает, а Vite перебирает .ts раньше
   .tsx — без расширения импорт пришёл бы к чистому модулю без компонента. */
import { HeroParticles } from "./HeroParticles.tsx";
import { scrollToSection } from "../../lib/scrollToSection";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";

/** Подсказка браузера об экономии трафика. NetworkInformation в lib.dom нет, поэтому
 *  тип сужается локально. При включённой экономии источники видео не подключаются:
 *  посетитель видит фон #070210 и частицы — принятое отклонение от оригинала. */
function prefersSaveData(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
}

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
  const reduce = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  // Значение подсказки держится всю сессию, поэтому читается один раз ленивым инициализатором.
  const [saveData] = useState(() => prefersSaveData());

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // React пишет muted свойством и не всегда доводит до DOM, а без него
    // автовоспроизведение на iOS не стартует: дублируем до play().
    video.muted = true;

    if (reduce) {
      const freeze = () => {
        video.pause();
        video.currentTime = 0;
      };
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        freeze();
        return;
      }
      video.addEventListener("loadeddata", freeze, { once: true });
      return () => video.removeEventListener("loadeddata", freeze);
    }

    // При снятии reduce эффект перезапускается и снова заводит видео.
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") {
      // Политика автовоспроизведения может отклонить промис; в jsdom play() отдаёт undefined.
      attempt.catch(() => {});
    }
  }, [reduce]);

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
      {/* Значение data-anim="globe" переехало на видео, реестр motionPolicy.test.ts не меняется.
          Постера нет, как у оригинала: первые кадры закрывает фон секции. */}
      <div className="hero__video">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload={saveData ? "none" : "auto"}
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
          aria-hidden="true"
          data-anim="globe"
        >
          {!saveData && (
            <>
              {/* webm первым: он вдвое легче mp4. */}
              <source src={`${import.meta.env.BASE_URL}hero-globe.webm`} type="video/webm" />
              <source src={`${import.meta.env.BASE_URL}hero-globe.mp4`} type="video/mp4" />
            </>
          )}
        </video>
      </div>
      <HeroParticles />
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
          href={heroCopy.ctaHref}
          onClick={handleCtaClick}
        >
          {heroCopy.cta}
        </Button>
      </div>
    </section>
  );
}
