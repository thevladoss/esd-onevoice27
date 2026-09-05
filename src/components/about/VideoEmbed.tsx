import { useEffect, useRef, useState } from "react";
import "./video-embed.css";

export interface VideoEmbedProps {
  videoId: string;
  title: string;
  className?: string;
  /** `compact` уменьшает круг play, радиус и тень: под сетку из шестнадцати роликов в панели ресурсов. */
  size?: "default" | "compact";
}

/** id ролика на YouTube: ровно 11 символов из латиницы, цифр, дефиса и подчёркивания. */
const YOUTUBE_ID_RE = /^[\w-]{11}$/;

/** Права сведены к воспроизведению: `clipboard-write` отдавал стороннему фрейму подмену буфера
 *  обмена, `web-share` — системный лист шаринга от имени страницы, `accelerometer` — датчик. */
const PLAYER_ALLOW = "autoplay; encrypted-media; picture-in-picture";

/** Песочница оставляет ролику скрипты, своё хранилище, Presentation API и переход по ссылке
 *  «Смотреть на YouTube» в новой вкладке — этого хватает плееру и ничего сверх того. */
const PLAYER_SANDBOX =
  "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox";

/** Имя кнопки для скринридера: постер декоративен, название ролика звучит только отсюда. */
function watchLabel(title: string) {
  return `Смотреть видео: ${title}`;
}

/**
 * Единственный видео-фасад проекта: блок «О проекте» и панель «Видео» в ресурсах рендерят его же.
 * До клика на странице лежит постер, плеер youtube-nocookie монтируется только после нажатия,
 * поэтому третья сторона получает запрос лишь по явному действию посетителя.
 */
export function VideoEmbed({ videoId, title, className, size = "default" }: VideoEmbedProps) {
  const [active, setActive] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /** Кнопка play исчезает вместе с фасадом. Без переноса фокуса браузер отдаёт его в `body`,
   *  и следующий Tab уводит клавиатуру из сетки роликов в начало страницы. */
  useEffect(() => {
    if (active) {
      iframeRef.current?.focus();
    }
  }, [active]);

  // Чужой id мог бы дописать свой путь и параметры к адресу эмбеда, поэтому фасад молчит.
  if (!YOUTUBE_ID_RE.test(videoId)) {
    return null;
  }

  /** Вторая линия обороны после YOUTUBE_ID_RE: даже разрешённые символы уезжают в путь
   *  экранированными, а не как часть адреса. */
  const safeId = encodeURIComponent(videoId);
  const rootClassName = [
    "ve",
    "group",
    size === "compact" ? "ve--compact" : "",
    active ? "ve--active" : "",
    className ?? "",
  ]
    .filter((token) => token !== "")
    .join(" ");

  return (
    <div className={rootClassName} data-cover={posterFailed ? "failed" : "ok"}>
      {active ? (
        <iframe
          ref={iframeRef}
          className="ve-frame"
          src={`https://www.youtube-nocookie.com/embed/${safeId}?autoplay=1&rel=0`}
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
          className="ve-trigger"
          aria-label={watchLabel(title)}
          onClick={() => setActive(true)}
        >
          {posterFailed ? (
            <span className="ve-fallback" aria-hidden="true">
              {title}
            </span>
          ) : (
            <img
              className="ve-poster"
              src={`https://img.youtube.com/vi/${safeId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              width={480}
              height={360}
              onError={() => setPosterFailed(true)}
            />
          )}
          <span className="ve-scrim" aria-hidden="true" />
          <span className="ve-play motion-safe:group-hover:scale-[1.06]" aria-hidden="true">
            <svg
              className="ve-play-icon"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M8.4 4.9 19.6 12 8.4 19.1z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
