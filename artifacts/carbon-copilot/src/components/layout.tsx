import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, History, Trophy, User, Leaf } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Live Radar", icon: Activity },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/history", label: "History", icon: History },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <ThemeProvider>
      {/* Skip navigation for keyboard and screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
        data-testid="skip-nav"
      >
        Skip to main content
      </a>

      <div className="flex min-h-screen w-full flex-col md:flex-row bg-background">
        {/* Desktop sidebar */}
        <aside
          className="w-full md:w-64 border-r border-border bg-card flex flex-col hidden md:flex"
          aria-label="Main navigation"
          role="navigation"
        >
          <div className="p-6 flex items-center gap-3" aria-label="Carbon Copilot">
            <div
              className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center"
              aria-hidden="true"
            >
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">Carbon Copilot</span>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1" aria-label="Site pages">
            {links.map((link) => {
              const active = location === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-current={active ? "page" : undefined}
                  data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span className="font-medium text-sm">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div
          className="md:hidden flex items-center border-b border-border bg-card p-4 overflow-x-auto gap-4"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-2 pr-4 border-r border-border" aria-hidden="true">
            <Leaf className="w-5 h-5 text-primary" />
          </div>
          {links.map((link) => {
            const active = location === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
                data-testid={`mobile-nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="font-medium text-sm">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <main
          id="main-content"
          className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto"
          tabIndex={-1}
        >
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
