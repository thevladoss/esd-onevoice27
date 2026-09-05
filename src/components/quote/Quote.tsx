import { copy } from "../../data/copy";
import { Section } from "../layout/Section";
import { GlassCard } from "../layout/GlassCard";

export function Quote() {
  return (
    <Section
      id="quote"
      eyebrow={copy.sections.quote.eyebrow}
      title={copy.sections.quote.title}
      className="min-h-[40vh]"
    >
      <GlassCard className="max-w-[60ch]">
        <p className="font-body text-base leading-[1.6] text-paper/72">{copy.sections.quote.body}</p>
      </GlassCard>
    </Section>
  );
}
