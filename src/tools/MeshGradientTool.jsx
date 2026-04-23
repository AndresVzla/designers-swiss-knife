import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shuffle, Copy, Check, Download, Plus, Minus, Play, Square } from 'lucide-react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

// ── Color utils ──────────────────────────────────────────────
const getRgb = (hex) => {
    const h = hex.replace('#', '');
    return { r: parseInt(h.slice(0,2),16)||0, g: parseInt(h.slice(2,4),16)||0, b: parseInt(h.slice(4,6),16)||0 };
};
const toHex = (r,g,b) => '#'+[r,g,b].map(x=>{const h=x.toString(16);return h.length===1?'0'+h:h;}).join('');
const toHSL = (hex) => {
    let {r,g,b}=getRgb(hex); r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h/=6;}
    return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];
};
const hslToRgb=(h,s,l)=>{s/=100;l/=100;const k=n=>((n+h/30)%12);const a=s*Math.min(l,1-l);const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return[Math.round(255*f(0)),Math.round(255*f(8)),Math.round(255*f(4))];};
const rgbToCmyk=(r,g,b)=>{let c=1-(r/255),m=1-(g/255),y=1-(b/255),k=Math.min(c,m,y);if(k===1)return{c:0,m:0,y:0,k:100};return{c:Math.round(((c-k)/(1-k))*100),m:Math.round(((m-k)/(1-k))*100),y:Math.round(((y-k)/(1-k))*100),k:Math.round(k*100)};};
const cmykToRgb=(c,m,y,k)=>[Math.round(255*(1-c/100)*(1-k/100)),Math.round(255*(1-m/100)*(1-k/100)),Math.round(255*(1-y/100)*(1-k/100))];

// ── Palettes ─────────────────────────────────────────────────
const PALETTES = [
    { name: 'Sunset', colors: ['#FF512F','#DD2476','#FF9A9E','#FECFEF','#A18CD1','#FBC2EB','#FF6B6B','#FFE66D','#4ECDC4'] },
    { name: 'Ocean', colors:  ['#00C9FF','#92FE9D','#4FACFE','#00F2FE','#30CFD0','#330867','#1A1A2E','#2ECC71','#3498DB'] },
    { name: 'Cyber', colors:  ['#1A1A2E','#16213E','#0F3460','#E94560','#533483','#7B2D8B','#00B4DB','#FF6B6B','#FFE66D'] },
    { name: 'Terra', colors:  ['#F4A261','#E76F51','#2A9D8F','#E9C46A','#264653','#E07A5F','#3D405B','#81B29A','#F2CC8F'] },
    { name: 'Pastel', colors: ['#FFB3BA','#FFDFBA','#FFFFBA','#B5EAD7','#C7CEEA','#FF9AA2','#FFB7B2','#FFDAC1','#E2F0CB'] },
    { name: 'Vivid', colors:  ['#11998E','#38EF7D','#108DC7','#EF8E38','#FC4A1A','#4A00E0','#8E2DE2','#F7971E','#FFD200'] },
    { name: 'Nordic', colors: ['#2C3E50','#3498DB','#ECF0F1','#BDC3C7','#34495E','#2980B9','#7F8C8D','#95A5A6','#1ABC9C'] },
    { name: 'Aurora', colors: ['#085078','#85D8CE','#085078','#2BC0B4','#7C83FD','#96BAFF','#EAAFC8','#FCEABB','#A1FFCE'] },
];

const generatePos = (count) => {
        const positions = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * 2 * Math.PI;
            const r = 0.3 + Math.random() * 0.3;
            positions.push({
                x: Math.round(50 + Math.cos(angle) * r * 80),
                y: Math.round(50 + Math.sin(angle) * r * 80),
                size: 45 + Math.floor(Math.random() * 30),
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
            });
        }
        return positions;
};

// ── Component ─────────────────────────────────────────────────
export function MeshGradientTool() {
    const [nodes, setNodes] = useState([]);
    const [nodeCount, setNodeCount] = useState(6);
    const [activePalette, setActivePalette] = useState(0);
    const [copied, setCopied] = useState(false);
    const [noiseLevel, setNoiseLevel] = useState(0.03);
    const [bgDark, setBgDark] = useState(true);
    const [draggingNode, setDraggingNode] = useState(null);
    const [openPickerIndex, setOpenPickerIndex] = useState(null);
    const [inputMode, setInputMode] = useState('HEX');
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef(null);
    const pickerRef = useRef(null);
    const animationRef = useRef(null);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Close picker on outside click
    useEffect(() => {
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpenPickerIndex(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const buildNodes = useCallback((count, paletteIdx) => {
        const palette = PALETTES[paletteIdx].colors;
        const positions = generatePos(count);
        return positions.map((pos, i) => ({
            color: palette[i % palette.length],
            x: Math.min(Math.max(pos.x, 8), 92),
            y: Math.min(Math.max(pos.y, 8), 92),
            size: pos.size,
            vx: pos.vx,
            vy: pos.vy
        }));
    }, []);

    useEffect(() => { setNodes(buildNodes(nodeCount, activePalette)); }, []);

    // Animation loop
    useEffect(() => {
        if (!isAnimating) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        let lastTime = performance.now();
        const tick = (time) => {
            const dt = Math.min(time - lastTime, 50); // limit delta to avoid jumps
            lastTime = time;

            setNodes(prev => prev.map((n, i) => {
                if (draggingNode === i) return n; // Skip dragged node

                let newX = n.x + n.vx * (dt / 16);
                let newY = n.y + n.vy * (dt / 16);
                let vx = n.vx;
                let vy = n.vy;

                // Bounce off edges (5% to 95%)
                if (newX < 5) { newX = 5; vx *= -1; }
                if (newX > 95) { newX = 95; vx *= -1; }
                if (newY < 5) { newY = 5; vy *= -1; }
                if (newY > 95) { newY = 95; vy *= -1; }

                return { ...n, x: newX, y: newY, vx, vy };
            }));

            animationRef.current = requestAnimationFrame(tick);
        };
        animationRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(animationRef.current);
    }, [isAnimating, draggingNode]);

    const handleShuffle = () => {
        const next = (activePalette + 1) % PALETTES.length;
        setActivePalette(next);
        setNodes(buildNodes(nodeCount, next));
    };

    const handleSetNodeCount = (delta) => {
        const next = Math.min(Math.max(nodeCount + delta, 2), 6);
        setNodeCount(next);
        const palette = PALETTES[activePalette].colors;
        const positions = generatePos(next);
        setNodes(positions.map((pos, i) => ({
            color: palette[i % palette.length],
            x: Math.min(Math.max(pos.x, 8), 92),
            y: Math.min(Math.max(pos.y, 8), 92),
            size: pos.size,
        })));
        setOpenPickerIndex(null);
    };

    const handleColorChange = (index, color) => {
        setNodes(prev => { const n=[...prev]; n[index]={...n[index],color}; return n; });
    };

    const getGradientStyle = () => ({
        backgroundColor: bgDark ? '#0d0d0f' : '#f8f8fc',
        backgroundImage: nodes.map(n => `radial-gradient(at ${n.x}% ${n.y}%, ${n.color} 0px, transparent ${n.size}%)`).join(', '),
    });

    const copyCSS = () => {
        const bg = getGradientStyle();
        const imgs = nodes.map(n=>`radial-gradient(at ${n.x}% ${n.y}%, ${n.color} 0px, transparent ${n.size}%)`).join(',\n    ');
        let css = '';
        
        if (noiseLevel > 0) {
            const noiseOpacity = Math.round(noiseLevel * 200) / 100;
            const svg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${noiseOpacity}'/%3E%3C/svg%3E`;
            css = `.mesh-bg {\n  background-color: ${bg.backgroundColor};\n  background-image:\n    url("${svg}"),\n    ${imgs};\n  background-blend-mode: overlay${', normal'.repeat(nodes.length)};\n}`;
        } else {
            css = `.mesh-bg {\n  background-color: ${bg.backgroundColor};\n  background-image:\n    ${imgs};\n}`;
        }
        
        navigator.clipboard.writeText(css);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadPNG = () => {
        const size = 2000;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = bgDark ? '#0d0d0f' : '#f8f8fc';
        ctx.fillRect(0, 0, size, size);
        
        nodes.forEach(n => {
            const grad = ctx.createRadialGradient(
                n.x/100*size, n.y/100*size, 0,
                n.x/100*size, n.y/100*size, n.size/100*size*1.2
            );
            const hex = n.color;
            grad.addColorStop(0, hex + 'cc');
            grad.addColorStop(1, hex + '00');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
        });

        const triggerDownload = () => {
            const link = document.createElement('a');
            link.download = `mesh-gradient.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        if (noiseLevel > 0) {
            const noiseOpacity = Math.round(noiseLevel * 200) / 100;
            const svg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${noiseOpacity}'/%3E%3C/svg%3E`;
            const img = new Image();
            img.onload = () => {
                ctx.globalCompositeOperation = 'overlay';
                const pattern = ctx.createPattern(img, 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, size, size);
                ctx.globalCompositeOperation = 'source-over';
                triggerDownload();
            };
            img.src = svg;
        } else {
            triggerDownload();
        }
    };

    const handlePointerMove = useCallback((e) => {
        if (draggingNode === null || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const marginX = (24 / rect.width) * 100;
        const marginY = (24 / rect.height) * 100;
        const rawX = ((e.clientX - rect.left) / rect.width) * 100;
        const rawY = ((e.clientY - rect.top) / rect.height) * 100;
        const x = Math.max(marginX, Math.min(100 - marginX, rawX));
        const y = Math.max(marginY, Math.min(100 - marginY, rawY));
        setNodes(prev => { const n=[...prev]; n[draggingNode]={...n[draggingNode],x,y}; return n; });
    }, [draggingNode]);

    const handlePointerUp = useCallback(() => setDraggingNode(null), []);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col-reverse md:flex-row min-h-[700px] isolate">

            {/* ── LEFT PANEL ── */}
            <div className="w-full md:w-72 bg-zinc-950/60 flex flex-col border-t md:border-t-0 md:border-r border-zinc-800 shrink-0 overflow-y-auto z-30">

                {/* Header */}
                <div className="p-5 border-b border-zinc-800">
                    <h3 className="text-white font-bold text-sm">Mesh Gradient</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Arrastra los nodos · Elige colores</p>
                </div>



                {/* Node count */}
                <div className="p-5 border-b border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nodos</span>
                        <span className="text-white font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md">{nodeCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleSetNodeCount(-1)} disabled={nodeCount <= 2}
                            className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white transition-colors flex items-center justify-center">
                            <Minus size={14} />
                        </button>
                        <div className="flex-1 flex gap-1">
                            {[2,3,4,5,6].map(n => (
                                <button key={n} onClick={() => handleSetNodeCount(n - nodeCount)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-colors ${nodeCount===n?'bg-indigo-600 text-white':'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                                    {n}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => handleSetNodeCount(1)} disabled={nodeCount >= 6}
                            className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white transition-colors flex items-center justify-center">
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {/* Color nodes */}
                <div className="p-5 border-b border-zinc-800 space-y-3" ref={pickerRef}>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Colores</span>
                    <div className="grid grid-cols-3 gap-2">
                        {nodes.map((node, index) => {
                            const rgb = getRgb(node.color);
                            const [hh,hs,hl] = toHSL(node.color);
                            const hsl = {h:hh,s:hs,l:hl};
                            const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
                            return (
                                <div key={index} className="relative">
                                    <button
                                        onClick={() => setOpenPickerIndex(openPickerIndex === index ? null : index)}
                                        className={`w-full h-10 rounded-xl border-2 transition-all ${openPickerIndex===index?'border-white scale-105':'border-white/10 hover:border-white/40'}`}
                                        style={{ backgroundColor: node.color }}
                                        title={`Nodo ${index+1}: ${node.color}`}
                                    />
                                    <span className="block text-center text-[9px] text-zinc-600 mt-1 font-mono">{index+1}</span>
                                    {openPickerIndex === index && (
                                        <div className={`absolute top-full mt-2 z-50 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl min-w-[240px] ${
                                            index % 3 === 2 ? 'right-0' : index % 3 === 1 ? 'left-1/2 -translate-x-1/2' : 'left-0'
                                        }`} style={{zIndex:100}}>
                                            <HexColorPicker color={node.color} onChange={(c) => handleColorChange(index, c)} />
                                            <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-col gap-2">
                                                <div className="flex bg-zinc-900 p-0.5 rounded-lg">
                                                    {['HEX','RGB','HSL','CMYK'].map(m => (
                                                        <button key={m} onClick={()=>setInputMode(m)}
                                                            className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${inputMode===m?'bg-zinc-700 text-white':'text-zinc-500 hover:text-zinc-300'}`}>
                                                            {m}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="h-9 flex items-center">
                                                    {inputMode==='HEX' && (
                                                        <div className="flex flex-1 bg-black border border-zinc-800 rounded-lg overflow-hidden">
                                                            <span className="text-zinc-500 pl-3 py-2 text-sm">#</span>
                                                            <HexColorInput color={node.color} onChange={c=>handleColorChange(index,c)} className="bg-transparent text-white font-mono text-sm w-full outline-none py-2 uppercase" prefixed={false} />
                                                        </div>
                                                    )}
                                                    {inputMode==='RGB' && (
                                                        <div className="flex gap-1.5 w-full">
                                                            {['r','g','b'].map(ch=>(
                                                                <input key={ch} type="number" value={rgb[ch]} placeholder={ch.toUpperCase()}
                                                                    onChange={e=>{const v=Math.max(0,Math.min(255,+e.target.value||0));handleColorChange(index,toHex({...rgb,[ch]:v}.r,{...rgb,[ch]:v}.g,{...rgb,[ch]:v}.b));}}
                                                                    className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-xs text-center py-2 outline-none focus:border-indigo-500" />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {inputMode==='HSL' && (
                                                        <div className="flex gap-1.5 w-full">
                                                            {['h','s','l'].map(ch=>(
                                                                <input key={ch} type="number" value={hsl[ch]} placeholder={ch.toUpperCase()}
                                                                    onChange={e=>{const v=Math.max(0,Math.min(ch==='h'?360:100,+e.target.value||0));const nh={...hsl,[ch]:v};const[r,g,b]=hslToRgb(nh.h,nh.s,nh.l);handleColorChange(index,toHex(r,g,b));}}
                                                                    className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-xs text-center py-2 outline-none focus:border-indigo-500" />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {inputMode==='CMYK' && (
                                                        <div className="flex gap-1 w-full">
                                                            {['c','m','y','k'].map(ch=>(
                                                                <input key={ch} type="number" value={cmyk[ch]} placeholder={ch.toUpperCase()}
                                                                    onChange={e=>{const v=Math.max(0,Math.min(100,+e.target.value||0));const nc={...cmyk,[ch]:v};const[r,g,b]=cmykToRgb(nc.c,nc.m,nc.y,nc.k);handleColorChange(index,toHex(r,g,b));}}
                                                                    className="w-full bg-black border border-zinc-800 rounded-lg text-white font-mono text-[10px] text-center py-2 outline-none focus:border-indigo-500" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Noise + bg toggle */}
                <div className="p-5 border-b border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Ruido</span>
                        <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded text-[10px]">{Math.round(noiseLevel * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="0.15" step="0.005" value={noiseLevel}
                        onChange={e=>setNoiseLevel(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500" />

                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Fondo</span>
                        <div className="flex gap-1.5">
                            <button onClick={()=>setBgDark(true)} className={`w-7 h-7 rounded-lg border-2 transition-all ${bgDark?'border-indigo-500 scale-110':'border-zinc-700 opacity-60'}`} style={{backgroundColor:'#0d0d0f'}} title="Oscuro"/>
                            <button onClick={()=>setBgDark(false)} className={`w-7 h-7 rounded-lg border-2 transition-all ${!bgDark?'border-indigo-500 scale-110':'border-zinc-700 opacity-60'}`} style={{backgroundColor:'#f8f8fc'}} title="Claro"/>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-5 mt-auto flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button onClick={handleShuffle}
                            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                            <Shuffle size={15}/> Aleatorio
                        </button>
                        <button onClick={() => setIsAnimating(!isAnimating)}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${isAnimating ? 'bg-zinc-700 text-rose-400 hover:bg-zinc-600' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
                            {isAnimating ? <><Square size={13} fill="currentColor" /> Pausa</> : <><Play size={13} fill="currentColor" /> Animar</>}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={downloadPNG}
                            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                            <Download size={15}/> PNG
                        </button>
                        <button onClick={copyCSS}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${copied?'bg-emerald-600 text-white':'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}>
                            {copied ? <><Check size={15}/>Copiado</> : <><Copy size={15}/>CSS</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── CANVAS ── */}
            <div
                className="flex-1 relative overflow-hidden select-none min-h-[400px] md:min-h-0 z-10"
                ref={containerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {/* Gradient layer */}
                <div className="absolute inset-0 transition-colors duration-500" style={getGradientStyle()} />

                {/* Noise overlay */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        opacity: noiseLevel * 2,
                        mixBlendMode: 'overlay',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                    }}
                />

                {/* Draggable nodes */}
                <div className="absolute inset-0" style={{zIndex:20}}>
                    {nodes.map((node, index) => (
                        <div
                            key={index}
                            onPointerDown={e=>{e.stopPropagation();setDraggingNode(index);}}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center touch-none
                                ${draggingNode===index
                                    ? 'w-12 h-12 border-white ring-4 ring-white/20'
                                    : 'w-9 h-9 border-white/50 hover:border-white hover:scale-125'}`}
                            style={{
                                left:`${node.x}%`,
                                top:`${node.y}%`,
                                backgroundColor:`${node.color}88`,
                                backdropFilter:'blur(8px)',
                                transition: 'width 0.15s, height 0.15s, background-color 0.15s, transform 0.15s, box-shadow 0.15s, border-color 0.15s'
                            }}
                        >
                            <span className="text-[9px] font-black text-white/80 leading-none">{index+1}</span>
                        </div>
                    ))}
                </div>

                {/* Desktop mockup text (hidden on mobile) */}
                <div className={`hidden md:flex absolute inset-0 flex-col items-center justify-center gap-3 pointer-events-none`} style={{zIndex:10}}>
                    <p className={`text-4xl font-black tracking-tight ${bgDark?'text-white/15':'text-black/10'}`}>
                        Your Gradient
                    </p>
                    <div className={`px-5 py-2 rounded-full border text-xs font-medium ${bgDark?'bg-white/5 border-white/10 text-white/20':'bg-black/5 border-black/10 text-black/20'}`}>
                        Drag nodes · Change colors
                    </div>
                </div>
            </div>
        </div>
    );
}
