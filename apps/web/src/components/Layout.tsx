import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { ScrollTopButton } from "./ScrollTopButton";
import { ScrollProgressBar } from "./ScrollProgressBar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <ScrollProgressBar />
      <Nav />
      <main className="lg:pl-20">{children}</main>
      <ScrollTopButton />
    </div>
  );
}
