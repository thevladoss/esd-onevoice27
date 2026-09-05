import type { VideoItem } from "../../data/videos";
import { videos } from "../../data/videos";
import { VideoFacade } from "./VideoFacade";

/** Сетка роликов дивизиона: 2 колонки на мобильном, 3 на планшете, 4 на десктопе. */
export function VideoGrid({ items = videos }: { items?: readonly VideoItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.id}>
          <VideoFacade videoId={item.id} title={item.title} />
          <p className="mt-2 line-clamp-2 text-xs font-bold uppercase tracking-[0.08em] text-paper/80">
            {item.title}
          </p>
        </li>
      ))}
    </ul>
  );
}
