import { aboutSteps } from "../../data/about";
import { aboutCopy } from "../../data/copy.about";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Section } from "../layout/Section";
import { StepCard } from "./StepCard";
import { VideoEmbed } from "./VideoEmbed";
import "./about.css";

export function About() {
  return (
    <Section id="about" className="ab-section">
      <div className="ab-head max-w-[42rem]">
        <Eyebrow>{aboutCopy.eyebrow}</Eyebrow>
        <GradientTitle as="h2" variant="section" className="mt-2">
          {aboutCopy.title}
        </GradientTitle>
        <p className="ab-lead mt-6">{aboutCopy.lead}</p>
      </div>
      <div className="ab-video-wrap mt-12">
        <VideoEmbed
          videoId={aboutCopy.video.id}
          title={aboutCopy.video.title}
          className="ab-video"
        />
      </div>
      <div className="ab-steps mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {aboutSteps.map((step) => (
          <StepCard key={step.number} {...step} />
        ))}
      </div>
    </Section>
  );
}
