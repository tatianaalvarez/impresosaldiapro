import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Trash2, Smartphone, Monitor, CheckCircle2, X, AlertTriangle } from 'lucide-react';

interface PWAInstallModalProps {
  onClose: () => void;
  onResetData?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ onClose, onResetData }) => {
  const { isInstalled, isIOS, install, uninstall } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);
  const [uninstallSuccess, setUninstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    const res = await install();
    if (res) {
      setInstallSuccess(true);
      setTimeout(() => {
        setInstallSuccess(false);
        onClose();
      }, 1800);
    }
  };

  const handleUninstallClick = () => {
    if (confirm('¿Deseas desinstalar la plataforma de tu dispositivo y restablecer la memoria local?')) {
      uninstall();
      if (onResetData) {
        onResetData();
      }
      setUninstallSuccess(true);
      setTimeout(() => {
        setUninstallSuccess(false);
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Instalación y Desinstalación PWA</h3>
            <p className="text-xs text-slate-400">Impresos El Día S.A.S. — Caja Menor</p>
          </div>
        </div>

        {installSuccess && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>¡Aplicación instalada exitosamente en este dispositivo!</span>
          </div>
        )}

        {uninstallSuccess && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Aplicación desinstalada y caché restablecida.</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Estado actual */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-semibold">Estado de la App:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold ${
              isInstalled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {isInstalled ? '✓ INSTALADA (Standalone)' : 'NO INSTALADA'}
            </span>
          </div>

          {/* Opción 1: Instalar */}
          {!isInstalled ? (
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <span className="font-bold text-white block">Instalar en Dispositivo Móvil o Computador</span>
              <p className="text-slate-300">
                Permite acceso rápido sin barras de navegación, soporte sin conexión a internet y escaneo rápido de facturas en campo.
              </p>
              {isIOS ? (
                <div className="bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-lg text-blue-200 text-[11px]">
                  <strong>En iPhone / iPad (Safari):</strong><br />
                  1. Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha).<br />
                  2. Selecciona <strong>Agregar a Inicio</strong>.
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-700/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Aplicación Ahora</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl space-y-1">
              <span className="font-bold text-emerald-300 block">La aplicación ya está instalada</span>
              <p className="text-slate-400">
                Disfruta de la experiencia nativa de escritorio y móvil con sincronización en tiempo real.
              </p>
            </div>
          )}

          {/* Opción 2: Desinstalar / Resetear */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <span className="font-bold text-rose-300 block">Desinstalar / Restablecer Aplicación</span>
            <p className="text-slate-400">
              Elimina los datos almacenados localmente en caché, desvincula el acceso PWA y reinicia los valores predeterminados de la caja menor.
            </p>
            <button
              onClick={handleUninstallClick}
              className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Desinstalar y Limpiar Datos Locales</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
