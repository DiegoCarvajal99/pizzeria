# 🍕 Inventario & Pedidos Pizzería

Aplicación web moderna desarrollada con **React 19**, **Tailwind CSS v4**, **Vite** y soporte en tiempo real con **Firebase Firestore**.

---

## 🚀 Flujo de Trabajo Implementado

1. **Hacer Pedido (`/hacer-pedido`)**:
   - Selección de productos rápida con buscador y filtro por proveedor.
   - Muestra de inmediato la **Cantidad Disponible (Stock Actual)**.
   - Campo numérico estricto para escribir la **Cantidad a pedir** con botones rápidos `+` / `-`.
   - Agrupación por proveedor en el borrador.
   - Botón **"Finalizar Pedido y Enviar a Recepción"** (guarda la orden y transfiere la lista).
   - Botón opcional **"Copiar WhatsApp"** con formato estructurado listo para enviar por chat.

2. **Recepción & Confirmación de Pedidos (`/recepcion`)**:
   - Lista de pedidos pendientes.
   - **Agrupación estricta por Proveedor**: cada proveedor encabeza su bloque con todos sus productos pedidos debajo.
   - Botón **"Confirmar llegada"** (por producto individual, por proveedor completo o por pedido entero).
   - **Suma automática al Stock**: En cuanto se confirma la recepción, las cantidades pedidas se incrementan automáticamente en el inventario real.

3. **Stock & Conteo Físico (`/stock`)**:
   - Vista general del inventario en tiempo real.
   - Alertas visuales automáticas cuando un insumo está por debajo de su stock mínimo sugerido.
   - Controles rápidos `+` / `-` para conteos rápidos de inventario.

4. **Catálogo & Registro (`/catalogo`)**:
   - Registro de nuevos insumos y proveedores.
   - Importador masivo compatible con copiar y pegar desde hojas de cálculo (Excel / Google Sheets).

---

## 🛠️ Ejecución Local

Para levantar el servidor de desarrollo:

```bash
npm run dev
```

Abre tu navegador en: [http://localhost:3000](http://localhost:3000)

Para compilar para producción:

```bash
npm run build
```

---

## 🔥 Conexión con Firebase Firestore

La aplicación funciona de forma inmediata con almacenamiento inteligente local (`localStorage`), pero está 100% preparada para sincronizarse en la nube con **Firebase Firestore**:

1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto.
2. Crea una base de datos **Firestore**.
3. Copia el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
4. Completa tus credenciales en `.env`:
   ```env
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123
   ```
5. Al reiniciar la app (`npm run dev`), la insignia superior cambiará a **"Firebase en vivo"** y todo el inventario se sincronizará en tiempo real entre múltiples dispositivos.

