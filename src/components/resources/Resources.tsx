import { useEffect, useRef, useState } from "react";
import type { ResourceKey } from "../../data/copy.resources";
import { resourcesCopy } from "../../data/copy.resources";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Reveal, RevealGroup, RevealItem } from "../layout/Reveal";
import { ResourceCard } from "./ResourceCard";
import { ResourcePanel } from "./ResourcePanel";
import "./resources.css";

/** Адрес с этим хэшем открывает панель материалов. Строка — константа модуля: с адресной
 *  строки в селектор ниже ничего не попадает, разметкой она не управляет.
 *  Внутри сайта сюда ведёт карточка триптиха «Скачать материалы →» (`copy.involve.ts`).
 *  Тот же адрес работает для внешних ссылок и закладок. */
const MATERIALS_HASH = "#resources-materials";

function hashOpensMaterials() {
  return window.location.hash === MATERIALS_HASH;
}

/** Скролл к секции ресурсов с оглядкой на prefers-reduced-motion. */
function scrollToResources(section: HTMLElement | null) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

export function Resources() {
  const [active, setActive] = useState<ResourceKey | null>(() =>
    hashOpensMaterials() ? "materials" : null,
  );
  const cardRefs = useRef<Record<ResourceKey, HTMLButtonElement | null>>({
    music: null,
    materials: null,
    video: null,
  });
  const sectionRef = useRef<HTMLElement>(null);

  function toggle(kind: ResourceKey) {
    setActive((prev) => (prev === kind ? null : kind));
  }

  /** Закрывает панель и возвращает фокус на карточку, которая её открыла. */
  function close() {
    const trigger = active;
    setActive(null);
    if (trigger) {
      cardRefs.current[trigger]?.focus();
    }
  }

  /** Панель материалов открывают три входа:
   *  1. хэш при монтировании — переход с внешней страницы или из закладки;
   *  2. `hashchange` — адрес поменяли снаружи разметки: «Назад», ввод в адресной строке;
   *  3. клик по любой внутренней ссылке на этот якорь — делегирование на документе.
   *
   *  Третий вход нужен потому, что браузер не шлёт `hashchange`, когда адрес после клика
   *  совпадает с текущим. Посетитель открыл панель карточкой триптиха, свернул её кнопкой,
   *  хэш остался прежним — и второй клик по той же карточке молчал бы. */
  useEffect(() => {
    if (hashOpensMaterials()) {
      scrollToResources(sectionRef.current);
    }

    function openMaterials() {
      setActive("materials");
      scrollToResources(sectionRef.current);
    }

    function onHashChange() {
      if (!hashOpensMaterials()) return;
      openMaterials();
    }

    function onDocumentClick(event: MouseEvent) {
      // Средняя кнопка и модификаторы открывают ссылку в новой вкладке, отменённый
      // клик обработал кто-то другой: в этих случаях панель не трогаем.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(`a[href="${MATERIALS_HASH}"]`)) return;

      openMaterials();
    }

    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onDocumentClick);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onDocumentClick);
    };
  }, []);

  return (
    <section
      id="resources"
      ref={sectionRef}
      aria-labelledby="resources-title"
      className={
        "resources relative isolate overflow-hidden" + (active ? ` is-${active}-active` : "")
      }
    >
      {/* Атмосфера наезжает на раскрытой панели и красится акцентом её карточки. */}
      <div
        aria-hidden="true"
        data-anim="atmosphere"
        data-kind={active ?? "none"}
        className="resources-atmosphere pointer-events-none absolute -z-10"
      />

      {/* Звёздное поле одним слоем: пять градиентов точек с разными шагами повтора. */}
      <div aria-hidden="true" data-particles className="pointer-events-none absolute -inset-6 -z-10">
        <span aria-hidden="true" data-anim="particles" className="resources-particles" />
      </div>

      <div className="resources-content">
        {/* Порядок в разметке — текст, музыка, материалы, видео: он же порядок колонки
            на узком экране, а с 64rem блоки расставляет grid-area в resources.css. */}
        <RevealGroup className="resources-grid">
          <Reveal className="resources-copy">
            <Eyebrow>{resourcesCopy.eyebrow}</Eyebrow>
            <GradientTitle as="h2" variant="section">
              {/* id живёт на внутреннем span: GradientTitle в этой волне правит план 05-03,
                  а имя секции считается по тексту элемента под aria-labelledby. */}
              <span id="resources-title">{resourcesCopy.title}</span>
            </GradientTitle>
            <p className="font-body text-base leading-[1.5] text-paper/78">{resourcesCopy.body}</p>
          </Reveal>

          <RevealItem className="resources-cell resources-cell--music">
            <ResourceCard
              kind="music"
              isOpen={active === "music"}
              onToggle={() => toggle("music")}
              ref={(el) => {
                cardRefs.current.music = el;
              }}
            />
          </RevealItem>

          <RevealItem className="resources-cell resources-cell--materials">
            <ResourceCard
              kind="materials"
              isOpen={active === "materials"}
              onToggle={() => toggle("materials")}
              ref={(el) => {
                cardRefs.current.materials = el;
              }}
            />
          </RevealItem>

          <RevealItem className="resources-cell resources-cell--video">
            <ResourceCard
              kind="video"
              isOpen={active === "video"}
              onToggle={() => toggle("video")}
              ref={(el) => {
                cardRefs.current.video = el;
              }}
            />
          </RevealItem>
        </RevealGroup>
      </div>

      {/* Панель уходит порталом в body и накрывает страницу целиком, поэтому стоит рядом
          с содержимым секции, а не внутри него. `id="resources-panel"` живёт на диалоге:
          `aria-controls` открытой карточки указывает на существующий узел, как и раньше. */}
      <ResourcePanel active={active} onClose={close} />
    </section>
  );
}
