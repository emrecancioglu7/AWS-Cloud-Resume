export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)";

// Sidebar items sit flush against the aside's edge — an outward ring would get clipped by
// the `overflow-hidden` container, so this variant draws the ring inside the element instead.
export const focusRingInset = "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)";

// For controls whose own background is already --color-accent, where an accent-colored ring
// would have no contrast against it.
export const focusRingOnAccent = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text)";
