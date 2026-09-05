import { copy } from "../../data/copy";
import { Section } from "../layout/Section";
import { GlassCard } from "../layout/GlassCard";

export function Resources() {
  return (
    <Section
      id="resources"
      eyebrow={copy.sections.resources.eyebrow}
      title={copy.sections.resources.title}
      className="min-h-[40vh]"
    >
      <GlassCard className="max-w-[60ch]">
        <p className="font-body text-base leading-[1.6] text-paper/72">{copy.sections.resources.body}</p>
      </GlassCard>
    </Section>
  );
}
