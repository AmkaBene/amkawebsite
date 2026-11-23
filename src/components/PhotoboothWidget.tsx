import {useCallback, useEffect, useRef, useState, type ChangeEvent} from 'react';
import {Camera, Download, RotateCcw, StopCircle, Upload} from 'lucide-react';

type BoothMode = 'four-cut' | 'single';
type BoothFilter =
  | 'y2k-silver'
  | 'frutiger-aqua'
  | 'digicam-2006'
  | 'duotone-script'
  | 'bw-film'
  | 'soft-dream'
  | 'midnight-crt'
  | 'natural';

const FILTER_OPTIONS: {id: BoothFilter; label: string; cssFilter: string}[] = [
  {id: 'y2k-silver', label: 'Y2K Silver', cssFilter: 'contrast(1.12) saturate(0.75) brightness(1.06)'},
  {id: 'frutiger-aqua', label: 'Frutiger Aqua', cssFilter: 'saturate(1.22) hue-rotate(-8deg) brightness(1.05)'},
  {id: 'digicam-2006', label: '2006 Digicam', cssFilter: 'contrast(1.18) saturate(1.18) brightness(1.08) sepia(0.12)'},
  {id: 'duotone-script', label: 'Cyan & Coral', cssFilter: 'contrast(1.28) saturate(1.35) hue-rotate(15deg)'},
  {id: 'bw-film', label: 'B&W Film', cssFilter: 'grayscale(1) contrast(1.25) brightness(1.04)'},
  {id: 'soft-dream', label: 'Soft Dream', cssFilter: 'brightness(1.1) contrast(0.94) saturate(1.16) sepia(0.08)'},
  {id: 'midnight-crt', label: 'Midnight CRT', cssFilter: 'hue-rotate(105deg) saturate(1.25) contrast(1.2) brightness(0.96)'},
  {id: 'natural', label: 'Natural', cssFilter: 'none'},
];

function paintFilterOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  filter: BoothFilter,
) {
  if (filter === 'y2k-silver') {
    ctx.fillStyle = 'rgba(203, 224, 246, 0.14)';
    ctx.fillRect(x, y, w, h);
  } else if (filter === 'frutiger-aqua') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  } else if (filter === 'digicam-2006') {
    const vig = ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      w * 0.25,
      x + w / 2,
      y + h / 2,
      w * 0.72,
    );
    vig.addColorStop(0, 'rgba(255, 250, 230, 0.14)');
    vig.addColorStop(1, 'rgba(15, 23, 42, 0.26)');
    ctx.fillStyle = vig;
    ctx.fillRect(x, y, w, h);
  } else if (filter === 'duotone-script') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
    grad.addColorStop(0.55, 'rgba(163, 230, 53, 0.16)');
    grad.addColorStop(1, 'rgba(249, 115, 22, 0.16)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  } else if (filter === 'bw-film') {
    const vig = ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      w * 0.3,
      x + w / 2,
      y + h / 2,
      w * 0.75,
    );
    vig.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    vig.addColorStop(1, 'rgba(10, 15, 24, 0.24)');
    ctx.fillStyle = vig;
    ctx.fillRect(x, y, w, h);
  } else if (filter === 'soft-dream') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, 'rgba(244, 180, 212, 0.18)');
    grad.addColorStop(1, 'rgba(186, 230, 253, 0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  } else if (filter === 'midnight-crt') {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(5, 20, 15, 0.16)';
    for (let sy = y; sy < y + h; sy += 6) {
      ctx.fillRect(x, sy, w, 2);
    }
  }
}

function drawFivePointChromeStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  rotationRad = 0,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);

  const grad = ctx.createLinearGradient(-outerR, -outerR, outerR, outerR);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.45, '#E2E8F0');
  grad.addColorStop(1, '#7D92A8');

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? outerR : innerR;
    const px = Math.cos(angle) * rad;
    const py = Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#5D748B';
  ctx.lineWidth = 1.1;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Tiny specular dot in the center
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-outerR * 0.12, -outerR * 0.12, Math.max(1.2, outerR * 0.16), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function PhotoboothWidget() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stripCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mode, setMode] = useState<BoothMode>('four-cut');
  const [filter, setFilter] = useState<BoothFilter>('y2k-silver');
  // Store unfiltered raw captures so users can switch filters freely before OR after shooting
  const [frames, setFrames] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturingSequence, setIsCapturingSequence] = useState(false);

  const requiredFrames = mode === 'four-cut' ? 4 : 1;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. You can upload a photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'user', width: {ideal: 1280}, height: {ideal: 960}},
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError(
        'Camera permission was declined or no webcam was found. Use Upload Photo to make a strip anytime.',
      );
    }
  };

  const captureSingleFrameDataUrl = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const w = 640;
    const h = 480;
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    ctx.save();
    // Mirror selfie horizontally so it matches preview (raw unfiltered capture)
    ctx.translate(w, 0);
    ctx.scale(-1, 1);

    const vw = video.videoWidth || w;
    const vh = video.videoHeight || h;
    const scale = Math.max(w / vw, h / vh);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    ctx.restore();

    return offscreen.toDataURL('image/png');
  }, []);

  const handleSnapNow = () => {
    if (!cameraActive || isCapturingSequence) return;
    const dataUrl = captureSingleFrameDataUrl();
    if (!dataUrl) return;
    setFrames((prev) => {
      const next = prev.length >= requiredFrames ? [dataUrl] : [...prev, dataUrl];
      return next;
    });
  };

  const handleTimedSession = () => {
    if (!cameraActive || isCapturingSequence) return;
    setIsCapturingSequence(true);
    setFrames([]);

    const totalShots = requiredFrames;
    let currentShot = 0;

    const runCountdownForShot = () => {
      let tick = 3;
      setCountdown(tick);
      const timer = window.setInterval(() => {
        tick -= 1;
        if (tick > 0) {
          setCountdown(tick);
        } else {
          window.clearInterval(timer);
          setCountdown(null);
          const shot = captureSingleFrameDataUrl();
          if (shot) {
            setFrames((prev) => [...prev, shot]);
          }
          currentShot += 1;
          if (currentShot < totalShots) {
            window.setTimeout(runCountdownForShot, 450);
          } else {
            setIsCapturingSequence(false);
          }
        }
      }, 850);
    };

    runCountdownForShot();
  };

  const handleUploadPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files)
      .slice(0, requiredFrames)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== 'string') return;
          const img = new Image();
          img.onload = () => {
            const w = 640;
            const h = 480;
            const offscreen = document.createElement('canvas');
            offscreen.width = w;
            offscreen.height = h;
            const ctx = offscreen.getContext('2d');
            if (!ctx) return;
            const scale = Math.max(w / img.width, h / img.height);
            const sw = w / scale;
            const sh = h / scale;
            const sx = (img.width - sw) / 2;
            const sy = (img.height - sh) / 2;
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
            const url = offscreen.toDataURL('image/png');
            setFrames((prev) => [...prev, url].slice(-requiredFrames));
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    e.target.value = '';
  };

  // Render final downloadable photobooth strip / single frame onto stripCanvasRef with live filter & 5-pointed stars
  useEffect(() => {
    let cancelled = false;
    const canvas = stripCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isFourCut = mode === 'four-cut';
    const slotW = 360;
    const slotH = 270;
    const pad = 26;
    const gap = 16;
    const footerH = 82;

    canvas.width = slotW + pad * 2;
    canvas.height = isFourCut
      ? pad * 2 + slotH * 4 + gap * 3 + footerH
      : pad * 2 + slotH + footerH;

    const activeFilterCss = FILTER_OPTIONS.find((f) => f.id === filter)?.cssFilter ?? 'none';

    const drawFrameDecorations = () => {
      // Cute 5-pointed silver chrome stars decorating the outer Y2K silver strip frame
      drawFivePointChromeStar(ctx, 18, 18, 9.5, 4.2, -0.22);
      drawFivePointChromeStar(ctx, canvas.width - 18, 18, 9.5, 4.2, 0.24);
      drawFivePointChromeStar(ctx, 14, canvas.height * 0.42, 7.5, 3.3, 0.15);
      drawFivePointChromeStar(ctx, canvas.width - 14, canvas.height * 0.56, 7.5, 3.3, -0.18);

      // Stars flanking the bottom strip stamp
      const footerY = canvas.height - footerH + 30;
      drawFivePointChromeStar(ctx, 38, footerY + 6, 10, 4.4, -0.18);
      drawFivePointChromeStar(ctx, 56, footerY - 8, 5.5, 2.4, 0.2);
      drawFivePointChromeStar(ctx, canvas.width - 38, footerY + 6, 10, 4.4, 0.18);
      drawFivePointChromeStar(ctx, canvas.width - 56, footerY - 8, 5.5, 2.4, -0.2);
    };

    const drawBaseStrip = () => {
      // Brushed Y2K Silver Photobooth Strip Backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.5, '#E8F1FA');
      bgGrad.addColorStop(1, '#D2E0EE');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#9FB4CA';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

      const slotCount = isFourCut ? 4 : 1;
      for (let i = 0; i < slotCount; i++) {
        const y = pad + i * (slotH + gap);
        ctx.fillStyle = '#F3F8FD';
        ctx.fillRect(pad, y, slotW, slotH);
        ctx.strokeStyle = '#B8C9DB';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pad, y, slotW, slotH);

        if (!frames[i]) {
          ctx.fillStyle = '#647990';
          ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Frame 0${i + 1}`, pad + slotW / 2, y + slotH / 2 + 4);
        }
      }

      // Photobooth Strip Footer Stamp
      const footerY = canvas.height - footerH + 30;
      ctx.fillStyle = '#0D1D2E';
      ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AMKA STUDIO · PHOTOBOOTH', canvas.width / 2, footerY);

      ctx.fillStyle = '#0369A1';
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillText('SKKU SUWON · Y2K SILVER EDITION', canvas.width / 2, footerY + 22);

      drawFrameDecorations();
    };

    drawBaseStrip();

    const slotCount = isFourCut ? 4 : 1;
    for (let i = 0; i < slotCount; i++) {
      const frameUrl = frames[i];
      if (!frameUrl) continue;
      const y = pad + i * (slotH + gap);
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        ctx.save();
        ctx.filter = activeFilterCss;
        ctx.drawImage(img, pad, y, slotW, slotH);
        ctx.restore();

        paintFilterOverlay(ctx, pad, y, slotW, slotH, filter);

        // Crisp photo frame border + cute corner 5-point star accent on each slot
        ctx.strokeStyle = '#9FB4CA';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pad, y, slotW, slotH);
        drawFivePointChromeStar(ctx, pad + slotW - 14, y + 14, 7, 3.1, 0.2);
      };
      img.src = frameUrl;
    }

    return () => {
      cancelled = true;
    };
  }, [frames, mode, filter]);

  const handleDownloadStrip = () => {
    const canvas = stripCanvasRef.current;
    if (!canvas || frames.length === 0) return;
    const link = document.createElement('a');
    link.download = mode === 'four-cut' ? 'amka-4cut-photobooth.png' : 'amka-photobooth.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const activeCssFilter = FILTER_OPTIONS.find((f) => f.id === filter)?.cssFilter ?? 'none';

  return (
    <section id="photobooth" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
            Interactive Camera Booth · 4-Cut Strip &amp; Digi-Cam Single Shot
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0D1D2E] dark:text-[#ECF4FD] sm:text-3xl">
            Y2K Silver Photobooth
          </h2>
        </div>
        <p className="max-w-md text-sm text-[#425870] dark:text-[#9EB6CF]">
          Take your own 4-cut strip or single digicam photo—swap filters before or after shooting,
          then save your star-framed strip as a PNG.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left: Live Camera / Capture Console */}
        <div className="lg:col-span-8 overflow-hidden rounded-2xl aero-chrome-panel">
          {/* Top Chrome Toolbar */}
          <div className="aero-silver-header flex flex-col gap-3 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Mode Switcher */}
              <div className="inline-flex items-center gap-1 rounded-xl border border-[#B5C4D6] dark:border-[#2C4766] bg-[#E3ECF5] aero-tray p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('four-cut');
                    setFrames([]);
                  }}
                  className={`min-h-[42px] sm:min-h-[36px] rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
                    mode === 'four-cut'
                      ? 'bg-white dark:bg-[#1E3550] text-[#0D1D2E] dark:text-[#ECF4FD] shadow-sm border border-[#C5D2E0] dark:border-[#3F5F82]'
                      : 'text-[#425870] dark:text-[#9EB6CF] hover:text-[#0D1D2E] dark:hover:text-[#ECF4FD]'
                  }`}
                >
                  4-Cut Strip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('single');
                    setFrames((prev) => prev.slice(0, 1));
                  }}
                  className={`min-h-[42px] sm:min-h-[36px] rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
                    mode === 'single'
                      ? 'bg-white dark:bg-[#1E3550] text-[#0D1D2E] dark:text-[#ECF4FD] shadow-sm border border-[#C5D2E0] dark:border-[#3F5F82]'
                      : 'text-[#425870] dark:text-[#9EB6CF] hover:text-[#0D1D2E] dark:hover:text-[#ECF4FD]'
                  }`}
                >
                  Single Shot
                </button>
              </div>

              <span className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
                Switch filters anytime—even after photos are taken
              </span>
            </div>

            {/* Expanded Filter Bar (live on camera AND applied retroactively to finished strip) */}
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Photobooth color filter">
              {FILTER_OPTIONS.map((opt) => {
                const active = filter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilter(opt.id)}
                    className={`min-h-[42px] sm:min-h-[34px] rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
                      active ? 'aero-btn-aqua' : 'aero-btn-silver'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera Viewport */}
          <div className="p-4 sm:p-5 bg-[#E4ECF5] aero-well">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#AEBFD2] dark:border-[#365273] bg-[#0D1D2E]">
              <video
                ref={videoRef}
                playsInline
                muted
                style={{filter: activeCssFilter, transform: 'scaleX(-1)'}}
                className={`h-full w-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {!cameraActive && (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#DCEAF7] via-[#EEF5FC] to-[#D4ECE3] dark:from-[#0C1E33] dark:via-[#112740] dark:to-[#0A2524] p-6 text-center">
                  <Camera className="h-10 w-10 text-[#0369A1] dark:text-[#38BDF8]" />
                  <p className="mt-3 font-display text-lg font-bold text-[#0D1D2E] dark:text-[#ECF4FD]">
                    Ready to Capture Your Strip
                  </p>
                  <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#425870] dark:text-[#9EB6CF]">
                    {cameraError ||
                      'Turn on your camera for live 3-second countdown poses, or upload photos from your device.'}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Start Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold aero-btn-silver whitespace-nowrap shrink-0"
                    >
                      <Upload className="h-4 w-4 text-[#0369A1] dark:text-[#38BDF8]" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0B1726]/35 backdrop-blur-[2px]">
                  <span className="font-display text-7xl font-bold text-white drop-shadow-lg tabular-nums">
                    {countdown}
                  </span>
                </div>
              )}
            </div>

            {/* Active Camera Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {cameraActive && (
                  <>
                    <button
                      type="button"
                      disabled={isCapturingSequence}
                      onClick={handleTimedSession}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold aero-btn-aqua disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      <Camera className="h-4 w-4" />
                      <span>
                        {isCapturingSequence
                          ? 'Taking Shots...'
                          : mode === 'four-cut'
                            ? 'Auto 4-Cut Timer'
                            : '3s Timer Shot'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isCapturingSequence}
                      onClick={handleSnapNow}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold aero-btn-silver disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      <span className="tabular-nums">Snap Frame ({frames.length}/{requiredFrames})</span>
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
                    >
                      <StopCircle className="h-4 w-4 text-[#BE185D] dark:text-[#FB7185]" />
                      <span>Stop Camera</span>
                    </button>
                  </>
                )}

                {cameraActive && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
                  >
                    <Upload className="h-4 w-4 text-[#0369A1] dark:text-[#38BDF8]" />
                    <span>Add Upload</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={frames.length === 0 || isCapturingSequence}
                  onClick={() => setFrames([])}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold aero-btn-silver disabled:opacity-45 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retake</span>
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={mode === 'four-cut'}
              onChange={handleUploadPhoto}
              className="hidden"
            />
          </div>
        </div>

        {/* Right: Live Photobooth Strip Preview & Download + Post-Capture Filter Picker */}
        <div className="lg:col-span-4 overflow-hidden rounded-2xl aero-chrome-panel">
          <div className="aero-silver-header flex items-center justify-between px-5 py-3">
            <span className="text-xs font-semibold text-[#0D1D2E] dark:text-[#ECF4FD] tabular-nums">
              Strip Preview ({frames.length}/{requiredFrames})
            </span>
            <button
              type="button"
              disabled={frames.length === 0}
              onClick={handleDownloadStrip}
              className="inline-flex min-h-[42px] sm:min-h-[34px] items-center gap-1.5 rounded-lg px-3.5 sm:px-3 py-1 text-xs font-semibold aero-btn-aqua disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save PNG</span>
            </button>
          </div>

          <div className="flex flex-col items-center bg-[#DCE7F3] aero-well p-4 sm:p-5 gap-4">
            <canvas
              ref={stripCanvasRef}
              aria-label="Rendered photobooth strip preview"
              className="max-h-[440px] sm:max-h-[540px] w-auto max-w-full rounded-lg shadow-md"
            />

            {/* Quick Strip Filter Switcher directly underneath finished preview */}
            {frames.length > 0 && (
              <div className="w-full rounded-xl border border-[#B5C4D6] dark:border-[#365273] aero-tray p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#425870] dark:text-[#9EB6CF]">
                  Change Strip Filter
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FILTER_OPTIONS.map((opt) => {
                    const active = filter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFilter(opt.id)}
                        className={`min-h-[44px] sm:min-h-[34px] rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          active ? 'aero-btn-aqua' : 'aero-btn-silver'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
