import {useCallback, useEffect, useRef, useState} from 'react';
import {
  ArrowUpRight,
  Disc3,
  ListMusic,
  Loader2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {ARTIST_ROTATION} from '../data/profileData';
import type {SiteTheme} from '../App';
import {SecretCollectible} from './SecretCollectible';

interface PreviewLookup {
  status: 'idle' | 'loading' | 'ready' | 'unavailable';
  previewUrl?: string;
  artworkUrl?: string;
  itunesUrl?: string;
}

interface ItunesSearchResult {
  artistName?: string;
  trackName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  trackViewUrl?: string;
}

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function MusicRotation({theme = 'light'}: {theme?: SiteTheme}) {
  const [selectedArtistIdx, setSelectedArtistIdx] = useState(0);
  const [selectedSongByArtist, setSelectedSongByArtist] = useState<Record<string, number>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [playbackMode, setPlaybackMode] = useState<'real' | 'chord'>('real');
  const [previewCache, setPreviewCache] = useState<Record<string, PreviewLookup>>({});
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('amka_music_autonext');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [autoPlay, setAutoPlay] = useState<boolean>(() => {
    try {
      return localStorage.getItem('amka_music_autoplay') === 'true';
    } catch {
      return false;
    }
  });
  const [waitingAutoplayGesture, setWaitingAutoplayGesture] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const autoplayTriggeredRef = useRef(false);

  const currentArtist = ARTIST_ROTATION[selectedArtistIdx];
  const songIdx = selectedSongByArtist[currentArtist.id] ?? 0;
  const currentSong = currentArtist.songs[songIdx] ?? currentArtist.songs[0];
  const cacheKey = `${currentArtist.id}::${currentSong.title}`;
  const currentLookup = previewCache[cacheKey] ?? {status: 'idle'};

  // Cleanup Web Audio fallback context on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Fetch real 30-second song audio & cover art via iTunes Search API
  const fetchSongPreview = useCallback(
    async (artistName: string, songTitle: string, key: string): Promise<PreviewLookup> => {
      setPreviewCache((prev) => ({
        ...prev,
        [key]: {...prev[key], status: 'loading'},
      }));

      try {
        const cleanArtist = artistName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cleanTitle = songTitle.replace(/\(.*?\)/g, '').trim();
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
          `${cleanArtist} ${cleanTitle}`,
        )}&media=music&entity=song&limit=8`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {results?: ItunesSearchResult[]};
        const results = data.results ?? [];

        const artistLower = cleanArtist.toLowerCase();
        const titleLower = cleanTitle.toLowerCase();

        const bestMatch =
          results.find(
            (r) =>
              r.previewUrl &&
              r.artistName?.toLowerCase().includes(artistLower.split(' ')[0]) &&
              r.trackName?.toLowerCase().includes(titleLower.split(' ')[0]),
          ) ||
          results.find(
            (r) =>
              r.previewUrl &&
              r.artistName?.toLowerCase().includes(artistLower.split(' ')[0]),
          ) ||
          results.find((r) => Boolean(r.previewUrl));

        if (bestMatch?.previewUrl) {
          const entry: PreviewLookup = {
            status: 'ready',
            previewUrl: bestMatch.previewUrl,
            artworkUrl: bestMatch.artworkUrl100?.replace('100x100bb', '240x240bb'),
            itunesUrl: bestMatch.trackViewUrl,
          };
          setPreviewCache((prev) => ({...prev, [key]: entry}));
          return entry;
        }

        const unavailable: PreviewLookup = {status: 'unavailable'};
        setPreviewCache((prev) => ({...prev, [key]: unavailable}));
        return unavailable;
      } catch {
        const unavailable: PreviewLookup = {status: 'unavailable'};
        setPreviewCache((prev) => ({...prev, [key]: unavailable}));
        return unavailable;
      }
    },
    [],
  );

  // Pre-fetch artwork & official audio preview when the active song changes
  useEffect(() => {
    if (currentLookup.status === 'idle') {
      void fetchSongPreview(currentArtist.artist, currentSong.title, cacheKey);
    }
  }, [cacheKey, currentArtist.artist, currentSong.title, currentLookup.status, fetchSongPreview]);

  // Sync volume & mute to <audio> and fallback Web Audio gain
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = muted ? 0 : volume;
      audio.muted = muted;
    }
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        muted ? 0 : volume * 0.22,
        audioCtxRef.current.currentTime,
        0.04,
      );
    }
  }, [volume, muted]);

  // Handle real <audio> playback whenever song or play state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(0);

    if (!isPlaying) {
      audio.pause();
      return;
    }

    if (currentLookup.status === 'ready' && currentLookup.previewUrl) {
      setPlaybackMode('real');
      if (audio.src !== currentLookup.previewUrl) {
        audio.src = currentLookup.previewUrl;
        audio.load();
      }
      audio.volume = muted ? 0 : volume;
      audio.muted = muted;
      audio.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setWaitingAutoplayGesture(true);
          return;
        }
        setPlaybackMode('chord');
      });
    } else if (currentLookup.status === 'loading' || currentLookup.status === 'idle') {
      audio.pause();
    } else if (currentLookup.status === 'unavailable') {
      audio.pause();
      setPlaybackMode('chord');
    }
  }, [cacheKey, isPlaying, currentLookup.status, currentLookup.previewUrl, muted, volume]);

  // Soft, in-key ambient electric-piano fallback ONLY when official preview stream is offline
  useEffect(() => {
    if (!isPlaying || playbackMode !== 'chord') return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!gainNodeRef.current) {
      const masterGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
      masterGain.gain.value = muted ? 0 : volume * 0.22;
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;
    }

    const playChordBeat = (beat: number) => {
      if (!audioCtxRef.current || !gainNodeRef.current) return;
      const now = ctx.currentTime;
      const bassFreq = currentSong.bassNotes[beat % currentSong.bassNotes.length];
      const leadFreq = currentSong.melodyNotes[beat % currentSong.melodyNotes.length];
      const fifthFreq = bassFreq * 1.5;

      [bassFreq, fifthFreq, leadFreq].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const peak = idx === 0 ? 0.14 : idx === 1 ? 0.06 : 0.08;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(peak, now + 0.06);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

        osc.connect(noteGain);
        noteGain.connect(gainNodeRef.current!);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    };

    let beat = 0;
    playChordBeat(beat);
    const beatMs = Math.max(460, Math.round((60 / currentSong.bpm) * 1000));
    const timer = window.setInterval(() => {
      beat = (beat + 1) % currentSong.bassNotes.length;
      playChordBeat(beat);
    }, beatMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackMode, currentSong, muted, volume]);

  // Harmonic spectrum canvas visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frameId = 0;
    let phase = 0;

    const renderWave = () => {
      const w = canvas.width;
      const h = canvas.height;
      const isDark = theme === 'dark';
      ctx.clearRect(0, 0, w, h);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (isDark) {
        bgGrad.addColorStop(0, '#091829');
        bgGrad.addColorStop(1, '#10263F');
      } else {
        bgGrad.addColorStop(0, '#F5FAFF');
        bgGrad.addColorStop(1, '#D7E5F3');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const barCount = 28;
      const gap = 4;
      const barWidth = (w - gap * (barCount + 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        const amplitude = isPlaying
          ? (Math.sin(phase * 2.4 + i * 0.52) * 0.34 +
              Math.cos(phase * 1.6 - i * 0.31) * 0.24 +
              0.44) *
            (h * 0.68)
          : (Math.sin(i * 0.45 + selectedArtistIdx + songIdx) * 0.14 + 0.22) * (h * 0.5);

        const barH = Math.max(6, amplitude);
        const x = gap + i * (barWidth + gap);
        const y = h - barH - 8;

        const barGrad = ctx.createLinearGradient(0, y, 0, h - 8);
        barGrad.addColorStop(0, currentArtist.swatchHex);
        barGrad.addColorStop(1, isDark ? '#38BDF8' : '#93C5FD');

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 3);
        ctx.fill();
      }
    };

    renderWave();
    if (isPlaying && !prefersReduced) {
      const tick = () => {
        phase += 0.05;
        renderWave();
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, selectedArtistIdx, songIdx, currentArtist, theme]);

  const advanceSong = useCallback(
    (step: 1 | -1, forcePlay?: boolean) => {
      const songsCount = currentArtist.songs.length;
      const nextSongIdx = songIdx + step;

      if (nextSongIdx >= 0 && nextSongIdx < songsCount) {
        setSelectedSongByArtist((prev) => ({...prev, [currentArtist.id]: nextSongIdx}));
      } else {
        const nextArtistIdx =
          (selectedArtistIdx + step + ARTIST_ROTATION.length) % ARTIST_ROTATION.length;
        const targetArtist = ARTIST_ROTATION[nextArtistIdx];
        const targetSongIdx = step > 0 ? 0 : Math.max(0, targetArtist.songs.length - 1);
        setSelectedArtistIdx(nextArtistIdx);
        setSelectedSongByArtist((prev) => ({...prev, [targetArtist.id]: targetSongIdx}));
      }
      setCurrentTime(0);
      if (forcePlay) {
        setIsPlaying(true);
      }
    },
    [currentArtist.id, currentArtist.songs.length, selectedArtistIdx, songIdx],
  );

  // Persist Auto-Play and Auto-Next preferences
  useEffect(() => {
    try {
      localStorage.setItem('amka_music_autonext', String(autoNext));
    } catch {
      // ignore
    }
  }, [autoNext]);

  useEffect(() => {
    try {
      localStorage.setItem('amka_music_autoplay', String(autoPlay));
    } catch {
      // ignore
    }
  }, [autoPlay]);

  // Trigger Auto-Play once when enabled & lookup is ready
  useEffect(() => {
    if (!autoPlay || autoplayTriggeredRef.current) return;
    if (currentLookup.status === 'ready' || currentLookup.status === 'unavailable') {
      autoplayTriggeredRef.current = true;
      setIsPlaying(true);
    }
  }, [autoPlay, currentLookup.status]);

  // Unlock browser-blocked Auto-Play on very first user gesture
  useEffect(() => {
    if (!waitingAutoplayGesture || !isPlaying) return;
    const unlock = () => {
      setWaitingAutoplayGesture(false);
      const audio = audioRef.current;
      if (audio && currentLookup.status === 'ready' && currentLookup.previewUrl) {
        audio.play().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', unlock, {once: true});
    window.addEventListener('keydown', unlock, {once: true});
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [waitingAutoplayGesture, isPlaying, currentLookup.status, currentLookup.previewUrl]);

  // Broadcast live music state to interactive Miku buddy & auto-advance fallback chord mode after 30s
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('amka:music-state', {
        detail: {
          isPlaying,
          artist: currentArtist.artist,
          song: currentSong.title,
        },
      }),
    );
  }, [isPlaying, currentArtist.artist, currentSong.title]);

  useEffect(() => {
    if (!isPlaying || playbackMode !== 'chord' || !autoNext) return;
    const timer = window.setTimeout(() => {
      advanceSong(1, true);
    }, 30000);
    return () => window.clearTimeout(timer);
  }, [isPlaying, playbackMode, autoNext, advanceSong, cacheKey]);

  const handleTogglePlay = useCallback(async () => {
    setWaitingAutoplayGesture(false);
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (currentLookup.status === 'idle') {
      await fetchSongPreview(currentArtist.artist, currentSong.title, cacheKey);
    }
    setIsPlaying(true);
  }, [cacheKey, currentArtist.artist, currentLookup.status, currentSong.title, fetchSongPreview, isPlaying]);

  // Listen for control requests from the 64-bit Miku buddy
  useEffect(() => {
    const onMusicControl = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{action: 'toggle' | 'play' | 'pause' | 'next' | 'prev' | 'miku'}>
      ).detail;
      if (!detail) return;
      setWaitingAutoplayGesture(false);
      if (detail.action === 'toggle') {
        void handleTogglePlay();
      } else if (detail.action === 'play') {
        setIsPlaying(true);
      } else if (detail.action === 'pause') {
        setIsPlaying(false);
      } else if (detail.action === 'next') {
        advanceSong(1, true);
      } else if (detail.action === 'prev') {
        advanceSong(-1, true);
      } else if (detail.action === 'miku') {
        const mikuIdx = ARTIST_ROTATION.findIndex((a) => a.id === 'hatsune-miku');
        if (mikuIdx >= 0) {
          setSelectedArtistIdx(mikuIdx);
        }
        setIsPlaying(true);
      }
    };
    window.addEventListener('amka:music-control', onMusicControl);
    return () => window.removeEventListener('amka:music-control', onMusicControl);
  }, [advanceSong, handleTogglePlay]);

  const handleSelectSong = (artistId: string, idx: number) => {
    setSelectedSongByArtist((prev) => ({...prev, [artistId]: idx}));
    setCurrentTime(0);
  };

  const handlePrev = () => {
    advanceSong(-1);
  };

  const handleNext = () => {
    advanceSong(1);
  };

  const handleSeek = (nextTime: number) => {
    const audio = audioRef.current;
    if (!audio || playbackMode !== 'real') return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const spotifyQueryUrl = `https://open.spotify.com/search/${encodeURIComponent(
    `${currentArtist.artist} ${currentSong.title}`,
  )}`;
  const youtubeQueryUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${currentArtist.artist} ${currentSong.title}`,
  )}`;

  return (
    <section id="soundtrack" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration || 30);
          }
        }}
        onEnded={() => {
          setCurrentTime(0);
          if (autoNext) {
            advanceSong(1, true);
          } else {
            setIsPlaying(false);
          }
        }}
        onError={() => {
          if (isPlaying) setPlaybackMode('chord');
        }}
      />

      <div className="mb-8">
        <p className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
          Heavy Rotation · {ARTIST_ROTATION.length} Favorite Artists &amp; Official Audio Previews
        </p>
        <div className="mt-2 flex items-center gap-2.5">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0D1D2E] dark:text-[#ECF4FD] sm:text-3xl">
            Silver Audio Deck &amp; Favorite Artists
          </h2>
          <SecretCollectible eggId="secret-leek" variant="leek" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Brushed Silver Y2K Player Console */}
        <div className="lg:col-span-5 flex flex-col overflow-hidden rounded-2xl aero-chrome-panel">
          <div className="aero-silver-header flex items-center justify-between gap-2 px-4 sm:px-5 py-3">
            <span className="text-xs font-semibold text-[#0D1D2E] dark:text-[#ECF4FD] truncate">
              Silver Deck · Official Track Preview
            </span>
            <span className="font-code text-xs text-[#425870] dark:text-[#9EB6CF] tabular-nums shrink-0">
              {currentSong.bpm} BPM · {currentSong.musicalKey}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
            <div>
              {/* Harmonic Visualizer Screen */}
              <div className="overflow-hidden rounded-xl border border-[#AEBFD2] dark:border-[#2C4766] shadow-[inset_0_2px_6px_rgba(13,29,46,0.08)]">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={112}
                  aria-label="Harmonic audio spectrum visualizer"
                  className="h-24 sm:h-28 w-full block"
                />
              </div>

              {/* Active Artist, Cover Art & Song */}
              <div className="mt-5 flex items-start gap-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl p-1 aero-silver-frame">
                  <div className="h-full w-full overflow-hidden rounded-lg aero-silver-mat bg-gradient-to-br from-[#DCE8F5] to-[#BFD7ED] dark:from-[#12263C] dark:to-[#0A1829] flex items-center justify-center">
                    {currentLookup.artworkUrl ? (
                      <img
                        src={currentLookup.artworkUrl}
                        alt={`${currentSong.title} single artwork`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Disc3
                        className={`h-7 w-7 text-[#0369A1] dark:text-[#38BDF8] ${
                          isPlaying ? 'animate-aero-disc' : ''
                        }`}
                      />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF] truncate">
                    {currentSong.album} ({currentSong.year})
                  </p>
                  <h3 className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-[#0D1D2E] dark:text-[#ECF4FD]">
                    {currentArtist.artist}
                  </h3>
                  <p className="mt-0.5 font-editorial text-lg sm:text-xl italic text-[#0369A1] dark:text-[#38BDF8] truncate">
                    “{currentSong.title}”
                  </p>
                </div>
              </div>

              {/* Switch between 3 verified tracks per artist */}
              <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Select track">
                {currentArtist.songs.map((song, idx) => {
                  const active = idx === songIdx;
                  return (
                    <button
                      key={song.title}
                      type="button"
                      onClick={() => handleSelectSong(currentArtist.id, idx)}
                      className={`min-h-[42px] sm:min-h-[34px] rounded-lg px-3 sm:px-2.5 py-2 sm:py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#0369A1] text-white'
                          : 'bg-[#E5EEF7] dark:bg-[#16293F] text-[#425870] dark:text-[#9EB6CF] hover:text-[#0D1D2E] dark:hover:text-white'
                      }`}
                    >
                      {song.title}
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#425870] dark:text-[#9EB6CF]">
                {currentArtist.note}
              </p>
            </div>

            {/* Playback & Direct Listen Controls */}
            <div className="mt-6 pt-5 border-t border-[#D7E2EE] dark:border-[#2C4766]">
              {/* Real Scrub Bar when streaming official preview */}
              {playbackMode === 'real' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between font-code text-[11px] text-[#425870] dark:text-[#9EB6CF] tabular-nums mb-1">
                    <span>{formatSeconds(currentTime)}</span>
                    <span>{formatSeconds(duration)} · 30s Preview</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Track playback position"
                    min={0}
                    max={duration || 30}
                    step={0.1}
                    value={Math.min(currentTime, duration || 30)}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="w-full accent-[#0369A1] dark:accent-[#38BDF8] cursor-pointer"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous song"
                    title="Previous song"
                    onClick={handlePrev}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD]"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    aria-label={isPlaying ? 'Pause song preview' : 'Play song preview'}
                    onClick={() => void handleTogglePlay()}
                    className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
                  >
                    {currentLookup.status === 'loading' && isPlaying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Play Track</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    aria-label="Next song"
                    title="Next song"
                    onClick={handleNext}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD]"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                    onClick={() => setMuted((prev) => !prev)}
                    className="inline-flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-[#425870] dark:text-[#9EB6CF] hover:text-[#0D1D2E] dark:hover:text-white"
                  >
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    aria-label="Audio volume"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      setMuted(false);
                      setVolume(parseFloat(e.target.value));
                    }}
                    className="w-24 sm:w-20 accent-[#0369A1] dark:accent-[#38BDF8] cursor-pointer"
                  />
                </div>
              </div>

              {/* Continuous Queue Controls: Auto-Play & Auto-Next Song */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-pressed={autoPlay}
                  onClick={() => {
                    const next = !autoPlay;
                    setAutoPlay(next);
                    if (next && !isPlaying) {
                      setIsPlaying(true);
                    }
                  }}
                  className={`inline-flex min-h-[42px] sm:min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    autoPlay ? 'aero-btn-aqua' : 'aero-btn-silver'
                  }`}
                >
                  <ListMusic className="h-3.5 w-3.5" />
                  <span>Auto-Play: {autoPlay ? 'On' : 'Off'}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={autoNext}
                  onClick={() => setAutoNext((prev) => !prev)}
                  className={`inline-flex min-h-[42px] sm:min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    autoNext ? 'aero-btn-aqua' : 'aero-btn-silver'
                  }`}
                >
                  <Repeat className="h-3.5 w-3.5" />
                  <span>Auto-Next Song: {autoNext ? 'On' : 'Off'}</span>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[#425870] dark:text-[#9EB6CF]">
                  {waitingAutoplayGesture
                    ? 'Tap anywhere or press Play to start Auto-Play'
                    : isPlaying
                      ? playbackMode === 'real'
                        ? autoNext
                          ? 'Playing preview · Auto-advancing to next song'
                          : 'Playing official 30s studio audio preview'
                        : 'Preview stream unavailable — playing soft chord loop'
                      : 'Listen to the real preview or open full song:'}
                </span>

                <div className="flex items-center gap-3">
                  <a
                    href={spotifyQueryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] sm:min-h-0 items-center gap-1 font-semibold text-[#0369A1] dark:text-[#38BDF8] hover:underline"
                  >
                    <span>Spotify</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={youtubeQueryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] sm:min-h-0 items-center gap-1 font-semibold text-[#0369A1] dark:text-[#38BDF8] hover:underline"
                  >
                    <span>YouTube</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Clean 7-Artist Index List */}
        <div className="lg:col-span-7 overflow-hidden rounded-2xl aero-chrome-panel divide-y divide-[#D7E2EE] dark:divide-[#2C4766]">
          {ARTIST_ROTATION.map((item, idx) => {
            const isSelected = idx === selectedArtistIdx;
            const activeSong = item.songs[selectedSongByArtist[item.id] ?? 0] ?? item.songs[0];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedArtistIdx(idx)}
                className={`w-full px-4 py-4 sm:px-6 text-left transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0369A1] ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#E0F2FE]/85 via-[#F0F8FF] to-transparent dark:from-[#0EA5E9]/20 dark:via-[#162C46]/75 dark:to-transparent'
                    : 'hover:bg-[#F1F6FB] dark:hover:bg-[#14273E]/60'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                  <span
                    className="mt-1 font-code text-xs font-medium text-[#425870] dark:text-[#9EB6CF] tabular-nums shrink-0"
                    aria-hidden="true"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <span className="font-display text-base font-bold text-[#0D1D2E] dark:text-[#ECF4FD]">
                        {item.artist}
                      </span>
                      <span className="text-xs text-[#425870] dark:text-[#9EB6CF]">·</span>
                      <span className="font-editorial text-base italic text-[#0369A1] dark:text-[#38BDF8]">
                        {activeSong.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#425870] dark:text-[#9EB6CF]">
                      {item.mood} · {activeSong.album}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-7 sm:pl-0 shrink-0">
                  <span className="font-code text-xs text-[#425870] dark:text-[#9EB6CF] tabular-nums">
                    {activeSong.bpm} BPM
                  </span>
                  <span className="text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                    {isSelected ? (isPlaying ? 'Playing' : 'Selected') : 'Select'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
