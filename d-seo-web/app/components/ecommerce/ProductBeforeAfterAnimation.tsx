'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Camera, CheckCircle2 } from 'lucide-react';

export default function ProductBeforeAfterAnimation() {
    const [isOptimized, setIsOptimized] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsOptimized(prev => !prev);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full aspect-square md:aspect-video bg-slate-900 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.1),transparent)] z-0" />

            <div className="relative h-full flex flex-col md:flex-row">
                {/* LEFT / BEFORE SIDE */}
                <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col justify-center items-center">
                    <AnimatePresence>
                        {!isOptimized && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-950/40 z-10"
                            />
                        )}
                    </AnimatePresence>

                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 z-20">Foto Amateur (Stock)</div>

                    <div className="relative w-48 h-48 bg-slate-800 rounded-2xl flex items-center justify-center grayscale opacity-40 border border-white/5">
                        <Camera size={40} className="text-slate-600" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    {!isOptimized && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute z-30"
                        >
                            <div className="px-4 py-2 bg-rose-500/20 backdrop-blur-md border border-rose-500/50 rounded-full text-rose-500 text-[10px] font-black uppercase tracking-widest">
                                Pobre Iluminación
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* RIGHT / AFTER SIDE */}
                <div className="flex-1 relative p-6 flex flex-col justify-center items-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.05),transparent)]" />

                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-4 z-20">Optimización IA (E-commerce)</div>

                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {isOptimized ? (
                                <motion.div
                                    key="pro"
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="relative z-10"
                                >
                                    <div className="w-40 h-56 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl rounded-sm border border-white/30 shadow-[0_0_50px_rgba(244,63,94,0.3)] flex items-center justify-center">
                                        <div className="text-[8px] font-black tracking-[0.5em] text-white rotate-90 opacity-40">PREMIUM</div>
                                    </div>
                                    <div className="absolute -inset-4 bg-rose-500/20 blur-3xl -z-10 animate-pulse" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="waiting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.2 }}
                                    className="w-40 h-56 bg-slate-800 rounded-sm"
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {isOptimized && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="absolute bottom-10 z-30 space-y-2"
                        >
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={10} /> Recorte Perfecto
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* AI SCANNER LINE */}
            <motion.div
                animate={{
                    left: ['0%', '100%', '0%'],
                    opacity: [0, 1, 1, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-rose-500 to-transparent z-40"
            />

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-50">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isOptimized ? 'bg-rose-500' : 'bg-slate-700'} transition-colors animate-pulse`} />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Procesando catálogo activo</span>
                </div>
                <Sparkles size={16} className="text-rose-500 animate-spin-slow" />
            </div>
        </div>
    );
}
