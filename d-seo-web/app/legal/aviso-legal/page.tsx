'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function AvisoLegal() {
    return (
        <div className="min-h-screen bg-black text-slate-300 pt-32 pb-20 px-4">
            <div className="container mx-auto max-w-4xl bg-white/[0.02] border border-white/10 p-12 rounded-3xl">
                <div className="flex items-center gap-4 mb-8 text-white">
                    <Shield className="text-cyan-500" size={32} />
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Aviso Legal</h1>
                </div>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Datos Identificativos</h2>
                        <p>
                            En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos del titular:<br /><br />
                            <strong>Titular:</strong> Linea digital norte, s.l.<br />
                            <strong>NIF:</strong> B31801350<br />
                            <strong>Domicilio social:</strong> Navarra, España.<br />
                            <strong>Email de contacto:</strong> web@d-seo.es<br /><br />
                            <strong>Datos Registrales:</strong> Inscrita en el Registro Mercantil de Navarra, Tomo 1012, folio 175, hoja NA-20372, inscripción 1ª.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. Usuarios</h2>
                        <p>El acceso y/o uso de este portal de D-SEO atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Propiedad Intelectual e Industrial</h2>
                        <p>D-SEO por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
