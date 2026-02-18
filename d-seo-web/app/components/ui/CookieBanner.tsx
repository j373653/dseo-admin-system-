'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [hasConsent, setHasConsent] = useState(true);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setHasConsent(false);
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
        setHasConsent(true);
    };

    const rejectCookies = () => {
        localStorage.setItem('cookie-consent', 'rejected');
        setIsVisible(false);
        setHasConsent(true);
    };

    return (
        <>
            {/* Botón flotante para reabrir ajustes (Trigger) */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: hasConsent ? 1 : 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsVisible(true)}
                className="fixed bottom-6 left-6 z-[90] w-12 h-12 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-cyan-500 shadow-2xl hover:bg-slate-800 transition-colors"
                title="Configurar Cookies"
            >
                <Cookie size={20} />
            </motion.button>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:max-w-lg"
                    >
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 flex-shrink-0 border border-cyan-500/20">
                                    <Cookie size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold text-lg mb-1 tracking-tight">Privacidad de Datos</h3>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Usamos cookies para optimizar tu experiencia. Puedes aceptarlas todas, rechazarlas o configurar tus preferencias en cualquier momento. <Link href="/legal/cookies/" className="text-cyan-400 hover:underline">Más info</Link>.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="text-slate-500 hover:text-white transition-colors p-1"
                                    aria-label="Cerrar"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={acceptCookies}
                                    className="flex-1 bg-white text-black font-black py-3 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-cyan-500 transition-colors shadow-lg shadow-white/5 active:scale-95"
                                >
                                    Aceptar Todo
                                </button>
                                <button
                                    onClick={rejectCookies}
                                    className="flex-1 bg-white/5 border border-white/10 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-red-500/20 hover:border-red-500/50 transition-colors active:scale-95"
                                >
                                    Rechazar Todo
                                </button>
                                <Link
                                    href="/legal/cookies/"
                                    className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3 rounded-2xl text-[11px] text-center uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Configurar
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
