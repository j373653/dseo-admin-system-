'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Database, BarChart3, Lock, Cpu, Globe, Rocket, Terminal, Zap, Shield, Sparkles } from 'lucide-react';
import RetroGrid from './components/ui/RetroGrid';
import { Spotlight } from './components/ui/Spotlight';
import { cn } from './lib/utils';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-x-hidden">

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
          <RetroGrid className="opacity-30" />

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

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]"
            >
              Transformamos <br />
              <span className="text-gradient">Ideas en Código.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
            >
              No somos solo una agencia. Somos tu <span className="text-white font-semibold">brazo tecnológico</span>.
              Especialistas en SEO técnico, desarrollo a medida e inteligencia artificial para dominar el mercado digital.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link href="/servicios" className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Empezar Proyecto
                <ArrowRight size={20} />
              </Link>
              <Link href="/auditoria" className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-bold text-lg backdrop-blur-xl transition-all">
                Auditoría Gratis
              </Link>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>

        {/* STATS / TRUST */}
        <section className="py-12 border-y border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Proyectos", value: "150+" },
                { label: "ROI Promedio", value: "300%" },
                { label: "Sectores", value: "24" },
                { label: "Países", value: "12" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</p>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES CATEGORIES */}
        <section className="py-32 relative">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                  Servicios de <br />
                  <span className="text-slate-500">Alto Rendimiento.</span>
                </h2>
                <p className="text-slate-400 text-lg">
                  Combinamos diseño premium con ingeniería de backend sólida para crear productos que no solo se ven bien, sino que escalan.
                </p>
              </div>
              <Link href="/servicios" className="text-cyan-400 font-bold flex items-center gap-2 group">
                Ver catálogo completo <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Terminal,
                  title: "Desarrollo Cloud",
                  desc: "Arquitecturas escalables en AWS/Vercel con rendimiento optimizado al milisegundo.",
                  accent: "from-blue-500 to-cyan-400"
                },
                {
                  icon: Cpu,
                  title: "IA & Automation",
                  desc: "Integramos modelos de LLM y automatización de procesos para ahorrar miles de horas.",
                  accent: "from-violet-500 to-fuchsia-400"
                },
                {
                  icon: BarChart3,
                  title: "SEO Data-Driven",
                  desc: "Estrategias basadas en datos reales, auditoría técnica y contenido optimizado para humanos e IA.",
                  accent: "from-emerald-500 to-teal-400"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  whileHover={{ y: -10 }}
                  className="group relative p-10 rounded-3xl bg-white/[0.03] border border-white/10 transition-all overflow-hidden"
                >
                  <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-3xl group-hover:opacity-30 transition-opacity", item.accent)} />
                  <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-8 shadow-lg", item.accent)}>
                    <item.icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SECTORS - 3D FEEL */}
        <section className="py-32 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] -z-10" />

          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <span className="text-violet-400 font-black uppercase tracking-[0.3em] text-sm mb-6 block">Especialización</span>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight">
                  Tu sector, <br />nuestra tecnología.
                </h2>
                <p className="text-slate-400 text-xl mb-12 leading-relaxed">
                  Hemos desarrollado frameworks específicos para cada industria, permitiéndonos desplegar soluciones complejas en tiempo récord.
                </p>

                <div className="space-y-4">
                  {[
                    { title: "Legal & Compliance", tech: "Smart Contracts & Automation" },
                    { title: "Real Estate", tech: "Custom CRM & Lead Gen" },
                    { title: "SaaS & Tech", tech: "MVP in 4 weeks" }
                  ].map((sector, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 20 }}
                      className="p-6 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <h4 className="text-white font-bold text-lg">{sector.title}</h4>
                        <p className="text-slate-500 text-sm uppercase tracking-wider">{sector.tech}</p>
                      </div>
                      <ArrowRight className="text-slate-500" />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                <div className="relative aspect-square md:aspect-video rounded-3xl bg-slate-900 border border-white/10 overflow-hidden flex items-center justify-center">
                  <div className="text-center p-12">
                    <Terminal size={64} className="text-cyan-400 mx-auto mb-6" />
                    <h3 className="text-3xl font-black text-white mb-4 italic">BUILDING THE FUTURE</h3>
                    <div className="inline-flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                  </div>
                  {/* Digital overlay */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-5xl md:text-9xl font-black text-white mb-12 tracking-tighter">
              ¿LISTO PARA <br /> ESCALAR?
            </h2>
            <Link href="/contacto" className="inline-flex items-center gap-4 text-3xl md:text-5xl font-black text-cyan-400 hover:text-white transition-colors group">
              Hablemos hoy <ArrowRight size={48} className="group-hover:translate-x-4 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 bg-black">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-600 font-bold uppercase tracking-[0.5em] mb-8">D-SEO AGENCY</p>
          <div className="flex justify-center gap-12 mb-12">
            {["Services", "Culture", "Stack", "Contact"].map((link, i) => (
              <Link key={i} href={`/${link.toLowerCase()}`} className="text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase">
                {link}
              </Link>
            ))}
          </div>
          <p className="text-slate-700 text-xs">© {new Date().getFullYear()} D-SEO. Built with precision and AI.</p>
        </div>
      </footer>
    </div>
  );
}
