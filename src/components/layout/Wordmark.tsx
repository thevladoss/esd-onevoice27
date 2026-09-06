import { copy } from "../../data/copy";

type WordmarkProps = {
  className?: string;
  /**
   * `solid` красит название цветом родителя вместо градиента: логотип в шапке
   * оригинала белый, градиент остаётся футеру.
   */
  tone?: "gradient" | "solid";
  /**
   * `footer` добавляет модификатор `wordmark--footer`; его размеры и свечение
   * задаёт `Footer.css`. Значение по умолчанию оставляет шапку без изменений.
   */
  size?: "default" | "footer";
};

export function Wordmark({ className, tone = "gradient", size = "default" }: WordmarkProps) {
  const titleClass = tone === "solid" ? "wordmark__title" : "wordmark__title text-gradient-brand";
  const rootClass =
    "wordmark" +
    (size === "footer" ? " wordmark--footer" : "") +
    (className ? " " + className : "");

  return (
    <span className={rootClass}>
      <span className={titleClass}>{copy.shell.wordmark}</span>
      <span className="wordmark__tagline">{copy.shell.tagline}</span>
    </span>
  );
}
