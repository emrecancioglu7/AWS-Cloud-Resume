// The only host with DNS + a TLS certificate — "www." has neither, so never use it in absolute URLs.
export const SITE_URL = "https://emrecancioglu.com";

// Shown in the footer and emitted as dateModified / sitemap <lastmod>. Bump it when the resume
// content changes (not on every deploy — it's meant to reflect the content, not the build).
export const LAST_UPDATED = "2026-09-28";
