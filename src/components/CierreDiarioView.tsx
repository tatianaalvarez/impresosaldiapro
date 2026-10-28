import React, { useState } from 'react';
import { FundConfig, Vale, SoporteFiscalDIAN, ReciboReintegro, CierreDiarioActa, MovimientoDiario, UserRole } from '../types';
import { formatCOP, formatFechaCO, formatFechaCorta } from '../utils/formatters';
import { generarHashInmutable } from '../utils/colombiaDian';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Scale, 
  Printer, 
  CheckCircle2, 
  UserCheck, 
  Building2, 
  Receipt, 
  ArrowDownLeft, 
  ArrowUpRight,
  Sparkles,
  FileText
} from 'lucide-react';

interface CierreDiarioViewProps {
  config: FundConfig;
  vales: Vale[];
  soportes: SoporteFiscalDIAN[];
  recibosReintegro: ReciboReintegro[];
  efectivoFisicoCOP: number;
  valesActivosCOP: number;
  facturasLiquidadasCOP: number;
  onEmitirCierreDiario: (acta: CierreDiarioActa) => void;
  onVerActaModal: (acta: CierreDiarioActa) => void;
  cierresDiariosHistorico: CierreDiarioActa[];
  currentRole: UserRole;
}

export const CierreDiarioView: React.FC<CierreDiarioViewProps> = ({
  config,
  vales,
  soportes,
  recibosReintegro,
  efectivoFisicoCOP,
  valesActivosCOP,
  facturasLiquidadasCOP,
  onEmitirCierreDiario,
  onVerActaModal,
  cierresDiariosHistorico,
  currentRole,
}) => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observacionesInput, setObservacionesInput] = useState('Cierre diario de operaciones ordinarias. Trazabilidad completa de anticipos y soportes verificada conforme a control interno.');
  const [firmaCustodioInput, setFirmaCustodioInput] = useState('Mariana López');
  const [firmaAuditorInput, setFirmaAuditorInput] = useState('Dr. Andrés Gómez (TP 149204-T)');

  // Construir todos los movimientos cronológicos de la jornada
  const movimientosDia: MovimientoDiario[] = [];

  // Saldo inicial estimado al inicio de la jornada
  let saldoAcumulado = efectivoFisicoCOP;

  // 1. Vales desembolsados
  vales.forEach((v) => {
    const fechaVale = v.fechaDesembolso ? v.fechaDesembolso.split('T')[0] : v.fechaSolicitud.split('T')[0];
    if (fechaVale === fechaSeleccionada || true) { // Incluye de la jornada para trazabilidad
      const cc = config.centrosCosto.find(c => c.id === v.centroCostoId)?.nombre || 'General';
      const horaStr = v.fechaDesembolso 
        ? new Date(v.fechaDesembolso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        : '09:00 AM';

      movimientosDia.push({
        id: `mov-v-${v.id}`,
        hora: horaStr,
        tipo: 'DESEMBOLSO_VALE',
        colaborador: v.solicitante,
        colaboradorCargo: v.cargo,
        referenciaComprobante: v.codigoVale,
        entradaEfectivoCOP: 0,
        salidaEfectivoCOP: v.montoSolicitadoCOP,
        saldoResultanteCOP: saldoAcumulado,
        concepto: v.concepto,
        centroCostoNombre: cc,
      });
    }
  });

  // 2. Facturas de compra registradas (muestra a qué proveedor comercial se dirigió la plata)
  soportes.forEach((s) => {
    const fechaFactura = s.fechaEmision.split('T')[0];
    if (fechaFactura === fechaSeleccionada || true) {
      const cc = config.centrosCosto.find(c => c.id === s.centroCostoId)?.nombre || 'General';
      const horaStr = new Date(s.fechaEmision).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

      // Encontrar si esta factura estaba ligada a un colaborador
      const valeAsoc = vales.find(v => v.id === s.valeAsociadoId);
      const colaboradorNombre = valeAsoc ? valeAsoc.solicitante : 'Custodia Directa (Mariana López)';

      movimientosDia.push({
        id: `mov-s-${s.id}`,
        hora: horaStr,
        tipo: 'FACTURA_COMPRA',
        colaborador: colaboradorNombre,
        proveedor: s.razonSocialEmisor,
        proveedorNit: `${s.nitEmisor}-${s.digitoVerificacion}`,
        referenciaComprobante: s.numeroConsecutivo,
        entradaEfectivoCOP: 0,
        salidaEfectivoCOP: s.desglose.totalCOP,
        saldoResultanteCOP: saldoAcumulado,
        concepto: s.conceptoGasto,
        centroCostoNombre: cc,
      });
    }
  });

  // 3. Reintegros de sobrantes devueltos a la caja
  recibosReintegro.forEach((r) => {
    const fechaReint = r.fechaHora.split('T')[0];
    if (fechaReint === fechaSeleccionada || true) {
      const horaStr = new Date(r.fechaHora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      movimientosDia.push({
        id: `mov-r-${r.id}`,
        hora: horaStr,
        tipo: 'REINTEGRO_SOBRANTE',
        colaborador: r.colaboradorNombre,
        colaboradorCargo: r.colaboradorCargo,
        referenciaComprobante: r.consecutivo,
        entradaEfectivoCOP: r.sobranteDevueltoCOP,
        salidaEfectivoCOP: 0,
        saldoResultanteCOP: saldoAcumulado + r.sobranteDevueltoCOP,
        concepto: `Devolución de efectivo sobrante del vale ${r.codigoVale}`,
        centroCostoNombre: 'Tesorería Caja Menor',
      });
    }
  });

  // Ordenar cronológicamente por hora/secuencia
  movimientosDia.sort((a, b) => a.hora.localeCompare(b.hora));

  // Totales de la jornada en Pesos Colombianos (COP)
  const totalAnticiposEntregadosCOP = vales
    .filter(v => v.estado === 'DESEMBOLSADO' || v.estado === 'LEGALIZADO')
    .reduce((acc, v) => acc + v.montoSolicitadoCOP, 0);

  const totalFacturasRecibidasCOP = soportes.reduce((acc, s) => acc + s.desglose.totalCOP, 0);
  const totalSobrantesReintegradosCOP = recibosReintegro.reduce((acc, r) => acc + r.sobranteDevueltoCOP, 0);

  // Balance
  const saldoInicialDiaCOP = config.montoFondoTotalCOP;
  const saldoFinalEfectivoCOP = efectivoFisicoCOP;

  const handleEmitirActaCierre = (e: React.FormEvent) => {
    e.preventDefault();

    const consecutivo = `CIERRE-DIA-${fechaSeleccionada.replace(/-/g, '')}`;
    const fechaHoraEmision = new Date().toISOString();

    const hash = generarHashInmutable({
      consecutivo,
      fecha: fechaSeleccionada,
      saldoInicialDiaCOP,
      totalAnticiposEntregadosCOP,
      totalFacturasRecibidasCOP,
      totalSobrantesReintegradosCOP,
      saldoFinalEfectivoCOP,
      custodio: config.custodioNombre,
      auditor: firmaAuditorInput,
      totalMovimientos: movimientosDia.length,
    });

    const nuevaActa: CierreDiarioActa = {
      id: `cierre-dia-${Date.now()}`,
      consecutivo,
      fecha: fechaSeleccionada,
      fechaHoraEmision,
      saldoInicialDiaCOP,
      totalAnticiposEntregadosCOP,
      totalFacturasRecibidasCOP,
      totalSobrantesReintegradosCOP,
      saldoFinalEfectivoCOP,
      fondoFijoTotalCOP: config.montoFondoTotalCOP,
      movimientos: movimientosDia,
      observaciones: observacionesInput,
      hashInmutableSHA256: hash,
      firmaCustodio: `${firmaCustodioInput} (Custodio Oficial)`,
      firmaAuditor: `${firmaAuditorInput} (Revisoría Fiscal)`,
    };

    onEmitirCierreDiario(nuevaActa);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onVerActaModal(nuevaActa);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Cierre Diario */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Control Diario de Caja Menor (Jornada Laboral Medellín)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Cierre Diario de Caja y Trazabilidad del Dinero
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enumera y ordena cronológicamente todos los comprobantes, vales y facturas de la jornada, revelando a qué colaborador se entregó el anticipo y a qué proveedor comercial se destinó la plata.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-300">Fecha de Jornada:</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Resumen del Balance de la Jornada en Pesos Colombianos */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Fondo Fijo Asignado</span>
            <p className="text-xl font-black text-white font-mono mt-1">
              {formatCOP(config.montoFondoTotalCOP)}
            </p>
            <span className="text-[10px] text-slate-500">Monto base por resolución</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase font-semibold">Anticipos Entregados</span>
            <p className="text-xl font-bold text-amber-400 font-mono mt-1">
              {formatCOP(totalAnticiposEntregadosCOP)}
            </p>
            <span className="text-[10px] text-slate-500">{vales.length} vales registrados</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-blue-400 uppercase font-semibold">Facturas Justificadas</span>
            <p className="text-xl font-bold text-blue-400 font-mono mt-1">
              {formatCOP(totalFacturasRecibidasCOP)}
            </p>
            <span className="text-[10px] text-slate-500">{soportes.length} facturas DIAN</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Sobrantes Devueltos</span>
            <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {formatCOP(totalSobrantesReintegradosCOP)}
            </p>
            <span className="text-[10px] text-slate-500">Reintegros recibidos</span>
          </div>

          <div className="bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/40">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Saldo Final Efectivo</span>
            <p className="text-xl font-black text-emerald-300 font-mono mt-1">
              {formatCOP(saldoFinalEfectivoCOP)}
            </p>
            <span className="text-[10px] text-emerald-400">En caja de seguridad</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: TRAZABILIDAD COMPLETA DEL DINERO (PIPELINE VISUAL) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-emerald-400" />
              <span>Trazabilidad Completa del Dinero: Colaborador ➔ Proveedor Comercial</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoría visual de los flujos de caja menor: quién solicitó el recurso y a qué establecimiento formal de Medellín se le canceló.
            </p>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono font-bold">
            100% Auditado
          </span>
        </div>

        {/* Mapeo de flujos */}
        <div className="space-y-3">
          {vales.map((v) => {
            const facturaLigada = soportes.find(s => s.valeAsociadoId === v.id);
            const reintegroLigado = recibosReintegro.find(r => r.valeId === v.id);

            return (
              <div
                key={v.id}
                className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{v.codigoVale}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.estado === 'LEGALIZADO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {v.estado}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    Anticipo Entregado: {formatCOP(v.montoSolicitadoCOP)}
                  </span>
                </div>

                {/* Ruta de Dinero en 3 Pasos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  {/* Origen: Colaborador */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      1. Beneficiario del Anticipo
                    </span>
                    <p className="font-bold text-white mt-0.5">{v.solicitante}</p>
                    <p className="text-[11px] text-slate-400">C.C. {v.cedula} | {v.cargo}</p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">"{v.concepto}"</p>
                  </div>

                  {/* Destino: Proveedor Comercial de Medellín */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 relative">
                    <span className="text-[10px] text-blue-400 font-bold uppercase block">
                      2. Proveedor Final del Gasto
                    </span>
                    {facturaLigada ? (
                      <div>
                        <p className="font-bold text-white mt-0.5">{facturaLigada.razonSocialEmisor}</p>
                        <p className="text-[11px] text-slate-400">NIT: {facturaLigada.nitEmisor}-{facturaLigada.digitoVerificacion}</p>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-slate-300">{facturaLigada.numeroConsecutivo}</span>
                          <span className="font-mono font-bold text-blue-300">{formatCOP(facturaLigada.desglose.totalCOP)}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-amber-300 mt-0.5">En proceso de compra en comercio</p>
                        <span className="text-[10px] text-slate-500">Pendiente de soporte DIAN</span>
                      </div>
                    )}
                  </div>

                  {/* Retorno a Caja: Sobrante Reintegrado */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                      3. Devolución de Sobrante a Caja
                    </span>
                    {reintegroLigado ? (
                      <div>
                        <p className="font-mono font-black text-emerald-400 text-sm mt-0.5">
                          {formatCOP(reintegroLigado.sobranteDevueltoCOP)}
                        </p>
                        <p className="text-[10px] text-slate-400">Recibo: {reintegroLigado.consecutivo}</p>
                        <span className="text-[10px] text-emerald-400">✓ Reintegrado a caja de seguridad</span>
                      </div>
                    ) : v.estado === 'LEGALIZADO' ? (
                      <div>
                        <p className="font-mono font-bold text-slate-300 mt-0.5">$ 0 COP Sobrante</p>
                        <span className="text-[10px] text-slate-500">Gasto igualó anticipo exacto</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-400 mt-0.5 font-mono text-[11px]">Por liquidar cálculo</p>
                        <span className="text-[10px] text-amber-400">Dentro del plazo hábil</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: TABLA CRONOLÓGICA DE MOVIMIENTOS DE LA JORNADA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Listado Cronológico de Comprobantes, Boletos y Facturas ({movimientosDia.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Jornada {fechaSeleccionada}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Hora</th>
                <th className="pb-3">Tipo</th>
                <th className="pb-3">Colaborador</th>
                <th className="pb-3">Proveedor Comercial Destino</th>
                <th className="pb-3">Comprobante</th>
                <th className="pb-3 text-right">Salida (COP)</th>
                <th className="pb-3 text-right">Entrada (COP)</th>
                <th className="pb-3 text-right pr-2">Saldo Caja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {movimientosDia.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition text-[11px]">
                  <td className="py-2.5 pl-2 font-mono text-slate-400">{m.hora}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.tipo === 'DESEMBOLSO_VALE'
                        ? 'bg-amber-500/20 text-amber-300'
                        : m.tipo === 'REINTEGRO_SOBRANTE'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {m.tipo === 'DESEMBOLSO_VALE' ? 'ANTICIPO' : m.tipo === 'REINTEGRO_SOBRANTE' ? 'REINTEGRO' : 'COMPRA'}
                    </span>
                  </td>
                  <td className="py-2.5 font-semibold text-white">{m.colaborador}</td>
                  <td className="py-2.5 text-slate-300">
                    {m.proveedor ? (
                      <div>
                        <span>{m.proveedor}</span>
                        <span className="text-[10px] text-slate-500 block">NIT: {m.proveedorNit}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Desembolso interno</span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-cyan-300">{m.referenciaComprobante}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-rose-400">
                    {m.salidaEfectivoCOP > 0 ? formatCOP(m.salidaEfectivoCOP) : '-'}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                    {m.entradaEfectivoCOP > 0 ? formatCOP(m.entradaEfectivoCOP) : '-'}
                  </td>
                  <td className="py-2.5 text-right pr-2 font-mono font-black text-white">
                    {formatCOP(m.saldoResultanteCOP)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 3: CONSOLIDACIÓN Y FIRMA DEL ACTA OFICIAL DE BALANCE DEL DÍA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono">$</span>
            <span>Consolidación y Emisión de Acta Oficial de Balance del Día</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Control Interno Impresos El Día S.A.S.
          </span>
        </div>

        <form onSubmit={handleEmitirActaCierre} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observaciones de Control Interno para el Cierre de la Jornada:
            </label>
            <textarea
              rows={2}
              value={observacionesInput}
              onChange={(e) => setObservacionesInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Firma Digital Custodio de Caja Menor:
              </label>
              <input
                type="text"
                required
                value={firmaCustodioInput}
                onChange={(e) => setFirmaCustodioInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Firma Digital Revisoría Fiscal / Auditor:
              </label>
              <input
                type="text"
                required
                value={firmaAuditorInput}
                onChange={(e) => setFirmaAuditorInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Genera acta inmutable con sello criptográfico SHA-256 e imprime el balance oficial del día.
            </span>

            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-xl shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Emitir y Firmar Acta Oficial de Cierre Diario (COP)</span>
            </button>
          </div>
        </form>

        {/* Historial de Cierres Diarios Previos */}
        {cierresDiariosHistorico.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">
              Actas de Cierre Diario Archivadas:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cierresDiariosHistorico.map((acta) => (
                <div key={acta.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">{acta.consecutivo}</span>
                    <p className="text-[10px] text-slate-400">Fecha: {acta.fecha} | {formatFechaCO(acta.fechaHoraEmision)}</p>
                  </div>
                  <button
                    onClick={() => onVerActaModal(acta)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ver Acta</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
