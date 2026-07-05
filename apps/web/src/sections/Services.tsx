import { Award, BookOpen, Cloud, Code, Cpu, Server } from "lucide-react";
import { useContent } from "../data/useContent";
import { Card } from "../components/Card";
import { RevealGroup, RevealItem } from "../components/RevealGroup";
import { SectionHeading } from "../components/SectionHeading";

const icons = { "cloud-check": Cloud, code: Code, cpu: Cpu, award: Award, book: BookOpen, server: Server };

export function Services() {
  const { services, ui } = useContent();

  return (
    <section id="services" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading title={ui.services.title} description={ui.services.description} />

      <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = icons[service.icon as keyof typeof icons];
          return (
            <RevealItem key={service.icon}>
              <Card>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-(--color-accent-soft) text-(--color-accent) transition-transform duration-300 group-hover:rotate-6">
                  <Icon size={22} />
                </div>
                <h3 className="mb-2 font-heading text-base font-semibold">{service.title}</h3>
                <p className="text-sm text-(--color-text-muted)">{service.description}</p>
              </Card>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
