import type { ReactNode } from "react";
import { involveCopy, type InvolveCardId } from "../../data/copy.involve";
import { Section } from "../layout/Section";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { GlassCard } from "../layout/GlassCard";
import { InvolveCard } from "./InvolveCard";
import { PersonalArt } from "./art/PersonalArt";
import { ToolkitArt } from "./art/ToolkitArt";
import { SharingArt } from "./art/SharingArt";

const artById: Record<InvolveCardId, ReactNode> = {
  personal: <PersonalArt />,
  toolkit: <ToolkitArt />,
  sharing: <SharingArt />,
};

export function Involve() {
  return (
    <Section id="involve" className="inv-section">
      <div className="inv-head max-w-[42rem]">
        <Eyebrow>{involveCopy.eyebrow}</Eyebrow>
        <GradientTitle as="h2" variant="section" className="mt-2">
          {involveCopy.title}
        </GradientTitle>
        <p className="inv-lead mt-4 font-body text-base leading-[1.6]">{involveCopy.lead}</p>
      </div>
      <div className="inv-triptych-wrap mt-12">
        <GlassCard className="inv-triptych grid gap-4 md:gap-0 lg:grid-cols-3">
          {involveCopy.cards.map((card) => (
            <InvolveCard
              key={card.id}
              id={card.id}
              title={card.title}
              action={card.action}
              href={card.href}
              art={artById[card.id]}
            />
          ))}
        </GlassCard>
      </div>
    </Section>
  );
}
