import { useEffect, useState } from "react";
import { GithubIcon, LinkedinIcon } from "./BrandIcons";
import { useContent } from "../data/useContent";
import { fetchVisitorCount } from "../lib/visitorCounter";
import { focusRing } from "../styles/focusRing";

export function Footer() {
  const { profile, ui } = useContent();
  const [views, setViews] = useState<string>("");

  useEffect(() => {
    fetchVisitorCount()
      .then((count) => setViews(`${ui.footer.viewsPrefix}: ${count}`))
      .catch(() => setViews(ui.footer.viewsError));
  }, [ui.footer.viewsPrefix, ui.footer.viewsError]);

  return (
    <footer className="border-t border-(--color-border) bg-(--color-surface) py-12 text-center">
      <h3 className="font-heading text-lg font-semibold">{profile.name}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm italic text-(--color-text-muted)">"{profile.quote}"</p>

      <div className="mt-4 flex justify-center gap-4">
        <a
          href={profile.social.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-text-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent) ${focusRing}`}
        >
          <LinkedinIcon size={16} />
        </a>
        <a
          href={profile.social.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-text-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent) ${focusRing}`}
        >
          <GithubIcon size={16} />
        </a>
      </div>

      <p className="mt-6 text-xs text-(--color-text-muted)">{views}</p>
      <p className="mt-1 text-xs text-(--color-text-muted)">{ui.footer.copyright}</p>
      <p className="mt-1 text-xs text-(--color-text-muted)">
        {ui.footer.designedBy}{" "}
        <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-(--color-accent) hover:underline">
          {profile.name}
        </a>{" "}
        | {ui.footer.hostedOn}
      </p>
    </footer>
  );
}
