import { useEffect, useRef, useState } from "react";
import type { ResourceKey } from "../../data/copy.resources";
import { resourcesCopy } from "../../data/copy.resources";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { ResourceCard } from "./ResourceCard";
import { ResourcePanel } from "./ResourcePanel";
import "./resources.css";

export function Resources() {
  const [active, setActive] = useState<ResourceKey | null>(null);
  const cardRefs = useRef<Record<ResourceKey, HTMLButtonElement | null>>({
    music: null,
    materials: null,
    video: null,
  });
  const panelRef = useRef<HTMLDivElement>(null);

  function toggle(kind: ResourceKey) {
    setActive((prev) => (prev === kind ? null : kind));
  }

  useEffect(() => {
    if (active) {
      panelRef.current?.focus({ preventScroll: true });
    }
  }, [active]);

  return (
    <section id="resources" className="resources relative isolate overflow-hidden bg-midnight-950">
      <div aria-hidden="true" data-particles className="pointer-events-none absolute -inset-6 -z-10">
        <span aria-hidden="true" className="resources-particles resources-particles--1" />
        <span aria-hidden="true" className="resources-particles resources-particles--2" />
        <span aria-hidden="true" className="resources-particles resources-particles--3" />
      </div>

      <div className="mx-auto max-w-[72rem] px-4 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-6 md:gap-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-8">
          <div className="order-first rounded-card border border-dotted border-[rgb(84_164_172/.25)] bg-[rgb(84_164_172/.05)] p-8 text-center md:col-span-6 md:row-start-1 lg:col-start-5 lg:col-end-10 lg:row-start-1 lg:row-end-3 lg:mx-auto lg:max-w-[528px] lg:self-center">
            <Eyebrow>{resourcesCopy.eyebrow}</Eyebrow>
            <GradientTitle as="h2" variant="section" className="mt-2">
              {resourcesCopy.title}
            </GradientTitle>
            <p className="mt-4 font-body text-base leading-[1.5] text-paper/80">
              {resourcesCopy.body}
            </p>
          </div>

          <div className="mx-auto w-full max-w-[360px] md:col-start-1 md:col-end-4 md:row-start-2 md:max-w-none lg:col-start-1 lg:col-end-5 lg:row-start-1 lg:row-end-3 lg:max-w-[320px] lg:self-start">
            <ResourceCard
              kind="music"
              isOpen={active === "music"}
              onToggle={() => toggle("music")}
              ref={(el) => {
                cardRefs.current.music = el;
              }}
            />
          </div>

          <div className="mx-auto w-full max-w-[360px] md:col-start-4 md:col-end-7 md:row-start-2 md:mt-6 md:max-w-none lg:col-start-10 lg:col-end-13 lg:row-start-2 lg:row-end-4 lg:mt-0 lg:ml-auto lg:max-w-[272px] lg:self-end">
            <ResourceCard
              kind="materials"
              isOpen={active === "materials"}
              onToggle={() => toggle("materials")}
              ref={(el) => {
                cardRefs.current.materials = el;
              }}
            />
          </div>

          <div className="mx-auto w-full max-w-[360px] md:col-start-2 md:col-end-6 md:row-start-3 md:-mt-4 md:max-w-none lg:col-start-4 lg:col-end-8 lg:row-start-3 lg:row-end-4 lg:-mt-8 lg:max-w-[344px]">
            <ResourceCard
              kind="video"
              isOpen={active === "video"}
              onToggle={() => toggle("video")}
              ref={(el) => {
                cardRefs.current.video = el;
              }}
            />
          </div>
        </div>

        <div id="resources-panel" data-open={active !== null} className="resources-panel-wrap mt-8">
          <div className="min-h-0 overflow-hidden">
            {active ? (
              <ResourcePanel
                key={active}
                kind={active}
                onClose={() => toggle(active)}
                ref={panelRef}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
