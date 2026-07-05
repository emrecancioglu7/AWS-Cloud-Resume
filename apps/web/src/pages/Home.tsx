import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "../sections/Hero";
import { About } from "../sections/About";
import { Skills } from "../sections/Skills";
import { Resume } from "../sections/Resume";
import { Services } from "../sections/Services";
import { Footer } from "../components/Footer";

export function Home() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Resume />
      <Services />
      <Footer />
    </>
  );
}
