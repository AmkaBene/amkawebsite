import {useCallback, useEffect, useRef, useState, type PointerEvent} from 'react';
import {Download, RotateCcw, Trash2} from 'lucide-react';

type BrushStyle = 'gouache' | 'watercolor' | 'ink';

interface Swatch {
  name: string;
  hex: string;
}

const SWATCHES: Swatch[] = [
  {name: 'Sky Cerulean', hex: '#0284C7'},
  {name: 'Glacial Aqua', hex: '#38BDF8'},
  {name: 'Steppe Emerald', hex: '#059669'},
  {name: 'Twilight Rose', hex: '#BE185D'},
  {name: 'Brushed Silver', hex: '#94A3B8'},
  {name: 'Midnight Ink', hex: '#0F1F30'},
];

export function PaintStudio() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{x: number; y: number} | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  const [brushStyle, setBrushStyle] = useState<BrushStyle>('gouache');
  const [activeColor, setActiveColor] = useState<string>(SWATCHES[0].hex);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [canUndo, setCanUndo] = useState(false);

  const seedCanvas = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const w = canvas.width;
    const h = canvas.height;

    // Soft porcelain-silver studio paper backdrop
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#FBFDFF');
    bg.addColorStop(1, '#EEF5FC');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle initial watercolor sky horizon & ink brushstroke
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.ellipse(w * 0.34, h * 0.42, 160, 56, -0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.ellipse(w * 0.65, h * 0.62, 190, 48, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#0369A1';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h * 0.68);
    ctx.bezierCurveTo(w * 0.35, h * 0.52, w * 0.58, h * 0.78, w * 0.86, h * 0.44);
    ctx.stroke();
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
    }
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) return;

    seedCanvas(canvas, ctx);
    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    setCanUndo(false);
  }, [seedCanvas]);

  // Allow 64-bit Miku buddy to draw animated strokes or toss paint splatters onto the pad
  useEffect(() => {
    const pushSnapshot = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const nextHistory = [...historyRef.current, snapshot].slice(-16);
      historyRef.current = nextHistory;
      setCanUndo(nextHistory.length > 1);
    };

    const onMikuStroke = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{
          color?: string;
          size?: number;
          points?: {nx: number; ny: number}[];
        }>
      ).detail;
      const canvas = canvasRef.current;
      if (!canvas || !detail?.points || detail.points.length < 2) return;
      const ctx = canvas.getContext('2d', {willReadFrequently: true});
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.save();
      ctx.strokeStyle = detail.color || '#06B6D4';
      ctx.lineWidth = detail.size ?? 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.moveTo(detail.points[0].nx * w, detail.points[0].ny * h);
      for (let i = 1; i < detail.points.length; i++) {
        ctx.lineTo(detail.points[i].nx * w, detail.points[i].ny * h);
      }
      ctx.stroke();
      ctx.restore();
      pushSnapshot(canvas, ctx);
    };

    const onMikuSplash = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{clientX: number; clientY: number; color?: string}>
      ).detail;
      const canvas = canvasRef.current;
      if (!canvas || !detail) return;
      const rect = canvas.getBoundingClientRect();
      if (
        detail.clientX < rect.left ||
        detail.clientX > rect.right ||
        detail.clientY < rect.top ||
        detail.clientY > rect.bottom
      ) {
        return;
      }

      const ctx = canvas.getContext('2d', {willReadFrequently: true});
      if (!ctx) return;
      const cx = ((detail.clientX - rect.left) / rect.width) * canvas.width;
      const cy = ((detail.clientY - rect.top) / rect.height) * canvas.height;
      const color = detail.color || '#06B6D4';

      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.78;
      // 5-pointed star splatter where 64-bit Miku landed
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 18 : 7.5;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + 0.3;
        const dist = 20 + (i % 2) * 8;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      pushSnapshot(canvas, ctx);
    };

    window.addEventListener('amka:paint-stroke', onMikuStroke);
    window.addEventListener('amka:paint-splash', onMikuSplash);
    return () => {
      window.removeEventListener('amka:paint-stroke', onMikuStroke);
      window.removeEventListener('amka:paint-splash', onMikuSplash);
    };
  }, []);

  const getCoordinates = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return {x: 0, y: 0};
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCoordinates(e);
    lastPointRef.current = pt;

    // Draw initial dot
    ctx.save();
    ctx.fillStyle = activeColor;
    ctx.globalAlpha = brushStyle === 'watercolor' ? 0.25 : brushStyle === 'gouache' ? 0.85 : 0.95;
    const radius = brushStyle === 'ink' ? Math.max(1.2, brushSize * 0.22) : brushSize * 0.5;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx || !lastPointRef.current) return;

    const pt = getCoordinates(e);
    ctx.save();
    ctx.strokeStyle = activeColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (brushStyle === 'watercolor') {
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = brushSize * 1.45;
    } else if (brushStyle === 'gouache') {
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = brushSize;
    } else {
      ctx.globalAlpha = 0.96;
      ctx.lineWidth = Math.max(1.5, brushSize * 0.35);
    }

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = pt;
  };

  const commitStroke = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const nextHistory = [...historyRef.current, snapshot].slice(-16);
    historyRef.current = nextHistory;
    setCanUndo(nextHistory.length > 1);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length <= 1) return;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) return;

    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
    setCanUndo(historyRef.current.length > 1);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) return;

    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#FBFDFF');
    bg.addColorStop(1, '#EEF5FC');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [...historyRef.current, snapshot].slice(-16);
    setCanUndo(historyRef.current.length > 1);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'amka-aero-sketch.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const brushModes: {id: BrushStyle; label: string}[] = [
    {id: 'gouache', label: 'Gouache'},
    {id: 'watercolor', label: 'Watercolor'},
    {id: 'ink', label: 'Fine Ink'},
  ];

  return (
    <section id="studio" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#465B73] dark:text-[#9EB6CF]">
            Interactive Canvas · Paint &amp; Sketch Directly in the Browser
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0F1F30] dark:text-[#ECF4FD] sm:text-3xl">
            Aero Paint Pad
          </h2>
        </div>
        <p className="max-w-md text-sm text-[#465B73] dark:text-[#9EB6CF]">
          Built to blend painting and code—test gouache, translucent watercolor, or fineliner
          ink strokes on a silver-framed canvas and export your sketch.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl aero-chrome-panel">
        {/* Brushed Silver Toolbar Header */}
        <div className="aero-silver-header flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Brush Mode Tabs */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-[#B5C4D6] dark:border-[#365273] aero-tray p-1">
            {brushModes.map((mode) => {
              const active = brushStyle === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setBrushStyle(mode.id)}
                  className={`min-h-[42px] sm:min-h-[36px] rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1] ${
                    active
                      ? 'bg-white dark:bg-[#1E3550] text-[#0F1F30] dark:text-[#ECF4FD] shadow-sm border border-[#C5D2E0] dark:border-[#3F5F82]'
                      : 'text-[#465B73] dark:text-[#9EB6CF] hover:text-[#0F1F30] dark:hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Swatches */}
          <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Paint color swatches">
            {SWATCHES.map((swatch) => {
              const selected = activeColor === swatch.hex;
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  aria-label={`Select ${swatch.name}`}
                  title={swatch.name}
                  onClick={() => setActiveColor(swatch.hex)}
                  style={{backgroundColor: swatch.hex}}
                  className={`h-10 w-10 sm:h-8 sm:w-8 rounded-full border-2 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1] ${
                    selected
                      ? 'border-[#0F1F30] dark:border-white scale-110 shadow-sm'
                      : 'border-white dark:border-[#365273] shadow-[0_1px_3px_rgba(15,31,48,0.2)] hover:scale-105'
                  }`}
                />
              );
            })}
          </div>

          {/* Size & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex min-h-[44px] sm:min-h-0 items-center gap-2 text-xs font-medium text-[#0F1F30] dark:text-[#ECF4FD]">
              <span className="whitespace-nowrap">Size</span>
              <input
                type="range"
                min={2}
                max={28}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24 sm:w-20 accent-[#0369A1] dark:accent-[#38BDF8] cursor-pointer"
              />
              <span className="font-code w-6 text-right tabular-nums text-[#465B73] dark:text-[#9EB6CF]">
                {brushSize}
              </span>
            </label>

            <button
              type="button"
              disabled={!canUndo}
              onClick={handleUndo}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 sm:px-3 py-1.5 text-xs font-semibold aero-btn-silver disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 sm:px-3 py-1.5 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-lg px-4 sm:px-3.5 py-1.5 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save PNG</span>
            </button>
          </div>
        </div>

        {/* Drawing Surface */}
        <div className="p-3 sm:p-4 aero-well">
          <canvas
            ref={canvasRef}
            width={1120}
            height={460}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={commitStroke}
            onPointerCancel={commitStroke}
            className="w-full h-[270px] sm:h-[400px] rounded-xl border border-[#B5C4D6] dark:border-[#2C4766] bg-white cursor-crosshair touch-none shadow-[inset_0_2px_6px_rgba(15,31,48,0.06)]"
          />
        </div>
      </div>
    </section>
  );
}
