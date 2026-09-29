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

// Share card for /resume.html (the LinkedIn-friendly wrapper around the resume PDF): the PDF's
// first page, rendered by macOS `sips`, shown as a tilted sheet next to the title.
function resumeHtml(c, page) {
  return `<!doctype html><html><head><meta charset="utf-8" />${fonts}<style>
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; background: #0a0b0d; color: #ececea; font-family: Inter, sans-serif; overflow: hidden; position: relative; }
    .glow { position: absolute; inset: 0; background: radial-gradient(circle at 78% 40%, rgba(52,211,153,0.22), transparent 50%); }
    .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: #34d399; }
    .text { position: absolute; left: 88px; top: 150px; width: 560px; }
    .tag { display: inline-block; padding: 8px 18px; border-radius: 999px; background: rgba(52,211,153,0.14); color: #34d399; font-weight: 600; font-size: 20px; letter-spacing: 2px; }
    h1 { margin-top: 26px; font-family: "Space Grotesk", sans-serif; font-size: 84px; line-height: 1; font-weight: 700; }
    .name { margin-top: 18px; font-size: 34px; font-weight: 600; }
    .role { margin-top: 10px; font-size: 22px; color: #9a9a97; white-space: nowrap; }
    .sheet { position: absolute; right: 70px; top: 60px; width: 400px; transform: rotate(4deg); border-radius: 6px; background: #fff; box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.08); }
    .url { position: absolute; left: 88px; bottom: 44px; font-size: 22px; color: #9a9a97; }
  </style></head><body><div class="glow"></div><div class="bar"></div>
    <div class="text"><span class="tag">PDF · 3 PAGES</span><h1>Resume</h1>
      <div class="name">${escape(c.profile.name)}</div>
      <div class="role">${escape(c.experience[0].title)} · Industrial Automation</div></div>
    <img class="sheet" src="${page}" alt="" />
    <div class="url">emrecancioglu.com/resume.html</div>
  </body></html>`;
}

// Share card for /github.html (LinkedIn wrapper around the GitHub profile, whose own preview is
// always just the avatar) and the social-preview image uploaded in the AWS-Cloud-Resume repo's
// GitHub settings (1280×640, GitHub's recommended size).
const githubLogo = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#ececea" d="${
  (await (await fetch("https://cdn.jsdelivr.net/npm/simple-icons@13/icons/github.svg")).text()).match(/ d="([^"]+)"/)[1]
}"/></svg>`;
const cardCss = `
    * { margin: 0; box-sizing: border-box; }
    body { background: #0a0b0d; color: #ececea; font-family: Inter, sans-serif; overflow: hidden; position: relative; }
    .glow { position: absolute; inset: 0; background: radial-gradient(circle at 82% 30%, rgba(52,211,153,0.2), transparent 48%); }
    .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: #34d399; }
    .tag { display: inline-flex; align-items: center; gap: 10px; padding: 8px 18px; border-radius: 999px; background: rgba(52,211,153,0.14); color: #34d399; font-weight: 600; font-size: 20px; letter-spacing: 2px; }
    h1 { font-family: "Space Grotesk", sans-serif; font-weight: 700; line-height: 1.02; }
    .sub { color: #9a9a97; }
    .chips { display: flex; flex-wrap: wrap; gap: 12px; }
    .chip { padding: 9px 16px; border-radius: 12px; background: #131519; border: 1px solid #262a30; font-size: 19px; font-weight: 500; }
    .url { position: absolute; bottom: 44px; font-size: 22px; color: #9a9a97; }`;

function githubHtml(c) {
  const chips = ["OPC UA", "MQTT", "Node.js", "TypeScript", "Python", "React", "AWS", "Terraform", "Kubernetes", "ML / AI"]
    .map((x) => `<span class="chip">${x}</span>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8" />${fonts}<style>${cardCss}
    body { width: 1200px; height: 630px; }
    .logo { position: absolute; right: 90px; top: 120px; width: 300px; height: 300px; opacity: .95; }
    .text { position: absolute; left: 88px; top: 110px; width: 700px; }
    h1 { margin-top: 26px; font-size: 76px; }
    .name { margin-top: 16px; font-size: 32px; font-weight: 600; }
    .sub { margin-top: 8px; font-size: 22px; }
    .chips { margin-top: 36px; }
    .url { left: 88px; }
  </style></head><body><div class="glow"></div><div class="bar"></div>
    <div class="text"><span class="tag">GITHUB</span><h1>@emrecancioglu7</h1>
      <div class="name">${escape(c.profile.name)}</div>
      <div class="sub">Industrial data, cloud &amp; automation — code and projects</div>
      <div class="chips">${chips}</div></div>
    <div class="logo">${githubLogo}</div>
    <div class="url">github.com/emrecancioglu7</div>
  </body></html>`;
}

function repoHtml() {
  const box = (title, sub) => `<div class="box"><b>${title}</b><span>${sub}</span></div>`;
  return `<!doctype html><html><head><meta charset="utf-8" />${fonts}<style>${cardCss}
    body { width: 1280px; height: 640px; }
    .text { position: absolute; left: 88px; top: 70px; right: 80px; }
    h1 { margin-top: 22px; font-size: 80px; }
    .sub { margin-top: 12px; font-size: 26px; }
    .flow { position: absolute; left: 88px; right: 80px; top: 320px; display: flex; align-items: stretch; gap: 12px; }
    .box { flex: 1; padding: 20px 16px; justify-content: center; border-radius: 16px; background: #131519; border: 1px solid #262a30; display: flex; flex-direction: column; gap: 6px; }
    .box b { font-size: 21px; white-space: nowrap; } .box span { font-size: 15px; color: #9a9a97; white-space: nowrap; }
    .arrow { color: #34d399; font-size: 28px; font-weight: 700; align-self: center; }
    .chips { position: absolute; left: 88px; top: 452px; }
    .url { left: 88px; }
  </style></head><body><div class="glow"></div><div class="bar"></div>
    <div class="text"><span class="tag">OPEN SOURCE · AWS SERVERLESS</span><h1>AWS Cloud Resume</h1>
      <div class="sub">Prerendered bilingual resume site + private admin panel, fully on AWS</div></div>
    <div class="flow">
      ${box("React + TS", "Vite · prerendered")}<span class="arrow">→</span>
      ${box("S3 + CloudFront", "hosting · CDN")}<span class="arrow">→</span>
      ${box("API Gateway", "Cognito JWT")}<span class="arrow">→</span>
      ${box("Lambda", "Node 20 · TS")}<span class="arrow">→</span>
      ${box("DynamoDB", "single-table")}
    </div>
    <div class="chips"><span class="chip">Terraform</span><span class="chip">GitHub Actions CI/CD</span><span class="chip">Cognito + TOTP MFA</span><span class="chip">S3 event pipeline</span><span class="chip">Vitest</span></div>
    <div class="url">github.com/emrecancioglu7/AWS-Cloud-Resume</div>
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

const pageDir = await mkdtemp(join(tmpdir(), "resume-"));
const pagePng = join(pageDir, "page1.png");
// sips renders a PDF's first page; ships with macOS.
execFileSync("sips", ["-s", "format", "png", "-Z", "1600", join(publicDir, "pdf/Resume_EmreCANCIOGLU.pdf"), "--out", pagePng], { stdio: "ignore" });
const page = `data:image/png;base64,${(await readFile(pagePng)).toString("base64")}`;
await screenshot(resumeHtml(en, page), 1200, 630, join(publicDir, "og/og-resume.png"));
await rm(pageDir, { recursive: true, force: true });

await screenshot(githubHtml(en), 1200, 630, join(publicDir, "og/og-github.png"));
// Not served by the site — upload it by hand: repo Settings → General → Social preview.
await screenshot(repoHtml(), 1280, 640, fileURLToPath(new URL("../../../.github/social-preview.png", import.meta.url)));

const icon512 = join(publicDir, "icons/icon-512.png");
await screenshot(iconHtml, 512, 512, icon512);
// sips ships with macOS — downscale the 512px render for the smaller icon sizes.
for (const [size, name] of [[192, "icon-192.png"], [180, "apple-touch-icon.png"]]) {
  execFileSync("sips", ["-z", String(size), String(size), icon512, "--out", join(publicDir, "icons", name)], { stdio: "ignore" });
  console.log(`wrote ${join(publicDir, "icons", name)}`);
}
