import type { ReactNode } from "react";
import { ArrowUpRight, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useContent } from "../data/useContent";
import { publicationPath } from "../data/publications";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { Timeline, TimelineItem } from "../components/Timeline";
import { AnimatedMetrics } from "../components/AnimatedMetrics";
import { focusRing } from "../styles/focusRing";

function ResumeTitle({ children }: { children: ReactNode }) {
  return (
    <Reveal>
      <h3 className="mb-6 border-l-4 border-(--color-accent) pl-3 font-heading text-xl font-semibold">{children}</h3>
    </Reveal>
  );
}

export function Resume() {
  const { awards, awardsNote, certifications, education, experience, publications, ui } = useContent();

  return (
    <section id="resume" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading title={ui.resume.title} description={ui.resume.description} />

      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <ResumeTitle>{ui.resume.honorsAwards}</ResumeTitle>
          <p className="mb-6 text-sm italic text-(--color-text-muted)">{awardsNote}</p>
          <Timeline>
            {awards.map((a, i) => (
              <TimelineItem key={i}>
                <h4 className="font-semibold">{a.title}</h4>
                <p className="text-sm text-(--color-accent)">{a.date}</p>
                <p className="mb-2 text-sm italic text-(--color-text-muted)">{a.place}</p>
                <ul className="space-y-1 text-sm text-(--color-text-muted)">
                  {a.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <Award size={14} className="text-(--color-accent)" /> {item}
                    </li>
                  ))}
                </ul>
              </TimelineItem>
            ))}
          </Timeline>

          <div className="mt-10">
            <ResumeTitle>{ui.resume.presentationsPublications}</ResumeTitle>
            <Timeline>
              {publications.map((p, i) => (
                <TimelineItem key={i}>
                  <Link
                    to={publicationPath(p.slug)}
                    className={`inline-flex items-center gap-1 rounded font-semibold underline decoration-(--color-accent) underline-offset-2 ${focusRing}`}
                  >
                    {p.title} <ArrowUpRight size={14} />
                  </Link>
                  <p className="text-sm text-(--color-accent)">{p.date}</p>
                  <p className="text-sm italic text-(--color-text-muted)">{p.place}</p>
                  <p className="text-sm text-(--color-text-muted)">{p.role}</p>
                  <p className="text-sm text-(--color-text-muted)">
                    <strong className="text-(--color-text)">{ui.resume.topic}: </strong>
                    {p.topic}
                  </p>
                </TimelineItem>
              ))}
            </Timeline>
          </div>

          <div className="mt-10">
            <ResumeTitle>{ui.resume.certifications}</ResumeTitle>
            <Timeline>
              {certifications.map((c, i) => (
                <TimelineItem key={i}>
                  <h4 className="font-semibold">{c.title}</h4>
                  <p className="text-sm text-(--color-accent)">{c.date}</p>
                  <p className="text-sm italic text-(--color-text-muted)">{c.issuer}</p>
                </TimelineItem>
              ))}
            </Timeline>
          </div>
        </div>

        <div>
          <ResumeTitle>{ui.resume.professionalExperience}</ResumeTitle>
          <Timeline>
            {experience.map((e, i) => (
              <TimelineItem key={i}>
                <h4 className="font-semibold">{e.title}</h4>
                <p className="text-sm text-(--color-accent)">{e.date}</p>
                <p className="mb-2 text-sm italic text-(--color-text-muted)">{e.company}</p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-(--color-text-muted)">
                  {e.bullets.map((b, j) => (
                    <li key={j}>
                      <AnimatedMetrics text={b} />
                    </li>
                  ))}
                </ul>
              </TimelineItem>
            ))}
          </Timeline>

          <div className="mt-10">
            <ResumeTitle>{ui.resume.education}</ResumeTitle>
            <Timeline>
              {education.map((ed, i) => (
                <TimelineItem key={i}>
                  <h4 className="font-semibold">{ed.title}</h4>
                  <p className="text-sm text-(--color-accent)">{ed.date}</p>
                  <p className="mb-2 text-sm italic text-(--color-text-muted)">{ed.school}</p>
                  <p className="text-sm text-(--color-text-muted)">
                    <strong className="text-(--color-text)">{ui.resume.gpa}: </strong>
                    {ed.gpa}
                  </p>
                  <p className="text-sm text-(--color-text-muted)">
                    <strong className="text-(--color-text)">{ui.resume.coursework}: </strong>
                    {ed.coursework}
                  </p>
                  <p className="text-sm text-(--color-text-muted)">
                    <strong className="text-(--color-text)">{ui.resume.thesis}: </strong>
                    {"thesisUrl" in ed ? (
                      <a
                        href={ed.thesisUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded underline decoration-(--color-accent) underline-offset-2 hover:text-(--color-accent) ${focusRing}`}
                      >
                        {ed.thesis}
                      </a>
                    ) : (
                      ed.thesis
                    )}
                  </p>
                </TimelineItem>
              ))}
            </Timeline>
          </div>
        </div>
      </div>
    </section>
  );
}
