# 🛠️ The Designer's Swiss Knife

**Concepto:** Una Web-App de alto rendimiento diseñada para centralizar herramientas críticas de diseño gráfico. Su valor diferencial es la eliminación de la fricción entre la web y el software creativo (Photoshop, Illustrator, Figma) mediante la exportación instantánea vía portapapeles.

---

## 🎯 Pilares del Proyecto
- **Integración Directa (The "Killer Feature"):** Los recursos generados se pueden "Copiar como imagen" para pegarlos directamente en la mesa de trabajo (`Ctrl + V`).
- **Filosofía "Zero-Friction":** Sin registros, sin publicidad y sin descargas innecesarias. Todo ocurre a un clic de distancia.
- **Ejecución "Client-Side" (Costo $0):** Procesamiento local en el navegador para garantizar privacidad y permitir un hosting gratuito (Vercel / GitHub Pages).
- **Estética:** Estilo "Glassmorphic" moderno, oscuro y minimalista.

---

## 🧰 Inventario de Funcionalidades (Roadmap)

1.  🎨 **Color Palette Engine:** Generador de armonías cromáticas con copia rápida de paleta completa.
2.  🧪 **Image Color Picker:** Extractor de códigos Hex/RGB/HSL con soporte para Eye-dropper nativo.
3.  🔡 **Type Pairing Guide:** Sugerencias de combinaciones de Google Fonts con previsualización real.
4.  📦 **Asset Pocket:** Buscador de iconos y vectores SVG con soporte Drag & Drop.
5.  🌀 **Mesh Gradient Tool:** Generador visual de degradados de malla en alta resolución.
6.  🏁 **Pattern Lab:** Creador de fondos repetibles y texturas.
7.  📏 **Social Blueprint:** Guía de medidas actualizadas para redes sociales con marcos de referencia.
8.  🔄 **Swift Converter:** Conversor y optimizador inmediato entre JPG, PNG y SVG sin servidor.

---

## 💻 Stack Tecnológico
- **Frontend:** React + Vite
- **Estilos:** Tailwind CSS
- **Iconografía:** Lucide React
- **Lógica:** Clipboard API & Canvas API (Procesamiento binario local)
- **Despliegue:** Vercel / GitHub Pages

---

## 🚀 Guía de Desarrollo
1. `npm install` para instalar dependencias.
2. `npm run dev` para iniciar el servidor local.
3. Las herramientas se encuentran modularizadas en `src/data/tools.js` y `src/components/`.
