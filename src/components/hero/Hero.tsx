import type { MouseEvent } from "react";
import "./hero.css";
import { heroCopy } from "../../data/copy.hero";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Button } from "../layout/Button";
import { Starfield } from "./Starfield";
import { GlobeCanvas } from "./GlobeCanvas";
import { scrollToSection } from "./scrollToSection";

export function Hero() {
  function handleCtaClick(event: MouseEvent<HTMLAnchorElement>) {
    if (scrollToSection(heroCopy.ctaHref)) {
      event.preventDefault();
    }
  }

  return (
    <section id="hero" className="hero">
      <Starfield />
      <GlobeCanvas />
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__vignette" aria-hidden="true" />
      <div className="hero__content">
        <Eyebrow>{heroCopy.eyebrow}</Eyebrow>
        <div className="hero__title">
          <GradientTitle as="h1" variant="hero">
            {heroCopy.title}
          </GradientTitle>
        </div>
        <p className="hero__subtitle">{heroCopy.subtitle}</p>
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
