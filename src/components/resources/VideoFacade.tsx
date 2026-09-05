import { useEffect, useRef, useState } from "react";
import { resourcesCopy } from "../../data/copy.resources";

/** Права сведены к воспроизведению: `clipboard-write` отдавал стороннему фрейму подмену буфера
 *  обмена, `web-share` — системный лист шаринга от имени страницы, `accelerometer` датчик. */
const PLAYER_ALLOW = "autoplay; encrypted-media; picture-in-picture";

/** Песочница оставляет ролику скрипты, своё хранилище, Presentation API и переход по ссылке
 *  «Смотреть на YouTube» в новой вкладке — этого хватает плееру и ничего сверх того. */
const PLAYER_SANDBOX =
  "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox";

/**
 * Лёгкий фасад ролика YouTube: постер и кнопка play, плеер грузится только по клику,
 * поэтому до взаимодействия страница не обращается к youtube-nocookie.com.
 */
export function VideoFacade({
  videoId,
  title,
  className,
}: {
  videoId: string;
  title: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  /** Компонент экспортирован и берёт `videoId` пропом от любого вызывающего кода. Без экранирования
   *  значение вида `abc?list=PL…` подменило бы параметры встраивания, `abc/../live_stream` — путь,
   *  а `#` обрезал бы хвост запроса. Origin от этого не меняется, содержимое фрейма — меняется. */
  const id = encodeURIComponent(videoId);

  /** Кнопка play исчезает вместе с фасадом. Без переноса фокуса браузер отдаёт его в `body`,
   *  и следующий Tab уводит клавиатуру из сетки роликов в начало страницы. */
  useEffect(() => {
    if (playing) {
      iframeRef.current?.focus();
    }
  }, [playing]);

  return (
    <div
      className={
        "relative aspect-video overflow-hidden rounded-xl bg-midnight-950" +
        (className ? " " + className : "")
      }
      data-cover={coverFailed ? "failed" : "ok"}
    >
      {playing ? (
        <iframe
          ref={iframeRef}
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow={PLAYER_ALLOW}
          sandbox={PLAYER_SANDBOX}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          aria-label={resourcesCopy.video.watchLabel(title)}
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horizon-400"
        >
          {coverFailed ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(145deg,rgb(48_63_131/.86),rgb(18_12_52/.76))]"
            />
          ) : (
            <img
              src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setCoverFailed(true)}
              className="h-full w-full object-cover"
            />
          )}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[rgb(7_2_16/.28)] transition-colors group-hover:bg-[rgb(7_2_16/.16)]"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(248_247_251/.14)] text-paper backdrop-blur-[8px] transition-transform motion-safe:group-hover:scale-[1.08]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.5 3.6 16.4 10 6.5 16.4z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
