import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge } from './Badge';

export const ActionCard = ({ tool, onClick }) => {
    const Icon = tool.icon;
    return (
        <div
            onClick={onClick}
            className="group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-800/50 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-lg shadow-black/20"
        >
            {/* Efecto de brillo al pasar el ratón */}
            <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity`} />

            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-lg shadow-black/20`}>
                    <Icon size={24} />
                </div>
                <Badge variant={tool.status === 'Nuevo' ? 'new' : 'default'}>{tool.status}</Badge>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {tool.name}
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                {tool.description}
            </p>

            <div className="flex items-center text-xs font-semibold text-zinc-500 group-hover:text-white transition-colors">
                <span>Abrir herramienta</span>
                <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
};
