import { describe, expect, it } from "vitest";
import { buildHead, pageFacts } from "../src/seo/site.ts";
import { checkPrerenderedPage, MIN_TEXT_CHARS } from "./check-prerender.mjs";

// A synthetic page shaped like prerender.mjs output: the real generated head plus a body that
// contains every required fact, padded past the minimum length.
function page(lang, { head = buildHead(lang), body } = {}) {
  const facts = pageFacts(lang);
  const text = body ?? `${facts.requiredText.join(" · ")} ${"Operational efficiency up 19%. ".repeat(Math.ceil(MIN_TEXT_CHARS / 30))}`;
  return `<!doctype html><html lang="${lang}"><head>${head}</head><body><div id="root"><main><p>${text}</p><a href="${facts.resumePdfUrl}">Resume</a></main></div></body></html>`;
}

describe("checkPrerenderedPage", () => {
  it.each(["en", "tr"])("passes a complete %s page", (lang) => {
    expect(checkPrerenderedPage(page(lang), pageFacts(lang))).toEqual([]);
  });

  it("flags an empty render", () => {
    const problems = checkPrerenderedPage(page("en", { body: "" }), pageFacts("en"));
    expect(problems.some((p) => p.includes("characters of text"))).toBe(true);
    expect(problems.some((p) => p.includes("resume text is missing"))).toBe(true);
  });

  it.each(["0%", "%0", "0+", "0.0%"])("flags a count-up metric stuck at %s", (zero) => {
    const html = page("en").replace("up 19%.", `up ${zero}.`);
    expect(checkPrerenderedPage(html, pageFacts("en")).some((p) => p.includes(zero))).toBe(true);
  });

  it.each(["100%", "%100", "%0,5", "10x", "$80k", "0.944"])("doesn't mistake %s for a zero metric", (value) => {
    const html = page("en").replace("up 19%.", `up ${value}.`);
    expect(checkPrerenderedPage(html, pageFacts("en"))).toEqual([]);
  });

  it("flags the www host", () => {
    const html = page("en").replace("<main>", '<main><a href="https://www.emrecancioglu.com">site</a>');
    expect(checkPrerenderedPage(html, pageFacts("en")).some((p) => p.includes("www.emrecancioglu.com"))).toBe(true);
  });

  it("flags the wrong language, canonical and broken JSON-LD", () => {
    const html = page("tr", { head: buildHead("en").replace(/"@type":"Person"/, '"@type":"Person",,') }).replace('lang="tr"', 'lang="en"');
    const problems = checkPrerenderedPage(html, pageFacts("tr"));
    expect(problems).toEqual(
      expect.arrayContaining([
        '<html lang> is not "tr"',
        `canonical is not ${pageFacts("tr").url}`,
        expect.stringContaining("JSON-LD is not valid JSON"),
      ]),
    );
  });

  it("flags a missing link to the resume PDF", () => {
    const html = page("tr").replace(`href="${pageFacts("tr").resumePdfUrl}"`, 'href="/pdf/old.pdf"');
    expect(checkPrerenderedPage(html, pageFacts("tr"))).toContain(`no link to ${pageFacts("tr").resumePdfUrl}`);
  });
});
