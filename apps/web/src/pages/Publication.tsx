import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Footer } from "../components/Footer";
import { useContent } from "../data/useContent";
import { citation, pageRange, publicationsBySlug, type Publication as PublicationData } from "../data/publications";
import { langPath } from "../i18n/LanguageContext";
import { focusRing } from "../styles/focusRing";

function Abstract({ heading, text, lang }: { heading: string; text: string; lang: "en" | "tr" }) {
  return (
    <section className="mt-10" lang={lang}>
      <h2 className="mb-3 font-heading text-xl font-semibold">{heading}</h2>
      <p className="leading-relaxed text-(--color-text-muted)">{text}</p>
    </section>
  );
}

function venueDetails(p: PublicationData, pagesLabel: string) {
  const parts = [p.volume && `Vol. ${p.volume}`, p.issue && `No. ${p.issue}`, pageRange(p) && `${pagesLabel} ${pageRange(p)}`];
  return parts.filter(Boolean).join(" · ");
}

export function Publication() {
  const { slug = "" } = useParams();
  const { ui, lang } = useContent();
  const p = publicationsBySlug.get(slug);
  const t = ui.publication;

  useEffect(() => {
    if (!p) return;
    window.scrollTo(0, 0);
    const previous = document.title;
    document.title = `${p.titleEn ?? p.title} | Emre Çancıoğlu`;
    return () => {
      document.title = previous;
    };
  }, [p]);

  if (!p) return <Navigate to="/" replace />;

  const abstracts: { heading: string; text: string; lang: "en" | "tr" }[] = [];
  if (p.abstractEn) abstracts.push({ heading: t.abstractEn, text: p.abstractEn, lang: "en" });
  if (p.abstractTr) abstracts.push({ heading: t.abstractTr, text: p.abstractTr, lang: "tr" });
  // Show the abstract in the visitor's language first when both exist.
  if (lang === "tr") abstracts.reverse();

  const details = venueDetails(p, t.pages);

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-24">
        <Link
          to={{ pathname: langPath(lang), hash: "#resume" }}
          className={`mb-10 inline-flex items-center gap-2 rounded text-sm text-(--color-text-muted) hover:text-(--color-accent) ${focusRing}`}
        >
          <ArrowLeft size={16} /> {t.backToResume}
        </Link>

        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--color-accent)">
          {t.kinds[p.kind]} · {p.date.slice(0, 4)}
        </p>
        <h1 lang={p.language} className="font-heading text-3xl font-bold leading-tight text-(--color-text) sm:text-4xl">
          {p.title}
        </h1>
        {p.titleEn && (
          <p lang="en" className="mt-3 text-lg italic text-(--color-text-muted)">
            {p.titleEn}
          </p>
        )}

        <dl className="mt-8 grid gap-4 border-y border-(--color-border) py-6 text-sm sm:grid-cols-[9rem_1fr]">
          <dt className="font-semibold">{t.authors}</dt>
          <dd className="text-(--color-text-muted)">
            {p.authors.map((a, i) => (
              <span key={a.name}>
                {a.orcid ? (
                  <a
                    href={`https://orcid.org/${a.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded underline-offset-2 hover:text-(--color-accent) hover:underline ${a.self ? "font-semibold text-(--color-text)" : ""} ${focusRing}`}
                  >
                    {a.name}
                  </a>
                ) : (
                  <span className={a.self ? "font-semibold text-(--color-text)" : ""}>{a.name}</span>
                )}
                {i < p.authors.length - 1 && ", "}
              </span>
            ))}
          </dd>

          <dt className="font-semibold">{t.publishedIn}</dt>
          <dd className="text-(--color-text-muted)">
            <span className="text-(--color-text)">{p.venue}</span>
            {details && <span className="block">{details}</span>}
            {p.venueNote && <span className="block">{p.venueNote}</span>}
            <span className="block">
              {p.displayDate} · {p.place}
            </span>
            {(p.publisher || p.isbn) && <span className="block">{[p.publisher, p.isbn && `ISBN ${p.isbn}`].filter(Boolean).join(" · ")}</span>}
          </dd>

          {p.doi && (
            <>
              <dt className="font-semibold">{t.doi}</dt>
              <dd>
                <a
                  href={`https://doi.org/${p.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded text-(--color-accent) underline underline-offset-2 ${focusRing}`}
                >
                  {p.doi}
                </a>
              </dd>
            </>
          )}

          {p.license && (
            <>
              <dt className="font-semibold">{t.license}</dt>
              <dd className="text-(--color-text-muted)">{p.license}</dd>
            </>
          )}
        </dl>

        {p.url ? (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-8 inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-(--color-bg) transition-opacity hover:opacity-90 ${focusRing}`}
          >
            {t.readPaper} <ExternalLink size={16} />
            <span className="sr-only"> — {p.urlLabel}</span>
          </a>
        ) : (
          <p className="mt-8 text-sm italic text-(--color-text-muted)">{t.noOnlineCopy}</p>
        )}
        {p.url && p.urlLabel && <p className="mt-2 text-xs text-(--color-text-muted)">{p.urlLabel}</p>}

        {abstracts.map((a) => (
          <Abstract key={a.lang} {...a} />
        ))}

        <section className="mt-10">
          <h2 className="mb-3 font-heading text-xl font-semibold">{t.keywords}</h2>
          <ul className="flex flex-wrap gap-2">
            {p.keywords.map((k) => (
              <li key={k} className="rounded-full border border-(--color-border) px-3 py-1 text-sm text-(--color-text-muted)">
                {k}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 font-heading text-xl font-semibold">{t.cite}</h2>
          <p className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-sm leading-relaxed text-(--color-text-muted)">
            {citation(p)}
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
