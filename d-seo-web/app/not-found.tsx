'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Rocket, Hash } from 'lucide-react';
import InteractiveBackground from './components/3d/InteractiveBackground';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
            <InteractiveBackground />

            <div className="container mx-auto px-4 z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="relative inline-block">
                        <motion.h1
                            className="text-[12rem] md:text-[18rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent italic"
                            animate={{
                                opacity: [0.2, 0.4, 0.2],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            404
                        </motion.h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Hash size={80} className="text-cyan-500 opacity-50 animate-pulse" />
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                            RUTA NO <br />
                            <span className="text-cyan-400">OPTIMIZADA...</span> AÚN.
                        </h2>
                        <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed">
                            Parece que te has salido del mapa. Este activo digital no existe o ha sido reestructurado para un mejor rendimiento.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                        <Link href="/" className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500" />
                            <button className="relative bg-black text-white px-10 py-5 rounded-full font-black flex items-center gap-3 border border-white/10 group-hover:bg-transparent transition-all">
                                <Home size={20} />
                                VOLVER AL INICIO
                            </button>
                        </Link>

                        <Link href="/servicios" className="text-slate-400 hover:text-white font-bold tracking-widest uppercase text-sm flex items-center gap-2 transition-colors">
                            <Rocket size={16} /> EXPLORAR SERVICIOS
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Decorative gradients */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}
