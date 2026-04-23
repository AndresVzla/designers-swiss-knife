import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    ExternalLink,
    Github,
    Monitor,
    MousePointer2,
    Zap,
    RefreshCw,
    Info
} from 'lucide-react';
import { TOOLS } from './data/tools.js';
import { ActionCard } from './components/ActionCard.jsx';
import { ColorPaletteEngine } from './tools/ColorPaletteEngine.jsx';
import { ImageColorPicker } from './tools/ImageColorPicker.jsx';

export default function App() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todas');
    const [selectedTool, setSelectedTool] = useState(null);

    // Reseteo de scroll al cambiar de herramienta
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [selectedTool]);

    const categories = ['Todas', ...new Set(TOOLS.map(t => t.category))];

    const filteredTools = useMemo(() => {
        return TOOLS.filter(tool => {
            const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
                tool.description.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'Todas' || tool.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [search, activeCategory]);

    return (
        <div className="min-h-screen bg-black text-zinc-300 selection:bg-indigo-500/30 selection:text-indigo-200 font-sans">

            {/* Barra de Navegación Glassmorphic */}
            <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/60 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setSelectedTool(null)}>
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
                            S
                        </div>
                        <span className="font-bold text-white tracking-tight hidden sm:block">Designer's <span className="text-indigo-500 font-black">Swiss Knife</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setActiveCategory(cat); setSelectedTool(null); }}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeCategory === cat
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                            <Github size={20} />
                        </a>
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-indigo-600/20">
                            v2.0
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-12">

                {!selectedTool && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Hero Section */}
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight">
                                Tus herramientas <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                    en un solo lugar
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-lg md:text-xl mb-10 leading-relaxed font-light">
                                Genera paletas, optimiza imágenes y crea recursos sin fricción. <br />
                                Sin registros, procesado 100% en tu navegador.
                            </p>

                            {/* Buscador Central */}
                            <div className="relative max-w-xl mx-auto">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500">
                                    <Search size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Busca una herramienta... (ej. paleta, comprimir)"
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-lg shadow-2xl shadow-black/50"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <div className="absolute right-3 top-3 hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 font-mono">
                                    <span>ESC</span>
                                </div>
                            </div>

                            {/* Atributos de Valor */}
                            <div className="flex flex-wrap justify-center gap-6 mt-12 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
                                <div className="flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Zero-Friction</div>
                                <div className="flex items-center gap-2"><Monitor size={14} className="text-blue-500" /> 100% Local</div>
                                <div className="flex items-center gap-2"><MousePointer2 size={14} className="text-emerald-500" /> Clipboard Ready</div>
                            </div>
                        </div>

                        {/* Listado de Herramientas */}
                        <div className="mb-8 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                Herramientas Disponibles
                                <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md font-mono">{filteredTools.length}</span>
                            </h2>
                        </div>

                        {filteredTools.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTools.map((tool) => (
                                    <ActionCard
                                        key={tool.id}
                                        tool={tool}
                                        onClick={() => setSelectedTool(tool)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
                                <p className="text-zinc-500">No encontramos herramientas que coincidan con tu búsqueda.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Vista Detalle Herramienta */}
                {selectedTool && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <button
                            onClick={() => setSelectedTool(null)}
                            className="mb-8 text-zinc-500 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <RefreshCw size={14} className="rotate-180" />
                            Volver al inicio
                        </button>

                        {selectedTool.id === 'palette' ? (
                            <ColorPaletteEngine />
                        ) : selectedTool.id === 'picker' ? (
                            <ImageColorPicker />
                        ) : (
                            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 min-h-[500px] flex flex-col items-center justify-center text-center">
                                <div className={`p-6 rounded-2xl bg-gradient-to-br ${selectedTool.color} text-white mb-6 shadow-2xl shadow-indigo-500/20`}>
                                    <selectedTool.icon size={48} />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">{selectedTool.name}</h2>
                                <p className="text-zinc-400 max-w-md mb-8">{selectedTool.description}</p>

                                <div className="flex gap-4">
                                    <button className="bg-zinc-800 text-white px-8 py-3 rounded-xl font-bold opacity-50 cursor-not-allowed flex items-center gap-2">
                                        <Info size={18} />
                                        Próximamente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <footer className="border-t border-zinc-900 mt-20 py-12">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-zinc-600 text-sm">
                        © 2026 Designer's Swiss Knife. <span className="hidden sm:inline">Hecho por diseñadores para diseñadores.</span>
                    </div>
                    <div className="flex gap-8 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-white transition-colors">Términos</a>
                        <a href="#" className="hover:text-white transition-colors flex items-center gap-1">Donar <ExternalLink size={12} /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
}