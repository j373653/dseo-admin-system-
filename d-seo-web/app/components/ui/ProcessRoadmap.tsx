'use client';

import { motion } from 'framer-motion';
import { Search, PenTool, CheckCircle2, Headphones } from 'lucide-react';

const steps = [
    {
        title: "Descubrimiento",
        desc: "Charlamos 15 minutos para entender tu negocio y tus 'dolores' reales.",
        icon: Search,
        color: "from-blue-500 to-cyan-500"
    },
    {
        title: "Estrategia e Ingeniería",
        desc: "Diseñamos la solución técnica sin que tú tengas que parar de trabajar.",
        icon: PenTool,
        color: "from-purple-500 to-pink-500"
    },
    {
        title: "Puesta en Marcha",
        desc: "Lanzamos tu nueva herramienta y te enseñamos a usarla en 10 min.",
        icon: CheckCircle2,
        color: "from-emerald-500 to-teal-500"
    },
    {
        title: "Soporte y Crecimiento",
        desc: "No te dejamos solo. Optimizamos para que los resultados lleguen.",
        icon: Headphones,
        color: "from-orange-500 to-red-500"
    }
];

export default function ProcessRoadmap() {
    return (
        <section className="py-24 bg-black/50 border-y border-white/5 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
                        Tu Camino a la <span className="text-cyan-500">Digitalización</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Un proceso transparente, rápido y diseñado para no robarte tiempo de tu negocio.
                    </p>
                </div>

                <div className="grid md:grid-cols-4 gap-8 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-[44px] left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-orange-500/20 -z-0" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="relative z-10 text-center flex flex-col items-center"
                        >
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 mb-6 group cursor-default shadow-lg shadow-black/50`}>
                                <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center group-hover:bg-transparent transition-colors duration-500">
                                    <step.icon className="text-white" size={32} />
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all flex-grow touch-none">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-2 block">Paso 0{i + 1}</span>
                                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
