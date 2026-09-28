// Regenerates the social-preview images (public/og/og-{en,tr}.png, 1200×630) and the app icons
// (public/icons/*) by screenshotting small HTML templates with headless Chrome. Run it locally
// after the resume content changes: `npm run og-images` (needs Google Chrome + Node 23.6+, which
// can import the .ts content files directly). Output PNGs are committed, not built in CI.
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as en from "../src/data/content.en.ts";
import * as tr from "../src/data/content.tr.ts";

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const photo = `data:image/jpeg;base64,${(await readFile(join(publicDir, "img/profile-img.jpg"))).toString("base64")}`;
const fonts = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=block" rel="stylesheet" />`;
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function ogHtml(c) {
  const [name, ...surname] = c.profile.name.split(" ");
  const stats = c.highlights
    .map((h) => `<div class="stat"><b>${escape(h.metric)}</b><span>${escape(h.label)}</span></div>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8" />${fonts}<style>
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; background: #0a0b0d; color: #ececea; font-family: Inter, sans-serif; overflow: hidden; position: relative; }
    .glow { position: absolute; inset: 0; background: radial-gradient(circle at 85% 20%, rgba(52,211,153,0.18), transparent 45%); }
    .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: #34d399; }
    .wrap { position: relative; display: flex; align-items: center; gap: 56px; height: 100%; padding: 0 72px 0 88px; }
    .text { flex: 1; }
    h1 { font-family: "Space Grotesk", sans-serif; font-size: 76px; line-height: 1; letter-spacing: -1px; font-weight: 700; }
    h1 span { font-weight: 600; color: #9a9a97; }
    .role { margin-top: 22px; font-size: 32px; font-weight: 600; color: #34d399; }
    .sub { margin-top: 10px; font-size: 24px; color: #9a9a97; }
    .stats { margin-top: 40px; display: grid; grid-template-columns: repeat(3, auto); gap: 18px 36px; justify-content: start; }
    .stat b { display: block; font-family: "Space Grotesk", sans-serif; font-size: 38px; color: #ececea; }
    .stat span { font-size: 18px; color: #9a9a97; }
    img { width: 300px; height: 300px; border-radius: 50%; object-fit: cover; border: 6px solid #1a1d22; box-shadow: 0 0 0 2px #34d399; }
    .url { position: absolute; right: 72px; bottom: 40px; font-size: 22px; color: #9a9a97; }
  </style></head><body><div class="glow"></div><div class="bar"></div>
    <div class="wrap"><div class="text">
      <h1>${escape(name)} <span>${escape(surname.join(" "))}</span></h1>
      <div class="role">${escape(c.experience[0].title)}</div>
      <div class="sub">${escape(c.profile.title.split("|")[1]?.replace(/\.$/, "").trim() ?? "")} · İzmir, Türkiye</div>
      <div class="stats">${stats}</div>
    </div><img src="${photo}" alt="" /></div>
    <div class="url">emrecancioglu.com</div>
  </body></html>`;
}

const iconHtml = `<!doctype html><html><head><meta charset="utf-8" />${fonts}<style>
  * { margin: 0; }
  body { width: 512px; height: 512px; background: #0a0b0d; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  div { width: 400px; height: 400px; border-radius: 50%; background: rgba(52,211,153,0.14); color: #34d399; display: flex; align-items: center; justify-content: center;
        font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 176px; letter-spacing: -4px; }
</style></head><body><div>EÇ</div></body></html>`;

async function screenshot(html, width, height, out) {
  const dir = await mkdtemp(join(tmpdir(), "og-"));
  const file = join(dir, "page.html");
  await writeFile(file, html);
  execFileSync(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    // Gives the Google Fonts stylesheet time to load before the capture.
    "--virtual-time-budget=5000",
    `--window-size=${width},${height}`,
    `--screenshot=${out}`,
    `file://${file}`,
  ], { stdio: "ignore" });
  await rm(dir, { recursive: true, force: true });
  console.log(`wrote ${out}`);
}

await mkdir(join(publicDir, "og"), { recursive: true });
await mkdir(join(publicDir, "icons"), { recursive: true });
await screenshot(ogHtml(en), 1200, 630, join(publicDir, "og/og-en.png"));
await screenshot(ogHtml(tr), 1200, 630, join(publicDir, "og/og-tr.png"));

const icon512 = join(publicDir, "icons/icon-512.png");
await screenshot(iconHtml, 512, 512, icon512);
// sips ships with macOS — downscale the 512px render for the smaller icon sizes.
for (const [size, name] of [[192, "icon-192.png"], [180, "apple-touch-icon.png"]]) {
  execFileSync("sips", ["-z", String(size), String(size), icon512, "--out", join(publicDir, "icons", name)], { stdio: "ignore" });
  console.log(`wrote ${join(publicDir, "icons", name)}`);
}
