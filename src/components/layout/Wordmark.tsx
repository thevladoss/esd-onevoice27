import { copy } from "../../data/copy";

type WordmarkProps = {
  className?: string;
  /**
   * `solid` красит название цветом родителя вместо градиента: логотип в шапке
   * оригинала белый, градиент остаётся футеру.
   */
  tone?: "gradient" | "solid";
};

export function Wordmark({ className, tone = "gradient" }: WordmarkProps) {
  const titleClass = tone === "solid" ? "wordmark__title" : "wordmark__title text-gradient-brand";

  return (
    <span className={"wordmark" + (className ? " " + className : "")}>
      <span className={titleClass}>{copy.shell.wordmark}</span>
      <span className="wordmark__tagline">{copy.shell.tagline}</span>
    </span>
  );
}
