// Build-time SEO output, generated from the same content files the page renders so the metadata
// can never drift from the visible resume. Used by scripts/prerender.mjs (via entry-server.tsx)
// for the production HTML/sitemap/llms.txt, and by vite.config.ts to fill the head in dev.
import * as en from "../data/content.en.ts";
import * as tr from "../data/content.tr.ts";
import { LAST_UPDATED, SITE_URL } from "../data/site.ts";

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

  const articles = c.publications.map((p) => ({
    "@type": "ScholarlyArticle",
    name: p.topic,
    author: { "@id": PERSON_ID },
    isPartOf: { "@type": "CreativeWork", name: p.title },
    ...("url" in p ? { url: p.url } : {}),
  }));

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

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...pages, ...pdfs].join("\n")}
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
      c.publications.map((p) => `- **${p.title}** (${p.place}, ${p.date}) — ${p.role}. ${p.topic}${"url" in p ? ` ${p.url}` : ""}`).join("\n"),
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
