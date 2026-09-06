#!/usr/bin/env node
/**
 * Побайтная сверка живого сайта на GitHub Pages с локальной сборкой `dist/`.
 *
 * Список файлов берётся из `dist/index.html`: сама страница, все её локальные ссылки
 * под `/esd-onevoice27/` (JS, CSS, favicon) плюс два файла видео глобуса, которые в
 * разметке не упомянуты — их подключает бандл. Каждый файл качается с запретом кэша,
 * хэшируется sha256 и сравнивается с файлом из `dist/`. Дополнительно сверяется список
 * ассетов живого `index.html` со списком из `dist/index.html`.
 *
 * Свежий деплой Pages какое-то время отдаёт прошлую сборку из кэша, поэтому при любом
 * расхождении скрипт ждёт `--wait` секунд и повторяет весь проход, до `--retries` раз.
 *
 * Запуск:
 *   node .planning/phases/17-integration-qa/qa/prod-hashes.mjs
 *   node .planning/phases/17-integration-qa/qa/prod-hashes.mjs --base http://localhost:4173/esd-onevoice27/ --retries 1
 *   node .planning/phases/17-integration-qa/qa/prod-hashes.mjs --out /dev/null --retries 1
 *
 * Коды выхода: 0 — все файлы равны, 1 — расхождение, 2 — ошибка аргументов или нет dist/index.html.
 *
 * Скрипт только читает: локальные файлы с диска, живые — по HTTPS. Ничего не отправляет.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import process from "node:process";

const DEFAULT_BASE = "https://thevladoss.github.io/esd-onevoice27/";
const SITE_PREFIX = "/esd-onevoice27/";
const ASSETS_PREFIX = "/esd-onevoice27/assets/";
/** Видео подключает бандл, в разметке ссылок на него нет: добавляем вручную. */
const EXTRA_FILES = ["hero-globe.webm", "hero-globe.mp4"];
const DEFAULT_OUT = join(fileURLToPath(new URL("./results/", import.meta.url)), "prod-hashes.txt");
const NO_CACHE = { "Cache-Control": "no-cache", Pragma: "no-cache" };

function fail(message) {
  console.log(`FAIL ${message}`);
  process.exit(2);
}

/** Значение именованного аргумента или запасное. */
function arg(argv, name, fallback) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  const value = argv[index + 1];
  if (!value) {
    fail(`после ${name} нужно значение`);
  }
  return value;
}

function positiveInt(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    fail(`${name} должен быть целым числом не меньше 1, получено «${value}»`);
  }
  return parsed;
}

/** Все значения src и href разметки — та же регулярка, что в scripts/check-dist.mjs. */
function urlsOf(html) {
  const urls = [];
  const pattern = /(?:src|href)="([^"]+)"/g;
  let match = pattern.exec(html);
  while (match !== null) {
    urls.push(match[1]);
    match = pattern.exec(html);
  }
  return urls;
}

function assetsOf(html) {
  return urlsOf(html)
    .filter((url) => url.startsWith(ASSETS_PREFIX))
    .sort();
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Текущий коммит без child_process: ссылка из .git/HEAD или строка из packed-refs. */
function gitHead() {
  try {
    const head = readFileSync(".git/HEAD", "utf8").trim();
    if (!head.startsWith("ref: ")) {
      return head;
    }
    const ref = head.slice("ref: ".length);
    if (existsSync(join(".git", ref))) {
      return readFileSync(join(".git", ref), "utf8").trim();
    }
    const packed = readFileSync(".git/packed-refs", "utf8");
    const line = packed.split("\n").find((row) => row.endsWith(` ${ref}`));
    return line ? line.split(" ")[0] : "неизвестен";
  } catch {
    return "неизвестен";
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Файлы для сверки: index.html, локальные ссылки разметки и видео.
 * Каждый элемент — относительный путь от base и от каталога dist.
 */
function filesToCheck(html) {
  const relatives = [""];
  for (const url of urlsOf(html)) {
    if (!url.startsWith(SITE_PREFIX)) {
      continue;
    }
    const relative = url.slice(SITE_PREFIX.length);
    if (relative && !relatives.includes(relative)) {
      relatives.push(relative);
    }
  }
  for (const extra of EXTRA_FILES) {
    if (!relatives.includes(extra)) {
      relatives.push(extra);
    }
  }
  return relatives;
}

async function fetchFile(base, relative) {
  try {
    const response = await fetch(new URL(relative, base), { headers: NO_CACHE });
    const body = Buffer.from(await response.arrayBuffer());
    return { status: response.status, body };
  } catch (error) {
    return { status: 0, body: Buffer.alloc(0), error: String(error) };
  }
}

/** Один проход по всем файлам. */
async function pass(base, distDir, relatives) {
  const rows = [];
  for (const relative of relatives) {
    const localFile = join(distDir, relative === "" ? "index.html" : relative);
    const label = relative === "" ? `${SITE_PREFIX} (index.html)` : `${SITE_PREFIX}${relative}`;
    const localHash = existsSync(localFile) ? sha256(readFileSync(localFile)) : "нет файла в dist";
    const live = await fetchFile(base, relative);
    const liveHash = live.status === 200 ? sha256(live.body) : "—";
    rows.push({
      label,
      relative,
      localName: relative === "" ? "index.html" : relative,
      status: live.status,
      liveHash,
      localHash,
      equal: live.status === 200 && liveHash === localHash,
      liveBody: live.body,
    });
  }
  return rows;
}

function report({ base, distDir, rows, attempts, assetsMatch, liveAssets, distAssets, head }) {
  const equal = rows.filter((row) => row.equal).length;
  const lines = [
    "Побайтная сверка живого сайта с локальным dist (фаза 17, план 01)",
    "",
    `Живой сайт:      ${base}`,
    `Локальная сборка: ${distDir}`,
    `Коммит HEAD:     ${head}`,
    `Снято:           ${new Date().toISOString()}`,
    `Проходов:        ${attempts}`,
    assetsMatch
      ? `Список ассетов:  список ассетов совпал, файлов: ${distAssets.length}`
      : `Список ассетов:  РАСХОЖДЕНИЕ. Живой: ${liveAssets.join(", ") || "—"}; dist: ${distAssets.join(", ") || "—"}`,
    "",
    "| путь | код | sha256 живого (первые 12) | sha256 dist (первые 12) | равен |",
    "|---|---|---|---|---|",
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.label} | ${row.status} | ${row.liveHash.slice(0, 12)} | ${row.localHash.slice(0, 12)} | ${row.equal ? "да" : "нет"} |`,
    );
  }

  lines.push("");
  if (equal === rows.length && assetsMatch) {
    lines.push(`Итог: ${equal} из ${rows.length} равны.`);
  } else {
    const diff = rows.filter((row) => !row.equal).map((row) => row.label);
    lines.push(
      `Итог: ${equal} из ${rows.length} равны, расхождения: ${diff.join(", ") || "список ассетов"}.`,
    );
  }

  lines.push("", "Полные хэши живых файлов:");
  for (const row of rows) {
    lines.push(`${row.liveHash}  ${row.localName}`);
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const base = arg(argv, "--base", DEFAULT_BASE);
  const distDir = arg(argv, "--dist", "dist");
  const outFile = arg(argv, "--out", DEFAULT_OUT);
  const retries = positiveInt(arg(argv, "--retries", "5"), "--retries");
  const waitSeconds = positiveInt(arg(argv, "--wait", "60"), "--wait");

  const indexFile = join(distDir, "index.html");
  if (!existsSync(indexFile)) {
    fail(`нет ${indexFile} — сначала npm run build`);
  }

  const distHtml = readFileSync(indexFile, "utf8");
  const distAssets = assetsOf(distHtml);
  const relatives = filesToCheck(distHtml);

  let rows = [];
  let liveAssets = [];
  let assetsMatch = false;
  let attempts = 0;

  while (attempts < retries) {
    attempts += 1;
    rows = await pass(base, distDir, relatives);
    const indexRow = rows.find((row) => row.relative === "");
    liveAssets = indexRow && indexRow.status === 200 ? assetsOf(indexRow.liveBody.toString("utf8")) : [];
    assetsMatch = liveAssets.join("\n") === distAssets.join("\n");

    if (rows.every((row) => row.equal) && assetsMatch) {
      break;
    }
    if (attempts < retries) {
      console.log(
        `Проход ${attempts}: есть расхождения, повтор через ${waitSeconds} с (кэш Pages после деплоя).`,
      );
      await sleep(waitSeconds * 1000);
    }
  }

  const head = gitHead();
  const text = report({ base, distDir, rows, attempts, assetsMatch, liveAssets, distAssets, head });
  console.log(text);

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, text, "utf8");

  process.exit(rows.every((row) => row.equal) && assetsMatch ? 0 : 1);
}

await main();
