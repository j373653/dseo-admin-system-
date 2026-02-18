'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Camera, Wand2 } from 'lucide-react';

export default function BeforeAfterSimulator() {
    const [isOptimized, setIsOptimized] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSimulate = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsOptimized(true);
            setIsProcessing(false);
        }, 1500);
    };

    const handleReset = () => {
        setIsOptimized(false);
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full max-w-2xl">

                {/* BEFORE / RAW */}
                <div className="relative space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Foto Original (Amateur)</p>
                    <div className="aspect-square bg-slate-800 rounded-2xl border border-white/5 flex items-center justify-center relative shadow-inner overflow-hidden grayscale opacity-60">
                        {/* Simulando un perfume genérico con CSS */}
                        <div className="w-1/3 h-2/3 bg-slate-700 rounded-sm relative shadow-lg">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-1/2 h-4 bg-slate-600 rounded-t-sm" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <Camera className="absolute top-4 right-4 text-slate-600" size={16} />
                    </div>
                </div>

                {/* AFTER / AI OPTIMIZED */}
                <div className="relative space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 text-center">IA Enhancement (Premium)</p>
                    <div className="aspect-square rounded-2xl border border-rose-500/30 flex items-center justify-center relative overflow-hidden group">

                        {/* Background Atmosphere */}
                        <div className={`absolute inset-0 transition-all duration-1000 ${isOptimized ? 'bg-gradient-to-br from-rose-600 via-orange-600 to-rose-900' : 'bg-slate-900'}`} />

                        {/* Product with AI "Lighting" */}
                        <AnimatePresence mode="wait">
                            {isProcessing ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="z-10 flex flex-col items-center gap-2"
                                >
                                    <Sparkles className="text-white animate-spin" size={32} />
                                    <span className="text-[10px] font-bold text-white uppercase animate-pulse">Procesando...</span>
                                </motion.div>
                            ) : isOptimized ? (
                                <motion.div
                                    key="optimized"
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="relative w-1/3 h-2/3 z-10"
                                >
                                    {/* Perfume Premium */}
                                    <div className="w-full h-full bg-white/20 backdrop-blur-xl rounded-sm border border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-1/2 h-5 bg-gradient-to-t from-white/60 to-white/40 rounded-t-sm shadow-lg" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-[8px] font-black tracking-widest text-white/80 rotate-90 w-max">PREMIUM</div>
                                        </div>
                                    </div>
                                    {/* Caustic & Glow effects */}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[150%] h-4 bg-white/40 blur-xl rounded-full" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    className="text-slate-700 italic text-xs z-10"
                                >
                                    Esperando...
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Interactive Sparkles on Hover */}
                        {isOptimized && (
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1 h-1 bg-white rounded-full"
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            opacity: [0, 1, 0],
                                            scale: [0, 1.5, 0],
                                            x: Math.random() * 100 - 50 + "%",
                                            y: Math.random() * 100 - 50 + "%"
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                                        style={{ top: '50%', left: '50%' }}
                                    />
                                ))}
                            </div>
                        )}
                        <Wand2 className={`absolute top-4 right-4 ${isOptimized ? 'text-white' : 'text-slate-700'}`} size={16} />
                    </div>
                </div>
            </div>

            {/* CONTROL PANEL */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col gap-4">
                {!isOptimized && !isProcessing && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSimulate}
                        className="w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-black/50 hover:bg-rose-500 transition-colors"
                    >
                        <ArrowRight size={24} />
                    </motion.button>
                )}
                {isOptimized && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleReset}
                        className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-black transition-colors"
                    >
                        Resetear
                    </motion.button>
                )}
            </div>
        </div>
    );
}
