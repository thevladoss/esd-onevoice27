import { aboutSteps } from "../../data/about";
import { aboutCopy } from "../../data/copy.about";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Reveal, RevealGroup, RevealItem } from "../layout/Reveal";
import { Section } from "../layout/Section";
import { StepCard } from "./StepCard";
import { VideoEmbed } from "./VideoEmbed";
import "./about.css";

export function About() {
  return (
    <Section id="about" titleId="about-title" className="ab-section">
      <Reveal className="ab-head">
        <Eyebrow>{aboutCopy.eyebrow}</Eyebrow>
        <GradientTitle as="h2" variant="section-gradient" className="mt-2" id="about-title">
          {aboutCopy.title}
        </GradientTitle>
        <p className="ab-lead mt-6">{aboutCopy.lead}</p>
      </Reveal>
      <Reveal delay={0.1} className="ab-video-wrap mt-12">
        <VideoEmbed
          videoId={aboutCopy.video.id}
          title={aboutCopy.video.title}
          className="ab-video"
        />
      </Reveal>
      <RevealGroup className="ab-steps mt-12">
        {aboutSteps.map((step) => (
          // grid на обёртке: карточка остаётся во всю ячейку, и тройка держит общую высоту.
          <RevealItem key={step.number} className="grid">
            <StepCard {...step} />
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
