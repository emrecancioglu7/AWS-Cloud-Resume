// Runs after `vite build` + `vite build --ssr` (see package.json "build"). Writes one static HTML
// page per language plus the generated sitemap and llms.txt files into dist/.
//   dist/index.html -> "/"   (English)
//   dist/tr.html    -> "/tr" (Turkish; deploy-web.yml uploads it to the extensionless S3 key "tr")
import { readFile, rm, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dist = (file) => new URL(`dist/${file}`, root);
const ssr = await import(new URL("dist-ssr/entry-server.js", root).href);

const template = await readFile(dist("index.html"), "utf8");
for (const marker of ['<html lang="en">', "<!--app-head-->", "<!--app-html-->"]) {
  if (!template.includes(marker)) throw new Error(`dist/index.html is missing the "${marker}" prerender marker`);
}

for (const [lang, file] of [["en", "index.html"], ["tr", "tr.html"]]) {
  const html = template
    .replace('<html lang="en">', `<html lang="${lang}">`)
    .replace("<!--app-head-->", ssr.buildHead(lang))
    .replace("<!--app-html-->", ssr.render(ssr.pagePath(lang)));
  await writeFile(dist(file), html);
}

await writeFile(dist("sitemap.xml"), ssr.buildSitemap());
await writeFile(dist("llms.txt"), ssr.buildLlmsTxt());
await writeFile(dist("llms-full.txt"), ssr.buildLlmsFullTxt());
await rm(new URL("dist-ssr/", root), { recursive: true, force: true });

console.log("prerendered: index.html, tr.html, sitemap.xml, llms.txt, llms-full.txt");
