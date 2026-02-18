'use client';

import { motion } from 'framer-motion';
import { Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface MiniContactFormProps {
    title?: string;
    subtitle?: string;
    serviceName?: string;
}

export default function MiniContactForm({
    title = "¿Hablamos de tu proyecto?",
    subtitle = "Cuéntanos qué necesitas y te responderemos en menos de 24h.",
    serviceName = "Servicio General"
}: MiniContactFormProps) {
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    return (
        <section className="py-24 container mx-auto px-4 max-w-5xl">
            <div className="bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] -z-0" />

                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                    <div className="md:w-1/2">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter leading-tight">
                            {title}
                        </h2>
                        <p className="text-slate-400 mb-8 text-lg leading-relaxed">
                            {subtitle}
                        </p>
                        <div className="space-y-4">
                            {["Auditoría gratuita inicial", "Presupuesto sin compromiso", "Soporte directo por expertos"].map((f, i) => (
                                <div key={i} className="flex items-center gap-3 text-slate-200 font-bold text-sm uppercase tracking-wide">
                                    <CheckCircle2 className="text-cyan-500" size={18} /> {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:w-1/2 w-full">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!privacyAccepted) return;
                                const form = e.currentTarget;
                                const formData = new FormData(form);
                                try {
                                    const res = await fetch('/send-mail.php', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    if (res.ok) {
                                        alert('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.');
                                        form.reset();
                                        setPrivacyAccepted(false);
                                    } else {
                                        alert('Hubo un error al enviar. Por favor, inténtalo de nuevo.');
                                    }
                                } catch (err) {
                                    alert('Error de conexión. Inténtalo más tarde.');
                                }
                            }}
                            className="space-y-4"
                        >
                            <input type="hidden" name="_subject" value={`Nuevo lead: ${serviceName}`} />
                            <input type="hidden" name="_captcha" value="false" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nombre</label>
                                    <input name="name" type="text" required placeholder="Tu nombre" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Gremio</label>
                                    <input name="gremio" type="text" placeholder="Ej: Reformas" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email</label>
                                <input name="email" type="email" required placeholder="tu@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Descripción corta</label>
                                <textarea name="message" required rows={3} placeholder="¿Cómo podemos ayudarte?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
                            </div>
                            <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <input
                                        id={`privacy-${serviceName.replace(/\s+/g, '-')}`}
                                        name="privacy"
                                        type="checkbox"
                                        required
                                        checked={privacyAccepted}
                                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-white/10 bg-black/40 text-cyan-500 focus:ring-cyan-500 transition-colors cursor-pointer"
                                    />
                                    <label htmlFor={`privacy-${serviceName.replace(/\s+/g, '-')}`} className="text-[10px] text-slate-500 leading-tight cursor-pointer select-none">
                                        He leído y acepto la <Link href="/legal/privacidad/" className="text-cyan-500 hover:underline">Política de Privacidad</Link>.
                                    </label>
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[9px] text-slate-600 leading-relaxed italic">
                                    <p><strong>Información Básica:</strong> <strong>Responsable:</strong> Linea digital norte, s.l. | <strong>Finalidad:</strong> Gestión de solicitud. | <strong>Derechos:</strong> web@d-seo.es.</p>
                                </div>

                                <motion.button
                                    whileHover={privacyAccepted ? { scale: 1.02 } : {}}
                                    whileTap={privacyAccepted ? { scale: 0.98 } : {}}
                                    disabled={!privacyAccepted}
                                    type="submit"
                                    className={`w-full py-4 bg-white text-black rounded-xl font-black text-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!privacyAccepted ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-cyan-500'}`}
                                >
                                    Enviar Consulta <Send size={20} />
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
