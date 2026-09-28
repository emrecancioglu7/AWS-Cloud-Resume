import { describe, expect, it } from "vitest";
import * as en from "../data/content.en";
import * as tr from "../data/content.tr";
import { SITE_URL } from "../data/site";
import { buildHead, buildJsonLd, buildLlmsFullTxt, buildLlmsTxt, buildSitemap, pageUrl } from "./site";

describe("seo/site", () => {
  it("never points at the www host, which has no DNS record", () => {
    const everything = [buildHead("en"), buildHead("tr"), buildSitemap(), buildLlmsTxt(), buildLlmsFullTxt()].join("\n");
    expect(everything).not.toContain("www.emrecancioglu.com");
  });

  it.each([
    ["en", en, `${SITE_URL}/`],
    ["tr", tr, `${SITE_URL}/tr`],
  ] as const)("builds a self-canonical %s head with hreflang alternates and localized OG tags", (lang, c, url) => {
    const head = buildHead(lang);
    expect(pageUrl(lang)).toBe(url);
    expect(head).toContain(`<link rel="canonical" href="${url}" />`);
    expect(head).toContain(`<link rel="alternate" hreflang="en" href="${SITE_URL}/" />`);
    expect(head).toContain(`<link rel="alternate" hreflang="tr" href="${SITE_URL}/tr" />`);
    expect(head).toContain(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`);
    expect(head).toContain(`<meta property="og:url" content="${url}" />`);
    expect(head).toContain(`<meta property="og:locale" content="${c.seo.locale}" />`);
    expect(head).toContain(`<meta property="og:image" content="${SITE_URL}${c.seo.ogImage}" />`);
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain(`<title>${c.seo.title.replace(/&/g, "&amp;")}</title>`);
  });

  it("escapes < inside the JSON-LD so it can't close its <script> tag", () => {
    const script = buildHead("en").match(/<script type="application\/ld\+json">(.*)<\/script>/)?.[1] ?? "";
    expect(script).not.toContain("<");
    expect(() => JSON.parse(script)).not.toThrow();
  });

  it("describes the person from the resume content", () => {
    const graph = buildJsonLd("en")["@graph"];
    const person = graph.find((node) => node["@type"] === "Person") as Record<string, unknown>;
    expect(person.jobTitle).toBe(en.experience[0].title);
    expect(person.sameAs).toEqual([en.profile.social.linkedin, en.profile.social.github, en.profile.social.orcid]);
    expect(graph.filter((node) => node["@type"] === "ScholarlyArticle")).toHaveLength(en.publications.length);
  });

  it("lists both language pages and both PDFs in the sitemap", () => {
    const sitemap = buildSitemap();
    expect(sitemap).toContain(`<loc>${SITE_URL}/</loc>`);
    expect(sitemap).toContain(`<loc>${SITE_URL}/tr</loc>`);
    expect(sitemap).toContain(`<loc>${SITE_URL}${en.profile.resumePdfUrl}</loc>`);
    expect(sitemap).toContain(`<loc>${SITE_URL}${tr.profile.resumePdfUrl}</loc>`);
  });

  it("puts every experience entry into llms-full.txt", () => {
    const full = buildLlmsFullTxt();
    for (const e of en.experience) expect(full).toContain(e.title);
  });
});
