import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const MODES = [
  {
    href: "/local",
    title: "Local 2 Player",
    description: "Take turns with a friend on the same device.",
  },
  {
    href: "/ai",
    title: "Player vs AI",
    description: "Challenge a Minimax AI at easy, medium, or unbeatable difficulty.",
  },
  {
    href: "/online",
    title: "Online Multiplayer",
    description: "Create or join a room and play in real time.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-10 px-4 py-12">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Tic Tac Toe</h1>
        <ThemeToggle />
      </div>

      <p className="text-center text-[var(--text-muted)]">Choose how you&apos;d like to play.</p>

      <nav className="grid w-full gap-4 sm:grid-cols-3" aria-label="Game modes">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className="flex flex-col gap-2 rounded-xl border-2 p-6 transition-transform hover:-translate-y-1"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <span className="text-lg font-semibold">{mode.title}</span>
            <span className="text-sm text-[var(--text-muted)]">{mode.description}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
