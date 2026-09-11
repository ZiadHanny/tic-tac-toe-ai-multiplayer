interface StatusAnnouncerProps {
  message: string;
  priority?: "polite" | "assertive";
}

/**
 * The visible turn/result line doubles as the aria-live region — one
 * element, both seen and announced — rather than a hidden duplicate, so
 * there's no risk of the visible and announced text drifting apart. Turn
 * changes use "polite" (waits for a pause); a win or draw uses "assertive"
 * so it isn't missed.
 */
export default function StatusAnnouncer({ message, priority = "polite" }: StatusAnnouncerProps) {
  return (
    <p role="status" aria-live={priority} className="min-h-[1.75rem] text-center text-lg font-medium">
      {message}
    </p>
  );
}
