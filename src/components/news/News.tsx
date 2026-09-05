import { copy } from "../../data/copy";
import { Section } from "../layout/Section";
import { GlassCard } from "../layout/GlassCard";

export function News() {
  return (
    <Section
      id="news"
      eyebrow={copy.sections.news.eyebrow}
      title={copy.sections.news.title}
      className="min-h-[40vh]"
    >
      <GlassCard className="max-w-[60ch]">
        <p className="font-body text-base leading-[1.6] text-paper/72">{copy.sections.news.body}</p>
      </GlassCard>
    </Section>
  );
}
