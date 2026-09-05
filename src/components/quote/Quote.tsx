import { quoteCopy } from "../../data/copy.quote";
import { Eyebrow } from "../layout/Eyebrow";
import { Reveal } from "../layout/Reveal";
import { WorldSilhouette } from "./WorldSilhouette";

export function Quote() {
  return (
    <section
      id="quote"
      className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#120c34,#211a3e)]"
    >
      <WorldSilhouette className="absolute inset-0 -z-10 h-full w-full [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_30%,rgb(158_67_154/.18),transparent_42%),radial-gradient(circle_at_78%_68%,rgb(84_164_172/.16),transparent_44%)]"
      />
      <div className="mx-auto max-w-[72rem] px-4 py-16 md:px-8 md:py-24">
        <Reveal
          as="figure"
          className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <Eyebrow>{quoteCopy.eyebrow}</Eyebrow>
          <span
            aria-hidden="true"
            className="text-gradient-brand mt-4 block font-display text-[96px] font-extrabold leading-none opacity-50"
          >
            “
          </span>
          <blockquote className="mt-4 flex flex-col gap-6 text-balance font-display text-[22px] font-bold leading-[1.35] tracking-[-0.03em] text-paper">
            {quoteCopy.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </blockquote>
          <figcaption className="mt-8">
            <cite className="block font-body text-xs font-bold uppercase not-italic leading-[1.4] tracking-[0.08em] text-horizon-200">
              {quoteCopy.cite}
            </cite>
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
