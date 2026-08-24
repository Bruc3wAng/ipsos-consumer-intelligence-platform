#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";

const files = process.argv.slice(2).filter((value) => !value.startsWith("--"));
if (!files.length) {
  console.error("Usage: node tools/xlsx_openability_gate.mjs <workbook.xlsx> [...]");
  process.exit(2);
}

const sofficeCandidates = [
  process.env.SOFFICE_BIN,
  "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  "/Users/bruce.w/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/soffice",
].filter(Boolean);
const soffice = sofficeCandidates.find((candidate) => existsSync(candidate));
if (!soffice) {
  console.error("Independent workbook engine unavailable: set SOFFICE_BIN to a LibreOffice soffice executable.");
  process.exit(3);
}

function listZip(path) {
  return execFileSync("unzip", ["-Z1", path], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
}

function readZipEntry(path, entry) {
  return execFileSync("unzip", ["-p", path, entry], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function inspectPackage(path) {
  execFileSync("unzip", ["-t", path], { stdio: "pipe" });
  const entries = listZip(path);
  const sheets = entries.filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry));
  if (!entries.includes("xl/workbook.xml") || !entries.includes("xl/_rels/workbook.xml.rels") || !sheets.length) {
    throw new Error("missing workbook, relationship or worksheet parts");
  }
  let cells = 0;
  let nonemptyCells = 0;
  for (const sheet of sheets) {
    const xml = readZipEntry(path, sheet);
    const matches = [...xml.matchAll(/<(?:[A-Za-z_][\w.-]*:)?c\b([^>]*)>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?c>/g)];
    if (matches.some((match) => !/\br="[A-Z]+[1-9][0-9]*"/.test(match[1]))) {
      throw new Error(`${sheet} contains a cell without an A1 address`);
    }
    cells += matches.length;
    nonemptyCells += matches.filter((match) => /<(?:[A-Za-z_][\w.-]*:)?(?:v|t)(?:\s[^>]*)?>[\s\S]*?<\/(?:[A-Za-z_][\w.-]*:)?(?:v|t)>/.test(match[2])).length;
  }
  if (!cells || !nonemptyCells) throw new Error("workbook contains no readable cell values");
  return { sheets: sheets.length, cells, nonemptyCells };
}

const root = mkdtempSync(join(tmpdir(), "xlsx-openability-"));
const results = [];
try {
  for (const input of files) {
    const source = resolve(input);
    if (!existsSync(source) || statSync(source).size === 0) throw new Error(`${source}: missing or empty`);
    const before = inspectPackage(source);
    const key = String(results.length + 1).padStart(2, "0");
    const outDir = join(root, `converted-${key}`);
    const profile = join(root, `profile-${key}`);
    mkdirSync(outDir, { recursive: true });
    mkdirSync(profile, { recursive: true });
    execFileSync(soffice, [
      `-env:UserInstallation=file://${profile}`,
      "--headless",
      "--convert-to",
      "xlsx",
      "--outdir",
      outDir,
      source,
    ], {
      env: { ...process.env, XDG_CACHE_HOME: join(root, "cache") },
      stdio: "pipe",
      maxBuffer: 64 * 1024 * 1024,
    });
    const reopened = join(outDir, basename(source));
    if (!existsSync(reopened) || readFileSync(reopened).length === 0) throw new Error(`${source}: independent engine produced no workbook`);
    const after = inspectPackage(reopened);
    if (!after.sheets || !after.nonemptyCells) throw new Error(`${source}: values disappeared after independent open/save`);
    results.push({ file: source, package: before, reopened: after, engine: soffice });
  }
  console.log(JSON.stringify({ status: "passed", workbooks: results }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "failed", error: error instanceof Error ? error.message : String(error), workbooks: results }, null, 2));
  process.exitCode = 1;
} finally {
  rmSync(root, { recursive: true, force: true });
}
