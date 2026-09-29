// Build-time SEO output, generated from the same content files the page renders so the metadata
// can never drift from the visible resume. Used by scripts/prerender.mjs (via entry-server.tsx)
// for the production HTML/sitemap/llms.txt, and by vite.config.ts to fill the head in dev.
import * as en from "../data/content.en.ts";
import * as tr from "../data/content.tr.ts";
import { LAST_UPDATED, SITE_URL } from "../data/site.ts";
import { citation, pageRange, publicationList, publicationPath, publicationsBySlug, type Publication } from "../data/publications.ts";

const content = { en, tr };
// Declared locally rather than imported from LanguageContext: vite.config.ts imports this file,
// and pulling a .tsx React module into the Node-side typecheck would break it.
type Language = keyof typeof content;
const languages: Language[] = ["en", "tr"];
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function pagePath(lang: Language) {
  return lang === "tr" ? "/tr" : "/";
}

export function pageUrl(lang: Language) {
  return `${SITE_URL}${pagePath(lang)}`;
}

// What scripts/check-prerender.mjs expects to find in each prerendered page — derived from the
// content files so the check follows the resume instead of hardcoding it.
export function pageFacts(lang: Language) {
  const c = content[lang];
  return {
    lang,
    url: pageUrl(lang),
    alternates: languages.map(pageUrl),
    requiredText: [c.profile.name, c.experience[0].title, c.experience[c.experience.length - 1].title, c.education[0].title],
    resumePdfUrl: c.profile.resumePdfUrl,
  };
}

export function publicationUrl(slug: string) {
  return `${SITE_URL}${publicationPath(slug)}`;
}

export const publicationSlugs = publicationList.map((p) => p.slug);

function getPublication(slug: string) {
  const p = publicationsBySlug.get(slug);
  if (!p) throw new Error(`Unknown publication slug "${slug}"`);
  return p;
}

// Same idea as pageFacts, for a /publications/<slug> page.
export function publicationFacts(slug: string) {
  const p = getPublication(slug);
  return {
    lang: "en",
    url: publicationUrl(slug),
    alternates: [] as string[],
    requiredText: [p.title, "Emre Çancıoğlu"],
    requiredMeta: ["citation_title", "citation_author", "citation_publication_date"],
    minTextChars: 300,
  };
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function unique<T>(items: readonly T[]) {
  return [...new Set(items)];
}

export function buildJsonLd(lang: Language) {
  const c = content[lang];
  const url = pageUrl(lang);
  const person = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: c.profile.name,
    alternateName: ["Emre Cancioglu", "Emre ÇANCIOĞLU", "Emre CANCIOGLU"],
    givenName: "Emre",
    familyName: "Çancıoğlu",
    jobTitle: c.experience[0].title,
    description: c.profile.shortBio,
    url: `${SITE_URL}/`,
    image: { "@type": "ImageObject", url: `${SITE_URL}/img/profile-img.jpg`, width: 460, height: 543 },
    email: `mailto:${c.profile.email}`,
    address: { "@type": "PostalAddress", addressLocality: "İzmir", addressCountry: "TR" },
    worksFor: { "@type": "Organization", name: c.seo.employer },
    alumniOf: { "@type": "CollegeOrUniversity", name: c.seo.university, url: "https://www.ikcu.edu.tr" },
    knowsAbout: unique(c.skillCategories.filter((cat) => cat.skills.length > 2).flatMap((cat) => cat.skills)),
    knowsLanguage: [
      { "@type": "Language", name: lang === "tr" ? "Türkçe" : "Turkish", alternateName: "tr" },
      { "@type": "Language", name: lang === "tr" ? "İngilizce" : "English", alternateName: "en" },
    ],
    award: c.awards.flatMap((a) => a.items.map((item) => `${item} — ${a.title} (${a.date})`)),
    hasCredential: [
      ...c.education.map((ed) => ({
        "@type": "EducationalOccupationalCredential",
        name: ed.title,
        credentialCategory: "degree",
        recognizedBy: { "@type": "CollegeOrUniversity", name: c.seo.university },
      })),
      ...c.certifications.map((cert) => ({
        "@type": "EducationalOccupationalCredential",
        name: cert.title,
        credentialCategory: "certificate",
        recognizedBy: { "@type": "Organization", name: cert.issuer },
      })),
    ],
    sameAs: [c.profile.social.linkedin, c.profile.social.github, c.profile.social.orcid],
  };

  const articles = publicationList.map(scholarlyArticle);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: c.profile.name,
        inLanguage: languages,
        publisher: { "@id": PERSON_ID },
      },
      {
        "@type": "ProfilePage",
        "@id": `${url}#profilepage`,
        url,
        name: c.seo.title,
        description: c.seo.description,
        inLanguage: lang,
        isPartOf: { "@id": WEBSITE_ID },
        dateModified: LAST_UPDATED,
        mainEntity: { "@id": PERSON_ID },
      },
      person,
      ...articles,
    ],
  };
}

// Full ScholarlyArticle for one publication; the resume pages embed all five, each publication
// page embeds its own. Co-authors with a known ORCID get it as their identifier.
function scholarlyArticle(p: Publication) {
  const isJournal = p.kind === "journal";
  return {
    "@type": "ScholarlyArticle",
    "@id": `${publicationUrl(p.slug)}#article`,
    url: publicationUrl(p.slug),
    headline: p.title,
    name: p.title,
    ...(p.titleEn ? { alternativeHeadline: p.titleEn } : {}),
    inLanguage: p.language,
    author: p.authors.map((a) =>
      a.self ? { "@id": PERSON_ID } : { "@type": "Person", name: a.name, ...(a.orcid ? { sameAs: `https://orcid.org/${a.orcid}` } : {}) },
    ),
    datePublished: p.date.replace(/\//g, "-"),
    ...(pageRange(p) ? { pagination: pageRange(p) } : {}),
    ...(p.doi ? { identifier: { "@type": "PropertyValue", propertyID: "DOI", value: p.doi }, sameAs: `https://doi.org/${p.doi}` } : {}),
    isPartOf: isJournal
      ? {
          "@type": p.volume ? "PublicationVolume" : "PublicationIssue",
          ...(p.volume ? { volumeNumber: p.volume } : { issueNumber: p.issue }),
          isPartOf: { "@type": "Periodical", name: p.venue },
        }
      : { "@type": "Book", name: p.venue, ...(p.isbn ? { isbn: p.isbn } : {}), ...(p.publisher ? { publisher: { "@type": "Organization", name: p.publisher } } : {}) },
    ...(p.abstractEn || p.abstractTr ? { abstract: p.abstractEn ?? p.abstractTr } : {}),
    keywords: p.keywords.join(", "),
    ...(p.license ? { license: "https://creativecommons.org/licenses/by-nc/4.0/" } : {}),
  };
}

// Head for /publications/<slug>: standard meta plus the Google Scholar citation_* tags
// (https://scholar.google.com/intl/en/scholar/inclusion.html#indexing).
export function buildPublicationHead(slug: string) {
  const p = getPublication(slug);
  const url = publicationUrl(slug);
  const title = escapeAttr(`${p.titleEn ?? p.title} | Emre Çancıoğlu`);
  const description = escapeAttr(truncate(p.abstractEn ?? p.abstractTr ?? p.title, 160));
  const image = `${SITE_URL}${en.seo.ogImage}`;
  const cite = (name: string, value: string | undefined) => (value ? [`<meta name="${name}" content="${escapeAttr(value)}" />`] : []);
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", ...scholarlyArticle(p) }).replace(/</g, "\\u003c");

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="author" content="${escapeAttr(p.authors.map((a) => a.name).join(", "))}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${url}" />`,
    ...cite("citation_title", p.title),
    ...p.authors.flatMap((a) => cite("citation_author", a.name)),
    ...cite("citation_publication_date", p.date),
    ...cite(p.kind === "journal" ? "citation_journal_title" : "citation_conference_title", p.venue),
    ...cite("citation_volume", p.volume),
    ...cite("citation_issue", p.issue),
    ...cite("citation_firstpage", p.firstPage),
    ...cite("citation_lastpage", p.lastPage),
    ...cite("citation_doi", p.doi),
    ...cite("citation_publisher", p.publisher),
    ...cite("citation_isbn", p.isbn),
    ...cite("citation_language", p.language),
    ...cite("citation_keywords", p.keywords.join("; ")),
    ...cite("citation_abstract_html_url", url),
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Emre Çancıoğlu" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join("\n    ");
}

export function buildHead(lang: Language) {
  const c = content[lang];
  const url = pageUrl(lang);
  const other: Language = lang === "en" ? "tr" : "en";
  const image = `${SITE_URL}${c.seo.ogImage}`;
  const title = escapeAttr(c.seo.title);
  const description = escapeAttr(c.seo.description);
  const imageAlt = escapeAttr(c.seo.ogImageAlt);
  // "<" escaped so no string inside the JSON can close the <script> tag early.
  const jsonLd = JSON.stringify(buildJsonLd(lang)).replace(/</g, "\\u003c");

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="author" content="${escapeAttr(c.profile.name)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${url}" />`,
    ...languages.map((l) => `<link rel="alternate" hreflang="${l}" href="${pageUrl(l)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl("en")}" />`,
    ...Object.values(c.profile.social).map((href) => `<link rel="me" href="${href}" />`),
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${escapeAttr(c.profile.name)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="${c.seo.locale}" />`,
    `<meta property="og:locale:alternate" content="${content[other].seo.locale}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    `<meta property="profile:first_name" content="Emre" />`,
    `<meta property="profile:last_name" content="Çancıoğlu" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join("\n    ");
}

export function buildSitemap() {
  const alternates = [
    ...languages.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${pageUrl(l)}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl("en")}" />`,
  ].join("\n");
  const pages = languages.map(
    (l) => `  <url>\n    <loc>${pageUrl(l)}</loc>\n    <lastmod>${LAST_UPDATED}</lastmod>\n${alternates}\n  </url>`,
  );
  const pdfs = languages.map((l) => `  <url>\n    <loc>${SITE_URL}${content[l].profile.resumePdfUrl}</loc>\n    <lastmod>${LAST_UPDATED}</lastmod>\n  </url>`);
  const papers = publicationSlugs.map((slug) => `  <url>\n    <loc>${publicationUrl(slug)}</loc>\n    <lastmod>${LAST_UPDATED}</lastmod>\n  </url>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...pages, ...papers, ...pdfs].join("\n")}
</urlset>
`;
}

// llms.txt (https://llmstxt.org): a short, link-rich summary for AI assistants and answer engines.
export function buildLlmsTxt() {
  const c = content.en;
  return `# ${c.profile.name}

> ${c.profile.shortBio}

${c.profile.name} (also written "Emre Cancioglu") is a ${c.experience[0].title} at ${c.seo.employer} in Manisa, Türkiye, based in İzmir. ${c.highlights.map((h) => `${h.metric} ${h.label}`).join(" · ")}.

## Pages

- [Resume website (English)](${pageUrl("en")}): experience, skills, awards, publications, certifications, education
- [Özgeçmiş (Türkçe)](${pageUrl("tr")}): the same resume in Turkish
- [Full resume as plain text](${SITE_URL}/llms-full.txt): every section of the English resume in Markdown

## Publications

${publicationList.map((p) => `- [${p.titleEn ?? p.title}](${publicationUrl(p.slug)}): ${p.venue}, ${p.date.slice(0, 4)}`).join("\n")}

## Resume PDFs

- [Resume PDF (English)](${SITE_URL}${en.profile.resumePdfUrl})
- [Özgeçmiş PDF (Türkçe)](${SITE_URL}${tr.profile.resumePdfUrl})

## Profiles

- [LinkedIn](${c.profile.social.linkedin})
- [GitHub](${c.profile.social.github})
- [ORCID](${c.profile.social.orcid}): scientific publications

Last updated: ${LAST_UPDATED}
`;
}

export function buildLlmsFullTxt() {
  const c = content.en;
  const section = (title: string, body: string) => `## ${title}\n\n${body}\n`;

  return [
    `# ${c.profile.name} — Resume\n`,
    `${c.experience[0].title} · Industrial Automation · İzmir, Türkiye\n`,
    `Website: ${pageUrl("en")} (Turkish: ${pageUrl("tr")}) · Email: ${c.profile.email} · LinkedIn: ${c.profile.social.linkedin} · GitHub: ${c.profile.social.github} · ORCID: ${c.profile.social.orcid}\n`,
    `Last updated: ${LAST_UPDATED}\n`,
    section("Highlights", c.highlights.map((h) => `- ${h.metric} ${h.label}`).join("\n")),
    section("Summary", `${c.profile.shortBio}\n\n${c.profile.longBio}`),
    section(
      "Work Experience",
      c.experience.map((e) => `### ${e.title} — ${e.company}\n\n${e.date}\n\n${e.bullets.map((b) => `- ${b}`).join("\n")}`).join("\n\n"),
    ),
    section("Skills", c.skillCategories.map((cat) => `- **${cat.name}:** ${cat.skills.join(", ")}`).join("\n")),
    section("Honors & Awards", `${c.awardsNote}\n\n${c.awards.map((a) => `- ${a.date} — ${a.items.join(", ")}, ${a.title} (${a.place})`).join("\n")}`),
    section(
      "Presentations & Publications",
      publicationList.map((p) => `- ${citation(p)} — ${publicationUrl(p.slug)}`).join("\n"),
    ),
    section("Certifications", c.certifications.map((cert) => `- ${cert.title} — ${cert.issuer} (${cert.date})`).join("\n")),
    section(
      "Education",
      c.education
        .map((ed) => `### ${ed.title} — ${ed.school}\n\n${ed.date} · GPA ${ed.gpa}\n\n- Coursework: ${ed.coursework}\n- Thesis: ${ed.thesis}`)
        .join("\n\n"),
    ),
  ].join("\n");
}
