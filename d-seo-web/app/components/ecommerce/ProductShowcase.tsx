'use client';

import { motion } from 'framer-motion';
import { Camera, CheckCircle2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function ProductShowcase() {
    return (
        <div className="flex flex-col gap-12 lg:flex-row items-stretch">
            {/* ANTES */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden group flex flex-col"
            >
                <div className="mb-6 flex items-center justify-between">
                    <div className="px-4 py-1.5 bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Foto Amateur
                    </div>
                </div>

                <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-slate-950 mb-8 border border-white/5">
                    <Image
                        src="https://images.unsplash.com/photo-1594122230689-45899d9e6f69?q=80&w=800&auto=format&fit=crop"
                        alt="Mala foto de producto"
                        fill
                        className="object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <Camera className="absolute bottom-4 right-4 text-white/20" size={24} />
                </div>

                <div className="space-y-3">
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Fondo saturado, iluminación deficiente y sombras duras que restan valor a tu producto.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Baja Conversión
                    </div>
                </div>
            </motion.div>

            {/* DESPUÉS */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex-1 bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden group shadow-2xl shadow-rose-500/5 flex flex-col"
            >
                <div className="mb-6 flex items-center justify-between">
                    <div className="px-4 py-1.5 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                        D-SEO Visual Lab
                    </div>
                </div>

                <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-black mb-8 border border-rose-500/20 shadow-xl shadow-rose-500/10">
                    <Image
                        src="https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop"
                        alt="Foto de producto profesional IA"
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 to-transparent" />
                </div>

                <div className="space-y-3">
                    <h4 className="text-white font-black text-lg uppercase tracking-tight">Potencial de Venta x3</h4>
                    <ul className="space-y-2">
                        {["Fondo Limpio y Elegante", "Iluminación de Estudio", "Retoque Visual IA"].map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                                <CheckCircle2 size={14} className="text-emerald-500" /> {f}
                            </li>
                        ))}
                    </ul>
                </div>
            </motion.div>
        </div>
    );
}
