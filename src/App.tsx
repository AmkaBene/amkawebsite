import {useEffect, useState} from 'react';
import {AeroAtmosphere} from './components/AeroAtmosphere';
import {Navbar} from './components/Navbar';
import {HeroSection} from './components/HeroSection';
import {Y2kCursor} from './components/Y2kCursor';
import {FishAquariumWidget} from './components/FishAquariumWidget';
import {GamesArcadeSection} from './components/GamesArcadeSection';
import {WorksGallery} from './components/WorksGallery';
import {FriendsOcSection} from './components/FriendsOcSection';
import {HanbokOutingSection} from './components/HanbokOutingSection';
import {TunkhelOutingSection} from './components/TunkhelOutingSection';
import {PhotoboothWidget} from './components/PhotoboothWidget';
import {MusicRotation} from './components/MusicRotation';
import {PaintStudio} from './components/PaintStudio';
import {AmkaQuizSection} from './components/AmkaQuizSection';
import {VaultSection} from './components/VaultSection';
import {AboutConnect} from './components/AboutConnect';
import {MikuBuddy} from './components/MikuBuddy';
import {DualCityClockWidget} from './components/DualCityClockWidget';
import {AeroStartDock} from './components/AeroStartDock';
import {EasterEggToastAndFireworks} from './components/EasterEggToastAndFireworks';
import {getGoldenAeroEnabled} from './utils/secrets';

export type SiteTheme = 'light' | 'dark';

function MarqueeDivider({phrase}: {phrase: string}) {
  return (
    <div
      aria-hidden="true"
      className="my-4 overflow-hidden border-y border-[#B9C9DA] dark:border-[#2C4766] bg-gradient-to-r from-[#EBF3FA] via-[#FAFDFF] to-[#EBF3FA] dark:from-[#091829] dark:via-[#12263C] dark:to-[#091829] py-3"
    >
      <div className="animate-aero-marquee font-editorial text-lg italic tracking-wide text-[#425870] dark:text-[#9EB6CF]">
        <span className="pr-2">{phrase}</span>
        <span className="pr-2">{phrase}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<SiteTheme>(() => {
    try {
      return localStorage.getItem('amka_site_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('amka_site_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('golden-aero', getGoldenAeroEnabled());
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <AeroAtmosphere />
      <Y2kCursor />
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main className="relative z-10 flex-1">
        <HeroSection />
        <DualCityClockWidget />
        <MarqueeDivider phrase="digital illustration · skku suwon computer science · y2k silver · frutiger aero · ulaanbaatar to suwon · " />
        <FishAquariumWidget />
        <GamesArcadeSection theme={theme} />
        <WorksGallery />
        <PhotoboothWidget />
        <MusicRotation theme={theme} />
        <PaintStudio />

        {/* Dedicated Friends & Memories Space — separated cleanly from Art & Code Studio */}
        <div id="friends" className="pt-4">
          <MarqueeDivider phrase="friends & memories · skku suwon hanbok oct 28 · selenge tunkhel aug 17 · no, i’m not a human oc dossier · " />
          <FriendsOcSection />
          <HanbokOutingSection />
          <TunkhelOutingSection />
        </div>

        <AmkaQuizSection />
        <VaultSection />
        <MarqueeDivider phrase="amka · sungkyunkwan university suwon · frutiger aero & midnight chrome · github AmkaBene · instagram amintsag_erentgeen · " />
      </main>
      <div className="relative z-10">
        <AboutConnect />
      </div>
      <AeroStartDock theme={theme} onToggleTheme={toggleTheme} />
      <EasterEggToastAndFireworks />
      <MikuBuddy />
    </div>
  );
}
