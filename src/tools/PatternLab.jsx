import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import {
    Grid3X3, Download, Copy, Check, SlidersHorizontal, MousePointer2,
    Circle, Square, Hash, Layers, MoveDiagonal, Activity, RefreshCw
} from 'lucide-react';

// ── COLOR MATH ──────────────────────────────────────────────
const hexToHSL = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

const hslToRgb = (h, s, l) => {
    s /= 100; l /= 100;
    const k = n => ((n + h / 30) % 12);
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
};

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}).join('');

// ── Pattern Generators ───────────────────────────────────────
const generatePatternSVG = (type, size, fgColor, bgColor, stroke) => {
    const s = parseInt(size);
    const w = parseInt(stroke);
    const half = s / 2;

    const bgRect = `<rect width="100%" height="100%" fill="${bgColor}" />`;
    let content = '';

    switch (type) {
        case 'dots':
            // Circle in the middle
            content = `<circle cx="${half}" cy="${half}" r="${w}" fill="${fgColor}" />`;
            break;
        case 'grid':
            // Simple grid lines
            content = `<path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${fgColor}" stroke-width="${w}" />`;
            break;
        case 'diagonal':
            // Diagonal lines (45 deg)
            content = `
                <path d="M0,${s} l${s},-${s}" stroke="${fgColor}" stroke-width="${w}" stroke-linecap="square" />
                <path d="M${s},${s} l${s},-${s}" stroke="${fgColor}" stroke-width="${w}" stroke-linecap="square" />
                <path d="M-${s},${s} l${s},-${s}" stroke="${fgColor}" stroke-width="${w}" stroke-linecap="square" />
            `;
            break;
        case 'cross':
            // Plus signs
            content = `
                <path d="M${half},0 v${s} M0,${half} h${s}" stroke="${fgColor}" stroke-width="${w}" />
            `;
            break;
        case 'checker':
            // Checkerboard
            content = `
                <rect x="0" y="0" width="${half}" height="${half}" fill="${fgColor}" />
                <rect x="${half}" y="${half}" width="${half}" height="${half}" fill="${fgColor}" />
            `;
            break;
        case 'waves':
            // Simple wavy line
            content = `<path d="M0,${half} Q${s / 4},${half - w * 2} ${half},${half} T${s},${half}" fill="none" stroke="${fgColor}" stroke-width="${w}" />`;
            break;
        case 'honeycomb':
            // Perfect Hexagonal Tiling Logic
            // A hexagon tile that repeats seamlessly needs a 2:sqrt(3) ratio
            const r = s / 2;
            const h = r * Math.sqrt(3);
            const hexPath = `M${r},0 L${r*3},0 L${r*4},${h} L${r*3},${h*2} L${r},${h*2} L0,${h} Z`;
            
            content = `
                <path d="${hexPath}" fill="none" stroke="${fgColor}" stroke-width="${w}" />
                <path d="M${-r},${h} L0,${h} M${r*4},${h} L${r*5},${h}" fill="none" stroke="${fgColor}" stroke-width="${w}" />
            `;
            const svgHoneycomb = `<svg xmlns="http://www.w3.org/2000/svg" width="${r * 3}" height="${h * 2}">${bgRect}${content}</svg>`;
            return svgHoneycomb;
        default:
            break;
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${bgRect}${content}</svg>`;
    return svgString;
};

const PATTERNS = [
    { id: 'dots', name: 'Polka Dots', icon: Circle, defaultStroke: 4 },
    { id: 'grid', name: 'Grid', icon: Hash, defaultStroke: 1 },
    { id: 'diagonal', name: 'Diagonals', icon: MoveDiagonal, defaultStroke: 2 },
    { id: 'cross', name: 'Crosses', icon: MousePointer2, defaultStroke: 1 },
    { id: 'checker', name: 'Checker', icon: Square, defaultStroke: 1 },
    { id: 'waves', name: 'Waves', icon: Activity, defaultStroke: 2 },
    { id: 'honeycomb', name: 'Hexagon', icon: Layers, defaultStroke: 1 },
];

export function PatternLab() {
    const [patternType, setPatternType] = useState('dots');
    const [size, setSize] = useState(40);
    const [stroke, setStroke] = useState(4);
    const [rotation, setRotation] = useState(0);
    const [opacity, setOpacity] = useState(100);
    const [fgColor, setFgColor] = useState('#8b5cf6'); // Violet
    const [bgColor, setBgColor] = useState('#18181b'); // Zinc 900
    const [showFgPicker, setShowFgPicker] = useState(false);
    const [showBgPicker, setShowBgPicker] = useState(false);
    const [inputMode, setInputMode] = useState('HEX'); // HEX, RGB, HSL
    const [copied, setCopied] = useState(false);

    const fgPickerRef = useRef();
    const bgPickerRef = useRef();

    // ── Helper functions for manual inputs ───────────────────
    const getRgbFromHex = (hex) => {
        const cleanHex = hex.replace('#', '');
        return {
            r: parseInt(cleanHex.substring(0, 2), 16) || 0,
            g: parseInt(cleanHex.substring(2, 4), 16) || 0,
            b: parseInt(cleanHex.substring(4, 6), 16) || 0
        };
    };

    const handleNumInput = (val, max) => {
        let num = parseInt(val);
        if (isNaN(num)) return 0;
        return Math.max(0, Math.min(max, num));
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fgPickerRef.current && !fgPickerRef.current.contains(event.target)) setShowFgPicker(false);
            if (bgPickerRef.current && !bgPickerRef.current.contains(event.target)) setShowBgPicker(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update default stroke when changing pattern
    useEffect(() => {
        const pat = PATTERNS.find(p => p.id === patternType);
        if (pat && patternType !== 'dots') { // Keep current stroke for dots if it's radius
           setStroke(pat.defaultStroke);
        }
    }, [patternType]);

    // Generate SVG string
    const svgString = useMemo(() => {
        return generatePatternSVG(patternType, size, fgColor, bgColor, stroke);
    }, [patternType, size, fgColor, bgColor, stroke]);

    // Convert SVG to Data URI for CSS
    const dataUri = useMemo(() => {
        const encoded = encodeURIComponent(svgString)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22');
        return `data:image/svg+xml,${encoded}`;
    }, [svgString]);

    const cssCode = `background-image: url("${dataUri}");\nbackground-color: ${bgColor};\nbackground-size: ${size}px ${size}px;\nopacity: ${opacity / 100};`;

    // ── Actions ────────────────────────────────────────────────
    const randomize = () => {
        const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        setFgColor(randomHex());
        // setBgColor(randomHex()); // Keep background mostly dark/neutral for UX? Or full random?
        setPatternType(PATTERNS[Math.floor(Math.random() * PATTERNS.length)].id);
        setSize(Math.floor(Math.random() * 100) + 20);
        setRotation(Math.floor(Math.random() * 360));
    };

    const copyCSS = async () => {
        try {
            await navigator.clipboard.writeText(cssCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const downloadSVG = () => {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `pattern-${patternType}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
            
            {/* ── LEFT: Controls ── */}
            <div className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col bg-zinc-900/50 relative z-10">
                    <div className="p-4 md:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-orange-500/20 shrink-0">
                                <Grid3X3 size={18} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-white font-bold text-sm md:text-lg leading-tight truncate">Pattern Lab</h3>
                                <p className="text-zinc-500 text-[9px] md:text-xs truncate">Fondos CSS/SVG</p>
                            </div>
                        </div>
                        <button onClick={randomize} 
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-orange-400 transition-all active:rotate-180 duration-500"
                            title="Randomize">
                            <RefreshCw size={16} />
                        </button>
                    </div>

                <div className="p-5 md:p-6 flex-1 overflow-y-auto space-y-8">
                    
                    {/* Pattern Type */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={12} /> Estilo
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                            {PATTERNS.map(p => (
                                <button key={p.id} onClick={() => setPatternType(p.id)}
                                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                                        patternType === p.id 
                                        ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' 
                                        : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    }`}>
                                    <p.icon size={16} />
                                    <span className="text-[9px] font-medium">{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Colores</span>
                        
                        <div className="flex flex-col gap-4">
                            {/* FG Color */}
                            <div className="space-y-1.5" ref={fgPickerRef}>
                                <label className="text-xs text-zinc-400">Color del Patrón</label>
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowFgPicker(!showFgPicker)}
                                        className="w-full flex items-center gap-3 bg-zinc-950 border border-zinc-800 hover:border-orange-500/50 pl-2 pr-4 py-2.5 rounded-xl transition-all shadow-lg"
                                    >
                                        <div className="w-6 h-6 rounded-lg shadow-inner border border-white/10" style={{ backgroundColor: fgColor }} />
                                        <span className="text-white font-mono text-sm uppercase">{fgColor}</span>
                                    </button>

                                    {showFgPicker && (
                                        <div className="absolute top-full mt-2 left-0 z-50 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 min-w-[240px]">
                                            <HexColorPicker color={fgColor} onChange={setFgColor} />
                                            
                                            {/* Manual Input Tabs */}
                                            <div className="mt-4 pt-4 border-t border-zinc-900 flex flex-col gap-3">
                                                <div className="flex justify-between bg-black/50 p-1 rounded-lg">
                                                    {['HEX', 'RGB', 'HSL'].map(mode => (
                                                        <button key={mode} onClick={() => setInputMode(mode)}
                                                            className={`flex-1 text-[9px] font-bold px-2 py-1 rounded transition-colors ${inputMode === mode ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                                            {mode}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="h-9 flex items-center">
                                                    {inputMode === 'HEX' && (
                                                        <div className="flex-1 flex bg-black border border-zinc-800 rounded-lg overflow-hidden">
                                                            <span className="text-zinc-500 pl-3 py-1.5 text-xs">#</span>
                                                            <HexColorInput color={fgColor} onChange={setFgColor} prefixed={false}
                                                                className="bg-transparent text-white font-mono text-xs w-full outline-none py-1.5 uppercase" />
                                                        </div>
                                                    )}
                                                    {inputMode === 'RGB' && (
                                                        <div className="flex gap-1.5 w-full">
                                                            {['r', 'g', 'b'].map(channel => (
                                                                <input key={channel} type="number" value={getRgbFromHex(fgColor)[channel]}
                                                                    onChange={e => {
                                                                        const rgb = getRgbFromHex(fgColor);
                                                                        rgb[channel] = handleNumInput(e.target.value, 255);
                                                                        setFgColor(rgbToHex(rgb.r, rgb.g, rgb.b));
                                                                    }}
                                                                    className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-[10px] text-center py-1.5 outline-none focus:border-orange-500/50" />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {inputMode === 'HSL' && (
                                                        <div className="flex gap-1.5 w-full">
                                                            {['h', 's', 'l'].map((channel, i) => (
                                                                <input key={channel} type="number" value={hexToHSL(fgColor)[i]}
                                                                    onChange={e => {
                                                                        const hsl = hexToHSL(fgColor);
                                                                        hsl[i] = handleNumInput(e.target.value, i === 0 ? 360 : 100);
                                                                        const [r, g, b] = hslToRgb(hsl[0], hsl[1], hsl[2]);
                                                                        setFgColor(rgbToHex(r, g, b));
                                                                    }}
                                                                    className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-[10px] text-center py-1.5 outline-none focus:border-orange-500/50" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* BG Color */}
                            <div className="space-y-1.5" ref={bgPickerRef}>
                                <label className="text-xs text-zinc-400">Color de Fondo</label>
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowBgPicker(!showBgPicker)}
                                        className="w-full flex items-center gap-3 bg-zinc-950 border border-zinc-800 hover:border-orange-500/50 pl-2 pr-4 py-2.5 rounded-xl transition-all shadow-lg"
                                    >
                                        <div className="w-6 h-6 rounded-lg shadow-inner border border-white/10" style={{ backgroundColor: bgColor }} />
                                        <span className="text-white font-mono text-sm uppercase">{bgColor}</span>
                                    </button>

                                    {showBgPicker && (
                                        <div className="absolute top-full mt-2 left-0 z-50 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 min-w-[240px]">
                                            <HexColorPicker color={bgColor} onChange={setBgColor} />

                                            {/* Manual Input Tabs */}
                                            <div className="mt-4 pt-4 border-t border-zinc-900 flex flex-col gap-3">
                                                <div className="flex justify-between bg-black/50 p-1 rounded-lg">
                                                    {['HEX', 'RGB', 'HSL'].map(mode => (
                                                        <button key={mode} onClick={() => setInputMode(mode)}
                                                            className={`flex-1 text-[9px] font-bold px-2 py-1 rounded transition-colors ${inputMode === mode ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                                            {mode}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="h-9 flex items-center">
                                                    {inputMode === 'HEX' && (
                                                        <div className="flex-1 flex bg-black border border-zinc-800 rounded-lg overflow-hidden">
                                                            <span className="text-zinc-500 pl-3 py-1.5 text-xs">#</span>
                                                            <HexColorInput color={bgColor} onChange={setBgColor} prefixed={false}
                                                                className="bg-transparent text-white font-mono text-xs w-full outline-none py-1.5 uppercase" />
                                                        </div>
                                                    )}
                                                    {inputMode === 'RGB' && (
                                                        <div className="flex gap-1.5 w-full">
                                                            {['r', 'g', 'b'].map(channel => (
                                                                <input key={channel} type="number" value={getRgbFromHex(bgColor)[channel]}
                                                                    onChange={e => {
                                                                        const rgb = getRgbFromHex(bgColor);
                                                                        rgb[channel] = handleNumInput(e.target.value, 255);
                                                                        setBgColor(rgbToHex(rgb.r, rgb.g, rgb.b));
                                                                    }}
                                                                    className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-[10px] text-center py-1.5 outline-none focus:border-orange-500/50" />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {inputMode === 'HSL' && (
                                                        <div className="flex gap-1.5 w-full">
                                                            {['h', 's', 'l'].map((channel, i) => (
                                                                <input key={channel} type="number" value={hexToHSL(bgColor)[i]}
                                                                    onChange={e => {
                                                                        const hsl = hexToHSL(bgColor);
                                                                        hsl[i] = handleNumInput(e.target.value, i === 0 ? 360 : 100);
                                                                        const [r, g, b] = hslToRgb(hsl[0], hsl[1], hsl[2]);
                                                                        setBgColor(rgbToHex(r, g, b));
                                                                    }}
                                                                    className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-[10px] text-center py-1.5 outline-none focus:border-orange-500/50" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Geometry Controls */}
                    <div className="space-y-6">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <SlidersHorizontal size={12} /> Geometría
                        </span>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-400">Escala (Tile Size)</label>
                                <span className="text-white font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md">{size}px</span>
                            </div>
                            <input type="range" min="10" max="250" step="2" value={size}
                                onChange={e => setSize(+e.target.value)}
                                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-orange-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-400">Rotación</label>
                                <span className="text-white font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md">{rotation}°</span>
                            </div>
                            <input type="range" min="0" max="360" step="1" value={rotation}
                                onChange={e => setRotation(+e.target.value)}
                                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-orange-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-400">Opacidad del Patrón</label>
                                <span className="text-white font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md">{opacity}%</span>
                            </div>
                            <input type="range" min="0" max="100" step="1" value={opacity}
                                onChange={e => setOpacity(+e.target.value)}
                                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-orange-500" />
                        </div>

                        {patternType !== 'checker' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-zinc-400">
                                        {patternType === 'dots' ? 'Radio del Punto' : 'Grosor de Línea'}
                                    </label>
                                    <span className="text-white font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md">{stroke}px</span>
                                </div>
                                <input type="range" min="1" max={size / 2} step="1" value={stroke}
                                    onChange={e => setStroke(+e.target.value)}
                                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-orange-500" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-5 md:p-6 border-t border-zinc-800 bg-zinc-900/80 space-y-3">
                    <button onClick={copyCSS}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                            copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20'
                        }`}>
                        {copied ? <><Check size={16} /> CSS Copiado</> : <><Copy size={16} /> Copiar CSS</>}
                    </button>
                    
                    <button onClick={downloadSVG}
                        className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                        <Download size={16} /> Descargar Tile (SVG)
                    </button>
                </div>
            </div>

            {/* ── RIGHT: Preview ── */}
            <div className="flex-1 relative min-h-[400px] bg-zinc-950 overflow-hidden">
                {/* The actual repeating pattern background */}
                <div 
                    className="absolute inset-[-200%] transition-transform duration-500 ease-out"
                    style={{ 
                        backgroundImage: `url("${dataUri}")`,
                        transform: `rotate(${rotation}deg) scale(1.5)`,
                        opacity: opacity / 100,
                        backgroundColor: bgColor
                    }}
                />

                {/* Optional: Inner shadow/vignette to make it look embedded */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] bg-gradient-to-t from-black/20 to-transparent" />
            </div>

        </div>
    );
}
