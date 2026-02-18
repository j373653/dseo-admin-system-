'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale,
    Stethoscope,
    Hammer,
    Home,
    ShoppingBag,
    Briefcase,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

const sectors = [
    {
        id: 'abogados',
        name: 'Abogados',
        icon: Scale,
        title: 'Automatización Jurídica',
        desc: 'Generación de contratos, gestión de citas y captación de clientes cualificados sin esfuerzo.',
        benefits: ['Contratos inteligentes', 'Agenda auto-gestionada', 'SEO Local jurídico'],
        color: 'from-blue-600 to-indigo-600'
    },
    {
        id: 'clinicas',
        name: 'Clínicas',
        icon: Stethoscope,
        title: 'Gestión de Pacientes',
        desc: 'Webs que agilizan tu consulta. Recordatorios por WhatsApp y expedientes digitales seguros.',
        benefits: ['Citas online 24/7', 'Recordatorios IA', 'Privacidad HIPAA/RGPD'],
        color: 'from-emerald-600 to-teal-600'
    },
    {
        id: 'reformas',
        name: 'Reformas',
        icon: Hammer,
        title: 'Showroom Digital',
        desc: 'Impacta con tus proyectos. Calculadoras de presupuestos y galerías interactivas de alta fidelidad.',
        benefits: ['Presupuestador online', 'Portafolio Visual 8K', 'Leads geolocalizados'],
        color: 'from-orange-600 to-amber-600'
    },
    {
        id: 'ecommerce',
        name: 'E-commerce',
        icon: ShoppingBag,
        title: 'Venta Inteligente',
        desc: 'Tiendas que no solo muestran productos, sino que los venden usando psicología y datos.',
        benefits: ['Checkout ultra-rápido', 'Imágenes IA de impacto', 'Recuperación de carritos'],
        color: 'from-rose-600 to-pink-600'
    }
];

export default function SectorsSelector() {
    const [activeTab, setActiveTab] = useState(sectors[0].id);
    const activeSector = sectors.find(s => s.id === activeTab) || sectors[0];

    return (
        <section className="py-24 bg-black relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 items-start">

                    {/* Left: Selector Tabs */}
                    <div className="lg:w-1/3 w-full">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
                            TECNOLOGÍA PARA <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">TU MUNDO REAL</span>
                        </h2>
                        <p className="text-slate-400 mb-12 text-lg">Selecciona tu sector y descubre cómo transformamos tu día a día.</p>

                        <div className="flex flex-col gap-3">
                            {sectors.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveTab(s.id)}
                                    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all text-left group ${activeTab === s.id
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'bg-transparent border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/[0.02]'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${activeTab === s.id ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'
                                        }`}>
                                        <s.icon size={20} />
                                    </div>
                                    <span className="font-bold text-lg">{s.name}</span>
                                </button>
                            ))}

                            <Link href="/servicios/sectores" className="mt-6 flex items-center gap-2 text-cyan-500 font-bold hover:gap-3 transition-all uppercase tracking-widest text-xs">
                                Ver todos los gremios <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Right: Interactive Card */}
                    <div className="lg:w-2/3 w-full min-h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                className="h-full w-full bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-[3rem] p-8 md:p-16 relative overflow-hidden flex flex-col justify-center"
                            >
                                {/* Decorative background circle */}
                                <div className={`absolute -bottom-24 -right-24 w-64 h-64 bg-gradient-to-br ${activeSector.color} opacity-10 rounded-full blur-3xl`} />

                                <div className="relative z-10">
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${activeSector.color} flex items-center justify-center mb-10 shadow-2xl`}
                                    >
                                        <activeSector.icon size={40} className="text-white" />
                                    </motion.div>

                                    <h3 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                                        {activeSector.title}
                                    </h3>

                                    <p className="text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
                                        {activeSector.desc}
                                    </p>

                                    <div className="grid sm:grid-cols-2 gap-4 mb-12">
                                        {activeSector.benefits.map((benefit, i) => (
                                            <div key={i} className="flex items-center gap-3 text-slate-200 font-medium">
                                                <CheckCircle2 className="text-cyan-500" size={20} />
                                                {benefit}
                                            </div>
                                        ))}
                                    </div>

                                    <Link href="#contacto" className="inline-flex items-center gap-4 px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-white/10">
                                        Solicitar Demo {activeSector.name} <ArrowRight size={20} />
                                    </Link>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </section>
    );
}
