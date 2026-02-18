"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Rocket, Terminal, Zap } from 'lucide-react';
import { cn } from '@/app/lib/utils';

import Logo from './Logo';

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-500 border-b",
                scrolled
                    ? "bg-black/80 backdrop-blur-xl border-white/10 py-3"
                    : "bg-transparent border-transparent py-5"
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/">
                    <Logo />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center space-x-10 text-[13px] font-bold uppercase tracking-widest text-slate-400">
                    {[
                        { label: 'Web', href: '/servicios/sitios-web' },
                        { label: 'E-commerce', href: '/servicios/ecommerce' },
                        { label: 'IA', href: '/servicios/ia' },
                        { label: 'Apps', href: '/servicios/apps' },
                        { label: 'SEO', href: '/servicios/seo' },
                        { label: 'Gremios', href: '/servicios/sectores' },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="hover:text-white transition-colors relative group overflow-hidden"
                        >
                            {item.label}
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}
                </nav>

                {/* CTA */}
                <div className="hidden lg:flex items-center space-x-6">
                    <Link href="/contacto" className="text-white text-sm font-bold hover:text-cyan-400 transition-colors">
                        Login
                    </Link>
                    <Link href="/auditoria" className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500" />
                        <div className="relative bg-black text-white px-8 py-3 rounded-full text-sm font-black flex items-center gap-2 border border-white/10 group-hover:bg-transparent transition-colors">
                            <Rocket size={16} />
                            INICIAR AHORA
                        </div>
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="lg:hidden text-white p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 w-full bg-slate-950 border-b border-white/10 p-8 lg:hidden flex flex-col gap-6"
                    >
                        <Link href="/servicios/sitios-web" className="text-2xl font-black text-white" onClick={() => setMobileMenuOpen(false)}>Web</Link>
                        <Link href="/servicios/ecommerce" className="text-2xl font-black text-white" onClick={() => setMobileMenuOpen(false)}>E-commerce</Link>
                        <Link href="/servicios/ia" className="text-2xl font-black text-white" onClick={() => setMobileMenuOpen(false)}>IA</Link>
                        <Link href="/servicios/apps" className="text-2xl font-black text-white" onClick={() => setMobileMenuOpen(false)}>Apps</Link>
                        <Link href="/servicios/seo" className="text-2xl font-black text-white" onClick={() => setMobileMenuOpen(false)}>SEO</Link>
                        <Link href="/servicios/sectores" className="text-2xl font-black text-white" onClick={() => setMobileMenuOpen(false)}>Gremios</Link>
                        <hr className="border-white/5" />
                        <Link href="/auditoria" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-xl text-center font-bold">
                            Consultoría Gratis
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
