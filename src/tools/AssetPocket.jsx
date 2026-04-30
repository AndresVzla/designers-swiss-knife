import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    Package, Search, Copy, Check, Download, Code, Image as ImageIcon,
    SlidersHorizontal, GripVertical, AlertCircle, ChevronLeft, ChevronRight, FileCode2, Paintbrush
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { ICON_CATEGORIES, ICON_ENTRIES } from '../data/iconLibrary.js';


const ITEMS_PER_PAGE = 60;

// ── Component ────────────────────────────────────────────────
export function AssetPocket() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [iconSize, setIconSize] = useState(32);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [iconColor, setIconColor] = useState('#ffffff');
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [copied, setCopied] = useState(null); // 'svg' | 'image' | 'name' | 'jsx' | 'css'
    const [showControls, setShowControls] = useState(false);
    const [page, setPage] = useState(1);
    const [toast, setToast] = useState(null);
    const [showBottomSheet, setShowBottomSheet] = useState(false);

    const svgRef = useRef(null);
    const catScrollRef = useRef(null);
    const colorPickerRef = useRef(null);
    const searchRef = useRef(null);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [search, activeCategory]);

    // Handle outside click for color picker
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
                setShowColorPicker(false);
            }
        };
        if (showColorPicker) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColorPicker]);

    // ── Toast helper ─────────────────────────────────────────
    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    }, []);

    // ── Filter icons ─────────────────────────────────────────
    const filteredIcons = useMemo(() => {
        return ICON_ENTRIES.filter(entry => {
            const matchesCat = activeCategory === 'all' || entry.cat === activeCategory;
            if (!matchesCat) return false;
            if (!search) return true;
            const q = search.toLowerCase();
            return entry.name.toLowerCase().includes(q) || entry.tags.toLowerCase().includes(q);
        });
    }, [search, activeCategory]);

    const totalPages = Math.ceil(filteredIcons.length / ITEMS_PER_PAGE);
    const pagedIcons = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredIcons.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredIcons, page]);

    // ── Keyboard shortcuts ───────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            // '/' focuses search
            if (e.key === '/' && document.activeElement !== searchRef.current) {
                e.preventDefault();
                searchRef.current?.focus();
            }
            // Escape closes panels
            if (e.key === 'Escape') {
                setShowColorPicker(false);
                setShowBottomSheet(false);
                searchRef.current?.blur();
            }
            // Arrow keys navigate grid
            if (!selectedIcon || !pagedIcons.length) return;
            if (!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)) return;
            const idx = pagedIcons.findIndex(i => i.name === selectedIcon.name);
            if (idx === -1) return;
            const cols = 7; // approx columns on desktop
            const map = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
            const next = pagedIcons[Math.max(0, Math.min(pagedIcons.length - 1, idx + map[e.key]))];
            if (next) { e.preventDefault(); setSelectedIcon(next); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [selectedIcon, pagedIcons]);

    // ── Get SVG string robustly ─────────────────────────────
    const getSvgString = useCallback(() => {
        if (!selectedIcon) return null;
        const IconComp = LucideIcons[selectedIcon.name];
        if (!IconComp) return null;
        
        let svgStr = renderToStaticMarkup(
            <IconComp size={iconSize} color={iconColor} strokeWidth={strokeWidth} />
        );
        
        // Ensure xmlns is present for proper encoding and usage in CSS/Downloads
        if (!svgStr.includes('xmlns=')) {
            svgStr = svgStr.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
        }
        return svgStr;
    }, [selectedIcon, iconSize, strokeWidth, iconColor]);

    // ── Copy SVG code ────────────────────────────────────────
    const copySvgCode = useCallback(async () => {
        const svgStr = getSvgString();
        if (!svgStr) return;
        try {
            await navigator.clipboard.writeText(svgStr);
            setCopied('svg');
            showToast('SVG copiado al portapapeles');
            setTimeout(() => setCopied(null), 2000);
        } catch { /* ignore */ }
    }, [getSvgString, showToast]);

    // ── Copy as PNG image ────────────────────────────────────
    const copyAsImage = useCallback(async () => {
        const svgStr = getSvgString();
        if (!svgStr) return;
        try {
            const exportSize = Math.max(iconSize, 128);
            const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const img = new window.Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });
            const canvas = document.createElement('canvas');
            canvas.width = exportSize;
            canvas.height = exportSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, exportSize, exportSize);
            URL.revokeObjectURL(url);

            const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': pngBlob })
            ]);
            setCopied('image');
            showToast('Imagen PNG copiada al portapapeles');
            setTimeout(() => setCopied(null), 2000);
        } catch { /* ignore */ }
    }, [getSvgString, iconSize, showToast]);

    // ── Copy icon name ───────────────────────────────────────
    const copyName = useCallback(async (name) => {
        try {
            await navigator.clipboard.writeText(name);
            setCopied('name');
            showToast(`Nombre "${name}" copiado`);
            setTimeout(() => setCopied(null), 2000);
        } catch { /* ignore */ }
    }, [showToast]);

    // ── Copy CSS background ──────────────────────────────────
    const copyCssCode = useCallback(async () => {
        const svgStr = getSvgString();
        if (!svgStr) return;
        try {
            // More robust SVG to Base64 specifically for CSS
            const encodedData = window.btoa(unescape(encodeURIComponent(svgStr)));
            const code = `background-image: url("data:image/svg+xml;base64,${encodedData}");`;
            await navigator.clipboard.writeText(code);
            setCopied('css');
            setTimeout(() => setCopied(null), 2000);
        } catch (e) { console.error('Error copying CSS:', e); }
    }, [getSvgString]);

    // ── Download SVG file ────────────────────────────────────
    const downloadSvg = useCallback(() => {
        const svgStr = getSvgString();
        if (!svgStr || !selectedIcon) return;
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = `${selectedIcon.name.toLowerCase()}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }, [getSvgString, selectedIcon]);

    // ── Download PNG file ────────────────────────────────────
    const downloadPng = useCallback(async () => {
        const svgStr = getSvgString();
        if (!svgStr || !selectedIcon) return;
        const exportSize = Math.max(iconSize, 256);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new window.Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });
        const canvas = document.createElement('canvas');
        canvas.width = exportSize;
        canvas.height = exportSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, exportSize, exportSize);
        URL.revokeObjectURL(url);

        canvas.toBlob((pngBlob) => {
            const link = document.createElement('a');
            link.download = `${selectedIcon.name.toLowerCase()}.png`;
            link.href = URL.createObjectURL(pngBlob);
            link.click();
            URL.revokeObjectURL(link.href);
        }, 'image/png');
    }, [getSvgString, selectedIcon, iconSize]);

    // ── Drag start for external D&D ──────────────────────────
    const handleDragStart = useCallback((e, iconEntry) => {
        const IconComp = LucideIcons[iconEntry.name];
        if (!IconComp) return;

        // Render the actual SVG synchronously
        const svgMarkup = renderToStaticMarkup(
            <IconComp size={iconSize} color={iconColor} strokeWidth={strokeWidth} />
        );

        // Word and rich text editors prioritize text/html. 
        // We wrap it in a div to ensure proper HTML parsing.
        e.dataTransfer.setData('text/html', `<div>${svgMarkup}</div>`);
        
        // Native SVG support
        e.dataTransfer.setData('image/svg+xml', svgMarkup);
        
        // Fallback to name
        e.dataTransfer.setData('text/plain', iconEntry.name);
        
        e.dataTransfer.effectAllowed = 'copy';
    }, [iconSize, strokeWidth, iconColor]);

    // ── Render selected icon ─────────────────────────────────
    const SelectedIconComponent = selectedIcon ? LucideIcons[selectedIcon.name] : null;

    // ── Category scroll ──────────────────────────────────────
    const scrollCats = (dir) => {
        if (catScrollRef.current) {
            catScrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col">

            {/* ── Header ── */}
            <div className="p-5 md:p-6 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                            <Package size={18} />
                        </div>
                        Asset Pocket
                    </h3>
                    <p className="text-zinc-500 text-xs mt-1">
                        {filteredIcons.length} iconos disponibles · Copia SVG o imagen · Drag & Drop
                    </p>
                </div>
                <button
                    onClick={() => setShowControls(!showControls)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${showControls
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                >
                    <SlidersHorizontal size={14} />
                    Personalizar
                </button>
            </div>

            {/* ── Controls Panel ── */}
            {showControls && (
                <div className="px-5 md:px-6 py-4 border-b border-zinc-800 bg-zinc-950/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
                        {/* Size */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Tamaño</span>
                                <span className="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">{iconSize}px</span>
                            </div>
                            <input type="range" min="16" max="96" step="2" value={iconSize}
                                onChange={e => setIconSize(+e.target.value)}
                                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400" />
                        </div>
                        {/* Stroke */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Trazo</span>
                                <span className="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">{strokeWidth}px</span>
                            </div>
                            <input type="range" min="0.5" max="4" step="0.25" value={strokeWidth}
                                onChange={e => setStrokeWidth(+e.target.value)}
                                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400" />
                        </div>
                        {/* Color */}
                        <div className="space-y-3 col-span-2 sm:col-span-1">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">Color</span>
                            <div className="flex items-center gap-3 relative" ref={colorPickerRef}>
                                <button
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl border border-zinc-700 hover:border-zinc-500 transition-colors bg-zinc-800/50 hover:bg-zinc-800"
                                >
                                    <div className="w-6 h-6 rounded-md shadow-inner border border-zinc-700/50" style={{ backgroundColor: iconColor }} />
                                    <span className="text-white font-mono text-sm uppercase">{iconColor}</span>
                                </button>
                                
                                {showColorPicker && (
                                    <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-3 z-50 p-4 bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-[260px]">
                                        <HexColorPicker color={iconColor} onChange={setIconColor} className="!w-full" />
                                        
                                        <div className="mt-5 border-t border-zinc-800/80 pt-4">
                                            <div className="flex bg-[#09090b] p-1 rounded-lg mb-3">
                                                <button className="flex-1 text-[10px] font-bold py-1.5 rounded bg-[#27272a] text-white shadow-sm">HEX</button>
                                                <button className="flex-1 text-[10px] font-bold py-1.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors">RGB</button>
                                                <button className="flex-1 text-[10px] font-bold py-1.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors">HSL</button>
                                            </div>
                                            <HexColorInput 
                                                color={iconColor} 
                                                onChange={setIconColor} 
                                                prefixed 
                                                className="w-full bg-[#09090b] text-white font-mono text-sm px-4 py-3 rounded-xl border border-zinc-800 outline-none focus:border-zinc-600 transition-colors uppercase" 
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                    {['#ffffff', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'].map(c => (
                                        <button key={c} onClick={() => setIconColor(c)}
                                            className={`w-7 h-7 rounded-md border transition-all hover:scale-110 ${iconColor === c ? 'border-white scale-110 ring-2 ring-zinc-800' : 'border-zinc-700'}`}
                                            style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Search + Categories ── */}
            <div className="px-5 md:px-6 pt-4 pb-2 space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                    <input
                        type="text"
                        ref={searchRef}
                        placeholder="Buscar icono... (ej. flecha, corazón, usuario)  [Pulsa / ]"
                        className="w-full bg-zinc-800 border border-zinc-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs">
                            ✕
                        </button>
                    )}
                </div>

                {/* Category pills */}
                <div className="relative">
                    <button onClick={() => scrollCats(-1)}
                        className="absolute left-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-r from-zinc-900 to-transparent text-zinc-400 hover:text-white md:hidden">
                        <ChevronLeft size={16} />
                    </button>
                    <div ref={catScrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 px-1">
                        {ICON_CATEGORIES.map(cat => (
                            <button key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeCategory === cat.id
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                                    : 'bg-zinc-800/70 text-zinc-400 hover:text-white hover:bg-zinc-700 hover:shadow-sm border border-transparent'
                                    }`}
                            >
                                <span className="text-[13px]">{cat.emoji}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => scrollCats(1)}
                        className="absolute right-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-l from-zinc-900 to-transparent text-zinc-400 hover:text-white md:hidden">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-[500px]">

                {/* ── Icon Grid ── */}
                <div className="flex-1 p-5 md:p-6 flex flex-col">
                    {pagedIcons.length > 0 ? (
                        <>
                            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                                {pagedIcons.map(entry => {
                                    const IconComp = LucideIcons[entry.name];
                                    if (!IconComp) return null;
                                    const isSelected = selectedIcon?.name === entry.name;
                                    return (
                                        <button
                                            key={entry.name}
                                            onClick={() => {
                                            setSelectedIcon(entry);
                                            // On mobile open bottom sheet
                                            if (window.innerWidth < 1024) setShowBottomSheet(true);
                                        }}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, entry)}
                                            title={entry.name}
                                            className={`group relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 border ${isSelected
                                                ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20 scale-105'
                                                : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 hover:scale-105'
                                                }`}
                                        >
                                            <IconComp
                                                size={32}
                                                strokeWidth={strokeWidth}
                                                className={`transition-colors ${isSelected ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-white'}`}
                                                style={{ color: isSelected ? iconColor : undefined }}
                                            />
                                            <span className={`text-[9px] mt-1.5 truncate max-w-full px-1 font-medium transition-colors ${isSelected ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                                                {entry.name}
                                            </span>
                                            <GripVertical size={8} className="absolute top-1 right-1 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-zinc-800">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="text-zinc-500 text-xs font-mono">
                                        {page} / {totalPages}
                                    </span>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                            <AlertCircle size={32} className="text-zinc-600" />
                            <p className="text-zinc-500 text-sm">No se encontraron iconos para "<span className="text-white">{search}</span>"</p>
                            <button onClick={() => { setSearch(''); setActiveCategory('all'); }}
                                className="text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors">
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Detail Panel (Desktop sticky sidebar) ── */}
                {selectedIcon && SelectedIconComponent && (
                    <div className="hidden lg:flex lg:w-80 shrink-0 border-l border-zinc-800 bg-zinc-950/30">
                        <div className="sticky top-4 w-full p-6 flex flex-col gap-5 max-h-[calc(100vh-2rem)] overflow-y-auto">

                        {/* Preview */}
                        <div className="flex flex-col items-center gap-4">
                            <div
                                ref={svgRef}
                                className="w-full aspect-square max-w-[200px] flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 relative"
                                style={{ backgroundImage: 'linear-gradient(45deg, #1a1a1e 25%, transparent 25%), linear-gradient(-45deg, #1a1a1e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1e 75%), linear-gradient(-45deg, transparent 75%, #1a1a1e 75%)', backgroundSize: '12px 12px', backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px' }}
                            >
                                <SelectedIconComponent
                                    size={iconSize}
                                    strokeWidth={strokeWidth}
                                    color={iconColor}
                                />
                            </div>

                            <div className="text-center">
                                <button onClick={() => copyName(selectedIcon.name)}
                                    className="text-white font-bold text-lg hover:text-emerald-400 transition-colors flex items-center gap-2 mx-auto">
                                    {selectedIcon.name}
                                    {copied === 'name' ? <Check size={14} className="text-emerald-400" /> : <Copy size={10} className="text-zinc-500" />}
                                </button>
                                <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-wider mt-1 block">
                                    {ICON_CATEGORIES.find(c => c.id === selectedIcon.cat)?.label || selectedIcon.cat}
                                </span>
                            </div>
                        </div>

                        {/* Info pills */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                                {iconSize}×{iconSize}px
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                                stroke: {strokeWidth}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                                <span className="w-2.5 h-2.5 rounded-full border border-zinc-600" style={{ backgroundColor: iconColor }} />
                                {iconColor}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Copiar</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={copySvgCode}
                                    className={`py-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.97] ${copied === 'svg'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                                        }`}>
                                    {copied === 'svg' ? <><Check size={14} /> ¡Copiado!</> : <><Code size={14} /> SVG</>}
                                </button>
                                <button onClick={copyAsImage}
                                    className={`py-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.97] ${copied === 'image'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                                        }`}>
                                    {copied === 'image' ? <><Check size={14} /> ¡Copiado!</> : <><ImageIcon size={14} /> Imagen</>}
                                </button>
                                <button onClick={copyCssCode}
                                    className={`py-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.97] ${copied === 'css'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                                        }`}>
                                    {copied === 'css' ? <><Check size={14} /> ¡Copiado!</> : <><Paintbrush size={14} /> CSS</>}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Descargar</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={downloadSvg}
                                    className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.97] border border-zinc-700">
                                    <Download size={14} /> .SVG
                                </button>
                                <button onClick={downloadPng}
                                    className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.97] border border-zinc-700">
                                    <Download size={14} /> .PNG
                                </button>
                            </div>
                        </div>


                    </div>
                </div>
            )}
            </div>

            {/* ── Mobile Bottom Sheet ── */}
            {showBottomSheet && selectedIcon && SelectedIconComponent && (
                <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBottomSheet(false)} />
                    {/* Sheet */}
                    <div className="relative bg-zinc-900 border-t border-zinc-700 rounded-t-3xl p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        {/* Handle */}
                        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto -mt-1 mb-1" />
                        {/* Icon preview row */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-800">
                                <SelectedIconComponent size={iconSize} strokeWidth={strokeWidth} color={iconColor} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-base">{selectedIcon.name}</p>
                                <p className="text-zinc-500 text-xs mt-0.5">{ICON_CATEGORIES.find(c => c.id === selectedIcon.cat)?.label || selectedIcon.cat}</p>
                            </div>
                            <button onClick={() => setShowBottomSheet(false)} className="ml-auto text-zinc-500 hover:text-white text-xl leading-none">×</button>
                        </div>
                        {/* Copy buttons */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Copiar</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={copySvgCode} className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${copied==='svg'?'bg-emerald-600 text-white':'bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700'}`}>
                                    {copied==='svg'?<><Check size={15}/> ¡Copiado!</>:<><Code size={15}/> SVG</>}
                                </button>
                                <button onClick={copyAsImage} className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${copied==='image'?'bg-emerald-600 text-white':'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                                    {copied==='image'?<><Check size={15}/> ¡Copiado!</>:<><ImageIcon size={15}/> Imagen</>}
                                </button>
                                <button onClick={copyCssCode} className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${copied==='css'?'bg-emerald-600 text-white':'bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700'}`}>
                                    {copied==='css'?<><Check size={15}/> ¡Copiado!</>:<><Paintbrush size={15}/> CSS</>}
                                </button>
                            </div>
                        </div>
                        {/* Download buttons */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Descargar</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={downloadSvg} className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-zinc-700">
                                    <Download size={15}/> .SVG
                                </button>
                                <button onClick={downloadPng} className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-zinc-700">
                                    <Download size={15}/> .PNG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast Notification ── */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white text-sm font-medium shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Check size={15} className="text-emerald-400" />
                    {toast}
                </div>
            )}
        </div>
    );
}
