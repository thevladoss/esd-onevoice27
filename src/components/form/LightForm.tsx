import { copy } from "../../data/copy";
import { Section } from "../layout/Section";
import { GlassCard } from "../layout/GlassCard";

export function LightForm() {
  return (
    <Section
      id="light-form"
      eyebrow={copy.sections.lightForm.eyebrow}
      title={copy.sections.lightForm.title}
      className="min-h-[40vh]"
    >
      <GlassCard className="max-w-[60ch]">
        <p className="font-body text-base leading-[1.6] text-paper/72">{copy.sections.lightForm.body}</p>
      </GlassCard>
    </Section>
  );
}
