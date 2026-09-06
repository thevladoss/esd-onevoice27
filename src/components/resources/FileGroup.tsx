import type { ResourceGroup } from "../../data/resourceFiles";
import { FileCard } from "./FileCard";

/**
 * Языковая группа панели материалов. Раскрытие держит сам `<details>`: состояние группы
 * никого за её пределами не касается, поэтому в React-состояние оно не поднимается.
 * Группа ЕАД приходит с `open: true` и открыта сразу.
 */
export function FileGroup({ group }: { group: ResourceGroup }) {
  return (
    <details className="resources-group" id={`resources-group-${group.id}`} open={group.open}>
      <summary className="resources-group__summary">
        <span className="resources-group__title">{group.title}</span>
        <svg
          className="resources-group__chevron"
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m8 5 5 5-5 5" />
        </svg>
      </summary>

      <div className="resources-group__inner">
        <ul className="resources-files">
          {group.files.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </ul>
      </div>
    </details>
  );
}
