import {useEffect, useState} from 'react';
import {
  Clock,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';

interface CityWeather {
  tempC: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
}

interface CityConfig {
  id: 'suwon' | 'ulaanbaatar';
  name: string;
  country: string;
  subtitle: string;
  timeZone: string;
  utcLabel: string;
  lat: number;
  lon: number;
}

const CITIES: CityConfig[] = [
  {
    id: 'suwon',
    name: 'Suwon',
    country: 'South Korea',
    subtitle: 'SKKU Natural Sciences Campus',
    timeZone: 'Asia/Seoul',
    utcLabel: 'KST · UTC+9',
    lat: 37.2636,
    lon: 127.0286,
  },
  {
    id: 'ulaanbaatar',
    name: 'Ulaanbaatar',
    country: 'Mongolia',
    subtitle: 'Hometown · Steppe Horizon',
    timeZone: 'Asia/Ulaanbaatar',
    utcLabel: 'ULAT · UTC+8',
    lat: 47.8864,
    lon: 106.9057,
  },
];

function describeWmoWeather(code: number | null, isDay: boolean): {
  label: string;
  tone: 'sun' | 'partly' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog' | 'night';
} {
  if (code === null) {
    return isDay
      ? {label: 'Clear Horizon Sky', tone: 'sun'}
      : {label: 'Starlit Chrome Night', tone: 'night'};
  }
  if (code === 0) {
    return isDay ? {label: 'Clear Blue Sky', tone: 'sun'} : {label: 'Clear Night Sky', tone: 'night'};
  }
  if (code === 1 || code === 2) {
    return isDay
      ? {label: 'Soft Clouds & Sun', tone: 'partly'}
      : {label: 'Partly Cloudy Night', tone: 'night'};
  }
  if (code === 3) return {label: 'Silver Overcast', tone: 'cloud'};
  if (code === 45 || code === 48) return {label: 'Misty Skyline', tone: 'fog'};
  if (code >= 51 && code <= 57) return {label: 'Light Aero Drizzle', tone: 'rain'};
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {label: 'Rainy Reflections', tone: 'rain'};
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {label: 'Crisp Snowfall', tone: 'snow'};
  }
  if (code >= 95) return {label: 'Electric Storm', tone: 'storm'};
  return isDay ? {label: 'Bright Aero Air', tone: 'partly'} : {label: 'Quiet Night Air', tone: 'night'};
}

function getCityHourMood(cityId: 'suwon' | 'ulaanbaatar', hour24: number): {
  phase: string;
  activity: string;
} {
  if (hour24 >= 6 && hour24 < 12) {
    return {
      phase: 'Morning Light',
      activity:
        cityId === 'suwon'
          ? 'Morning iced latte & algorithms class at SKKU'
          : 'Crisp steppe sunrise over Bogd Khan mountain',
    };
  }
  if (hour24 >= 12 && hour24 < 17) {
    return {
      phase: 'Afternoon Focus',
      activity:
        cityId === 'suwon'
          ? 'Campus coding sprints & sketchbook doodles'
          : 'Golden daylight across Ulaanbaatar avenues',
    };
  }
  if (hour24 >= 17 && hour24 < 21) {
    return {
      phase: 'Golden Dusk',
      activity:
        cityId === 'suwon'
          ? 'Evening stroll around Sungkyunkwan campus'
          : 'Warm sunset glow & family tea at home',
    };
  }
  return {
    phase: 'Midnight Studio',
    activity:
      cityId === 'suwon'
        ? 'Late-night TypeScript & Miku soundtrack loop'
        : 'Quiet starlit Mongolian night sky',
  };
}

function WeatherGlyph({
  tone,
  className = 'h-5 w-5',
}: {
  tone: ReturnType<typeof describeWmoWeather>['tone'];
  className?: string;
}) {
  switch (tone) {
    case 'sun':
      return <Sun className={`${className} text-[#D97706] dark:text-[#FCD34D]`} />;
    case 'partly':
      return <CloudSun className={`${className} text-[#0284C7] dark:text-[#38BDF8]`} />;
    case 'cloud':
      return <Cloud className={`${className} text-[#475569] dark:text-[#9EB6CF]`} />;
    case 'fog':
      return <CloudFog className={`${className} text-[#64748B] dark:text-[#9EB6CF]`} />;
    case 'rain':
      return <CloudRain className={`${className} text-[#0369A1] dark:text-[#38BDF8]`} />;
    case 'snow':
      return <CloudSnow className={`${className} text-[#0284C7] dark:text-[#BAE6FD]`} />;
    case 'storm':
      return <CloudLightning className={`${className} text-[#7C3AED] dark:text-[#C4B5FD]`} />;
    case 'night':
    default:
      return <Moon className={`${className} text-[#1D4ED8] dark:text-[#93C5FD]`} />;
  }
}

export function DualCityClockWidget() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [use24Hour, setUse24Hour] = useState(false);
  const [weatherByCity, setWeatherByCity] = useState<Record<'suwon' | 'ulaanbaatar', CityWeather>>({
    suwon: {tempC: null, weatherCode: null, isDay: null},
    ulaanbaatar: {tempC: null, weatherCode: null, isDay: null},
  });

  // Update live clocks every second
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch live Open-Meteo conditions (no API key required) with graceful offline fallback
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    const loadWeather = async () => {
      await Promise.all(
        CITIES.map(async (city) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,is_day&timezone=${encodeURIComponent(city.timeZone)}`;
            const res = await fetch(url, {signal: controller.signal});
            if (!res.ok) return;
            const data = (await res.json()) as {
              current?: {
                temperature_2m?: number;
                weather_code?: number;
                is_day?: number;
              };
            };
            if (data.current) {
              setWeatherByCity((prev) => ({
                ...prev,
                [city.id]: {
                  tempC:
                    typeof data.current?.temperature_2m === 'number'
                      ? Math.round(data.current.temperature_2m)
                      : null,
                  weatherCode:
                    typeof data.current?.weather_code === 'number'
                      ? data.current.weather_code
                      : null,
                  isDay:
                    typeof data.current?.is_day === 'number'
                      ? data.current.is_day === 1
                      : null,
                },
              }));
            }
          } catch {
            // Silent fallback to local time-of-day sky mood when offline
          }
        }),
      );
    };

    void loadWeather();
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <section id="dual-clock" className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-2xl aero-chrome-panel">
        {/* Top Y2K Silver Titlebar */}
        <div className="aero-silver-header flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0D1D2E] dark:text-[#ECF4FD]">
            <Clock className="h-4 w-4 text-[#0369A1] dark:text-[#38BDF8]" />
            <span>Dual Horizon · Suwon Campus &amp; Ulaanbaatar Home</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1 font-code text-[11px] text-[#425870] dark:text-[#9EB6CF] tabular-nums">
              <Sparkles className="h-3 w-3 text-[#0284C7] dark:text-[#38BDF8]" />
              Suwon is +1h ahead of Ulaanbaatar
            </span>
            <button
              type="button"
              onClick={() => setUse24Hour((prev) => !prev)}
              aria-pressed={use24Hour}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
            >
              <span className="font-code tabular-nums">{use24Hour ? '24H' : '12H'}</span>
            </button>
          </div>
        </div>

        {/* Two City Panels */}
        <div className="grid grid-cols-1 divide-y divide-[#C5D2E0] dark:divide-[#2C4766] md:grid-cols-2 md:divide-y-0 md:divide-x">
          {CITIES.map((city) => {
            const hourStr = new Intl.DateTimeFormat('en-US', {
              timeZone: city.timeZone,
              hour: 'numeric',
              hour12: false,
            }).format(now);
            const hour24 = parseInt(hourStr, 10) || 0;
            const localIsDay = hour24 >= 6 && hour24 < 19;

            const timeDisplay = new Intl.DateTimeFormat('en-US', {
              timeZone: city.timeZone,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: !use24Hour,
            }).format(now);

            const dateDisplay = new Intl.DateTimeFormat('en-US', {
              timeZone: city.timeZone,
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }).format(now);

            const weather = weatherByCity[city.id];
            const isDay = weather.isDay !== null ? weather.isDay : localIsDay;
            const desc = describeWmoWeather(weather.weatherCode, isDay);
            const mood = getCityHourMood(city.id, hour24);

            return (
              <div
                key={city.id}
                className={`relative overflow-hidden p-5 sm:p-6 transition-colors ${
                  isDay
                    ? 'bg-gradient-to-br from-[#F0F9FF]/75 via-white/75 to-[#ECFDF5]/60 dark:from-[#0E243C]/70 dark:via-[#0B1C2E]/85 dark:to-[#102A3C]/70'
                    : 'bg-gradient-to-br from-[#E2ECF7]/75 via-[#EFF5FC]/80 to-[#DCE7F5]/70 dark:from-[#081322]/90 dark:via-[#0C1D33]/90 dark:to-[#122640]/85'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg sm:text-xl font-bold text-[#0D1D2E] dark:text-[#ECF4FD]">
                        {city.name}
                      </h3>
                      <span className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
                        · {city.country}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#425870] dark:text-[#9EB6CF]">
                      {city.subtitle}
                    </p>
                  </div>

                  {/* Weather & Sky Mood Tile */}
                  <div className="flex items-center gap-2 rounded-xl border border-[#B8C9DB] dark:border-[#2C4766] bg-white/80 dark:bg-[#11253C]/85 px-3 py-1.5 shadow-sm shrink-0">
                    <WeatherGlyph tone={desc.tone} className="h-4.5 w-4.5" />
                    <div className="text-right">
                      <p className="font-code text-xs font-bold text-[#0D1D2E] dark:text-[#ECF4FD] tabular-nums">
                        {weather.tempC !== null ? `${weather.tempC}°C` : mood.phase}
                      </p>
                      <p className="text-[11px] text-[#425870] dark:text-[#9EB6CF] whitespace-nowrap">
                        {desc.label}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Clock Readout */}
                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-y border-[#D4E0EC] dark:border-[#233B57] py-3">
                  <p className="font-code text-3xl sm:text-4xl font-bold tracking-tight text-[#0D1D2E] dark:text-[#ECF4FD] tabular-nums">
                    {timeDisplay}
                  </p>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                      {dateDisplay}
                    </p>
                    <p className="font-code text-[11px] text-[#425870] dark:text-[#9EB6CF] tabular-nums">
                      {city.utcLabel}
                    </p>
                  </div>
                </div>

                {/* Local Hour Activity Note */}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[#425870] dark:text-[#9EB6CF]">
                  <CloudDrizzle className="h-3.5 w-3.5 text-[#0369A1] dark:text-[#38BDF8] shrink-0" />
                  <span>{mood.activity}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
