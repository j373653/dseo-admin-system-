'use client';

import { motion } from 'framer-motion';
import {
    Bot,
    Cpu,
    Zap,
    Brain,
    ArrowRight,
    MessageSquare,
    Workflow,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import ProcessRoadmap from '@/app/components/ui/ProcessRoadmap';
import FAQSection from '@/app/components/ui/FAQSection';
import MiniContactForm from '@/app/components/ui/MiniContactForm';
import { CheckCircle2 } from 'lucide-react';

const iaServices = [
    {
        title: "Agentes de Atención",
        desc: "Chatbots de IA que no frustran al cliente. Entrenados con tus propios datos para dar respuestas precisas y cerrar citas 24/7.",
        icon: MessageSquare,
        color: "text-purple-400",
        bg: "bg-purple-500/10"
    },
    {
        title: "Automatización con IA",
        desc: "Dile adiós a las tareas repetitivas. Automatizamos tu facturación, clasificación de leads y gestión de correos mediante agentes inteligentes.",
        icon: Workflow,
        color: "text-pink-400",
        bg: "bg-pink-500/10"
    },
    {
        title: "Visión Artificial Pyme",
        desc: "Análisis automático de imágenes de stock, mejora de fotos de producto y clasificación visual para tu E-commerce o inventario.",
        icon: Brain,
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    }
];

const iaFAQs = [
    {
        question: "¿Es la IA solo para grandes empresas con mucho presupuesto?",
        answer: "Para nada. Hoy en día existen soluciones 'no-code' y herramientas de bajo coste que permiten a un autónomo automatizar su agenda o su atención al cliente por una fracción de lo que costaba hace un año."
    },
    {
        question: "¿La IA va a sustituir a mis empleados?",
        answer: "Nuestra filosofía es que la IA debe ser un 'exosqueleto'. No sustituye a tu equipo, les quita de encima las tareas aburridas y repetitivas para que puedan centrarse en lo que de verdad aporta valor."
    },
    {
        question: "¿Cómo sé qué proceso puedo automatizar en mi negocio?",
        answer: "Cualquier tarea que hagas más de 5 veces al día y que siempre sea igual (copiar datos de un sitio a otro, responder dudas básicas, clasificar facturas) es candidata a ser automatizada con IA."
    }
];

export default function IAClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-purple-500/30">
            {/* HERO IA */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 tracking-tight leading-[1.3] md:leading-[0.9] px-4 pb-4 overflow-visible"
                        >
                            DUEÑO DE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 italic py-2 inline-block">TU TIEMPO.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12 font-light"
                        >
                            La Inteligencia Artificial ya no es ciencia ficción. Es tu nuevo asistente que trabaja gratis 24/7 clasificando facturas, agendando citas y respondiendo a tus clientes mientras descansas.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-white/10">
                                Ganar Tiempo Libre
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <Zap className="text-purple-500" /> IA Aplicada a Negocios Reales
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SERVICES GRID */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {iaServices.map((service, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-purple-500/30 transition-all group"
                            >
                                <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-black/40`}>
                                    <service.icon className={service.color} size={28} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{service.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{service.desc.replace("gigantes", "pymes")}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* NEW SECTIONS */}
            <ProcessRoadmap />

            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase italic py-4 overflow-visible">
                                TU NEGOCIO <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 pr-8 leading-tight inline-block">SIN PILOTO.</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed font-light">
                                ¿Cuántas horas pierdes a la semana respondiendo las mismas dudas por WhatsApp o clasificando tickets? Nuestros agentes de IA actúan como tu primer filtro, atendiendo al cliente con la misma precisión que tú, pero sin cansarse.
                            </p>
                            <div className="space-y-4 mb-10">
                                {["Chatbots que venden", "Lectores de facturas automáticos", "Clasificación de Leads"].map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-slate-300">
                                        <CheckCircle2 className="text-purple-500" size={18} /> {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 blur-[100px] -z-10" />
                            <div className="bg-black border border-white/10 rounded-3xl p-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Cpu size={120} />
                                </div>
                                <h3 className="text-3xl font-black mb-6 uppercase italic">Calculadora de <br />Ahorro IA</h3>
                                <p className="text-slate-400 mb-8 text-lg">
                                    Una pyme media puede ahorrar hasta <span className="text-white font-bold">15 horas semanales</span> mediante agentes de gestión documental y atención automatizada.
                                </p>
                                <Link href="#contacto" className="block w-full py-5 border border-white/20 text-white rounded-2xl font-black text-center group-hover:bg-white group-hover:text-black transition-all">
                                    Analizar mi Caso
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <FAQSection items={iaFAQs} title="Preguntas sobre Inteligencia Artificial" />

            <MiniContactForm
                serviceName="Inteligencia Artificial"
                title="¿Automatizamos el crecimiento?"
                subtitle="Cuéntanos qué tarea te quita más tiempo y te diremos cómo podemos usar la IA para que te olvides de ella."
            />
        </div>
    );
}
