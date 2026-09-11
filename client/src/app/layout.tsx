import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tic Tac Toe — AI & Multiplayer",
  description:
    "Play Tic Tac Toe locally with a friend, against an unbeatable Minimax AI, or online in real time. WCAG 2.1 AA accessible.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The inline script below deliberately sets the "dark" class on this
    // element before React hydrates (to avoid a flash of the wrong theme),
    // which will never match the server-rendered markup — that mismatch is
    // expected here, so it's suppressed rather than a real bug.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved/system theme before first paint, so there's no
            flash of the light theme for a returning dark-mode visitor. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var stored = localStorage.getItem('ttt:theme');
              var dark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
              if (dark) document.documentElement.classList.add('dark');
            } catch (e) {}`,
          }}
        />
      </head>
      <body className="min-h-screen">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
