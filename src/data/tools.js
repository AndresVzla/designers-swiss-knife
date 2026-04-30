import {
    Palette,
    Pipette,
    Type,
    Package,
    Move,
    Grid3X3,
    Layout,
    RefreshCw
} from 'lucide-react';

export const TOOLS = [
    {
        id: 'palette',
        name: 'Color Palette Engine',
        description: 'Generador de armonías cromáticas. Exporta paletas completas como imagen.',
        icon: Palette,
        category: 'Color',
        status: 'Popular',
        color: 'from-pink-500 to-rose-500'
    },
    {
        id: 'picker',
        name: 'Image Color Picker',
        description: 'Extrae códigos HEX/RGB/HSL de fotos. Soporte para Eye-dropper nativo.',
        icon: Pipette,
        category: 'Color',
        status: 'Nuevo',
        color: 'from-purple-500 to-indigo-500'
    },
    {
        id: 'type',
        name: 'Type Pairing Guide',
        description: 'Sugerencias de combinaciones de Google Fonts con previsualización real.',
        icon: Type,
        category: 'Tipografía',
        status: 'Útil',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'assets',
        name: 'Asset Pocket',
        description: 'Buscador de iconos y vectores SVG con soporte Drag & Drop.',
        icon: Package,
        category: 'Assets',
        status: 'Nuevo',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        id: 'mesh',
        name: 'Mesh Gradient Tool',
        description: 'Generador visual de degradados de malla complejos en alta resolución.',
        icon: Move,
        category: 'Generadores',
        status: 'Creativo',
        color: 'from-blue-600 to-indigo-600'
    },
    {
        id: 'pattern',
        name: 'Pattern Lab',
        description: 'Creador de fondos repetibles y patrones geométricos personalizados.',
        icon: Grid3X3,
        category: 'Generadores',
        status: 'Nuevo',
        color: 'from-red-500 to-orange-500'
    },
    {
        id: 'social',
        name: 'Social Blueprint',
        description: 'Guía de medidas actualizadas y marcos de referencia para redes sociales.',
        icon: Layout,
        category: 'Referencia',
        status: 'Básico',
        color: 'from-sky-500 to-blue-500'
    },
    {
        id: 'converter',
        name: 'Swift Converter',
        description: 'Conversor y optimizador inmediato entre JPG, PNG y SVG. Sin subidas al servidor.',
        icon: RefreshCw,
        category: 'Conversión',
        status: 'Rápido',
        color: 'from-violet-500 to-purple-500'
    }
];
