import type { ReactElement } from "react";
import type { MaterialItem, MaterialKind } from "../../data/materials";
import { materials } from "../../data/materials";

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function DocumentIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 4.5-5 3.5 3.5L15.5 12 20 17" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 6.5C10.5 5 8.4 4.4 5 4.5v13c3.4-.1 5.5.5 7 2 1.5-1.5 3.6-2.1 7-2v-13c-3.4-.1-5.5.5-7 2z" />
      <path d="M12 6.5V20" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 5.5h3" />
      <path d="M10.5 18.5h3" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

const icons: Record<MaterialKind, () => ReactElement> = {
  document: DocumentIcon,
  image: ImageIcon,
  book: BookIcon,
  phone: PhoneIcon,
  folder: FolderIcon,
};

/** Строки материалов дивизиона: каждая ведёт на внешнюю страницу в новой вкладке. */
export function MaterialsList({ items = materials }: { items?: readonly MaterialItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const Icon = icons[item.kind];
        return (
          <li key={item.id}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl border border-paper/10 bg-paper/5 p-4 transition-[transform,border-color,background-color] duration-[240ms] ease-ui hover:border-[rgb(123_194_199/.4)] hover:bg-paper/[.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horizon-400 motion-safe:hover:translate-x-1"
            >
              <span className="shrink-0 text-horizon-200">
                <Icon />
              </span>
              <span className="flex flex-col">
                <span className="font-body text-base font-bold leading-[1.5] text-paper">
                  {item.title}
                </span>
                <span className="font-body text-xs font-bold uppercase leading-[1.4] tracking-[0.08em] text-paper/80">
                  {item.caption}
                </span>
              </span>
              <span aria-hidden="true" className="ml-auto text-base text-paper/80">
                →
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
