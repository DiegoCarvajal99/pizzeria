import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PedidosView from './components/PedidosView';
import InventarioView from './components/InventarioView';
import GestionProductosView from './components/GestionProductosView';
import { 
  Home, 
  ShoppingCart, 
  ClipboardList, 
  Boxes, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  UtensilsCrossed,
  Trash2,
  X
} from 'lucide-react';

function MainLayout() {
  // Pestaña principal por defecto: 'home'
  const [activeTab, setActiveTab] = useState('home');
  const { 
    notificacion, 
    modalConfirmacion, 
    errorFirebase, 
    cerrarAlerta 
  } = useInventory();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-body selection:bg-black selection:text-white">
      {/* Barra de navegación superior con diseño negro/blanco */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* =========================================================================
          POPUP DE ALERTAS MODAL (Éxito, Error, Advertencia, Información)
          ========================================================================= */}
      {notificacion && (
        <div 
          onClick={cerrarAlerta}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 text-center animate-scale-up space-y-4 relative"
            role="alertdialog"
          >
            <button
              type="button"
              onClick={cerrarAlerta}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full cursor-pointer transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>

            {notificacion.tipo === 'success' && (
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}
            {notificacion.tipo === 'warning' && (
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}
            {(notificacion.tipo === 'danger' || notificacion.tipo === 'error') && (
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}
            {notificacion.tipo === 'info' && (
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center justify-center mx-auto shadow-sm">
                <Info className="w-8 h-8" />
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900 font-display">
                {notificacion.titulo || (
                  notificacion.tipo === 'success' ? '¡Operación Exitosa!' :
                  notificacion.tipo === 'warning' ? 'Atención' :
                  notificacion.tipo === 'danger' ? 'Error' : 'Información'
                )}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                {notificacion.mensaje}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={cerrarAlerta}
                className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POPUP DE CONFIRMACIÓN DE ELIMINACIÓN: OPCIÓN "DESCARTAR" Y "SÍ, ELIMINAR"
          ========================================================================= */}
      {modalConfirmacion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 text-center animate-scale-up space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 font-display">
                {modalConfirmacion.titulo || '¿Eliminar elemento?'}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {modalConfirmacion.mensaje}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={modalConfirmacion.onCancelar}
                className="flex-1 py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {modalConfirmacion.textoCancelar || 'Descartar'}
              </button>
              <button
                type="button"
                onClick={modalConfirmacion.onConfirmar}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{modalConfirmacion.textoConfirmar || 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal de las vistas con espacio inferior en móvil para la barra de navegación */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 sm:pb-8">
        {/* Banner de advertencia si las Reglas de Firebase no están publicadas */}
        {errorFirebase === 'permission-denied' && (
          <div className="mb-6 p-4 sm:p-5 bg-amber-50 border-2 border-amber-400 rounded-2xl text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Firebase conectado, pero faltan publicar las Reglas en la Consola
                </h3>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Firestore está bloqueando el guardado con <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">permission-denied</code>. 
                  Para habilitar la base de datos: En <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold hover:text-black">Firebase Console</a> ve a <strong>Firestore Database &gt; Reglas (Rules)</strong>, copia y pega la regla de acceso libre y pulsa <strong>Publicar</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const regla = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
                navigator.clipboard.writeText(regla);
                alert('¡Regla copiada al portapapeles!\n\nPégala en Firebase Console > Firestore Database > Reglas y haz clic en "Publicar".');
              }}
              className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-sm transition-all whitespace-nowrap self-stretch sm:self-auto text-center"
            >
              Copiar Regla
            </button>
          </div>
        )}
        {activeTab === 'home' && (
          <HomeView setActiveTab={setActiveTab} />
        )}
        {activeTab === 'pedidos' && (
          <PedidosView />
        )}
        {activeTab === 'stock' && <InventarioView />}
        {activeTab === 'catalogo' && <GestionProductosView />}
      </main>

      {/* Barra de navegación inferior móvil:
          - Fondo negro
          - Letras grises (text-zinc-400)
          - Activo: fondo blanco y letras negras
      */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-md border-t border-zinc-800 py-1.5 px-2 flex justify-around items-center shadow-2xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'home' 
              ? 'bg-white text-black font-bold shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('pedidos')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'pedidos' 
              ? 'bg-white text-black font-bold shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="mt-0.5">Pedidos</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'stock' 
              ? 'bg-white text-black font-bold shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span className="mt-0.5">Consumo</span>
        </button>

        <button
          onClick={() => setActiveTab('catalogo')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'catalogo' 
              ? 'bg-white text-black font-bold shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span className="mt-0.5">Productos</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}
