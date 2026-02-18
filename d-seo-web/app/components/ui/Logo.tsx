'use client';

import { motion } from 'framer-motion';

export default function Logo() {
    return (
        <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 flex items-center justify-center">
                {/* Concept 1: Data-Flow Logo (SVG) */}
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    {/* Top Line - Cyan */}
                    <motion.path
                        d="M30 20C55 20 75 40 75 50"
                        stroke="url(#gradient-cyan)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    />
                    {/* Middle Line - Blue */}
                    <motion.path
                        d="M25 50C25 50 65 50 85 50"
                        stroke="url(#gradient-blue)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    />
                    {/* Bottom Line - Violet */}
                    <motion.path
                        d="M30 80C55 80 75 60 75 50"
                        stroke="url(#gradient-violet)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    />

                    {/* Gradients */}
                    <defs>
                        <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#0891b2" />
                        </linearGradient>
                        <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="gradient-violet" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#6d28d9" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Background Glow */}
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tighter text-white">
                    D<span className="text-cyan-500">-</span>SEO
                </span>
                <span className="text-[8px] uppercase tracking-[0.3em] font-bold text-slate-400">
                    Engineering & IA
                </span>
            </div>
        </div>
    );
}
