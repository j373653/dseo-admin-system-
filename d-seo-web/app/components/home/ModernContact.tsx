'use client';

import { motion } from 'framer-motion';
import { Send, MessageSquare, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function ModernContact() {
    const [activeTab, setActiveTab] = useState<'idea' | 'question'>('idea');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    return (
        <section className="py-32 relative flex items-center justify-center overflow-hidden" id="contacto">
            {/* Background gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950 to-black z-0" />

            <div className="container mx-auto px-4 relative z-10 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                        Laboratorio de Ideas
                    </h2>
                    <p className="text-xl text-slate-400">Cuéntanos tu visión. Nosotros ponemos la tecnología.</p>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-2 md:p-8 shadow-2xl">
                    <div className="flex gap-4 mb-8 justify-center">
                        <button
                            onClick={() => setActiveTab('idea')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'idea' ? 'bg-white text-black' : 'bg-transparent text-slate-400 hover:text-white'}`}
                        >
                            <Lightbulb size={18} className="inline mr-2" /> Tengo una Idea
                        </button>
                        <button
                            onClick={() => setActiveTab('question')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'question' ? 'bg-white text-black' : 'bg-transparent text-slate-400 hover:text-white'}`}
                        >
                            <MessageSquare size={18} className="inline mr-2" /> Tengo una Duda
                        </button>
                    </div>

                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const formData = new FormData(form);
                            formData.append('_subject', activeTab === 'idea' ? 'Nueva Idea de Proyecto' : 'Consulta General');
                            try {
                                const res = await fetch('/send-mail.php', {
                                    method: 'POST',
                                    body: formData
                                });
                                if (res.ok) {
                                    alert('¡Tu mensaje ha sido enviado al Laboratorio de D-SEO! Te responderemos pronto.');
                                    form.reset();
                                } else {
                                    alert('El servidor no ha podido procesar el envío. Revisa los datos.');
                                }
                            } catch (err) {
                                alert('Error al conectar con el servidor de correo.');
                            }
                        }}
                        className="space-y-6"
                    >

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase ml-2">Nombre</label>
                                <input id="name" name="name" type="text" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="Tu nombre" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="sector" className="text-xs font-bold text-slate-400 uppercase ml-2">Gremio / Sector</label>
                                <div className="relative">
                                    <select
                                        id="sector"
                                        name="sector"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none text-slate-300"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Selecciona tu gremio</option>
                                        <option value="legal">Abogado / Legal</option>
                                        <option value="salud">Clínica / Salud</option>
                                        <option value="reformas">Reformas / Construcción</option>
                                        <option value="inmobiliaria">Inmobiliaria</option>
                                        <option value="ecommerce">E-commerce</option>
                                        <option value="otro">Otro sector</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase ml-2">Email</label>
                            <input id="email" name="email" type="email" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="tu@email.com" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="message" className="text-xs font-bold text-slate-400 uppercase ml-2">
                                {activeTab === 'idea' ? 'Cuéntanos sobre tu proyecto' : '¿En qué podemos ayudarte?'}
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows={4}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                                placeholder={activeTab === 'idea' ? 'Quiero automatizar mi...' : 'Me gustaría saber si...'}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <input
                                    id="privacy"
                                    name="privacy"
                                    type="checkbox"
                                    required
                                    checked={privacyAccepted}
                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-white/10 bg-black/40 text-cyan-500 focus:ring-cyan-500 transition-colors"
                                />
                                <label htmlFor="privacy" className="text-xs text-slate-400 leading-tight">
                                    He leído y acepto la <Link href="/legal/privacidad/" className="text-cyan-500 hover:underline">Política de Privacidad</Link>.
                                </label>
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-[10px] text-slate-500 leading-relaxed italic">
                                <p><strong>Información Básica sobre Protección de Datos:</strong></p>
                                <p><strong>Responsable:</strong> Linea digital norte, s.l. | <strong>Finalidad:</strong> Gestionar tu consulta y envío de información comercial. | <strong>Legitimación:</strong> Tu consentimiento explícito. | <strong>Derechos:</strong> Acceder, rectificar y suprimir tus datos en web@d-seo.es.</p>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={!privacyAccepted}
                                whileHover={privacyAccepted ? { scale: 1.02 } : {}}
                                whileTap={privacyAccepted ? { scale: 0.98 } : {}}
                                className={`w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 ${!privacyAccepted ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                                Enviar Mensaje <Send size={20} />
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
