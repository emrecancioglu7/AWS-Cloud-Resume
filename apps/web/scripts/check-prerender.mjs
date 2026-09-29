// Sanity checks on the prerendered HTML, run by prerender.mjs before anything is written. Crawlers
// and link-preview bots only ever see this HTML, and it can break silently while the site still
// looks fine in a browser (which re-renders it with JavaScript) — so a failure here stops the build.

// Deliberately loose: it guards against an empty or broken render, not against a shorter resume.
export const MIN_TEXT_CHARS = 5000;

export function visibleText(html) {
  const root = html.split('<div id="root">')[1] ?? "";
  return root
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");
}

function attr(html, pattern) {
  return html.match(pattern)?.[1];
}

// facts: pageFacts(lang) or publicationFacts(slug) from src/seo/site.ts. Optional fields:
// requiredMeta (meta names that must be present), minTextChars (overrides MIN_TEXT_CHARS),
// resumePdfUrl (a link that must be present). Returns a list of problems (empty = OK).
export function checkPrerenderedPage(html, facts) {
  const problems = [];
  const text = visibleText(html);

  if (attr(html, /<html lang="([^"]+)"/) !== facts.lang) problems.push(`<html lang> is not "${facts.lang}"`);
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push("missing <title>");
  if (!/<meta name="description" content="[^"]+"/.test(html)) problems.push("missing meta description");
  if (attr(html, /<link rel="canonical" href="([^"]+)"/) !== facts.url) problems.push(`canonical is not ${facts.url}`);
  for (const href of facts.alternates) {
    if (!html.includes(`" href="${href}" />`) || !html.includes("hreflang=")) problems.push(`missing hreflang alternate ${href}`);
  }
  if (facts.alternates.length > 0 && !html.includes('hreflang="x-default"')) problems.push("missing hreflang x-default");
  for (const name of facts.requiredMeta ?? []) {
    if (!new RegExp(`<meta name="${name}" content="[^"]+"`).test(html)) problems.push(`missing <meta name="${name}">`);
  }
  if (!/<meta property="og:image" content="https:\/\/[^"]+"/.test(html)) problems.push("missing absolute og:image");

  const jsonLd = attr(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!jsonLd) {
    problems.push("missing JSON-LD");
  } else {
    try {
      const types = (JSON.parse(jsonLd)["@graph"] ?? []).map((node) => node["@type"]);
      const parsed = JSON.parse(jsonLd);
      const nodeTypes = parsed["@graph"] ? types : [parsed["@type"]];
      const expected = facts.requiredMeta ? ["ScholarlyArticle"] : ["ProfilePage", "Person"];
      for (const type of expected) if (!nodeTypes.includes(type)) problems.push(`JSON-LD has no ${type}`);
    } catch (e) {
      problems.push(`JSON-LD is not valid JSON (${e.message})`);
    }
  }

  const minChars = facts.minTextChars ?? MIN_TEXT_CHARS;
  if (text.length < minChars) problems.push(`only ${text.length} characters of text (expected at least ${minChars}) — did the render come out empty?`);
  for (const needle of facts.requiredText) if (!text.includes(needle)) problems.push(`resume text is missing "${needle}"`);
  if (facts.resumePdfUrl && !html.includes(`href="${facts.resumePdfUrl}"`)) problems.push(`no link to ${facts.resumePdfUrl}`);

  // Count-up animations start at 0 in the browser; the server render must show the real value.
  const zeroMetric = text.match(/(?<![\d.,])0(?:[.,]0+)?(?:%|\+|x|K)(?![\w])|(?<![\w])%0(?![\d]|[.,]\d)/);
  if (zeroMetric) problems.push(`a metric rendered as "${zeroMetric[0]}" — an animated number isn't showing its real value server-side`);

  if (html.includes("www.emrecancioglu.com")) problems.push('contains "www.emrecancioglu.com", which has no DNS record');

  return problems;
}
