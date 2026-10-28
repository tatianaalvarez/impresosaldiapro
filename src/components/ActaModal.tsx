import React from 'react';
import { ArqueoActa, FundConfig } from '../types';
import { formatCOP, formatFechaCO } from '../utils/formatters';
import { Printer, Scale, X, CheckCircle2 } from 'lucide-react';

interface ActaModalProps {
  acta: ArqueoActa;
  config: FundConfig;
  onClose: () => void;
}

export const ActaModal: React.FC<ActaModalProps> = ({ acta, config, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-2 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg print:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado Oficial */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-black text-sm">
              ED
            </span>
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {config.empresaNombre}
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-mono">
            NIT: {config.nit} | Domicilio Principal: {config.ciudad}
          </p>
          <div className="mt-2 inline-block bg-slate-100 px-3 py-1 rounded-md border border-slate-300">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              ACTA OFICIAL DE ARQUEO SORPRESIVO DE CAJA MENOR N° {acta.consecutivo}
            </h3>
          </div>
        </div>

        {/* Metadatos del Arqueo */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
          <div>
            <span className="text-slate-500 font-semibold block">Fecha y Hora de Diligenciamiento:</span>
            <span className="font-medium text-slate-800">{formatFechaCO(acta.fechaHora)}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Custodio Responsable del Fondo:</span>
            <span className="font-bold text-slate-800">{acta.custodioNombre}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Auditor / Revisor Fiscal Presente:</span>
            <span className="font-bold text-slate-800">{acta.auditorNombre}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Fondo Total Parametrizado (COP):</span>
            <span className="font-mono font-bold text-slate-900">{formatCOP(acta.fondoAsignadoCOP)}</span>
          </div>
        </div>

        {/* Conciliación de la Ecuación Contable */}
        <div className="border border-slate-300 rounded-xl p-3.5 mb-4 text-xs">
          <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-700" />
            <span>Resultado de la Ecuación Contable del Fondo</span>
          </h4>

          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2.5 rounded-lg font-mono text-center mb-3">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Efectivo Físico</span>
              <span className="font-bold text-slate-900">{formatCOP(acta.efectivoFisicoTotalCOP)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">+ Vales Vigentes</span>
              <span className="font-bold text-slate-900">{formatCOP(acta.valesProvisionalesCOP)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">+ Facturas Radicadas</span>
              <span className="font-bold text-slate-900">{formatCOP(acta.facturasLiquidadasCOP)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-800">Total Arqueado (Suma Ecuación):</span>
            <span className="font-mono font-black text-slate-900 text-sm">
              {formatCOP(acta.totalArqueadoCOP)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-slate-800">Diferencia Neta (Sobrante / Faltante):</span>
            <span className={`font-mono font-black text-sm ${
              acta.diferenciaCOP === 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatCOP(acta.diferenciaCOP)} ({acta.estadoCuadre})
            </span>
          </div>
        </div>

        {/* Desglose de Denominaciones Colombianas */}
        <div className="mb-4 text-xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1.5">
            Conteo Físico por Denominación en Pesos Colombianos:
          </h4>
          <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50 text-[11px] font-mono">
            {acta.desgloseEfectivo.filter(d => d.cantidad > 0).map((d) => (
              <div key={d.valorUnitario} className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600">{formatCOP(d.valorUnitario)} x {d.cantidad} unid:</span>
                <span className="font-bold text-slate-900">{formatCOP(d.cantidad * d.valorUnitario)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        <div className="mb-4 text-xs">
          <span className="font-bold text-slate-700 block mb-1">Observaciones de Auditoría:</span>
          <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 italic text-[11px]">
            "{acta.observaciones}"
          </p>
        </div>

        {/* Sello de Inmutabilidad SHA-256 */}
        <div className="bg-slate-900 text-white p-3 rounded-xl mb-4 text-[10px] font-mono">
          <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
            <span className="flex items-center gap-1">
              <span className="font-mono font-bold text-xs">$</span>
              <span>SELLO CRIPTOGRÁFICO DE INMUTABILIDAD DIAN-NIIF</span>
            </span>
            <span>VERIFICADO</span>
          </div>
          <p className="text-slate-300 break-all">{acta.hashInmutableSHA256}</p>
        </div>

        {/* Firmas Digitales */}
        <div className="grid grid-cols-2 gap-6 pt-3 border-t-2 border-slate-900 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 pb-6 text-slate-500 font-mono text-[10px]">
              {acta.firmaCustodio}
            </div>
            <p className="font-bold text-slate-900 mt-1">{acta.custodioNombre}</p>
            <p className="text-[10px] text-slate-600">Custodio Oficial de Caja Menor</p>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-6 text-slate-500 font-mono text-[10px]">
              {acta.firmaAuditor}
            </div>
            <p className="font-bold text-slate-900 mt-1">{acta.auditorNombre}</p>
            <p className="text-[10px] text-slate-600">Revisoría Fiscal / Auditor Contable</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Acta Oficial</span>
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
