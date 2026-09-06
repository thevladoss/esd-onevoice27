import { resourcesCopy } from "../../data/copy.resources";
import type { ResourceFile } from "../../data/resourceFiles";

/**
 * Карточка файла в панели ресурсов: название с бейджем формата и ссылка внизу.
 * Стрелку «↓» / «→» справа от подписи рисует CSS через `::after`: в разметке символа нет,
 * иначе скринридер прочитал бы его вместе с именем ссылки.
 */
export function FileCard({ file }: { file: ResourceFile }) {
  const label = file.action === "download" ? resourcesCopy.panel.download : resourcesCopy.panel.open;

  return (
    <li className="resources-file">
      <div className="resources-file__meta">
        <p className="resources-file__name" id={`resources-file-${file.id}`}>
          {file.name}
        </p>
        <span className="resources-file__type" data-file-type={file.type}>
          {file.type.toUpperCase()}
        </span>
      </div>

      {/* Название файла звучит в имени ссылки: подписи «Скачать» в списке из тридцати
          карточек различаются только соседним текстом, а его скринридер не читает. */}
      <a
        className="resources-file__action"
        data-action={file.action}
        href={file.href}
        target="_blank" rel="noopener noreferrer"
        aria-label={`${label}: ${file.name}`}
      >
        {label}
      </a>
    </li>
  );
}
