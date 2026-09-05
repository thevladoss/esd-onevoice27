import { useEffect, useRef, useState } from "react";
import type { ResourceKey } from "../../data/copy.resources";
import { resourcesCopy } from "../../data/copy.resources";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Reveal, RevealGroup, RevealItem } from "../layout/Reveal";
import { ResourceCard } from "./ResourceCard";
import { ResourcePanel } from "./ResourcePanel";
import "./resources.css";

/** Адрес с этим хэшем открывает панель материалов. Строка сверяется целиком и никуда не
 *  подставляется, поэтому адресная строка не управляет разметкой.
 *  Сейчас такую ссылку никто в `src/` не отдаёт: триптих «Скачать материалы →» ведёт на
 *  `#resources`. Перевод ссылки на `#resources-materials` — за фазой 5, которая сводит копирайт
 *  секций в общий словарь; до тех пор хэш работает для внешних ссылок и закладок. */
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
  const panelRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (active) {
      panelRef.current?.focus({ preventScroll: true });
    }
  }, [active]);

  /** Хэш читается дважды: при монтировании (переход с внешней страницы) и на `hashchange` —
   *  клик по ссылке внутри уже открытого лендинга меняет адрес без перезагрузки, и без
   *  слушателя панель осталась бы закрытой. */
  useEffect(() => {
    if (hashOpensMaterials()) {
      scrollToResources(sectionRef.current);
    }

    function onHashChange() {
      if (!hashOpensMaterials()) return;
      setActive("materials");
      scrollToResources(sectionRef.current);
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
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

      <div className="mx-auto max-w-[72rem] px-4 py-16 md:px-8 md:py-24">
        <RevealGroup className="flex flex-col gap-6 md:grid md:grid-cols-6 md:gap-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-8">
          <Reveal className="order-first rounded-card border border-dotted border-[rgb(84_164_172/.25)] bg-[rgb(84_164_172/.05)] p-8 text-center md:col-span-6 md:row-start-1 lg:col-start-5 lg:col-end-10 lg:row-start-1 lg:row-end-3 lg:mx-auto lg:max-w-[528px] lg:self-center">
            <Eyebrow>{resourcesCopy.eyebrow}</Eyebrow>
            <GradientTitle as="h2" variant="section" className="mt-2">
              {/* id живёт на внутреннем span: GradientTitle в этой волне правит план 05-03,
                  а имя секции считается по тексту элемента под aria-labelledby. */}
              <span id="resources-title">{resourcesCopy.title}</span>
            </GradientTitle>
            <p className="mt-4 font-body text-base leading-[1.5] text-paper/78">
              {resourcesCopy.body}
            </p>
          </Reveal>

          <RevealItem className="mx-auto w-full min-w-0 max-w-[360px] md:col-start-1 md:col-end-4 md:row-start-2 md:max-w-none lg:col-start-1 lg:col-end-5 lg:row-start-1 lg:row-end-3 lg:max-w-[320px] lg:self-start">
            <ResourceCard
              kind="music"
              isOpen={active === "music"}
              onToggle={() => toggle("music")}
              ref={(el) => {
                cardRefs.current.music = el;
              }}
            />
          </RevealItem>

          <RevealItem className="mx-auto w-full min-w-0 max-w-[360px] md:col-start-4 md:col-end-7 md:row-start-2 md:mt-6 md:max-w-none lg:col-start-10 lg:col-end-13 lg:row-start-2 lg:row-end-4 lg:mt-0 lg:ml-auto lg:max-w-[272px] lg:self-end">
            <ResourceCard
              kind="materials"
              isOpen={active === "materials"}
              onToggle={() => toggle("materials")}
              ref={(el) => {
                cardRefs.current.materials = el;
              }}
            />
          </RevealItem>

          <RevealItem className="mx-auto w-full min-w-0 max-w-[360px] md:col-start-2 md:col-end-6 md:row-start-3 md:-mt-4 md:max-w-none lg:col-start-4 lg:col-end-8 lg:row-start-3 lg:row-end-4 lg:-mt-8 lg:max-w-[344px]">
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

        {/* Обёртка держит только анимацию высоты: `id="resources-panel"` живёт на самой
            панели с `role="region"`, иначе `aria-controls` карточек указывал бы на
            безролевой div (04-UI-SPEC.md:244). */}
        <div data-open={active !== null} className="resources-panel-wrap mt-8">
          <div className="min-h-0 overflow-hidden">
            {active ? (
              <ResourcePanel
                key={active}
                kind={active}
                onClose={close}
                ref={panelRef}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.stopPropagation();
                    close();
                  }
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
