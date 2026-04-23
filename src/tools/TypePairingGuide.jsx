import React, { useState, useEffect, useMemo } from 'react';
import { Type, Shuffle, Copy, Check, Download, Info, AlignLeft, Bold, Settings2 } from 'lucide-react';

const FONTS = [
    { name: 'Inter', type: 'sans-serif', url: 'Inter:wght@400;500;700' },
    { name: 'Roboto', type: 'sans-serif', url: 'Roboto:wght@400;500;700' },
    { name: 'Playfair Display', type: 'serif', url: 'Playfair+Display:ital,wght@0,400;0,700;1,400' },
    { name: 'Merriweather', type: 'serif', url: 'Merriweather:ital,wght@0,400;0,700;1,400' },
    { name: 'Montserrat', type: 'sans-serif', url: 'Montserrat:wght@400;500;700' },
    { name: 'Lora', type: 'serif', url: 'Lora:ital,wght@0,400;0,700;1,400' },
    { name: 'Open Sans', type: 'sans-serif', url: 'Open+Sans:wght@400;500;700' },
    { name: 'Lato', type: 'sans-serif', url: 'Lato:wght@400;700' },
    { name: 'Oswald', type: 'sans-serif', url: 'Oswald:wght@400;500;700' },
    { name: 'Raleway', type: 'sans-serif', url: 'Raleway:wght@400;500;700' },
    { name: 'Poppins', type: 'sans-serif', url: 'Poppins:wght@400;500;700' },
    { name: 'Nunito', type: 'sans-serif', url: 'Nunito:wght@400;600;700' },
    { name: 'Source Serif 4', type: 'serif', url: 'Source+Serif+4:wght@400;600;700' },
    { name: 'Crimson Pro', type: 'serif', url: 'Crimson+Pro:ital,wght@0,400;0,700;1,400' },
    { name: 'Work Sans', type: 'sans-serif', url: 'Work+Sans:wght@400;500;700' },
    { name: 'Syne', type: 'sans-serif', url: 'Syne:wght@400;700;800' },
    { name: 'Space Grotesk', type: 'sans-serif', url: 'Space+Grotesk:wght@400;500;700' },
    { name: 'Cormorant Garamond', type: 'serif', url: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400' },
    { name: 'DM Sans', type: 'sans-serif', url: 'DM+Sans:ital,wght@0,400;0,500;0,700;1,400' },
    { name: 'Bebas Neue', type: 'sans-serif', url: 'Bebas+Neue' },
];

const CURATED_PAIRS = [
    { heading: 'Playfair Display', body: 'Source Serif 4' },
    { heading: 'Montserrat', body: 'Merriweather' },
    { heading: 'Oswald', body: 'Open Sans' },
    { heading: 'Poppins', body: 'Lora' },
    { heading: 'Syne', body: 'Inter' },
    { heading: 'Cormorant Garamond', body: 'Proza Libre' }, // Note: Proza Libre isn't in main list, we'll map to Lato or add it if needed. Let's stick to list fonts.
    { heading: 'Cormorant Garamond', body: 'Lato' },
    { heading: 'Space Grotesk', body: 'Inter' },
    { heading: 'Bebas Neue', body: 'Montserrat' },
    { heading: 'Merriweather', body: 'Open Sans' },
    { heading: 'Raleway', body: 'Roboto' }
];

export function TypePairingGuide() {
    const [headingFont, setHeadingFont] = useState(FONTS.find(f => f.name === 'Playfair Display'));
    const [bodyFont, setBodyFont] = useState(FONTS.find(f => f.name === 'Inter'));
    
    const [headingSize, setHeadingSize] = useState(64);
    const [bodySize, setBodySize] = useState(18);
    const [headingLineHeight, setHeadingLineHeight] = useState(1.1);
    const [bodyLineHeight, setBodyLineHeight] = useState(1.6);
    
    const [copied, setCopied] = useState(false);

    // Cargar fuentes de Google Fonts
    useEffect(() => {
        const loadFonts = () => {
            const fontUrls = [headingFont, bodyFont]
                .filter(Boolean)
                .map(font => `family=${font.url}`);
            
            if (fontUrls.length === 0) return;

            const url = `https://fonts.googleapis.com/css2?${fontUrls.join('&')}&display=swap`;
            
            let linkId = 'google-fonts-pairing';
            let linkElement = document.getElementById(linkId);

            if (!linkElement) {
                linkElement = document.createElement('link');
                linkElement.id = linkId;
                linkElement.rel = 'stylesheet';
                document.head.appendChild(linkElement);
            }
            
            linkElement.href = url;
        };

        loadFonts();
    }, [headingFont, bodyFont]);

    const handleShuffle = () => {
        const randomPair = CURATED_PAIRS[Math.floor(Math.random() * CURATED_PAIRS.length)];
        const newHeadingFont = FONTS.find(f => f.name === randomPair.heading) || FONTS[0];
        const newBodyFont = FONTS.find(f => f.name === randomPair.body) || FONTS[1];
        
        setHeadingFont(newHeadingFont);
        setBodyFont(newBodyFont);
    };

    const copyCSS = () => {
        const css = `/* Font Pairings */
:root {
  --font-heading: '${headingFont.name}', ${headingFont.type};
  --font-body: '${bodyFont.name}', ${bodyFont.type};
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

body {
  font-family: var(--font-body);
}

/* Para importar en tu CSS: */
/* @import url('https://fonts.googleapis.com/css2?family=${headingFont.url}&family=${bodyFont.url}&display=swap'); */`;

        navigator.clipboard.writeText(css);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
            {/* Panel de Controles (Izquierda) */}
            <div className="w-full md:w-80 bg-zinc-950/50 p-6 flex flex-col gap-8 border-b md:border-b-0 md:border-r border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                        <Type size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Type Pairing</h3>
                        <p className="text-zinc-500 text-xs">Descubre combinaciones perfectas</p>
                    </div>
                </div>

                {/* Controles de Título */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Fuente del Título
                        </label>
                        <select 
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                            value={headingFont.name}
                            onChange={(e) => setHeadingFont(FONTS.find(f => f.name === e.target.value))}
                            style={{ fontFamily: headingFont.name }}
                        >
                            {FONTS.map(font => (
                                <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                                    {font.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-medium">Tamaño</span>
                            <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded text-[10px]">{headingSize}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="32" max="120" 
                            value={headingSize} 
                            onChange={(e) => setHeadingSize(e.target.value)}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        
                        <div className="flex justify-between items-center text-xs pt-2">
                            <span className="text-zinc-400 font-medium">Interlineado</span>
                            <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded text-[10px]">{headingLineHeight}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.8" max="1.5" step="0.05"
                            value={headingLineHeight} 
                            onChange={(e) => setHeadingLineHeight(e.target.value)}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                <hr className="border-zinc-800" />

                {/* Controles de Cuerpo */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                            Fuente del Cuerpo
                        </label>
                        <select 
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-500 outline-none transition-all appearance-none cursor-pointer"
                            value={bodyFont.name}
                            onChange={(e) => setBodyFont(FONTS.find(f => f.name === e.target.value))}
                            style={{ fontFamily: bodyFont.name }}
                        >
                            {FONTS.map(font => (
                                <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                                    {font.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-medium">Tamaño</span>
                            <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded text-[10px]">{bodySize}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="14" max="24" 
                            value={bodySize} 
                            onChange={(e) => setBodySize(e.target.value)}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                        />
                        
                        <div className="flex justify-between items-center text-xs pt-2">
                            <span className="text-zinc-400 font-medium">Interlineado</span>
                            <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded text-[10px]">{bodyLineHeight}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1.2" max="2.0" step="0.05"
                            value={bodyLineHeight} 
                            onChange={(e) => setBodyLineHeight(e.target.value)}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                        />
                    </div>
                </div>

                {/* Designer Tip Section */}
                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-3">
                    <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                        <strong className="text-blue-400 block mb-1">Tip de Diseño:</strong>
                        Combina una fuente <span className="text-white font-medium">Serif</span> para títulos con una <span className="text-white font-medium">Sans Serif</span> para el cuerpo para lograr un contraste clásico y elegante.
                    </p>
                </div>

                <div className="mt-auto pt-6 flex gap-2">
                    <button 
                        onClick={handleShuffle}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                        <Shuffle size={16} /> Inspiración
                    </button>
                    <button 
                        onClick={copyCSS}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-blue-500/20"
                        title="Copiar CSS"
                    >
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                </div>
            </div>

            {/* Lienzo de Previsualización (Derecha) */}
            <div className="flex-1 bg-[#fdfcfb] text-zinc-900 relative overflow-y-auto min-h-[500px] md:min-h-0">
                {/* Navbar mock */}
                <div className="sticky top-0 p-6 flex justify-between items-center border-b border-zinc-200/50 bg-[#fdfcfb]/80 backdrop-blur-sm z-10" style={{ fontFamily: headingFont.name }}>
                    <div className="font-bold text-xl tracking-tight">Kreative.</div>
                    <div className="hidden sm:flex gap-6 text-sm" style={{ fontFamily: bodyFont.name }}>
                        <span className="cursor-pointer hover:text-blue-600 transition-colors">Portafolio</span>
                        <span className="cursor-pointer hover:text-blue-600 transition-colors">Servicios</span>
                        <span className="cursor-pointer hover:text-blue-600 transition-colors">Contacto</span>
                    </div>
                </div>

                {/* Contenido principal editable */}
                <div className="max-w-3xl mx-auto p-8 md:p-16 lg:p-24 space-y-8">
                    
                    <div className="space-y-6">
                        <div 
                            className="text-blue-600 font-bold tracking-widest text-sm uppercase"
                            style={{ fontFamily: bodyFont.name }}
                            contentEditable
                            suppressContentEditableWarning
                        >
                            Diseño Estratégico
                        </div>
                        
                        <h1 
                            className="font-bold text-zinc-900 outline-none focus:bg-blue-50/50 rounded transition-colors break-words"
                            style={{ 
                                fontFamily: `'${headingFont.name}', ${headingFont.type}`, 
                                fontSize: `${headingSize}px`,
                                lineHeight: headingLineHeight,
                                letterSpacing: headingFont.name === 'Bebas Neue' || headingFont.name === 'Oswald' ? '0.02em' : '-0.02em'
                            }}
                            contentEditable
                            suppressContentEditableWarning
                        >
                            Construimos experiencias digitales inolvidables.
                        </h1>
                        
                        <p 
                            className="text-zinc-600 max-w-2xl outline-none focus:bg-zinc-100/50 rounded transition-colors break-words"
                            style={{ 
                                fontFamily: `'${bodyFont.name}', ${bodyFont.type}`, 
                                fontSize: `${bodySize}px`,
                                lineHeight: bodyLineHeight
                            }}
                            contentEditable
                            suppressContentEditableWarning
                        >
                            El buen diseño no es solo lo que se ve, sino cómo funciona. Nuestra agencia transforma ideas complejas en interfaces intuitivas, hermosas y escalables. Prueba a hacer clic aquí y editar este texto para ver cómo se comporta tu nueva combinación tipográfica en un escenario real de uso.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4" style={{ fontFamily: bodyFont.name }}>
                        <button className="bg-zinc-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-zinc-800 transition-colors w-full sm:w-auto">
                            Empezar Proyecto
                        </button>
                        <button className="bg-white text-zinc-900 border border-zinc-200 px-8 py-4 rounded-xl font-medium hover:bg-zinc-50 transition-colors w-full sm:w-auto">
                            Ver Galería
                        </button>
                    </div>

                    <div className="pt-24 grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h3 
                                className="font-bold text-zinc-900 text-2xl outline-none focus:bg-blue-50/50 rounded"
                                style={{ fontFamily: `'${headingFont.name}', ${headingFont.type}` }}
                                contentEditable
                                suppressContentEditableWarning
                            >
                                Metodología Ágil
                            </h3>
                            <p 
                                className="text-zinc-600"
                                style={{ fontFamily: `'${bodyFont.name}', ${bodyFont.type}`, fontSize: `${Math.max(14, bodySize * 0.85)}px`, lineHeight: bodyLineHeight }}
                                contentEditable
                                suppressContentEditableWarning
                            >
                                Iteramos rápidamente para adaptar el producto a las necesidades reales de los usuarios, minimizando riesgos y asegurando resultados óptimos en cada sprint.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 
                                className="font-bold text-zinc-900 text-2xl outline-none focus:bg-blue-50/50 rounded"
                                style={{ fontFamily: `'${headingFont.name}', ${headingFont.type}` }}
                                contentEditable
                                suppressContentEditableWarning
                            >
                                Código Limpio
                            </h3>
                            <p 
                                className="text-zinc-600"
                                style={{ fontFamily: `'${bodyFont.name}', ${bodyFont.type}`, fontSize: `${Math.max(14, bodySize * 0.85)}px`, lineHeight: bodyLineHeight }}
                                contentEditable
                                suppressContentEditableWarning
                            >
                                No solo diseñamos. Desarrollamos arquitecturas frontend robustas, escalables y fáciles de mantener usando las últimas tecnologías del mercado.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
