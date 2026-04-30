import React, { useState, useRef, useCallback } from 'react';
import {
    Layout, Copy, Check, ChevronDown, ChevronRight, Search,
    Download, Smartphone, Monitor, Info, ExternalLink, Maximize2
} from 'lucide-react';

// ── SOCIAL MEDIA SIZE DATABASE (2026 Updated) ──────────────────
const PLATFORMS = [
    {
        id: 'instagram',
        name: 'Instagram',
        color: '#E1306C',
        gradient: 'from-pink-500 via-purple-500 to-yellow-500',
        icon: '📸',
        categories: [
            {
                name: 'Feed',
                sizes: [
                    { name: 'Post Cuadrado', w: 1080, h: 1080, ratio: '1:1', tip: 'Formato más versátil' },
                    { name: 'Post Vertical', w: 1080, h: 1350, ratio: '4:5', tip: 'Ocupa más pantalla en el feed' },
                    { name: 'Post Horizontal', w: 1080, h: 566, ratio: '1.91:1', tip: 'Menos engagement que vertical' },
                    { name: 'Carrusel', w: 1080, h: 1080, ratio: '1:1', tip: 'Hasta 10 slides, también 4:5' },
                ]
            },
            {
                name: 'Stories & Reels',
                sizes: [
                    { name: 'Story', w: 1080, h: 1920, ratio: '9:16', tip: 'Zona segura: 1080×1420 central' },
                    { name: 'Reel', w: 1080, h: 1920, ratio: '9:16', tip: 'Cover thumbnail: 1080×1920' },
                    { name: 'Reel Cover', w: 420, h: 654, ratio: '0.64:1', tip: 'Visible en perfil grid' },
                ]
            },
            {
                name: 'Perfil',
                sizes: [
                    { name: 'Foto de Perfil', w: 320, h: 320, ratio: '1:1', tip: 'Se muestra a 110×110px' },
                    { name: 'Highlight Cover', w: 161, h: 161, ratio: '1:1', tip: 'Icono circular' },
                ]
            }
        ]
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        color: '#00F2EA',
        gradient: 'from-cyan-400 to-pink-500',
        icon: '🎵',
        categories: [
            {
                name: 'Video',
                sizes: [
                    { name: 'Video Vertical', w: 1080, h: 1920, ratio: '9:16', tip: 'Formato principal' },
                    { name: 'Video Horizontal', w: 1920, h: 1080, ratio: '16:9', tip: 'Pantalla completa horizontal' },
                ]
            },
            {
                name: 'Perfil',
                sizes: [
                    { name: 'Foto de Perfil', w: 200, h: 200, ratio: '1:1', tip: 'Mínimo recomendado' },
                ]
            }
        ]
    },
    {
        id: 'youtube',
        name: 'YouTube',
        color: '#FF0000',
        gradient: 'from-red-600 to-red-500',
        icon: '▶️',
        categories: [
            {
                name: 'Video',
                sizes: [
                    { name: 'Thumbnail', w: 1280, h: 720, ratio: '16:9', tip: 'Máx 2MB, JPG/PNG/GIF' },
                    { name: 'Video HD', w: 1920, h: 1080, ratio: '16:9', tip: 'Resolución estándar' },
                    { name: 'Video 4K', w: 3840, h: 2160, ratio: '16:9', tip: 'Máxima calidad' },
                    { name: 'Short', w: 1080, h: 1920, ratio: '9:16', tip: 'Formato vertical corto' },
                ]
            },
            {
                name: 'Canal',
                sizes: [
                    { name: 'Banner del Canal', w: 2560, h: 1440, ratio: '16:9', tip: 'Zona segura: 1546×423 central' },
                    { name: 'Foto de Perfil', w: 800, h: 800, ratio: '1:1', tip: 'Se muestra a 98×98px' },
                    { name: 'Watermark', w: 150, h: 150, ratio: '1:1', tip: 'PNG transparente recomendado' },
                ]
            }
        ]
    },
    {
        id: 'facebook',
        name: 'Facebook',
        color: '#1877F2',
        gradient: 'from-blue-600 to-blue-500',
        icon: '👤',
        categories: [
            {
                name: 'Feed',
                sizes: [
                    { name: 'Post Imagen', w: 1200, h: 630, ratio: '1.91:1', tip: 'Formato link preview' },
                    { name: 'Post Cuadrado', w: 1080, h: 1080, ratio: '1:1', tip: 'Máximo engagement' },
                    { name: 'Story', w: 1080, h: 1920, ratio: '9:16', tip: 'Igual que Instagram' },
                    { name: 'Reel', w: 1080, h: 1920, ratio: '9:16', tip: 'Formato vertical' },
                ]
            },
            {
                name: 'Perfil & Página',
                sizes: [
                    { name: 'Foto de Perfil', w: 170, h: 170, ratio: '1:1', tip: 'Se recorta circular' },
                    { name: 'Cover Photo', w: 820, h: 312, ratio: '2.63:1', tip: 'Desktop: 820×312px' },
                    { name: 'Event Cover', w: 1920, h: 1005, ratio: '1.91:1', tip: 'Imagen de evento' },
                ]
            },
            {
                name: 'Ads',
                sizes: [
                    { name: 'Ad Cuadrado', w: 1080, h: 1080, ratio: '1:1', tip: 'Feed + Marketplace' },
                    { name: 'Ad Carrusel', w: 1080, h: 1080, ratio: '1:1', tip: 'Cada slide' },
                ]
            }
        ]
    },
    {
        id: 'twitter',
        name: 'X (Twitter)',
        color: '#000000',
        gradient: 'from-zinc-700 to-zinc-900',
        icon: '𝕏',
        categories: [
            {
                name: 'Posts',
                sizes: [
                    { name: 'Post Imagen', w: 1600, h: 900, ratio: '16:9', tip: 'Máx 5MB, hasta 4 imgs' },
                    { name: 'Post Cuadrado', w: 1080, h: 1080, ratio: '1:1', tip: 'Se recorta en feed' },
                    { name: 'Card Image', w: 800, h: 418, ratio: '1.91:1', tip: 'Para links compartidos' },
                ]
            },
            {
                name: 'Perfil',
                sizes: [
                    { name: 'Foto de Perfil', w: 400, h: 400, ratio: '1:1', tip: 'Se muestra a 48×48px' },
                    { name: 'Header/Banner', w: 1500, h: 500, ratio: '3:1', tip: 'Se recorta en mobile' },
                ]
            }
        ]
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        color: '#0A66C2',
        gradient: 'from-blue-700 to-sky-600',
        icon: '💼',
        categories: [
            {
                name: 'Posts',
                sizes: [
                    { name: 'Post Imagen', w: 1200, h: 627, ratio: '1.91:1', tip: 'Formato estándar' },
                    { name: 'Post Cuadrado', w: 1080, h: 1080, ratio: '1:1', tip: 'Más visibilidad' },
                    { name: 'Post Vertical', w: 1080, h: 1350, ratio: '4:5', tip: 'Máximo espacio' },
                    { name: 'Artículo Cover', w: 1200, h: 644, ratio: '1.86:1', tip: 'Imagen de artículo' },
                ]
            },
            {
                name: 'Perfil & Empresa',
                sizes: [
                    { name: 'Foto de Perfil', w: 400, h: 400, ratio: '1:1', tip: 'Mínimo 200×200' },
                    { name: 'Background', w: 1584, h: 396, ratio: '4:1', tip: 'Fondo del perfil' },
                    { name: 'Logo Empresa', w: 300, h: 300, ratio: '1:1', tip: 'Se muestra a 60×60' },
                    { name: 'Cover Empresa', w: 1128, h: 191, ratio: '5.9:1', tip: 'Banner de empresa' },
                ]
            }
        ]
    },
    {
        id: 'pinterest',
        name: 'Pinterest',
        color: '#E60023',
        gradient: 'from-red-600 to-rose-500',
        icon: '📌',
        categories: [
            {
                name: 'Pines',
                sizes: [
                    { name: 'Pin Estándar', w: 1000, h: 1500, ratio: '2:3', tip: 'Ratio ideal para pines' },
                    { name: 'Pin Cuadrado', w: 1000, h: 1000, ratio: '1:1', tip: 'Alternativa compacta' },
                    { name: 'Pin Largo', w: 1000, h: 2100, ratio: '1:2.1', tip: 'Infografías' },
                    { name: 'Idea Pin', w: 1080, h: 1920, ratio: '9:16', tip: 'Formato story' },
                ]
            },
            {
                name: 'Perfil',
                sizes: [
                    { name: 'Foto de Perfil', w: 165, h: 165, ratio: '1:1', tip: 'Se muestra pequeño' },
                    { name: 'Board Cover', w: 222, h: 150, ratio: '1.48:1', tip: 'Cover de tablero' },
                ]
            }
        ]
    },
    {
        id: 'threads',
        name: 'Threads',
        color: '#000000',
        gradient: 'from-zinc-800 to-zinc-600',
        icon: '🧵',
        categories: [
            {
                name: 'Posts',
                sizes: [
                    { name: 'Post Imagen', w: 1080, h: 1080, ratio: '1:1', tip: 'Cuadrado recomendado' },
                    { name: 'Post Vertical', w: 1080, h: 1350, ratio: '4:5', tip: 'Formato portrait' },
                ]
            },
            {
                name: 'Perfil',
                sizes: [
                    { name: 'Foto de Perfil', w: 320, h: 320, ratio: '1:1', tip: 'Sincronizado con IG' },
                ]
            }
        ]
    }
];

// ── VISUAL PREVIEW COMPONENT ──────────────────────────────────
const SizePreview = ({ size, platformColor }) => {
    const maxW = 280, maxH = 200;
    const scale = Math.min(maxW / size.w, maxH / size.h, 1);
    const w = Math.max(size.w * scale, 40);
    const h = Math.max(size.h * scale, 30);

    return (
        <div className="flex flex-col items-center justify-center py-4">
            <div
                className="relative border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300"
                style={{
                    width: `${w}px`,
                    height: `${h}px`,
                    borderColor: platformColor + '80',
                    backgroundColor: platformColor + '10',
                }}
            >
                {/* Corner markers */}
                {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-2 h-2 rounded-full`}
                        style={{ backgroundColor: platformColor }} />
                ))}
                {/* Dimension labels */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ color: platformColor }}>{size.w}px</div>
                <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ color: platformColor }}>{size.h}px</div>
                {/* Ratio */}
                <span className="text-zinc-500 text-xs font-mono">{size.ratio}</span>
            </div>
        </div>
    );
};

// ── SIZE CARD COMPONENT ──────────────────────────────────────
const SizeCard = ({ size, platformColor, platformGradient }) => {
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const copySize = useCallback(async () => {
        const text = `${size.w} × ${size.h}px (${size.ratio})`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (e) { console.error(e); }
    }, [size]);

    return (
        <div className="group bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all duration-200 hover:bg-zinc-800/40">
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                    <h4 className="text-white font-semibold text-sm truncate">{size.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-zinc-400 font-mono text-xs">{size.w} × {size.h}px</span>
                        <span className="text-zinc-600 text-[10px]">•</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700"
                            style={{ color: platformColor }}>{size.ratio}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setShowPreview(!showPreview)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
                        title="Vista previa">
                        <Maximize2 size={13} />
                    </button>
                    <button onClick={copySize}
                        className={`p-1.5 rounded-lg transition-all ${copied
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                        title="Copiar medidas">
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                </div>
            </div>

            {/* Tip */}
            {size.tip && (
                <div className="flex items-start gap-1.5 text-[11px] text-zinc-500 leading-relaxed">
                    <Info size={11} className="shrink-0 mt-0.5" style={{ color: platformColor + 'AA' }} />
                    <span>{size.tip}</span>
                </div>
            )}

            {/* Visual Preview */}
            {showPreview && <SizePreview size={size} platformColor={platformColor} />}
        </div>
    );
};

// ── MAIN COMPONENT ──────────────────────────────────────────
export function SocialBlueprint() {
    const [activePlatform, setActivePlatform] = useState('instagram');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});
    const [copiedAll, setCopiedAll] = useState(false);
    const contentRef = useRef(null);

    const platform = PLATFORMS.find(p => p.id === activePlatform);

    const toggleCategory = (catName) => {
        setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
    };

    const isCategoryExpanded = (catName) => {
        return expandedCategories[catName] !== false; // default open
    };

    // Filter sizes by search
    const filteredCategories = platform?.categories.map(cat => ({
        ...cat,
        sizes: cat.sizes.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.ratio.includes(searchQuery) ||
            `${s.w}`.includes(searchQuery) ||
            `${s.h}`.includes(searchQuery)
        )
    })).filter(cat => cat.sizes.length > 0) || [];

    const totalSizes = filteredCategories.reduce((acc, cat) => acc + cat.sizes.length, 0);

    // Copy all sizes for current platform
    const copyAllSizes = async () => {
        const lines = filteredCategories.flatMap(cat =>
            [`\n── ${cat.name} ──`, ...cat.sizes.map(s => `${s.name}: ${s.w} × ${s.h}px (${s.ratio})`)]
        );
        const text = `📐 ${platform.name} - Medidas 2026\n${lines.join('\n')}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAll(true);
            setTimeout(() => setCopiedAll(false), 2000);
        } catch (e) { console.error(e); }
    };

    // Export as text file
    const downloadCheatsheet = () => {
        const lines = PLATFORMS.flatMap(p => [
            `\n${'═'.repeat(40)}`,
            `${p.icon} ${p.name}`,
            `${'═'.repeat(40)}`,
            ...p.categories.flatMap(cat => [
                `\n── ${cat.name} ──`,
                ...cat.sizes.map(s => `  ${s.name}: ${s.w} × ${s.h}px (${s.ratio})${s.tip ? ` — ${s.tip}` : ''}`)
            ])
        ]);
        const text = `📐 SOCIAL MEDIA SIZE GUIDE 2026\nGenerado con Designer's Swiss Knife\n${lines.join('\n')}\n`;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'social-media-sizes-2026.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]">

            {/* ── LEFT SIDEBAR: Platform Selector ── */}
            <div className="lg:w-72 xl:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col bg-zinc-900/50">

                {/* Header */}
                <div className="p-4 md:p-5 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-lg shadow-blue-500/20 shrink-0">
                                <Layout size={18} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-white font-bold text-sm md:text-lg leading-tight truncate">Social Blueprint</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] md:text-[9px] font-bold text-emerald-400 uppercase tracking-tight">
                                        <Check size={8} /> Verificado 2026
                                    </div>
                                    <p className="text-zinc-500 text-[9px] md:text-xs truncate">Estándares Actualizados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3 md:p-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2 block">
                            Plataformas
                        </span>
                        <div className="space-y-1 mt-2">
                            {PLATFORMS.map(p => {
                                const count = p.categories.reduce((a, c) => a + c.sizes.length, 0);
                                return (
                                    <button key={p.id}
                                        onClick={() => { setActivePlatform(p.id); setSearchQuery(''); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${activePlatform === p.id
                                            ? 'bg-zinc-800 border border-zinc-700 shadow-lg'
                                            : 'hover:bg-zinc-800/50 border border-transparent'
                                            }`}>
                                        <span className="text-lg shrink-0">{p.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-sm font-semibold block truncate ${activePlatform === p.id ? 'text-white' : 'text-zinc-400'}`}>
                                                {p.name}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-500 shrink-0">
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 md:p-4 border-t border-zinc-800 bg-zinc-900/80 space-y-2">
                    <button onClick={copyAllSizes}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${copiedAll
                            ? 'bg-emerald-600 text-white'
                            : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
                            }`}>
                        {copiedAll ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar Medidas</>}
                    </button>
                    <button onClick={downloadCheatsheet}
                        className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-zinc-700 active:scale-[0.95]">
                        <Download size={14} /> Descargar Cheatsheet
                    </button>
                    <a href="https://blog.hootsuite.com/social-media-image-sizes-guide/" target="_blank" rel="noopener noreferrer"
                        className="w-full py-2 text-zinc-500 hover:text-sky-400 text-[10px] text-center transition-colors flex items-center justify-center gap-1">
                        Verificar fuente oficial <ExternalLink size={10} />
                    </a>
                </div>
            </div>

            {/* ── RIGHT: Content Area ── */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden" ref={contentRef}>

                {/* Platform Header */}
                {platform && (
                    <div className="p-4 md:p-6 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{platform.icon}</span>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-white">{platform.name}</h2>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        {totalSizes} medida{totalSizes !== 1 ? 's' : ''} disponible{totalSizes !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Search within platform */}
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar medida..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white pl-9 pr-3 py-2 rounded-xl text-sm outline-none focus:border-sky-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Sizes Grid */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map(cat => (
                            <div key={cat.name} className="space-y-3">
                                <button onClick={() => toggleCategory(cat.name)}
                                    className="flex items-center gap-2 group/cat w-full text-left">
                                    <div className="p-1 rounded-md transition-colors group-hover/cat:bg-zinc-800">
                                        {isCategoryExpanded(cat.name)
                                            ? <ChevronDown size={14} className="text-zinc-500" />
                                            : <ChevronRight size={14} className="text-zinc-500" />
                                        }
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest group-hover/cat:text-white transition-colors">
                                        {cat.name}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 font-mono">{cat.sizes.length}</span>
                                    <div className="flex-1 h-px bg-zinc-800/50 ml-2" />
                                </button>

                                {isCategoryExpanded(cat.name) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                                        {cat.sizes.map((size, idx) => (
                                            <SizeCard
                                                key={idx}
                                                size={size}
                                                platformColor={platform.color}
                                                platformGradient={platform.gradient}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Search size={40} className="text-zinc-700 mb-4" />
                            <p className="text-zinc-500 text-sm">No se encontraron medidas para "{searchQuery}"</p>
                            <button onClick={() => setSearchQuery('')}
                                className="mt-3 text-sky-500 hover:text-sky-400 text-xs font-semibold transition-colors">
                                Limpiar búsqueda
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
