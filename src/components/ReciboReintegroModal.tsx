import React from 'react';
import { ReciboReintegro, FundConfig } from '../types';
import { formatCOP, formatFechaCO } from '../utils/formatters';
import { Printer, X, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';

interface ReciboReintegroModalProps {
  recibo: ReciboReintegro;
  config: FundConfig;
  onClose: () => void;
}

export const ReciboReintegroModal: React.FC<ReciboReintegroModalProps> = ({ recibo, config, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-2 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg print:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Membrete Oficial Impresos El Día S.A.S. */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-black text-xs">
              ED
            </span>
            <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
              {config.empresaNombre}
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            NIT: {config.nit} | {config.ciudad}
          </p>
          <div className="mt-2 inline-block bg-slate-100 px-3 py-1 rounded-md border border-slate-300">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              RECIBO OFICIAL DE REINTEGRO DE EFECTIVO A CAJA MENOR N° {recibo.consecutivo}
            </h3>
          </div>
        </div>

        {/* Metadatos del Reintegro */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
          <div>
            <span className="text-slate-500 font-semibold block">Fecha y Hora de Reintegro:</span>
            <span className="font-medium text-slate-800">{formatFechaCO(recibo.fechaHora)}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Vale Provisional Asociado:</span>
            <span className="font-mono font-bold text-slate-900">{recibo.codigoVale}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Colaborador que Reintegra:</span>
            <span className="font-bold text-slate-800">{recibo.colaboradorNombre}</span>
            <span className="text-[10px] text-slate-500 block">C.C. {recibo.colaboradorCedula} — {recibo.colaboradorCargo}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Custodio Receptor del Dinero:</span>
            <span className="font-bold text-slate-800">{recibo.custodioReceptor}</span>
            <span className="text-[10px] text-slate-500 block">Tesorería Impresos El Día S.A.S.</span>
          </div>
        </div>

        {/* La Fórmula Contable de Reconciliación */}
        <div className="border border-slate-300 rounded-xl p-3.5 mb-4 text-xs bg-slate-50">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
            FÓRMULA DE RECONCILIACIÓN Y LIQUIDACIÓN EN PESOS COLOMBIANOS (COP):
          </span>

          <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-slate-200 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">1. Monto Entregado</span>
              <span className="font-bold text-slate-900 text-sm">{formatCOP(recibo.montoEntregadoCOP)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">(-) 2. Gasto Facturado</span>
              <span className="font-bold text-slate-900 text-sm">{formatCOP(recibo.montoUtilizadoCOP)}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 block uppercase">(=) 3. Efectivo Devuelto</span>
              <span className="font-black text-emerald-700 text-base">{formatCOP(recibo.sobranteDevueltoCOP)}</span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200">
            <span>Destino del Reintegro:</span>
            <span className="font-bold text-emerald-700">
              Restablecido al Efectivo Físico de la Caja Menor
            </span>
          </div>
        </div>

        {/* Desglose de Facturas que Justifican el Gasto */}
        <div className="mb-4 text-xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center justify-between">
            <span>Soportes Fiscales / Facturas Agrupadas:</span>
            <span className="font-mono text-slate-500 text-[11px]">{recibo.facturasAsociadas.length} comprobante(s)</span>
          </h4>

          <div className="space-y-1.5 border border-slate-200 rounded-xl p-2.5 bg-slate-50">
            {recibo.facturasAsociadas.map((f, idx) => (
              <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">{f.numeroConsecutivo}</span>
                    <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                      {f.tipo === 'FACTURA_ELECTRONICA' ? 'FEV' : f.tipo === 'TIQUETE_POS_ELECTRONICO' ? 'POS' : 'DOC SOP'}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium">{f.razonSocialEmisor}</p>
                  <p className="text-slate-500 text-[10px]">NIT: {f.nitEmisor} — {f.conceptoGasto}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{formatCOP(f.totalCOP)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        {recibo.observaciones && (
          <div className="mb-4 text-xs">
            <span className="font-bold text-slate-700 block mb-0.5">Observaciones de Control Interno:</span>
            <p className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-700 italic text-[11px]">
              "{recibo.observaciones}"
            </p>
          </div>
        )}

        {/* Sello de Inmutabilidad SHA-256 */}
        <div className="bg-slate-900 text-white p-2.5 rounded-xl mb-4 text-[10px] font-mono">
          <div className="flex items-center justify-between text-emerald-400 font-bold mb-0.5">
            <span className="flex items-center gap-1">
              <span className="font-mono font-bold text-xs">$</span>
              <span>SELLO DIGITAL DE REINTEGRO EN CAJA (DIAN-NIIF)</span>
            </span>
            <span>VERIFICADO</span>
          </div>
          <p className="text-slate-300 break-all">{recibo.hashVerificacionSHA256}</p>
        </div>

        {/* Firmas Digitales */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t-2 border-slate-900 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 pb-5 text-slate-500 font-mono text-[10px]">
              {recibo.firmaColaborador}
            </div>
            <p className="font-bold text-slate-900 mt-1">{recibo.colaboradorNombre}</p>
            <p className="text-[10px] text-slate-600">Entregó Sobrante Físico (COP)</p>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-5 text-slate-500 font-mono text-[10px]">
              {recibo.firmaCustodio}
            </div>
            <p className="font-bold text-slate-900 mt-1">{recibo.custodioReceptor}</p>
            <p className="text-[10px] text-slate-600">Recibió Conforme en Caja de Seguridad</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Recibo Oficial</span>
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
