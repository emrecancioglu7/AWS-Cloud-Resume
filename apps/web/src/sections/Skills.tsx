import { useContent } from "../data/useContent";
import { Card } from "../components/Card";
import { RevealGroup, RevealItem } from "../components/RevealGroup";
import { SectionHeading } from "../components/SectionHeading";

export function Skills() {
  const { skillCategories, ui } = useContent();

  return (
    <section id="skills" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading title={ui.skills.title} description={ui.skills.description} />

      <RevealGroup className="grid gap-6 sm:grid-cols-2">
        {skillCategories.map((cat, i) => (
          <RevealItem key={i}>
            <Card>
              <h3 className="mb-4 font-heading text-lg font-semibold">{cat.name}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.skills.map((skill, j) => (
                  <span
                    key={j}
                    className="rounded-full bg-(--color-surface-2) px-3 py-1 text-xs text-(--color-text-muted) transition-all duration-200 hover:scale-105 hover:bg-(--color-accent-soft) hover:text-(--color-accent)"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
