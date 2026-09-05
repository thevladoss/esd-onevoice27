import { copy } from "../../data/copy";

export function SkipLink() {
  return (
    <a href="#main" className="skip-link">
      {copy.shell.skipLink}
    </a>
  );
}
