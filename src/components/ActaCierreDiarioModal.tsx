import React from 'react';
import { CierreDiarioActa, FundConfig } from '../types';
import { formatCOP, formatFechaCO } from '../utils/formatters';
import { Printer, X, Scale, FileText, CheckCircle2 } from 'lucide-react';

interface ActaCierreDiarioModalProps {
  acta: CierreDiarioActa;
  config: FundConfig;
  onClose: () => void;
}

export const ActaCierreDiarioModal: React.FC<ActaCierreDiarioModalProps> = ({ acta, config, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-2 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg print:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado Oficial Impresos El Día S.A.S. */}
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
            NIT: {config.nit} | Domicilio Principal: {config.ciudad}
          </p>
          <div className="mt-2 inline-block bg-slate-100 px-3 py-1 rounded-md border border-slate-300">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              ACTA OFICIAL DE BALANCE Y CIERRE DIARIO DE CAJA MENOR N° {acta.consecutivo}
            </h3>
          </div>
        </div>

        {/* Metadatos de la Jornada */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
          <div>
            <span className="text-slate-500 font-semibold block text-[10px]">Fecha de Jornada:</span>
            <span className="font-bold text-slate-900">{acta.fecha}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[10px]">Fondo Fijo Total:</span>
            <span className="font-mono font-bold text-slate-900">{formatCOP(acta.fondoFijoTotalCOP)}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[10px]">Custodio Responsable:</span>
            <span className="font-medium text-slate-900">{config.custodioNombre}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[10px]">Hora de Cierre:</span>
            <span className="font-medium text-slate-900">{formatFechaCO(acta.fechaHoraEmision)}</span>
          </div>
        </div>

        {/* Resumen del Balance de Efectivo del Día */}
        <div className="border border-slate-300 rounded-xl p-3.5 mb-4 text-xs bg-slate-50">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-700" />
            <span>Balance Financiero de la Jornada en Pesos Colombianos (COP)</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Saldo Inicial del Día</span>
              <span className="font-bold text-slate-900 text-sm">{formatCOP(acta.saldoInicialDiaCOP)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-rose-600 block">(-) Anticipos Entregados</span>
              <span className="font-bold text-rose-700 text-sm">{formatCOP(acta.totalAnticiposEntregadosCOP)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-emerald-600 block">(+) Sobrantes Reintegrados</span>
              <span className="font-bold text-emerald-700 text-sm">{formatCOP(acta.totalSobrantesReintegradosCOP)}</span>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-300">
              <span className="text-[10px] text-emerald-800 block font-bold">(=) Saldo Final en Efectivo</span>
              <span className="font-black text-emerald-800 text-sm">{formatCOP(acta.saldoFinalEfectivoCOP)}</span>
            </div>
          </div>
        </div>

        {/* Trazabilidad Completa del Dinero (Orden Cronológico) */}
        <div className="mb-4 text-xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center justify-between">
            <span>Trazabilidad Cronológica del Dinero (Colaborador ➔ Proveedor Comercial)</span>
            <span className="font-mono text-slate-500 text-[11px]">{acta.movimientos.length} operaciones registradas</span>
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-2">Hora</th>
                  <th className="p-2">Operación</th>
                  <th className="p-2">Colaborador / Solicitante</th>
                  <th className="p-2">Proveedor Destino (Factura)</th>
                  <th className="p-2">Ref. Comprobante</th>
                  <th className="p-2 text-right">Salida (COP)</th>
                  <th className="p-2 text-right">Entrada (COP)</th>
                  <th className="p-2 text-right pr-2">Saldo Efectivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {acta.movimientos.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 font-mono text-slate-600">{m.hora}</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        m.tipo === 'DESEMBOLSO_VALE'
                          ? 'bg-amber-100 text-amber-800'
                          : m.tipo === 'REINTEGRO_SOBRANTE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {m.tipo === 'DESEMBOLSO_VALE' ? 'ANTICIPO' : m.tipo === 'REINTEGRO_SOBRANTE' ? 'REINTEGRO' : 'COMPRA'}
                      </span>
                    </td>
                    <td className="p-2 font-medium text-slate-800">{m.colaborador}</td>
                    <td className="p-2 text-slate-700">{m.proveedor || 'N/A (Entrega Interna)'}</td>
                    <td className="p-2 font-mono text-slate-600 text-[10px]">{m.referenciaComprobante}</td>
                    <td className="p-2 text-right font-mono font-semibold text-rose-700">
                      {m.salidaEfectivoCOP > 0 ? formatCOP(m.salidaEfectivoCOP) : '-'}
                    </td>
                    <td className="p-2 text-right font-mono font-semibold text-emerald-700">
                      {m.entradaEfectivoCOP > 0 ? formatCOP(m.entradaEfectivoCOP) : '-'}
                    </td>
                    <td className="p-2 text-right pr-2 font-mono font-bold text-slate-900">
                      {formatCOP(m.saldoResultanteCOP)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observaciones */}
        {acta.observaciones && (
          <div className="mb-4 text-xs">
            <span className="font-bold text-slate-700 block mb-0.5">Observaciones de la Jornada:</span>
            <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 italic text-[11px]">
              "{acta.observaciones}"
            </p>
          </div>
        )}

        {/* Sello de Inmutabilidad SHA-256 */}
        <div className="bg-slate-900 text-white p-2.5 rounded-xl mb-4 text-[10px] font-mono">
          <div className="flex items-center justify-between text-emerald-400 font-bold mb-0.5">
            <span className="flex items-center gap-1">
              <span className="font-mono font-bold text-xs">$</span>
              <span>SELLO CRIPTOGRÁFICO DE CIERRE DIARIO (IMPRESOS EL DÍA S.A.S.)</span>
            </span>
            <span>BALANCE CUADRADO</span>
          </div>
          <p className="text-slate-300 break-all">{acta.hashInmutableSHA256}</p>
        </div>

        {/* Firmas Digitales */}
        <div className="grid grid-cols-2 gap-6 pt-3 border-t-2 border-slate-900 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 pb-6 text-slate-500 font-mono text-[10px]">
              {acta.firmaCustodio}
            </div>
            <p className="font-bold text-slate-900 mt-1">{config.custodioNombre}</p>
            <p className="text-[10px] text-slate-600">Custodio Oficial de Caja Menor</p>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-6 text-slate-500 font-mono text-[10px]">
              {acta.firmaAuditor}
            </div>
            <p className="font-bold text-slate-900 mt-1">Dr. Andrés Gómez (TP 149204-T)</p>
            <p className="text-[10px] text-slate-600">Revisoría Fiscal / Contabilidad</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Acta de Cierre Diario</span>
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
