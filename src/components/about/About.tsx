import { copy } from "../../data/copy";
import { Section } from "../layout/Section";
import { GlassCard } from "../layout/GlassCard";

export function About() {
  return (
    <Section
      id="about"
      eyebrow={copy.sections.about.eyebrow}
      title={copy.sections.about.title}
      className="min-h-[40vh]"
    >
      <GlassCard className="max-w-[60ch]">
        <p className="font-body text-base leading-[1.6] text-paper/72">{copy.sections.about.body}</p>
      </GlassCard>
    </Section>
  );
}
