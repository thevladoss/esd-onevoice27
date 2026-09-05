import { copy } from "../../data/copy";
import { Section } from "../layout/Section";
import { GlassCard } from "../layout/GlassCard";

export function Involve() {
  return (
    <Section
      id="involve"
      eyebrow={copy.sections.involve.eyebrow}
      title={copy.sections.involve.title}
      className="min-h-[40vh]"
    >
      <GlassCard className="max-w-[60ch]">
        <p className="font-body text-base leading-[1.6] text-paper/72">{copy.sections.involve.body}</p>
      </GlassCard>
    </Section>
  );
}
