'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    items: FAQItem[];
    title?: string;
}

export default function FAQSection({ items, title = "Preguntas Frecuentes" }: FAQSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-24 container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase mb-4">
                    <HelpCircle size={14} /> Resolviendo dudas
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic">
                    {title}
                </h2>
            </div>

            <div className="space-y-4">
                {items.map((faq, i) => (
                    <div key={i} className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
                        <button
                            onClick={() => setOpenIndex(openIndex === i ? null : i)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left group hover:bg-white/5 transition-colors"
                        >
                            <span className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">{faq.question}</span>
                            <ChevronDown
                                className={`text-slate-500 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-cyan-500' : ''}`}
                                size={20}
                            />
                        </button>
                        <AnimatePresence>
                            {openIndex === i && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                >
                                    <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                                        {faq.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </section>
    );
}
