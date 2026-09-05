import { copy } from "../../data/copy";
import { Section } from "../layout/Section";
import { GlassCard } from "../layout/GlassCard";

export function MapSection() {
  return (
    <Section
      id="map"
      eyebrow={copy.sections.map.eyebrow}
      title={copy.sections.map.title}
      className="min-h-[40vh]"
    >
      <GlassCard className="max-w-[60ch]">
        <p className="font-body text-base leading-[1.6] text-paper/72">{copy.sections.map.body}</p>
      </GlassCard>
    </Section>
  );
}
