import { useMemo } from "react";
import { useContent } from "../data/useContent";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

function calculateAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function About() {
  const { profile, ui, lang } = useContent();
  const age = useMemo(() => calculateAge(profile.birthday), [profile.birthday]);
  const birthdayDisplay = useMemo(
    () => new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(profile.birthday)),
    [lang, profile.birthday],
  );

  const infoItems: { label: string; value: string; href?: string }[] = [
    { label: ui.about.fields.birthday, value: birthdayDisplay },
    { label: ui.about.fields.website, value: profile.website, href: `https://${profile.website}` },
    { label: ui.about.fields.phone, value: profile.phone, href: `tel:${profile.phone.replace(/\s+/g, "")}` },
    { label: ui.about.fields.city, value: profile.city },
    { label: ui.about.fields.age, value: String(age) },
    { label: ui.about.fields.degree, value: profile.degree },
    { label: ui.about.fields.email, value: profile.email, href: `mailto:${profile.email}` },
    { label: ui.about.fields.freelance, value: profile.freelance },
  ];

  return (
    <section id="about" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading title={ui.about.title} description={ui.about.description} />

      <div className="grid gap-10 md:grid-cols-[240px_1fr]">
        <Reveal className="mx-auto">
          <img
            src="/img/profile-img.jpg"
            alt={profile.name}
            width={224}
            height={224}
            loading="lazy"
            decoding="async"
            className="h-56 w-56 rounded-full object-cover ring-1 ring-(--color-border)"
          />
        </Reveal>

        <Reveal delay={0.1}>
          <h3 className="mb-4 font-heading text-xl font-semibold">{profile.title}</h3>
          <p className="mb-6 italic text-(--color-text-muted)">{profile.shortBio}</p>

          <div className="mb-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {infoItems.map(({ label, value, href }, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold text-(--color-text)">{label}: </span>
                {href ? (
                  <a
                    href={href}
                    className="rounded text-(--color-text-muted) underline-offset-2 hover:text-(--color-accent) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
                  >
                    {value}
                  </a>
                ) : (
                  <span className="text-(--color-text-muted)">{value}</span>
                )}
              </div>
            ))}
          </div>

          <p className="text-(--color-text-muted)">{profile.longBio}</p>
        </Reveal>
      </div>
    </section>
  );
}
