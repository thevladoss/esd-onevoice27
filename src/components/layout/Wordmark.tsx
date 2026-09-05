import { copy } from "../../data/copy";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={"wordmark" + (className ? " " + className : "")}>
      <span className="wordmark__title text-gradient-brand">{copy.shell.wordmark}</span>
      <span className="wordmark__tagline">{copy.shell.tagline}</span>
    </span>
  );
}
