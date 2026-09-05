import type { ReactNode } from "react";
import "./involve.css";
import { involveCopy, type InvolveCardId } from "../../data/copy.involve";
import { Section } from "../layout/Section";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { GlassCard } from "../layout/GlassCard";
import { Reveal, RevealGroup, RevealItem } from "../layout/Reveal";
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
      <Reveal className="inv-head">
        <Eyebrow>{involveCopy.eyebrow}</Eyebrow>
        <GradientTitle as="h2" variant="section" className="mt-2">
          {involveCopy.title}
        </GradientTitle>
        <p className="inv-lead mt-4 font-body text-base leading-[1.6]">{involveCopy.lead}</p>
      </Reveal>
      <RevealGroup className="inv-triptych-wrap mt-12">
        <GlassCard className="inv-triptych">
          {involveCopy.cards.map((card) => (
            // `.inv-slot` заменяет карточку в сетке рамки и несёт шов между соседями:
            // после обёртки карточки перестают быть соседями друг другу.
            <RevealItem key={card.id} className="inv-slot">
              <InvolveCard
                id={card.id}
                title={card.title}
                action={card.action}
                href={card.href}
                art={artById[card.id]}
              />
            </RevealItem>
          ))}
        </GlassCard>
      </RevealGroup>
    </Section>
  );
}
