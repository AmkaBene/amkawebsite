import {useState} from 'react';
import {Menu, Moon, Sun, X} from 'lucide-react';
import type {SiteTheme} from '../App';

interface NavbarProps {
  theme: SiteTheme;
  onToggleTheme: () => void;
}

export function Navbar({theme, onToggleTheme}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    {label: 'Works', href: '#works'},
    {label: 'Friends', href: '#friends'},
    {label: 'Quiz', href: '#quiz'},
    {label: 'Photobooth', href: '#photobooth'},
    {label: 'Vault', href: '#vault'},
  ];

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 aero-glass-bar">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-4 py-3 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-[#0D1D2E] dark:text-[#ECF4FD] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0369A1] dark:focus-visible:outline-[#38BDF8]"
        >
          Amka
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#425870] dark:text-[#9EB6CF]"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#0369A1] dark:hover:border-[#38BDF8] hover:text-[#0D1D2E] dark:hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0369A1] dark:focus-visible:outline-[#38BDF8]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Theme switch icon + 1 primary action + mobile menu toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            className="inline-flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-lg aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD] shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-[#0369A1]" />
            ) : (
              <Sun className="h-4 w-4 text-[#FDE047]" />
            )}
          </button>

          <a
            href="#connect"
            className="hidden md:inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
          >
            Connect
          </a>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center rounded-lg p-2.5 min-h-[44px] min-w-[44px] aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden max-h-[calc(100dvh-64px)] overflow-y-auto border-t border-[#B8C8DA] dark:border-[#2C4766] bg-[#F7FAFD]/95 dark:bg-[#0B1929]/95 px-4 py-3">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-[#0D1D2E] dark:text-[#ECF4FD] hover:bg-[#E4ECF5] dark:hover:bg-[#16293F]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#aquarium"
              onClick={handleNavClick}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-[#0D1D2E] dark:text-[#ECF4FD] hover:bg-[#E4ECF5] dark:hover:bg-[#16293F]"
            >
              Aquarium Tank
            </a>
              <a
                href="#games"
                onClick={handleNavClick}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-[#0D1D2E] dark:text-[#ECF4FD] hover:bg-[#E4ECF5] dark:hover:bg-[#16293F]"
              >
                Y2K Arcade
              </a>
            <a
              href="#notes"
              onClick={handleNavClick}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-[#0D1D2E] dark:text-[#ECF4FD] hover:bg-[#E4ECF5] dark:hover:bg-[#16293F]"
            >
              Visitor Notes
            </a>
            <a
              href="#soundtrack"
              onClick={handleNavClick}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-[#0D1D2E] dark:text-[#ECF4FD] hover:bg-[#E4ECF5] dark:hover:bg-[#16293F]"
            >
              Soundtrack
            </a>
            <a
              href="#studio"
              onClick={handleNavClick}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-[#0D1D2E] dark:text-[#ECF4FD] hover:bg-[#E4ECF5] dark:hover:bg-[#16293F]"
            >
              Paint Pad
            </a>
            <a
              href="#connect"
              onClick={handleNavClick}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-lg px-4 text-sm font-semibold aero-btn-aqua"
            >
              Connect
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
