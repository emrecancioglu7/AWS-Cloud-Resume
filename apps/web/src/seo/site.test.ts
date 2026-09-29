import { describe, expect, it } from "vitest";
import * as en from "../data/content.en";
import * as tr from "../data/content.tr";
import { SITE_URL } from "../data/site";
import { publicationList, publicationsBySlug } from "../data/publications";
import { buildHead, buildJsonLd, buildLlmsFullTxt, buildLlmsTxt, buildPublicationHead, buildSitemap, pageUrl, publicationUrl } from "./site";

describe("seo/site", () => {
  it("never points at the www host, which has no DNS record", () => {
    const everything = [buildHead("en"), buildHead("tr"), buildSitemap(), buildLlmsTxt(), buildLlmsFullTxt(), JSON.stringify(en), JSON.stringify(tr), ...publicationList.map((p) => buildPublicationHead(p.slug))].join("\n");
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
    expect(person.sameAs).toEqual(Object.values(en.profile.social));
    expect(person.sameAs).toEqual(expect.arrayContaining([en.profile.social.orcid, en.profile.social.semanticScholar, en.profile.social.academia]));
    const thesis = graph.find((node) => node["@type"] === "Thesis") as Record<string, unknown>;
    expect(thesis.url).toBe(en.education[0].thesisUrl);
    const articles = graph.filter((node) => node["@type"] === "ScholarlyArticle") as Record<string, unknown>[];
    expect(articles.map((a) => a.url)).toEqual(publicationList.map((p) => publicationUrl(p.slug)));
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

  it("links every resume-section publication, in both languages, to an existing publication page", () => {
    for (const list of [en.publications, tr.publications]) {
      expect(list.map((p) => p.slug)).toEqual(publicationList.map((p) => p.slug));
      for (const p of list) expect(publicationsBySlug.has(p.slug)).toBe(true);
    }
    expect(en.highlights.find((h) => h.label === "Publications")?.metric).toBe(String(publicationList.length));
    expect(tr.highlights.find((h) => h.label === "Yayın")?.metric).toBe(String(publicationList.length));
  });

  it("gives each publication page Google Scholar tags, one citation_author per author, and a self canonical", () => {
    for (const p of publicationList) {
      const head = buildPublicationHead(p.slug);
      expect(head).toContain(`<link rel="canonical" href="${publicationUrl(p.slug)}" />`);
      expect(head).toContain('<meta name="citation_title"');
      expect(head.match(/<meta name="citation_author"/g)).toHaveLength(p.authors.length);
      expect(head).toContain(`<meta name="citation_publication_date" content="${p.date}" />`);
      if (p.doi) expect(head).toContain(`<meta name="citation_doi" content="${p.doi}" />`);
      const script = head.match(/<script type="application\/ld\+json">(.*)<\/script>/)?.[1] ?? "";
      expect(JSON.parse(script)["@type"]).toBe("ScholarlyArticle");
    }
  });

  it("lists every publication page in the sitemap and llms.txt", () => {
    for (const p of publicationList) {
      expect(buildSitemap()).toContain(`<loc>${publicationUrl(p.slug)}</loc>`);
      expect(buildLlmsTxt()).toContain(publicationUrl(p.slug));
    }
  });
});
