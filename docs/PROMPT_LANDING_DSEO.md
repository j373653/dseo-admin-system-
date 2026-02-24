# Prompt para Generar Landing con Estilo D-SEO

## CONTEXTO
Eres un desarrollador Frontend experto en Next.js, Tailwind CSS y diseño UI/UX. Tu tarea es crear una landing page con el estilo EXACTO de la web d-seo.es.

---

## COLORES (Obligatorios - Usar exactamente estos)

### CSS Variables
```css
:root {
  --background: #0f172a;        /* Slate 900 - Fondo principal */
  --foreground: #f8fafc;       /* Slate 50 - Texto principal */
  --primary: #38bdf8;           /* Sky 400 - Cian Tecnológico */
  --secondary: #a78bfa;         /* Violet 400 - IA/Creatividad */
  --muted: #1e293b;             /* Slate 800 */
  --muted-foreground: #94a3b8; /* Slate 400 */
  --accent: #0ea5e9;            /* Sky 500 */
  --card: #1e293b;              /* Slate 800 */
  --card-foreground: #f1f5f9;
  --border: #334155;
}
```

### Fondos de Gradiente para Tarjetas
- Blue-Cyan: `from-blue-600 to-cyan-500`
- Purple-Pink: `from-purple-600 to-pink-500`
- Rose-Orange: `from-rose-600 to-orange-500`
- Emerald-Teal: `from-emerald-600 to-teal-500`
- Orange-Red: `from-orange-600 to-red-500`

---

## TIPOGRAFÍA

### Tamaños
- H1: `text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tight`
- H2: `text-4xl md:text-5xl font-black text-white mb-4`
- H3: `text-2xl font-bold text-white`
- Body: `text-lg md:text-xl text-slate-400`
-small: `text-sm text-slate-500`

### Estilos
- Negrita: `font-black` para títulos grandes
- Semi: `font-semibold` para énfasis
- Ligero: `font-light` para textos largos

---

## ESTRUCTURA DE SECCIONES

### 1. Hero Section
```tsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
  {/* Badge opcional arriba */}
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-bold uppercase tracking-widest">
    <Sparkles size={14} className="animate-pulse" />
    Tu Texto
  </div>
  
  {/* Título principal */}
  <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tight mb-8">
    TÍTULO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">DESTACADO</span>
  </h1>
  
  {/* Subtítulo */}
  <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12">
    Descripción del servicio
  </p>
  
  {/* Botones CTA */}
  <div className="flex flex-col sm:flex-row gap-6">
    <button className="px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform">
      CTA Principal
    </button>
    <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-full font-bold text-lg backdrop-blur-xl">
      CTA Secundario
    </button>
  </div>
</section>
```

### 2. Features/BentoGrid
```tsx
// Grid: grid-cols-1 md:grid-cols-3 gap-6
// Tarjeta:
<div className="rounded-3xl p-8 border border-white/10 bg-white/5 backdrop-blur-sm h-full">
  {/* Icono con gradiente */}
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-6">
    <Icon className="text-white" size={24} />
  </div>
  
  <h3 className="text-2xl font-bold text-white mb-2">Título</h3>
  <p className="text-slate-400 text-sm">Descripción</p>
  
  {/* Footer con link */}
  <div className="flex items-center gap-2 text-white/70 text-sm font-bold uppercase tracking-wider mt-4">
    Ver más <ArrowRight size={16} />
  </div>
</div>
```

### 3. Testimonios/Stats
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
  <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
    <div className="text-4xl font-black text-cyan-400">100+</div>
    <div className="text-slate-400 text-sm">Proyectos</div>
  </div>
</div>
```

### 4. FAQ Section
```tsx
// Accordion con:
<div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
  <button className="w-full p-6 text-left flex justify-between items-center">
    <span className="font-bold text-white">Pregunta?</span>
    <ChevronDown className="text-cyan-400" />
  </button>
  <div className="px-6 pb-6 text-slate-400">
    Respuesta...
  </div>
</div>
```

### 5. Contact Form
```tsx
<div className="rounded-3xl p-8 bg-white/5 border border-white/10 backdrop-blur-xl">
  <form className="space-y-6">
    <input 
      type="text" 
      placeholder="Tu nombre"
      className="w-full px-6 py-4 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 outline-none"
    />
    <input 
      type="email" 
      placeholder="Tu email"
      className="w-full px-6 py-4 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 outline-none"
    />
    <textarea 
      placeholder="Tu mensaje"
      rows={4}
      className="w-full px-6 py-4 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 outline-none"
    />
    <button className="w-full py-4 bg-cyan-400 text-black font-black rounded-xl hover:scale-[1.02] transition-transform">
      Enviar Mensaje
    </button>
  </form>
</div>
```

### 6. Footer
```tsx
<footer className="py-12 border-t border-white/10">
  <div className="container mx-auto px-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Logo + descripción */}
      <div>
        <div className="text-2xl font-black text-white mb-4">D-SEO</div>
        <p className="text-slate-400 text-sm">Tu descripción</p>
      </div>
      
      {/* Links */}
      <div>
        <h4 className="font-bold text-white mb-4">Servicios</h4>
        <ul className="space-y-2 text-slate-400">
          <li><a href="#" className="hover:text-cyan-400 transition-colors">Link</a></li>
        </ul>
      </div>
    </div>
    
    <div className="mt-12 pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
      © 2024 Tu Empresa. Todos los derechos reservados.
    </div>
  </div>
</footer>
```

---

## ANIMACIONES (Framer Motion)

```tsx
import { motion } from 'framer-motion';

// Entrada:
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.2 }}
>
  Contenido
</motion.div>

// Hover en tarjetas:
<motion.div whileHover={{ scale: 0.98 }}>
  Contenido
</motion.div>
```

---

## REGLAS OBLIGATORIAS

1. **FONDO**: SIEMPRE `#0f172a` o más oscuro (`black`, `#000`)
2. **TEXTO PRINCIPAL**: SIEMPRE blanco (`text-white`)
3. **TEXTO SECUNDARIO**: SIEMPRE `text-slate-400`
4. **BORDES**: Usar `border-white/10` para subtlety
5. **TARJETAS**: `bg-white/5` + `backdrop-blur-sm` + `border-white/10`
6. **BOTONES PRIMARIOS**: Fondo blanco, texto negro
7. **ICONOS**: Wrapped en div con gradiente
8. **HOVER**: Escalar ligeramente (`scale-105` o `0.98`)

---

## EJEMPLO COMPLETO - LANDING PAGE

Crea una landing page completa para **[TEMA]** con:

1. Hero con título, subtítulo y CTAs
2. Features/BentoGrid (6 tarjetas)
3. Stats/Números
4. FAQ (4-6 preguntas)
5. Formulario de contacto
6. Footer

Usa:
- Next.js 13 (App Router)
- Tailwind CSS
- Framer Motion
- Lucide React icons
- Los colores y estilos exactos de arriba

¿Generas el código completo?
