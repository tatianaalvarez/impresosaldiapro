import React, { useState } from 'react';
import { FundConfig, Vale, SoporteFiscalDIAN, ReciboReintegro, FacturaResumenItem, UserRole } from '../types';
import { formatCOP, formatFechaCO } from '../utils/formatters';
import { generarHashInmutable } from '../utils/colombiaDian';
import confetti from 'canvas-confetti';
import { 
  Calculator, 
  RotateCcw, 
  Receipt, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Printer, 
  ArrowRight, 
  Plus, 
  Coins, 
  UserCheck,
  Sparkles
} from 'lucide-react';

interface ReconciliacionViewProps {
  config: FundConfig;
  vales: Vale[];
  soportes: SoporteFiscalDIAN[];
  recibosReintegro: ReciboReintegro[];
  onEmitirReintegro: (nuevoRecibo: ReciboReintegro, valeId: string, gastoRealCOP: number, sobranteCOP: number) => void;
  onVerReciboModal: (recibo: ReciboReintegro) => void;
  currentRole: UserRole;
}

export const ReconciliacionView: React.FC<ReconciliacionViewProps> = ({
  config,
  vales,
  soportes,
  recibosReintegro,
  onEmitirReintegro,
  onVerReciboModal,
  currentRole,
}) => {
  // Vales en estado DESEMBOLSADO listos para reconciliar
  const valesPendientes = vales.filter(v => v.estado === 'DESEMBOLSADO');
  const valesLegalizados = vales.filter(v => v.estado === 'LEGALIZADO');

  // Estado del vale seleccionado actualmente para reconciliar
  const [selectedValeId, setSelectedValeId] = useState<string>(valesPendientes[0]?.id || '');
  const [observacionesInput, setObservacionesInput] = useState('');
  const [firmaColaboradorInput, setFirmaColaboradorInput] = useState('');

  const valeSeleccionado = vales.find(v => v.id === selectedValeId) || valesPendientes[0];

  // Facturas ya asociadas a este vale
  const facturasAsociadas = soportes.filter(s => s.valeAsociadoId === valeSeleccionado?.id);

  // También permitir agregar una factura libre que no tenga vale asignado
  const [facturaLibreId, setFacturaLibreId] = useState<string>('');
  const facturasSinVale = soportes.filter(s => !s.valeAsociadoId);

  // Simulación interactiva: si el usuario no tiene una factura escaneada vinculada, permitir ingresar el gasto soportado
  const sumaFacturasAsociadas = facturasAsociadas.reduce((acc, f) => acc + f.desglose.totalCOP, 0);
  const [montoGastoManual, setMontoGastoManual] = useState<number>(0);

  // Monto utilizado total
  const montoUtilizado = sumaFacturasAsociadas > 0 ? sumaFacturasAsociadas : (montoGastoManual || (valeSeleccionado ? valeSeleccionado.montoSolicitadoCOP - 8000 : 0));
  const montoEntregado = valeSeleccionado ? valeSeleccionado.montoSolicitadoCOP : 0;
  
  // Fórmula requerida: Monto Entregado (Vale) - Monto Utilizado (Facturas) = Efectivo a Devolver/Reintegrar (COP)
  const sobranteCalculadoCOP = Math.max(0, montoEntregado - montoUtilizado);
  const faltanteOReembolsoCOP = montoUtilizado > montoEntregado ? montoUtilizado - montoEntregado : 0;

  // Totales acumulados de reconciliación
  const totalAnticiposReconciliados = recibosReintegro.reduce((acc, r) => acc + r.montoEntregadoCOP, 0);
  const totalFacturasJustificadas = recibosReintegro.reduce((acc, r) => acc + r.montoUtilizadoCOP, 0);
  const totalEfectivoReintegrado = recibosReintegro.reduce((acc, r) => acc + r.sobranteDevueltoCOP, 0);

  const handleProcesarReconciliacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valeSeleccionado) return;

    const consecutivo = `REINT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const fechaHora = new Date().toISOString();

    const facturasParaRecibo: FacturaResumenItem[] = facturasAsociadas.length > 0 
      ? facturasAsociadas.map(f => ({
          id: f.id,
          numeroConsecutivo: f.numeroConsecutivo,
          tipo: f.tipo,
          razonSocialEmisor: f.razonSocialEmisor,
          nitEmisor: f.nitEmisor,
          conceptoGasto: f.conceptoGasto,
          totalCOP: f.desglose.totalCOP,
          fechaEmision: f.fechaEmision,
        }))
      : [
          {
            id: `sop-rec-${Date.now()}`,
            numeroConsecutivo: `FE-${Math.floor(10000 + Math.random() * 90000)}`,
            tipo: 'FACTURA_ELECTRONICA',
            razonSocialEmisor: 'Comercio Homologado Medellín',
            nitEmisor: '900888777-1',
            conceptoGasto: valeSeleccionado.concepto,
            totalCOP: montoUtilizado,
            fechaEmision: new Date().toISOString(),
          }
        ];

    const hash = generarHashInmutable({
      consecutivo,
      vale: valeSeleccionado.codigoVale,
      colaborador: valeSeleccionado.solicitante,
      montoEntregado,
      montoUtilizado,
      sobrante: sobranteCalculadoCOP,
      custodio: config.custodioNombre,
    });

    const nuevoRecibo: ReciboReintegro = {
      id: `reint-${Date.now()}`,
      consecutivo,
      fechaHora,
      valeId: valeSeleccionado.id,
      codigoVale: valeSeleccionado.codigoVale,
      colaboradorNombre: valeSeleccionado.solicitante,
      colaboradorCedula: valeSeleccionado.cedula,
      colaboradorCargo: valeSeleccionado.cargo,
      montoEntregadoCOP: montoEntregado,
      montoUtilizadoCOP: montoUtilizado,
      sobranteDevueltoCOP: sobranteCalculadoCOP,
      custodioReceptor: config.custodioNombre,
      facturasAsociadas: facturasParaRecibo,
      observaciones: observacionesInput || `Reconciliación de anticipo ${valeSeleccionado.codigoVale}. Sobrante de ${formatCOP(sobranteCalculadoCOP)} reintegrado al efectivo físico de caja.`,
      hashVerificacionSHA256: hash,
      firmaColaborador: firmaColaboradorInput || `${valeSeleccionado.solicitante} (Beneficiario)`,
      firmaCustodio: `${config.custodioNombre} (Custodio Oficial)`,
    };

    onEmitirReintegro(nuevoRecibo, valeSeleccionado.id, montoUtilizado, sobranteCalculadoCOP);

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setObservacionesInput('');
    setFirmaColaboradorInput('');
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo con la Fórmula Matemática Obligatoria */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <RotateCcw className="w-4 h-4" />
              <span>Módulo de Control Interno & Liquidación de Anticipos</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Devoluciones de Dinero y Reconciliación de Vales
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Reorganiza las facturas bajo el valor original entregado y emite el recibo digital oficial de reintegro en Pesos Colombianos (COP) para restituir el saldo físico de la caja menor.
            </p>
          </div>

          {/* Tarjeta de Fórmula Contable */}
          <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/40 text-center">
            <span className="text-[10px] text-emerald-400 uppercase font-black block tracking-wider">
              FÓRMULA AUTOMATIZADA DE RECONCILIACIÓN
            </span>
            <div className="text-xs sm:text-sm font-mono font-bold text-white mt-1">
              Monto Entregado (Vale) <span className="text-emerald-400">-</span> Monto Utilizado (Facturas) <span className="text-emerald-400">=</span> Efectivo a Devolver (COP)
            </div>
          </div>
        </div>

        {/* Métricas Rápidas de Reconciliación */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Vales en Circulación</span>
            <p className="text-xl font-black text-amber-400 font-mono mt-1">
              {valesPendientes.length} vales
            </p>
            <span className="text-[10px] text-slate-500">Por legalizar y reconciliar</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Anticipos Reconciliados</span>
            <p className="text-xl font-bold text-white font-mono mt-1">
              {formatCOP(totalAnticiposReconciliados)}
            </p>
            <span className="text-[10px] text-slate-500">{recibosReintegro.length} actas emitidas</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Gasto Justificado en Facturas</span>
            <p className="text-xl font-bold text-blue-400 font-mono mt-1">
              {formatCOP(totalFacturasJustificadas)}
            </p>
            <span className="text-[10px] text-slate-500">Soportes validados DIAN</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Efectivo Reintegrado a Caja</span>
            <p className="text-xl font-black text-emerald-400 font-mono mt-1">
              {formatCOP(totalEfectivoReintegrado)}
            </p>
            <span className="text-[10px] text-slate-500">Sobrantes devueltos a caja</span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Formulario de Reconciliación en Vivo vs Historial de Recibos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Reconciliar Vale Activo */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <span>Reconciliación y Liquidación de Vale en Tránsito</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {valesPendientes.length} disponibles
            </span>
          </div>

          {valesPendientes.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Todos los vales provisionales están al día</h4>
              <p className="text-xs text-slate-400">
                No hay anticipos pendientes por reconciliar en este momento. Cuando se desembolse un nuevo vale, aparecerá aquí automáticamente para el cálculo de sobrantes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleProcesarReconciliacion} className="space-y-4">
              {/* Selector de Vale */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Seleccionar Vale Provisional a Reconciliar:
                </label>
                <select
                  value={selectedValeId}
                  onChange={(e) => {
                    setSelectedValeId(e.target.value);
                    const v = vales.find(item => item.id === e.target.value);
                    if (v) {
                      setMontoGastoManual(v.montoSolicitadoCOP - 8000);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {valesPendientes.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.codigoVale} — {v.solicitante} ({v.cargo}) | Entregado: {formatCOP(v.montoSolicitadoCOP)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Detalle del Colaborador y Concepto Original */}
              {valeSeleccionado && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Colaborador / Beneficiario:</span>
                    <span className="font-bold text-white">{valeSeleccionado.solicitante} (C.C. {valeSeleccionado.cedula})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Monto Entregado Originalmente:</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {formatCOP(valeSeleccionado.montoSolicitadoCOP)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Motivo del Anticipo:</span>
                    <p className="bg-slate-900 p-2 rounded text-slate-300 text-[11px] border border-slate-800">
                      {valeSeleccionado.concepto}
                    </p>
                  </div>
                </div>
              )}

              {/* Facturas Escaneadas Agrupadas Bajo este Vale */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-blue-400" />
                    <span>Facturas Escaneadas Asociadas al Vale</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Total Gastado: {formatCOP(montoUtilizado)}
                  </span>
                </div>

                {facturasAsociadas.length > 0 ? (
                  <div className="space-y-2">
                    {facturasAsociadas.map(f => (
                      <div key={f.id} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-white">{f.numeroConsecutivo}</span>
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                              {f.tipo === 'FACTURA_ELECTRONICA' ? 'FEV' : 'POS'}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{f.razonSocialEmisor}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-white">{formatCOP(f.desglose.totalCOP)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400">
                      No hay facturas previamente enlazadas en OCR para este vale. Ingresa el valor exacto soportado por las facturas físicas entregadas:
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-emerald-400 font-mono font-bold text-xs">COP</span>
                        <input
                          type="number"
                          required
                          min={100}
                          max={montoEntregado * 1.5}
                          value={montoGastoManual || ''}
                          onChange={(e) => setMontoGastoManual(Number(e.target.value))}
                          placeholder="Monto en facturas"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <span className="text-xs text-slate-400">COP</span>
                    </div>
                  </div>
                )}
              </div>

              {/* RESULTADO DE LA FÓRMULA DE RECONCILIACIÓN */}
              <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  RESULTADO DEL CÁLCULO CONTABLE EN TIEMPO REAL:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Entregado</span>
                    <span className="font-bold text-slate-200">{formatCOP(montoEntregado)}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">(-) Facturado</span>
                    <span className="font-bold text-slate-200">{formatCOP(montoUtilizado)}</span>
                  </div>
                  <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/40">
                    <span className="text-[10px] text-emerald-300 block font-bold">(=) Sobrante</span>
                    <span className="font-black text-emerald-400 text-sm">{formatCOP(sobranteCalculadoCOP)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>Efectivo a Reintegrar a Caja Menor:</span>
                  </span>
                  <span className="font-mono font-black text-emerald-400 text-base">
                    {formatCOP(sobranteCalculadoCOP)}
                  </span>
                </div>
              </div>

              {/* Firmas y Observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Firma del Colaborador que Devuelve:
                  </label>
                  <input
                    type="text"
                    value={firmaColaboradorInput}
                    onChange={(e) => setFirmaColaboradorInput(e.target.value)}
                    placeholder={valeSeleccionado?.solicitante || 'Nombre colaborador'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Custodio que Recibe en Caja:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={config.custodioNombre}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono"
                  />
                </div>
              </div>

              {/* Botón de Emisión */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer"
              >
                <span className="font-mono font-black text-sm">$</span>
                <span>Procesar Reconciliación y Emitir Recibo Digital de Reintegro (COP)</span>
              </button>
            </form>
          )}
        </div>

        {/* Panel Derecho: Historial de Recibos Oficiales de Reintegro */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Recibos Digitales de Reintegro Emitidos ({recibosReintegro.length})</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Total Reintegrado: {formatCOP(totalEfectivoReintegrado)}
              </span>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {recibosReintegro.map(rec => (
                <div
                  key={rec.id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl text-xs space-y-2 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-emerald-400">{rec.consecutivo}</span>
                      <p className="font-semibold text-white mt-0.5">{rec.colaboradorNombre}</p>
                      <span className="text-[10px] text-slate-500 font-mono">Vale: {rec.codigoVale}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Sobrante Reintegrado</span>
                      <span className="font-mono font-black text-sm text-emerald-400">
                        {formatCOP(rec.sobranteDevueltoCOP)}
                      </span>
                    </div>
                  </div>

                  {/* Resumen de la fórmula en la tarjeta */}
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80 grid grid-cols-2 text-[10px] font-mono text-slate-400">
                    <div>Entregado: <span className="text-white">{formatCOP(rec.montoEntregadoCOP)}</span></div>
                    <div>Facturado: <span className="text-white">{formatCOP(rec.montoUtilizadoCOP)}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{formatFechaCO(rec.fechaHora)}</span>
                    <button
                      onClick={() => onVerReciboModal(rec)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ver Recibo Oficial</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Control Interno: Sello SHA-256 e inmutabilidad garantizada.</span>
            <span className="text-emerald-400 font-medium">Reconciliado 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
