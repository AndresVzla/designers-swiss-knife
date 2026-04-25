import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Upload, Download, Copy, Check, Image as ImageIcon, RefreshCw, Trash2,
    ChevronDown, FileImage, ArrowRight, Monitor, AlertCircle, Layers
} from 'lucide-react';
import TracerWorker from './tracerWorker.js?worker';

// ── Supported formats ────────────────────────────────────────
const FORMATS = [
    { id: 'png',  label: 'PNG',  mime: 'image/png',  ext: '.png',  supportsQuality: false, desc: 'Lossless · Transparencia' },
    { id: 'jpg',  label: 'JPG',  mime: 'image/jpeg', ext: '.jpg',  supportsQuality: true,  desc: 'Comprimido · Fotos' },
    { id: 'webp', label: 'WebP', mime: 'image/webp', ext: '.webp', supportsQuality: true,  desc: 'Moderno · Liviano' },
    { id: 'bmp',  label: 'BMP',  mime: 'image/bmp',  ext: '.bmp',  supportsQuality: false, desc: 'Sin compresión' },
    { id: 'svg',  label: 'SVG',  mime: 'image/svg+xml', ext: '.svg', supportsQuality: false, desc: 'Vectorizado (Tracer)' },
];

const ACCEPT = 'image/png,image/jpeg,image/webp,image/bmp,image/gif,image/svg+xml';

// ── Helpers ──────────────────────────────────────────────────
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFormatFromMime = (mime) => {
    if (mime.includes('png')) return 'PNG';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPG';
    if (mime.includes('webp')) return 'WebP';
    if (mime.includes('bmp')) return 'BMP';
    if (mime.includes('gif')) return 'GIF';
    if (mime.includes('svg')) return 'SVG';
    return 'Unknown';
};

// ── Component ────────────────────────────────────────────────
export function SwiftConverter() {
    const [sourceFiles, setSourceFiles] = useState([]);       
    const [outputFormat, setOutputFormat] = useState('png');
    const [quality, setQuality] = useState(92);
    const [convertedBlobs, setConvertedBlobs] = useState([]); 
    const [converting, setConverting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const formatMenuRef = useRef(null);

    // ── Load images ───────────────────────────────────────────
    const loadImages = useCallback(async (filesList) => {
        setError(null);
        setConvertedBlobs([]);
        
        const validFiles = Array.from(filesList).filter(f => f.type.startsWith('image/') && f.size <= 50 * 1024 * 1024);
        if (validFiles.length === 0) {
            setError('Archivos inválidos o mayores a 50MB.');
            return;
        }

        sourceFiles.forEach(f => URL.revokeObjectURL(f.url));

        const loadedFiles = await Promise.all(validFiles.map(async (file) => {
            const url = URL.createObjectURL(file);
            return new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => resolve({
                    file, url, width: img.naturalWidth, height: img.naturalHeight, size: file.size,
                    format: getFormatFromMime(file.type), name: file.name
                });
                img.onerror = () => { URL.revokeObjectURL(url); reject(); };
                img.src = url;
            });
        }).filter(Boolean)); 
        
        if (loadedFiles.length > 0) {
            setSourceFiles(loadedFiles);
            const current = getFormatFromMime(loadedFiles[0].file.type).toLowerCase();
            if (current === outputFormat) {
                const alt = FORMATS.find(f => f.id !== current);
                if (alt) setOutputFormat(alt.id);
            }
        }
    }, [sourceFiles, outputFormat]);

    // ── Drag & Drop ──────────────────────────────────────────
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) loadImages(e.dataTransfer.files);
    };

    // ── Single Conversion Logic ──────────────────────────────
    const convertSingle = async (source) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = source.url;
        });

        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        const fmt = FORMATS.find(f => f.id === outputFormat);
        if (outputFormat === 'jpg' || outputFormat === 'bmp') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        let blob;
        if (outputFormat === 'svg') {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            blob = await new Promise((resolve, reject) => {
                const worker = new TracerWorker();
                worker.postMessage({
                    imageData, 
                    options: { ltres: 1, qtres: 1, pathomit: 8, colorsampling: 2, numberofcolors: 16, mincolorratio: 0, colorquantcycles: 3 }
                });
                worker.onmessage = (e) => {
                    if (e.data.success) {
                        resolve(new Blob([e.data.svgString], { type: 'image/svg+xml' }));
                    } else {
                        reject(new Error(e.data.error));
                    }
                    worker.terminate();
                };
            });
        } else {
            blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, fmt.mime, fmt.supportsQuality ? quality / 100 : undefined);
            });
        }
        
        return { blob, url: URL.createObjectURL(blob), size: blob.size, name: source.name };
    };

    // ── Convert All ──────────────────────────────────────────
    const runConversion = useCallback(async () => {
        if (sourceFiles.length === 0) return;
        setConverting(true);
        setError(null);
        
        convertedBlobs.forEach(b => URL.revokeObjectURL(b.url));
        
        try {
            const results = [];
            for (const source of sourceFiles) {
                const res = await convertSingle(source);
                results.push(res);
            }
            setConvertedBlobs(results);
        } catch (err) {
            console.error(err);
            setError('Error al convertir. Intenta nuevamente.');
        } finally {
            setConverting(false);
        }
    }, [sourceFiles, outputFormat, quality]);

    // ── Auto-Update (Real-time Preview) ─────────────────────
    useEffect(() => {
        // Auto-convert for instant feedback if NOT SVG
        if (sourceFiles.length > 0 && outputFormat !== 'svg') {
            const timer = setTimeout(() => {
                runConversion();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [quality, outputFormat, sourceFiles.length]);

    // ── Download ─────────────────────────────────────────────
    const downloadResult = () => {
        if (convertedBlobs.length === 0) return;
        const fmt = FORMATS.find(f => f.id === outputFormat);
        
        convertedBlobs.forEach((cb) => {
            const baseName = cb.name.replace(/\.[^/.]+$/, '');
            const link = document.createElement('a');
            link.download = `${baseName}${fmt.ext}`;
            link.href = cb.url;
            link.click();
        });
    };

    // ── Copy to clipboard ────────────────────────────────────
    const copyToClipboard = async () => {
        if (convertedBlobs.length === 0) return;
        try {
            let blobToCopy = convertedBlobs[0].blob;
            if (convertedBlobs[0].blob.type !== 'image/png') {
                const img = new window.Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = convertedBlobs[0].url;
                });
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0);
                blobToCopy = await new Promise(r => c.toBlob(r, 'image/png'));
            }
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blobToCopy })
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('No se pudo copiar. Tu navegador puede no soportar esta función.');
        }
    };

    // ── Reset ────────────────────────────────────────────────
    const reset = () => {
        sourceFiles.forEach(f => URL.revokeObjectURL(f.url));
        convertedBlobs.forEach(b => URL.revokeObjectURL(b.url));
        setSourceFiles([]);
        setConvertedBlobs([]);
        setError(null);
    };

    const selectedFormat = FORMATS.find(f => f.id === outputFormat);
    const mainSource = sourceFiles[0];
    const mainConverted = convertedBlobs[0];
    
    const totalSourceSize = sourceFiles.reduce((acc, f) => acc + f.size, 0);
    const totalConvertedSize = convertedBlobs.reduce((acc, b) => acc + b.size, 0);
    const savings = totalSourceSize > 0 && totalConvertedSize > 0
        ? Math.round((1 - totalConvertedSize / totalSourceSize) * 100)
        : null;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col min-h-[700px]">
            <canvas ref={canvasRef} className="hidden" />

            {/* Header */}
            <div className="p-5 md:p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/20">
                            <RefreshCw size={18} />
                        </div>
                        Swift Converter
                    </h3>
                    <p className="text-zinc-500 text-xs mt-1">Convierte imágenes entre formatos · Batch mode · 100% local</p>
                </div>
                {sourceFiles.length > 0 && (
                    <button onClick={reset}
                        className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        title="Limpiar">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {error && (
                <div className="mx-5 md:mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row">

                {/* ── LEFT: Upload / Source preview ── */}
                <div className="flex-1 p-5 md:p-6 flex flex-col">
                    {sourceFiles.length === 0 ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
                                ${isDragging
                                    ? 'border-violet-500 bg-violet-500/5 scale-[1.01]'
                                    : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30'
                                }`}
                        >
                            <div className={`p-5 rounded-2xl transition-colors ${isDragging ? 'bg-violet-500/10' : 'bg-zinc-800/50'}`}>
                                <Upload size={32} className={`transition-colors ${isDragging ? 'text-violet-400' : 'text-zinc-500'}`} />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-semibold mb-1">
                                    {isDragging ? 'Suelta tus imágenes aquí' : 'Arrastra imágenes (Batch soportado)'}
                                </p>
                                <p className="text-zinc-500 text-xs">
                                    JPG · PNG · WebP · BMP · GIF · SVG
                                </p>
                            </div>
                            <button className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors">
                                Seleccionar archivos
                            </button>
                            <input ref={fileInputRef} type="file" accept={ACCEPT} multiple
                                className="hidden" onChange={(e) => loadImages(e.target.files)} />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Original</span>
                                    {sourceFiles.length > 1 && (
                                        <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center gap-1">
                                            <Layers size={10} /> +{sourceFiles.length - 1} imágenes
                                        </span>
                                    )}
                                </div>
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                    Añadir más
                                </button>
                                <input ref={fileInputRef} type="file" accept={ACCEPT} multiple
                                    className="hidden" onChange={(e) => { if (e.target.files?.length) loadImages([...sourceFiles.map(f=>f.file), ...e.target.files]); }} />
                            </div>

                            {/* Preview thumbnail */}
                            <div className="flex-1 min-h-[200px] lg:min-h-0 bg-zinc-950/50 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center p-4 relative"
                                style={{ backgroundImage: 'linear-gradient(45deg, #1a1a1e 25%, transparent 25%), linear-gradient(-45deg, #1a1a1e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1e 75%), linear-gradient(-45deg, transparent 75%, #1a1a1e 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px' }}>
                                <img src={mainSource.url} alt="Source"
                                    className="max-w-full max-h-[300px] lg:max-h-[400px] object-contain rounded-lg shadow-2xl" />
                            </div>

                            {/* Source info pills */}
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 font-medium">
                                    <FileImage size={12} className="text-violet-400" /> {mainSource.format} {sourceFiles.length > 1 ? '(Lote)' : ''}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 font-medium">
                                    <Monitor size={12} className="text-blue-400" /> {mainSource.width}×{mainSource.height}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 font-medium">
                                    <ImageIcon size={12} className="text-emerald-400" /> {formatBytes(totalSourceSize)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── CENTER: Controls ── */}
                {sourceFiles.length > 0 && (
                    <div className="lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l lg:border-r border-zinc-800 p-5 md:p-6 flex flex-col gap-5">

                        {/* Format selector */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Formato de salida</span>
                            <div className="relative" ref={formatMenuRef}>
                                <button onClick={() => setShowFormatMenu(!showFormatMenu)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium text-sm transition-colors">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                                        {selectedFormat.label}
                                    </span>
                                    <ChevronDown size={14} className={`text-zinc-400 transition-transform ${showFormatMenu ? 'rotate-180' : ''}`} />
                                </button>
                                {showFormatMenu && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl z-50">
                                        {FORMATS.map(f => (
                                            <button key={f.id}
                                                onClick={() => { setOutputFormat(f.id); setShowFormatMenu(false); }}
                                                className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-zinc-800 transition-colors text-sm ${outputFormat === f.id ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}>
                                                <div>
                                                    <span className="font-medium text-white">{f.label}</span>
                                                    <span className="block text-[10px] text-zinc-500 mt-0.5">{f.desc}</span>
                                                </div>
                                                {outputFormat === f.id && <Check size={14} className="text-violet-400" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quality slider */}
                        {selectedFormat.supportsQuality && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Calidad</span>
                                    <span className="text-white font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md">{quality}%</span>
                                </div>
                                <input type="range" min="10" max="100" step="1" value={quality}
                                    onChange={e => { setQuality(+e.target.value); }}
                                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-violet-500" />
                            </div>
                        )}

                        <div className="flex items-center gap-2 py-2">
                            <div className="flex-1 h-px bg-zinc-800" />
                            <div className="flex items-center gap-2 text-zinc-500">
                                <span className="text-[10px] font-bold uppercase tracking-wider">{sourceFiles.length > 1 ? 'LOTE' : mainSource.format}</span>
                                <ArrowRight size={14} className="text-violet-400" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">{selectedFormat.label}</span>
                            </div>
                            <div className="flex-1 h-px bg-zinc-800" />
                        </div>

                        {/* Convert button (Mainly needed for SVG which skips auto-update) */}
                        <button onClick={runConversion} disabled={converting}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${converting
                                ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 active:scale-[0.98]'
                            }`}>
                            {converting ? (
                                <><RefreshCw size={15} className="animate-spin" /> Procesando...</>
                            ) : (
                                <><RefreshCw size={15} /> Forzar Conversión</>
                            )}
                        </button>

                        {/* Result size comparison */}
                        {convertedBlobs.length > 0 && (
                            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-3 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-400">Total Original</span>
                                    <span className="text-white font-mono">{formatBytes(totalSourceSize)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-400">Total Convertido</span>
                                    <span className="text-white font-mono">{formatBytes(totalConvertedSize)}</span>
                                </div>
                                {savings !== null && savings !== 0 && (
                                    <div className={`text-center text-xs font-bold py-1.5 rounded-lg ${savings > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                                        {savings > 0 ? `↓ ${savings}% optimizado` : `↑ ${Math.abs(savings)}% más pesado`}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── RIGHT: Result preview ── */}
                {sourceFiles.length > 0 && convertedBlobs.length > 0 && mainConverted && (
                    <div className="flex-1 border-t lg:border-t-0 p-5 md:p-6 flex flex-col gap-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Resultado</span>

                        {/* Converted preview */}
                        <div className="flex-1 min-h-[200px] lg:min-h-0 bg-zinc-950/50 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center p-4 relative"
                            style={{ backgroundImage: 'linear-gradient(45deg, #1a1a1e 25%, transparent 25%), linear-gradient(-45deg, #1a1a1e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1e 75%), linear-gradient(-45deg, transparent 75%, #1a1a1e 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px' }}>
                            <img src={mainConverted.url} alt="Converted"
                                className={`max-w-full max-h-[300px] lg:max-h-[400px] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${converting ? 'opacity-30' : 'opacity-100'}`} />
                            
                            {converting && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <RefreshCw size={32} className="text-violet-500 animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <button onClick={downloadResult}
                                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                                <Download size={15} /> Descargar {sourceFiles.length > 1 ? `(${sourceFiles.length})` : selectedFormat.label}
                            </button>
                            {sourceFiles.length === 1 && (
                                <button onClick={copyToClipboard}
                                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${copied
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                    }`}>
                                    {copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
