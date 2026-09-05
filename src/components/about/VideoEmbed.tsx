import { useEffect, useRef, useState } from "react";
import "./video-embed.css";

export interface VideoEmbedProps {
  videoId: string;
  title: string;
  className?: string;
}

/** id ролика на YouTube: ровно 11 символов из латиницы, цифр, дефиса и подчёркивания. */
const YOUTUBE_ID_RE = /^[\w-]{11}$/;

export function VideoEmbed({ videoId, title, className }: VideoEmbedProps) {
  const [active, setActive] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (active) {
      iframeRef.current?.focus();
    }
  }, [active]);

  // Чужой id мог бы дописать свой путь и параметры к адресу эмбеда, поэтому фасад молчит.
  if (!YOUTUBE_ID_RE.test(videoId)) {
    return null;
  }

  const safeId = encodeURIComponent(videoId);
  const rootClassName = ["ve", active ? "ve--active" : "", className ?? ""]
    .filter((token) => token !== "")
    .join(" ");

  return (
    <div className={rootClassName}>
      {active ? (
        <iframe
          ref={iframeRef}
          className="ve-frame"
          src={`https://www.youtube-nocookie.com/embed/${safeId}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <>
          {posterFailed ? (
            <div className="ve-fallback" aria-hidden="true">
              <span>{title}</span>
            </div>
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
          <div className="ve-scrim" aria-hidden="true" />
          <button
            type="button"
            className="ve-play"
            aria-label={`Смотреть видео: ${title}`}
            onClick={() => setActive(true)}
          >
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
          </button>
        </>
      )}
    </div>
  );
}
