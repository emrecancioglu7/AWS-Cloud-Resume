import { useRef, type MouseEvent } from "react";
import { FileText } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { GithubIcon, LinkedinIcon } from "../components/BrandIcons";
import { useContent } from "../data/useContent";
import { useTypedRotator } from "../hooks/useTypedRotator";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { RevealGroup, RevealItem } from "../components/RevealGroup";
import { Magnetic } from "../components/Magnetic";

const linkClass =
  "flex h-11 w-11 items-center justify-center rounded-full border border-(--color-border) text-(--color-text) transition-all duration-200 hover:border-(--color-accent) hover:text-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)";

export function Hero() {
  const { profile, ui } = useContent();
  const typed = useTypedRotator(profile.roles);
  const showVideo = useMediaQuery("(min-width: 640px)");
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const videoOpacity = useTransform(scrollYProgress, [0, 1], [1, prefersReducedMotion ? 1 : 0.15]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, prefersReducedMotion ? 1 : 1.2]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 80]);

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    if (prefersReducedMotion || !spotlightRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    spotlightRef.current.style.setProperty("--spot-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    spotlightRef.current.style.setProperty("--spot-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <section
      ref={sectionRef}
      id="hero"
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--color-bg)"
    >
      {showVideo && (
        <motion.video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: videoOpacity, scale: videoScale }}
        >
          <source src="/vid/video.mp4" type="video/mp4" />
        </motion.video>
      )}
      <div className="absolute inset-0 bg-(--color-bg)/80" />
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(500px circle at var(--spot-x, 50%) var(--spot-y, 40%), var(--color-accent-soft), transparent 70%)" }}
      />

      <motion.div style={{ y: contentY }} className="relative z-10 px-6 text-center">
        <RevealGroup>
          <RevealItem>
            <h1 className="mb-4 font-heading text-4xl font-bold text-(--color-text) sm:text-6xl">{profile.name}</h1>
          </RevealItem>
          <RevealItem>
            <p className="mb-8 text-xl text-(--color-text-muted) sm:text-2xl">
              {ui.hero.imA} <span className="text-(--color-accent)">{typed}</span>
              {!prefersReducedMotion && <span className="animate-pulse text-(--color-accent)">|</span>}
            </p>
          </RevealItem>
          <RevealItem className="flex items-center justify-center gap-4">
            <Magnetic>
              <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={linkClass}>
                <LinkedinIcon size={18} />
              </a>
            </Magnetic>
            <Magnetic>
              <a href={profile.social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={linkClass}>
                <GithubIcon size={18} />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={profile.resumePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center gap-2 rounded-full border border-(--color-border) px-5 text-sm font-medium text-(--color-text) transition-all duration-200 hover:border-(--color-accent) hover:text-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
              >
                <FileText size={16} /> {ui.hero.resumeButton}
              </a>
            </Magnetic>
          </RevealItem>
        </RevealGroup>
      </motion.div>
    </section>
  );
}
