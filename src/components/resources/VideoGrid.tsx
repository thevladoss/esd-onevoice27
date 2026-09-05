import { VideoEmbed } from "../about/VideoEmbed";
import type { VideoItem } from "../../data/videos";
import { videos } from "../../data/videos";

/** Сетка роликов дивизиона. Колонки задаёт вызывающий блок, значение по умолчанию повторяет
 *  раскладку панели ресурсов: 2 колонки на мобильном, 3 на планшете, 4 на десктопе. */
export function VideoGrid({
  items = videos,
  className = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
}: {
  items?: readonly VideoItem[];
  className?: string;
}) {
  return (
    <ul className={"grid gap-4 " + className}>
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <VideoEmbed videoId={item.id} title={item.title} size="compact" />
          <p className="mt-2 line-clamp-2 text-xs font-bold uppercase tracking-[0.08em] text-paper/78">
            {item.title}
          </p>
        </li>
      ))}
    </ul>
  );
}
