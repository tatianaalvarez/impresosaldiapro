import React from 'react';
import { Vale, FundConfig } from '../types';
import { formatCOP, formatFechaCO, calcularDiasRestantesLegalizacion } from '../utils/formatters';
import { QrCode, Printer, CheckCircle2, X } from 'lucide-react';

interface QrModalProps {
  vale: Vale;
  config: FundConfig;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ vale, config, onClose }) => {
  const semaforo = vale.fechaDesembolso
    ? calcularDiasRestantesLegalizacion(vale.fechaDesembolso, config.plazoLegalizacionDias)
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-4">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg print:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Membrete Oficial Impresos El Día S.A.S. */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-black text-xs">
              ED
            </span>
            <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
              {config.empresaNombre}
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            NIT: {config.nit} | {config.ciudad}
          </p>
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-1">
            Comprobante Oficial de Desembolso de Vale Provisional
          </p>
        </div>

        {/* Datos Principales del Vale */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Código Único:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{vale.codigoVale}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Monto Desembolsado:</span>
            <span className="font-mono font-black text-emerald-700 text-base">
              {formatCOP(vale.montoSolicitadoCOP)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Beneficiario / Solicitante:</span>
            <span className="font-bold text-slate-800">{vale.solicitante} (C.C. {vale.cedula})</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Cargo y Área:</span>
            <span className="text-slate-700">{vale.cargo}</span>
          </div>

          <div>
            <span className="text-slate-500 font-semibold block mb-0.5">Destino Específico:</span>
            <p className="text-slate-800 font-medium bg-white p-2 rounded border border-slate-200 text-[11px]">
              {vale.concepto}
            </p>
          </div>
        </div>

        {/* Código QR Simulado SVG de Alta Definición */}
        <div className="flex flex-col items-center justify-center py-3 bg-slate-100 rounded-xl border border-slate-300 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center">
            {/* SVG QR Code Pattern */}
            <svg width="140" height="140" viewBox="0 0 100 100" className="text-slate-900">
              {/* Corner 1 */}
              <rect x="5" y="5" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5" />
              <rect x="12" y="12" width="12" height="12" fill="currentColor" />
              {/* Corner 2 */}
              <rect x="69" y="5" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5" />
              <rect x="76" y="12" width="12" height="12" fill="currentColor" />
              {/* Corner 3 */}
              <rect x="5" y="69" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5" />
              <rect x="12" y="76" width="12" height="12" fill="currentColor" />
              {/* Random QR blocks */}
              <rect x="38" y="10" width="8" height="8" fill="currentColor" />
              <rect x="50" y="10" width="8" height="8" fill="currentColor" />
              <rect x="42" y="24" width="8" height="8" fill="currentColor" />
              <rect x="10" y="42" width="8" height="8" fill="currentColor" />
              <rect x="24" y="42" width="8" height="8" fill="currentColor" />
              <rect x="38" y="38" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" />
              <rect x="46" y="46" width="8" height="8" fill="currentColor" />
              <rect x="68" y="42" width="8" height="8" fill="currentColor" />
              <rect x="82" y="42" width="8" height="8" fill="currentColor" />
              <rect x="42" y="68" width="8" height="8" fill="currentColor" />
              <rect x="56" y="68" width="8" height="8" fill="currentColor" />
              <rect x="68" y="68" width="8" height="8" fill="currentColor" />
              <rect x="82" y="68" width="8" height="8" fill="currentColor" />
              <rect x="42" y="82" width="8" height="8" fill="currentColor" />
              <rect x="70" y="82" width="8" height="8" fill="currentColor" />
            </svg>
            <span className="text-[9px] font-mono font-bold text-slate-500 mt-1">
              {vale.codigoQR.slice(0, 32)}...
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 font-semibold">
            Escanee con la App Móvil para legalizar o consultar plazo
          </span>
        </div>

        {/* Plazo Legal y Compromiso */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 mb-4">
          <p className="font-bold">⚠️ OBLIGACIÓN LEGAL DE LEGALIZACIÓN:</p>
          <p className="mt-0.5">
            El beneficiario se compromete a presentar la Factura Electrónica o tiquete POS correspondiente y reintegrar el sobrante en un plazo máximo de <strong>5 días hábiles</strong>. El incumplimiento autoriza el descuento por nómina conforme al Código Sustantivo del Trabajo.
          </p>
        </div>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 pb-8 text-slate-400 font-mono text-[10px]">
              Firma del Solicitante / Recibí Conforme
            </div>
            <p className="font-bold text-slate-800 mt-1">{vale.solicitante}</p>
            <p className="text-[10px] text-slate-500">C.C. {vale.cedula}</p>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-8 text-slate-400 font-mono text-[10px]">
              Firma del Custodio de Caja
            </div>
            <p className="font-bold text-slate-800 mt-1">{config.custodioNombre}</p>
            <p className="text-[10px] text-slate-500">Tesorería Impresos El Día</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Vale Digital</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
