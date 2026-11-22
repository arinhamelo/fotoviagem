// Copia index.html para a constante APP_HTML (linha 1) de worker.js.
// Uso: node scripts/sync-html.mjs
import { readFileSync, writeFileSync } from "node:fs";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const worker = readFileSync(new URL("../worker.js", import.meta.url), "utf8");
const rest = worker.slice(worker.indexOf("\n") + 1);
writeFileSync(new URL("../worker.js", import.meta.url), "const APP_HTML = " + JSON.stringify(html) + ";\n" + rest);
console.log("worker.js atualizado a partir de index.html");
