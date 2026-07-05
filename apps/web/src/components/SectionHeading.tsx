import { Reveal } from "./Reveal";

export function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <h2 className="mb-3 font-heading text-3xl font-semibold text-(--color-text) sm:text-4xl">{title}</h2>
      <p className="text-(--color-text-muted)">{description}</p>
    </Reveal>
  );
}
