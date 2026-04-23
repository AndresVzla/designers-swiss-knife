import React from 'react';

export const Badge = ({ children, variant = 'default' }) => {
    const styles = {
        default: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        accent: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        new: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${styles[variant]}`}>
            {children}
        </span>
    );
};
