import type { FC, PropsWithChildren } from "hono/jsx";
import { getAlert } from "../lib/alerts";
import type { User } from "../middleware/auth";

type LayoutProps = PropsWithChildren<{
  user?: User | null;
  notice?: string;
  alert?: string;
}>;

export const Layout: FC<LayoutProps> = ({
  children,
  user,
  notice,
  alert: alertCode,
}) => {
  const alert = getAlert(alertCode);
  return (
    <html lang="en">
      <head>
        <title>Needle</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
      </head>

      <body class="bg-parchment min-h-screen font-body text-ink flex flex-col">
        {/* Decorative top border */}
        <div class="bg-burgundy-dark py-1">
          <div class="max-w-4xl mx-auto flex justify-center">
            <span class="text-gold text-xs tracking-[0.3em] uppercase">
              Est. MMXXVI
            </span>
          </div>
        </div>

        <nav class="bg-burgundy border-b-4 border-gold">
          <div class="max-w-4xl mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
              <a class="group" href="/">
                <h1 class="font-display text-2xl text-gold tracking-wider group-hover:text-gold-light transition-colors">
                  NEEDLE
                </h1>
                <p class="text-parchment/70 text-xs tracking-widest uppercase -mt-1">
                  Threads Feed Manufactory
                </p>
              </a>
              {user ? (
                <div class="flex items-center gap-6">
                  <a
                    class="text-gold hover:text-gold-light text-sm tracking-wide uppercase"
                    href="/feeds"
                  >
                    Thy Feeds
                  </a>
                  <form method="post" action="/logout">
                    <button
                      class="text-parchment/70 hover:text-parchment text-sm tracking-wide uppercase"
                      type="submit"
                    >
                      Depart
                    </button>
                  </form>
                </div>
              ) : (
                <div class="flex items-center gap-6">
                  <a
                    class="text-gold hover:text-gold-light text-sm tracking-wide uppercase"
                    href="/login"
                  >
                    Enter
                  </a>
                  <a
                    class="text-parchment/70 hover:text-parchment text-sm tracking-wide uppercase"
                    href="/signup"
                  >
                    Register
                  </a>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Ornamental divider */}
        <div class="flex justify-center py-4 bg-parchment">
          <div class="flex items-center gap-4 text-aged">
            <span class="text-2xl">&#10022;</span>
            <div class="w-24 h-px bg-aged" />
            <span class="text-3xl">&#10048;</span>
            <div class="w-24 h-px bg-aged" />
            <span class="text-2xl">&#10022;</span>
          </div>
        </div>

        <main class="max-w-4xl mx-auto px-6 py-8 flex-1 w-full">
          {notice && (
            <div class="bg-sepia/50 border-2 border-gold text-aged px-6 py-4 mb-6 text-center italic">
              <span class="text-gold mr-2">&#10038;</span>
              {notice}
              <span class="text-gold ml-2">&#10038;</span>
            </div>
          )}
          {alert && (
            <div class="bg-burgundy/10 border-2 border-burgundy text-burgundy-dark px-6 py-4 mb-6 text-center italic">
              {alert}
            </div>
          )}

          {/* Content frame */}
          <div class="border-4 border-double border-aged/30 p-8 bg-white/50">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer class="mt-auto bg-burgundy-dark py-8">
          <div class="max-w-4xl mx-auto px-6 text-center">
            <div class="flex justify-center mb-4">
              <div class="flex items-center gap-3 text-gold/60">
                <div class="w-16 h-px bg-gold/40" />
                <span class="text-xl">&#10053;</span>
                <div class="w-16 h-px bg-gold/40" />
              </div>
            </div>
            <p class="text-parchment/60 text-sm italic">
              "The Finest Threads, Delivered to Thy Reader"
            </p>
            <p class="text-parchment/40 text-xs mt-2 tracking-widest uppercase">
              Needle Feed Manufactory &mdash; Quality Assured
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
};
