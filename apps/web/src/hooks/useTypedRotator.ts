import { useEffect, useState } from "react";

const TYPE_SPEED = 60;
const DELETE_SPEED = 30;
const HOLD_MS = 1500;

export function useTypedRotator(items: readonly string[]) {
  const [text, setText] = useState("");
  const [itemIndex, setItemIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = items[itemIndex];
    let timeout: number;

    if (!deleting && text === current) {
      timeout = window.setTimeout(() => setDeleting(true), HOLD_MS);
    } else if (deleting && text === "") {
      setDeleting(false);
      setItemIndex((i) => (i + 1) % items.length);
    } else {
      const next = deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1);
      timeout = window.setTimeout(() => setText(next), deleting ? DELETE_SPEED : TYPE_SPEED);
    }

    return () => window.clearTimeout(timeout);
  }, [text, deleting, itemIndex, items]);

  return text;
}
