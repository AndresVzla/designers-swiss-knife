import React, { useState, useEffect, useRef } from 'react';
import { Copy, RefreshCw, Check, Palette, Download } from 'lucide-react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

// --- MATEMÁTICAS DE COLOR ---

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
    s /= 100;
    l /= 100;
    const k = n => ((n + h / 30) % 12);
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
};

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}).join('');

const rgbToCmyk = (r, g, b) => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, m, y);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);
    return { c, m, y, k };
};

const cmykToRgb = (c, m, y, k) => {
    let r = 255 * (1 - c/100) * (1 - k/100);
    let g = 255 * (1 - m/100) * (1 - k/100);
    let b = 255 * (1 - y/100) * (1 - k/100);
    return [Math.round(r), Math.round(g), Math.round(b)];
};

const createColorObj = (h, s, l) => {
    h = Math.round(h % 360);
    if (h < 0) h += 360;
    s = Math.round(Math.min(100, Math.max(0, s)));
    l = Math.round(Math.min(100, Math.max(0, l)));
    
    const [r, g, b] = hslToRgb(h, s, l);
    const hex = rgbToHex(r, g, b);
    const { c, m, y, k } = rgbToCmyk(r, g, b);
    
    return {
        hex: hex.toUpperCase(),
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${h}, ${s}%, ${l}%)`,
        cmyk: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`
    };
};

// --- COMPONENTES UI ---

const ColorBlock = ({ color }) => {
    const [copiedFormat, setCopiedFormat] = useState(null);

    const copyText = (format, text) => {
        navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 1500);
    };

    const CopyButton = ({ format, value }) => (
        <button 
            onClick={() => copyText(format, value)}
            className="bg-black/50 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white font-mono text-[10px] sm:text-xs shadow-lg flex items-center justify-between gap-2 min-w-[140px] transition-colors border border-white/10 hover:border-indigo-400 group/btn"
        >
            <span className="text-zinc-400 font-bold group-hover/btn:text-white transition-colors">{format}</span>
            <span className="font-bold truncate max-w-[90px] text-right">{copiedFormat === format ? '¡Copiado!' : value}</span>
        </button>
    );

    return (
        <div 
            className="group/color flex-1 flex flex-col items-center justify-center pb-0 transition-all duration-300 hover:flex-[1.5]"
            style={{ backgroundColor: color.hex }}
        >
            <div className="flex flex-col gap-1.5 opacity-0 group-hover/color:opacity-100 transition-all transform scale-95 group-hover/color:scale-100 duration-200">
                <CopyButton format="HEX" value={color.hex} />
                <CopyButton format="RGB" value={color.rgb} />
                <CopyButton format="HSL" value={color.hsl} />
                <CopyButton format="CMYK" value={color.cmyk} />
            </div>
        </div>
    );
};

export const ColorPaletteEngine = () => {
    const [baseColor, setBaseColor] = useState('#6366f1');
    const [harmonyType, setHarmonyType] = useState('monochromatic');
    const [palette, setPalette] = useState([]);
    const [copiedImage, setCopiedImage] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [inputMode, setInputMode] = useState('HEX'); // HEX, RGB, HSL, CMYK
    
    const pickerRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const harmonies = [
        { id: 'monochromatic', label: 'Monocromática' },
        { id: 'analogous', label: 'Análoga' },
        { id: 'complementary', label: 'Complementaria' },
        { id: 'triadic', label: 'Triádica' }
    ];

    const generateRandomBase = () => {
        const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        setBaseColor(randomHex);
    };

    // Estados derivados para los inputs manuales
    const getRgbFromHex = (hex) => {
        const cleanHex = hex.replace('#', '');
        return {
            r: parseInt(cleanHex.substring(0, 2), 16) || 0,
            g: parseInt(cleanHex.substring(2, 4), 16) || 0,
            b: parseInt(cleanHex.substring(4, 6), 16) || 0
        };
    };
    
    const currentRgb = getRgbFromHex(baseColor);
    const currentHslArr = hexToHSL(baseColor);
    const currentHsl = { h: currentHslArr[0], s: currentHslArr[1], l: currentHslArr[2] };
    const currentCmyk = rgbToCmyk(currentRgb.r, currentRgb.g, currentRgb.b);

    // Handlers para Inputs
    const handleNumInput = (val, max) => {
        let num = parseInt(val);
        if (isNaN(num)) return 0;
        return Math.max(0, Math.min(max, num));
    };

    const handleRgbChange = (channel, value) => {
        const newRgb = { ...currentRgb, [channel]: handleNumInput(value, 255) };
        setBaseColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    };

    const handleHslChange = (channel, value) => {
        const max = channel === 'h' ? 360 : 100;
        const newHsl = { ...currentHsl, [channel]: handleNumInput(value, max) };
        const [r, g, b] = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        setBaseColor(rgbToHex(r, g, b));
    };

    const handleCmykChange = (channel, value) => {
        const newCmyk = { ...currentCmyk, [channel]: handleNumInput(value, 100) };
        const [r, g, b] = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
        setBaseColor(rgbToHex(r, g, b));
    };

    // Calcular paleta
    useEffect(() => {
        const [h, s, l] = hexToHSL(baseColor);
        let newPalette = [];

        switch (harmonyType) {
            case 'monochromatic':
                newPalette = [
                    createColorObj(h, s, 15),
                    createColorObj(h, s, 35),
                    createColorObj(h, s, l), 
                    createColorObj(h, s, 75),
                    createColorObj(h, s, 95),
                ];
                break;
            case 'analogous':
                newPalette = [
                    createColorObj(h - 60, s, l),
                    createColorObj(h - 30, s, l),
                    createColorObj(h, s, l),
                    createColorObj(h + 30, s, l),
                    createColorObj(h + 60, s, l),
                ];
                break;
            case 'complementary':
                newPalette = [
                    createColorObj(h, s, Math.max(10, l - 30)),
                    createColorObj(h, s, l), 
                    createColorObj(h, 10, 90), 
                    createColorObj(h + 180, s, l), 
                    createColorObj(h + 180, s, Math.max(10, l - 30)),
                ];
                break;
            case 'triadic':
                newPalette = [
                    createColorObj(h, s, Math.max(20, l - 20)),
                    createColorObj(h, s, l), 
                    createColorObj(h + 120, s, l),
                    createColorObj(h + 240, s, l),
                    createColorObj(h + 240, s, Math.max(20, l - 20)),
                ];
                break;
            default:
                break;
        }

        setPalette(newPalette);
        setCopiedImage(false);
    }, [baseColor, harmonyType]);

    // Exportar Canvas al Clipboard
    const copyToClipboard = async () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1000;
            canvas.height = 250;
            const ctx = canvas.getContext('2d');
            
            palette.forEach((color, index) => {
                ctx.fillStyle = color.hex;
                ctx.fillRect(index * 200, 0, 200, 250);
            });

            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error("No se pudo generar la imagen");
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                setCopiedImage(true);
                setTimeout(() => setCopiedImage(false), 2500);
            }, 'image/png');
        } catch (err) {
            console.error('Error copiando:', err);
            alert('Error al copiar. Verifica los permisos del portapapeles.');
        }
    };

    // Descargar Canvas como archivo PNG
    const downloadImage = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1000;
            canvas.height = 250;
            const ctx = canvas.getContext('2d');
            
            palette.forEach((color, index) => {
                ctx.fillStyle = color.hex;
                ctx.fillRect(index * 200, 0, 200, 250);
            });

            const link = document.createElement('a');
            link.download = `swiss-knife-${baseColor.replace('#', '')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Error descargando:', err);
            alert('Error al descargar la imagen.');
        }
    };

    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-zinc-800 pb-8">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2">Color Palette Engine</h2>
                    <p className="text-zinc-400">Armonías perfectas. Pasa el cursor por los colores para obtener su código.</p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={downloadImage}
                        className="px-5 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                        title="Descargar imagen (PNG)"
                    >
                        <Download size={20} />
                    </button>
                    <button 
                        onClick={copyToClipboard}
                        className={`px-6 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                            copiedImage ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                    >
                        {copiedImage ? <Check size={20} /> : <Copy size={20} />}
                        {copiedImage ? '¡Copiada!' : 'Copiar al Portapapeles'}
                    </button>
                </div>
            </div>

            {/* Panel de Controles */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative z-20">
                {/* Selector de Color Custom */}
                <div className="flex items-center gap-4 border-r border-zinc-800 pr-6 relative" ref={pickerRef}>
                    <div className="relative">
                        <button 
                            onClick={() => setShowPicker(!showPicker)}
                            className="flex items-center gap-3 bg-zinc-950 border border-zinc-700 hover:border-indigo-500 pl-2 pr-4 py-2 rounded-xl transition-all shadow-lg"
                        >
                            <div className="w-8 h-8 rounded-lg shadow-inner border border-white/10" style={{ backgroundColor: baseColor }} />
                            <span className="text-white font-mono font-bold tracking-wider uppercase">{baseColor}</span>
                        </button>

                        {/* Popover del Color Picker */}
                        {showPicker && (
                            <div className="absolute top-full mt-3 left-0 z-50 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 min-w-[240px]">
                                <HexColorPicker color={baseColor} onChange={setBaseColor} />
                                
                                {/* Pestañas de Input Manual */}
                                <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col gap-3">
                                    <div className="flex justify-between bg-black/50 p-1 rounded-lg">
                                        {['HEX', 'RGB', 'HSL', 'CMYK'].map(mode => (
                                            <button 
                                                key={mode}
                                                onClick={() => setInputMode(mode)}
                                                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${inputMode === mode ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* Inputs Condicionales */}
                                    <div className="h-10 flex items-center justify-center">
                                        {inputMode === 'HEX' && (
                                            <div className="flex-1 flex bg-black border border-zinc-800 rounded-lg overflow-hidden">
                                                <span className="text-zinc-500 pl-3 py-2">#</span>
                                                <HexColorInput 
                                                    color={baseColor} 
                                                    onChange={setBaseColor} 
                                                    className="bg-transparent text-white font-mono text-sm w-full outline-none py-2 uppercase"
                                                    prefixed={false}
                                                />
                                            </div>
                                        )}
                                        {inputMode === 'RGB' && (
                                            <div className="flex gap-2 w-full">
                                                {['r', 'g', 'b'].map(channel => (
                                                    <input key={channel} type="number" placeholder={channel.toUpperCase()}
                                                        value={currentRgb[channel]} onChange={(e) => handleRgbChange(channel, e.target.value)}
                                                        className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-xs text-center py-2 outline-none focus:border-indigo-500"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {inputMode === 'HSL' && (
                                            <div className="flex gap-2 w-full">
                                                {['h', 's', 'l'].map(channel => (
                                                    <input key={channel} type="number" placeholder={channel.toUpperCase()}
                                                        value={currentHsl[channel]} onChange={(e) => handleHslChange(channel, e.target.value)}
                                                        className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-xs text-center py-2 outline-none focus:border-indigo-500"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {inputMode === 'CMYK' && (
                                            <div className="flex gap-1 w-full">
                                                {['c', 'm', 'y', 'k'].map(channel => (
                                                    <input key={channel} type="number" placeholder={channel.toUpperCase()}
                                                        value={currentCmyk[channel]} onChange={(e) => handleCmykChange(channel, e.target.value)}
                                                        className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-[10px] text-center py-2 outline-none focus:border-indigo-500"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Color Base</span>
                        <button onClick={generateRandomBase} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-400 transition-colors font-medium" title="Color Aleatorio">
                            <RefreshCw size={12} />
                            Aleatorio
                        </button>
                    </div>
                </div>

                {/* Tipos de Armonía */}
                <div className="flex-1 w-full overflow-x-auto pb-2 md:pb-0">
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Regla de Armonía</span>
                    <div className="flex gap-2">
                        {harmonies.map(harmony => (
                            <button
                                key={harmony.id}
                                onClick={() => setHarmonyType(harmony.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                    harmonyType === harmony.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700'
                                }`}
                            >
                                <Palette size={14} />
                                {harmony.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Visualización de la Paleta */}
            <div className="flex h-[380px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-zinc-800 relative z-10">
                {palette.map((color, idx) => (
                    <ColorBlock key={`${color.hex}-${idx}`} color={color} />
                ))}
            </div>
            
            <div className="mt-6 flex justify-between text-xs text-zinc-500 font-medium">
                <span>Pasa el cursor sobre un color para copiar su código en diferentes formatos.</span>
                <span>Resolución de exportación de imagen: 1000x250px</span>
            </div>
        </div>
    );
};
