import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Pipette, Copy, X, Check, Image as ImageIcon } from 'lucide-react';

// --- MATEMÁTICAS DE COLOR ---
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s ? l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s : 0;
    const lVal = (2 * l - s) / 2;
    const sVal = s ? (lVal <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0;
    return `hsl(${Math.round(60 * h < 0 ? 60 * h + 360 : 60 * h)}, ${Math.round(100 * sVal)}%, ${Math.round(100 * lVal)}%)`;
};

const rgbToCmyk = (r, g, b) => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));
    if (k === 1) return 'cmyk(0%, 0%, 0%, 100%)';
    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);
    return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
};

export const ImageColorPicker = () => {
    const [imageSrc, setImageSrc] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverColor, setHoverColor] = useState(null);
    const [pickedColors, setPickedColors] = useState([]);
    const [copiedIndex, setCopiedIndex] = useState(null);
    
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const lensCanvasRef = useRef(null);

    // Detección de API Nativa
    const isEyeDropperSupported = 'EyeDropper' in window;

    // Cargar imagen en Canvas
    useEffect(() => {
        if (imageSrc && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
            img.src = imageSrc;
            imgRef.current = img;
        }
    }, [imageSrc]);

    // Lógica Drag & Drop
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadFileReader(file);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) loadFileReader(file);
    };

    const loadFileReader = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => setImageSrc(e.target.result);
        reader.readAsDataURL(file);
    };

    // Pegar imagen (Ctrl+V)
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    loadFileReader(blob);
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    // Extraer color del Canvas
    const getColorFromEvent = (e) => {
        if (!canvasRef.current) return null;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const ctx = canvas.getContext('2d');
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        
        if (pixel[3] === 0) return null; // Transparente

        const r = pixel[0], g = pixel[1], b = pixel[2];
        return {
            hex: rgbToHex(r, g, b),
            rgb: `rgb(${r}, ${g}, ${b})`,
            hsl: rgbToHsl(r, g, b),
            cmyk: rgbToCmyk(r, g, b)
        };
    };

    const handleMouseMove = (e) => {
        const color = getColorFromEvent(e);
        if (color) setHoverColor(color);

        // Lupa logic (ahora en el panel lateral)
        if (canvasRef.current && lensCanvasRef.current) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            
            // Coordenadas relativas a la imagen para el zoom
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const imgX = (e.clientX - rect.left) * scaleX;
            const imgY = (e.clientY - rect.top) * scaleY;

            const lensCtx = lensCanvasRef.current.getContext('2d');
            lensCtx.imageSmoothingEnabled = false; // Pixelado limpio
            
            // Limpiar fondo
            lensCtx.fillStyle = '#18181b'; // zinc-900
            lensCtx.fillRect(0, 0, 96, 96);

            // Dibujar zoom (20x20 pixels escalados a 96x96)
            lensCtx.drawImage(
                canvas,
                imgX - 10, imgY - 10, 20, 20, // Source
                0, 0, 96, 96 // Destination
            );

            // Dibujar Crosshair central
            lensCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            lensCtx.lineWidth = 1.5;
            lensCtx.beginPath();
            lensCtx.moveTo(48, 40);
            lensCtx.lineTo(48, 56);
            lensCtx.moveTo(40, 48);
            lensCtx.lineTo(56, 48);
            lensCtx.stroke();
            
            // Dibujar un pequeño cuadrado en el centro exacto
            lensCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            lensCtx.strokeRect(45, 45, 6, 6);
            lensCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            lensCtx.strokeRect(44, 44, 8, 8);
        }
    };

    const handleMouseLeave = () => {
        setHoverColor(null);
    };

    const handleTouchMove = (e) => {
        if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            const event = { clientX: touch.clientX, clientY: touch.clientY };
            handleMouseMove(event);
        }
    };
    
    const handleTouchStart = (e) => {
        handleTouchMove(e);
    };

    const handleClick = (e) => {
        const color = getColorFromEvent(e);
        if (color && !pickedColors.some(c => c.hex === color.hex)) {
            setPickedColors(prev => [color, ...prev].slice(0, 10)); // Guardar max 10
        }
    };

    // Usar EyeDropper Nativo
    const useNativeEyeDropper = async () => {
        if (!isEyeDropperSupported) return;
        try {
            // eslint-disable-next-line no-undef
            const eyeDropper = new EyeDropper();
            const result = await eyeDropper.open();
            
            // Result da HEX. Lo convertimos a RGB para el resto.
            const hex = result.sRGBHex;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            
            const color = {
                hex: hex.toUpperCase(),
                rgb: `rgb(${r}, ${g}, ${b})`,
                hsl: rgbToHsl(r, g, b),
                cmyk: rgbToCmyk(r, g, b)
            };

            if (!pickedColors.some(c => c.hex === color.hex)) {
                setPickedColors(prev => [color, ...prev].slice(0, 10));
            }
        } catch (e) {
            console.log('EyeDropper cancelado o con error:', e);
        }
    };

    // Copiar Color
    const copyColor = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
    };

    const removeColor = (e, hex) => {
        e.stopPropagation();
        setPickedColors(prev => prev.filter(c => c.hex !== hex));
    };

    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Pipette className="text-indigo-400" size={32} />
                        Image Color Picker
                    </h2>
                    <p className="text-zinc-400 mt-1">Extrae colores exactos de cualquier imagen.</p>
                </div>
                
                {isEyeDropperSupported && (
                    <button 
                        onClick={useNativeEyeDropper}
                        className="px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
                        title="Usar cuentagotas en toda la pantalla"
                    >
                        <Pipette size={20} />
                        Cuentagotas Global
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-6 lg:gap-8">
                
                {/* 1. Preview de Color (Mobile: Arriba, Desktop: Derecha Arriba) */}
                <div className="order-1 lg:col-span-4 lg:col-start-9 lg:row-start-1 h-fit">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-lg">
                        <h3 className="text-sm font-bold tracking-widest text-zinc-500 uppercase mb-4 flex items-center gap-2">
                            <ImageIcon size={16} /> Color Actual (Zoom)
                        </h3>
                        <div className="flex items-center gap-4 md:gap-6">
                            <div 
                                className="relative w-16 h-16 md:w-28 md:h-28 rounded-xl shadow-inner border-2 md:border-4 flex-shrink-0 bg-black overflow-hidden transition-colors duration-200"
                                style={{ borderColor: hoverColor ? hoverColor.hex : '#27272a' }}
                            >
                                <canvas 
                                    ref={lensCanvasRef} 
                                    width={96} 
                                    height={96} 
                                    className={`w-full h-full ${hoverColor ? 'opacity-100' : 'opacity-0'}`} 
                                />
                                {!hoverColor && (
                                    <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nw08DWMGMBgNEBvwM4gRAAMGBgD1qgL/BpmFzAAAAABJRU5ErkJggg==')] opacity-30"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-2xl md:text-4xl font-black text-white tracking-tight truncate mb-1">
                                    {hoverColor ? hoverColor.hex : '—'}
                                </div>
                                <div className="text-xs md:text-sm font-mono text-zinc-400 truncate bg-zinc-800/50 inline-block px-2 py-1 rounded">
                                    {hoverColor ? hoverColor.rgb : 'Esperando cursor...'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Zona Principal (Canvas) */}
                <div className="order-2 lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:row-span-2">
                    {!imageSrc ? (
                        <div 
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl h-[350px] md:h-[450px] flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group ${
                                isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                        >
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileSelect}
                            />
                            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                <UploadCloud size={32} className="text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sube una imagen</h3>
                            <p className="text-zinc-400 text-center text-sm px-4">
                                Arrastra y suelta, haz clic,<br className="md:hidden" />
                                o presiona <span className="bg-zinc-800 text-white px-2 py-0.5 rounded font-mono">Ctrl+V</span>
                            </p>
                        </div>
                    ) : (
                        <div className="relative group rounded-2xl overflow-hidden bg-black/50 border border-zinc-800">
                            {/* Botón para cambiar imagen */}
                            <button 
                                onClick={() => setImageSrc(null)}
                                className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-red-500/80 backdrop-blur-md text-white p-2 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shadow-lg"
                                title="Cambiar imagen"
                            >
                                <X size={20} />
                            </button>

                            {/* Contenedor del Canvas */}
                            <div className="w-full h-[350px] md:h-[450px] flex items-center justify-center overflow-hidden cursor-crosshair relative">
                                <canvas 
                                    ref={canvasRef}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={handleClick}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    className="max-w-full max-h-full object-contain shadow-2xl relative z-10 touch-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Historial de Paleta Extraída */}
                <div className="order-3 lg:col-span-4 lg:col-start-9 lg:row-start-2 flex flex-col min-h-[300px]">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex-1 flex flex-col">
                        <h3 className="text-sm font-bold tracking-widest text-zinc-500 uppercase mb-4 flex justify-between items-center">
                            <span>Colores Extraídos</span>
                            <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full text-xs">{pickedColors.length}/10</span>
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {pickedColors.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 p-4">
                                    <Pipette size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">Haz clic/Toca en la imagen para guardar colores.</p>
                                </div>
                            ) : (
                                pickedColors.map((color, idx) => (
                                    <div key={`${color.hex}-${idx}`} className="group relative bg-zinc-800/50 rounded-xl p-2 flex items-center gap-3 hover:bg-zinc-800 transition-colors">
                                        <div 
                                            className="w-10 h-10 rounded-lg shadow-inner border border-white/10 flex-shrink-0"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white font-mono">{color.hex}</div>
                                            <div className="flex gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                                                <button onClick={() => copyColor(color.rgb, `rgb-${idx}`)} className="hover:text-white transition-colors">
                                                    {copiedIndex === `rgb-${idx}` ? '¡Copiado!' : 'RGB'}
                                                </button>
                                                <span>•</span>
                                                <button onClick={() => copyColor(color.hsl, `hsl-${idx}`)} className="hover:text-white transition-colors">
                                                    {copiedIndex === `hsl-${idx}` ? '¡Copiado!' : 'HSL'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Acciones */}
                                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => copyColor(color.hex, `hex-${idx}`)}
                                                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                                                title="Copiar HEX"
                                            >
                                                {copiedIndex === `hex-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                            <button 
                                                onClick={(e) => removeColor(e, color.hex)}
                                                className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {pickedColors.length > 0 && (
                            <button 
                                onClick={() => setPickedColors([])}
                                className="w-full mt-4 text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest"
                            >
                                Limpiar Lista
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
