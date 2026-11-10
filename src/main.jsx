import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary atrapó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F1512] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 bg-rose-950 text-rose-400 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 border border-rose-800">
            ⚠️
          </div>
          <h1 className="text-xl font-bold mb-2">Ocurrió un problema al cargar</h1>
          <p className="text-stone-400 text-xs max-w-md mb-4 font-mono bg-[#18201C] p-3 rounded-xl border border-[#2A352F]">
            {this.state.error?.message || "Error desconocido"}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Limpiar datos y Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
