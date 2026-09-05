import { copy } from "../../data/copy";
import { Section } from "../layout/Section";
import { GradientTitle } from "../layout/GradientTitle";
import { GlassCard } from "../layout/GlassCard";
import { Button } from "../layout/Button";

export function Hero() {
  return (
    <Section id="hero" eyebrow={copy.sections.hero.eyebrow} className="min-h-[40vh]">
      <GradientTitle as="h1" variant="section">
        {copy.sections.hero.title}
      </GradientTitle>
      <GlassCard className="mt-6 max-w-[60ch]">
        <p className="font-body text-base leading-[1.6] text-paper/72">
          {copy.sections.hero.body}
        </p>
        <div className="mt-8">
          <Button as="a" variant="primary" href={copy.cta.lightYourLight.href}>
            {copy.cta.lightYourLight.label}
          </Button>
        </div>
      </GlassCard>
    </Section>
  );
}
