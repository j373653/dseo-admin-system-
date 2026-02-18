'use client';

import { motion } from 'framer-motion';
import { Globe, Bot, Cpu, BarChart3, ArrowRight, Smartphone } from 'lucide-react';
import Link from 'next/link';

const items = [
    {
        title: "Ingeniería Web",
        description: "Sitios corporativos y landings de alta conversión para profesionales.",
        icon: Globe,
        href: "/servicios/sitios-web",
        color: "from-blue-600 to-cyan-500",
        colSpan: "md:col-span-2",
    },
    {
        title: "Inteligencia Artificial",
        description: "Automatización de procesos y chatbots para tu día a día.",
        icon: Bot,
        href: "/servicios/ia",
        color: "from-purple-600 to-pink-500",
        colSpan: "md:col-span-1",
    },
    {
        title: "E-commerce Pyme",
        description: "Tu tienda online lista para vender con Bizum y Shopify/Woo.",
        icon: Cpu,
        href: "/servicios/ecommerce",
        color: "from-rose-600 to-orange-500",
        colSpan: "md:col-span-1",
    },
    {
        title: "Apps de Gestión",
        description: "Herramientas móviles para digitalizar tus procesos internos.",
        icon: Smartphone,
        href: "/servicios/apps",
        color: "from-emerald-600 to-teal-500",
        colSpan: "md:col-span-2",
    },
    {
        title: "SEO Local Pymes",
        description: "Domina Google Maps y atráe clientes de tu propia ciudad o barrio.",
        icon: BarChart3,
        href: "/servicios/seo/local",
        color: "from-orange-600 to-red-500",
        colSpan: "md:col-span-2",
    },
];

export default function BentoGrid() {
    return (
        <section className="py-24 container mx-auto px-4">
            <div className="mb-12 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ecosistema Digital</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">4 pilares fundamentales para escalar tu negocio en la era digital.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                {items.map((item, index) => (
                    <Link href={item.href} key={index} className={item.colSpan}>
                        <motion.div
                            whileHover={{ scale: 0.98 }}
                            className={`h-full w-full rounded-3xl p-8 relative overflow-hidden group border border-white/10 bg-white/5 backdrop-blur-sm`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6`}>
                                        <item.icon className="text-white" size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                                </div>

                                <div className="flex items-center gap-2 text-white/70 group-hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
                                    Explorar <ArrowRight size={16} />
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
