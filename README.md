# Workshop Método Lash Mastery™ — Quiz de Alta Conversión

Formulario tipo Typeform en HTML/CSS/JS puro (sin frameworks) que captura leads
y los envía automáticamente a Google Sheets mediante Google Apps Script.

## 📁 Estructura

```
.
├── index.html      # Markup principal
├── styles.css      # Diseño premium mobile-first
├── script.js       # Lógica del quiz, scoring y envío
├── apps-script.gs  # Código listo para pegar en Google Apps Script
└── README.md       # Esta guía
```

## 🚀 Setup en 5 minutos

### 1. Configurar el Apps Script Web App

1. Abre tu Google Sheet (o crea uno nuevo).
2. Ve a **Extensiones → Apps Script**.
3. Borra el contenido por defecto y pega el código de `apps-script.gs`.
4. **Reemplaza `SHEET_NAME`** con el nombre exacto de la pestaña donde quieres los leads.
5. **Ejecuta `setupSheet()` una vez** para crear los headers automáticamente:
   - Selecciona la función `setupSheet` en la barra superior.
   - Click en **Ejecutar** → autoriza los permisos.
6. Despliega como Web App:
   - Click en **Desplegar → Nueva implementación**.
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona**.
   - Click **Desplegar** y copia la URL (formato `https://script.google.com/macros/s/.../exec`).

### 2. Configurar las constantes en `script.js`

Edita el objeto `CONFIG` al inicio de `script.js`:

```js
const CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/TU_ID_AQUI/exec',
  WHATSAPP_GROUP_URL: 'https://chat.whatsapp.com/TU_INVITE',
  EVENT_DATE: '23 de junio',
  EVENT_TIME: '7:00 PM EST',
  WORKSHOP_NAME: 'Workshop Método Lash Mastery™',
};
```

### 3. Subir a producción

Sube los 3 archivos (`index.html`, `styles.css`, `script.js`) a tu hosting
(Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.) o directamente en
un bucket S3. Mantén los 3 archivos en el mismo directorio.

## 🧪 Probar UTMs

Para validar que las UTMs se capturan, abre el quiz con:

```
https://tu-dominio.com/?utm_source=instagram&utm_medium=story&utm_campaign=lash-mastery-junio&utm_content=video-15s&utm_term=lashlatinas
```

Y revisa la pestaña de Google Sheets — las columnas `UTM Source`, `UTM Medium`,
etc. deberían estar pobladas.

## 🎯 Lead Scoring

| Pregunta | Opción | Puntos |
|---|---|---|
| `cuando_comenzar` | Lo antes posible | 30 |
| | Próximos meses | 20 |
| | Más adelante | 10 |
| | Explorando | 0 |
| `compromiso_economico` | Totalmente comprometida | 30 |
| | Bastante comprometida | 20 |
| | Algo comprometida | 10 |
| | Explorando | 0 |
| `prioridad_ingresos` | Valor 1–10 | 1–10 |

**Score final = q5 + compromiso + prioridad** (máx. 70)

| Rango | Temperatura |
|---|---|
| 60+ | 🔥 Caliente |
| 40–59 | 🌤 Tibio |
| 0–39 | ❄️ Frío |

## 🛡 Privacidad & Seguridad

- El envío usa `mode: 'no-cors'` para evitar preflight CORS. Esto significa
  que no podemos leer la respuesta del servidor, pero Apps Script recibe y
  procesa el POST normalmente. El usuario no se queda bloqueado si hay
  algún error de red.
- Se guarda un backup en `sessionStorage` por si el usuario refresca.

## 🎨 Personalización

### Cambiar colores

Edita las variables CSS en `styles.css` (`:root`):

```css
--color-primary: #B8336A;        /* rosa principal */
--color-primary-dark: #8B1A4B;
--color-accent: #C9A87C;         /* oro rosa */
```

### Cambiar textos de preguntas

Edita el array `QUESTIONS` en `script.js`.

### Cambiar destino del WhatsApp

Edita `CONFIG.WHATSAPP_GROUP_URL` en `script.js`.

## 📱 Mobile-first

- Probado en iPhone SE hasta desktop 1920px.
- Inputs con `autocomplete` correcto (name, tel, email).
- Teclado optimizado por tipo (`tel`, `email`).
- Atajos de teclado: A/B/C/D para seleccionar opción en desktop.

## ⌨️ Atajos de teclado (desktop)

- **A / B / C / D** → selecciona la primera/segunda/... opción de la pregunta actual.
- **Enter** → continúa en preguntas de texto/select/scale.
- **←** (backspace fuera de inputs) → volver a la pregunta anterior.

## 🔧 Troubleshooting

**El Sheets no recibe los datos:**
1. Verifica que la URL en `CONFIG.APPS_SCRIPT_URL` termina en `/exec`.
2. Verifica que el Web App está desplegado con acceso "Cualquier persona".
3. Revisa la pestaña **Ejecuciones** del Apps Script — los errores aparecen ahí.
4. Abre la consola del navegador y busca errores.

**El grupo de WhatsApp no abre:**
- Verifica el enlace en `CONFIG.WHATSAPP_GROUP_URL`. Debe ser un enlace de invitación
  (`https://chat.whatsapp.com/...`) no un enlace directo a un número.

**Las preguntas se ven raras en mi celular:**
- Limpia caché del navegador.
- Verifica que los 3 archivos están en el mismo directorio.

---

Hecho con 💖 para **Método Lash Mastery™**
