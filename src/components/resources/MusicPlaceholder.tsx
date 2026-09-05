import { resourcesCopy } from "../../data/copy.resources";
import { GlassCard } from "../layout/GlassCard";

/** Честная заглушка панели «Музыка»: официальной песни ещё нет, кнопок тоже. */
export function MusicPlaceholder() {
  return (
    <GlassCard className="flex flex-col items-center text-center">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-[#8f9dd6]"
      >
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </svg>
      <h4 className="mt-4 font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.03em] text-paper">
        {resourcesCopy.music.emptyTitle}
      </h4>
      <p className="mt-2 max-w-md font-body text-base leading-[1.5] text-paper/80">
        {resourcesCopy.music.emptyBody}
      </p>
    </GlassCard>
  );
}
