'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

            {/* Content z-index > background */}
            <div className="container mx-auto px-4 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md"
                >
                    <Sparkles size={14} className="animate-pulse" />
                    Ingeniería Digital de Próxima Generación
                </motion.div>

                <div className="max-w-7xl mx-auto px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tight mb-8 leading-[1.3] md:leading-[0.9] px-4 pb-4 overflow-visible"
                    >
                        TECNOLOGÍA <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 italic py-2 inline-block">PARA TU PYME.</span>
                    </motion.h1>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
                >
                    Hacemos que la tecnología trabaje <span className="text-white font-semibold">para ti</span>, y no al revés. Somos el partner digital de <span className="text-white font-semibold">autónomos y pymes</span> que quieren escalar sin complicaciones.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link href="#contacto" className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        Empezar Proyecto
                        <ArrowRight size={20} />
                    </Link>
                    <Link href="/servicios" className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-bold text-lg backdrop-blur-xl transition-all">
                        Explorar Servicios
                    </Link>
                </motion.div>
            </div>

            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>
    );
}
