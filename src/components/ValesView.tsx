import React, { useState } from 'react';
import { Vale, FundConfig, UserRole } from '../types';
import { formatCOP, formatFechaCO, calcularDiasRestantesLegalizacion } from '../utils/formatters';
import { verificarProhibicionesLegales } from '../utils/colombiaDian';
import { 
  FileText, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  UserCheck, 
  PlusCircle, 
  ArrowRight,
  Printer
} from 'lucide-react';

interface ValesViewProps {
  config: FundConfig;
  vales: Vale[];
  currentRole: UserRole;
  onCrearVale: (nuevoVale: Vale) => void;
  onDesembolsarVale: (valeId: string) => void;
  onLegalizarVale: (valeId: string, gastoRealCOP: number, sobranteCOP: number) => void;
  onVerQrModal: (vale: Vale) => void;
}

export const ValesView: React.FC<ValesViewProps> = ({
  config,
  vales,
  currentRole,
  onCrearVale,
  onDesembolsarVale,
  onLegalizarVale,
  onVerQrModal,
}) => {
  // Modal de nueva solicitud
  const [showModal, setShowModal] = useState(false);
  const [solicitanteNombre, setSolicitanteNombre] = useState('Carlos Restrepo');
  const [solicitanteCedula, setSolicitanteCedula] = useState('98.541.220');
  const [solicitanteCargo, setSolicitanteCargo] = useState('Técnico de Mantenimiento');
  const [centroCostoId, setCentroCostoId] = useState(config.centrosCosto[0]?.id || 'CC-101');
  const [montoSolicitadoCOP, setMontoSolicitadoCOP] = useState<number>(45000);
  const [concepto, setConcepto] = useState('');

  // Modal de legalización rápida
  const [valeParaLegalizar, setValeParaLegalizar] = useState<Vale | null>(null);
  const [gastoRealInput, setGastoRealInput] = useState<number>(0);

  // Alerta de regla / prohibición detectada en tiempo real
  const checkProhibicion = verificarProhibicionesLegales(concepto, montoSolicitadoCOP, config.topePorComprobanteCOP);

  // Presets para probar bloqueos legales automáticos
  const setPresetPrueba = (tipo: 'valido' | 'nomina' | 'prestamo' | 'materia_prima' | 'exceso_tope') => {
    if (tipo === 'valido') {
      setConcepto('Adquisición urgente de acople de manguera de aire comprimido para compresor de litografía');
      setMontoSolicitadoCOP(52000);
      setSolicitanteNombre('Carlos Restrepo');
      setSolicitanteCargo('Técnico de Mantenimiento');
    } else if (tipo === 'nomina') {
      setConcepto('Adelanto quincenal de sueldo y prima para operario de taller');
      setMontoSolicitadoCOP(180000);
      setSolicitanteNombre('Javier Morales');
      setSolicitanteCargo('Operario Litográfico');
    } else if (tipo === 'prestamo') {
      setConcepto('Préstamo personal temporal para calamidad doméstica');
      setMontoSolicitadoCOP(150000);
      setSolicitanteNombre('Diana Montoya');
      setSolicitanteCargo('Líder Preprensa');
    } else if (tipo === 'materia_prima') {
      setConcepto('Compra de 5 resmas de papel propalcote a granel y tinta litográfica para tiraje comercial');
      setMontoSolicitadoCOP(220000);
      setSolicitanteNombre('Carlos Restrepo');
      setSolicitanteCargo('Técnico de Mantenimiento');
    } else if (tipo === 'exceso_tope') {
      setConcepto('Reparación general de rodillo de prensa offset Heidelberg');
      setMontoSolicitadoCOP(350000); // Supera los 250k
      setSolicitanteNombre('Carlos Restrepo');
    }
  };

  const handleCrearValeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (checkProhibicion.bloqueado) {
      alert(`SOLICITUD BLOQUEADA POR NORMATIVA:\n${checkProhibicion.motivo}\n\nFundamento Legal: ${checkProhibicion.fundamentoLegal}`);
      return;
    }

    const nuevoVale: Vale = {
      id: `val-${Date.now()}`,
      codigoVale: `VAL-2026-${Math.floor(100 + Math.random() * 900)}`,
      solicitante: solicitanteNombre,
      cedula: solicitanteCedula,
      cargo: solicitanteCargo,
      centroCostoId,
      montoSolicitadoCOP,
      concepto,
      fechaSolicitud: new Date().toISOString(),
      estado: currentRole === 'custodio' ? 'DESEMBOLSADO' : 'PENDIENTE_APROBACION',
      fechaDesembolso: currentRole === 'custodio' ? new Date().toISOString() : undefined,
      fechaLimiteLegalizacion: currentRole === 'custodio'
        ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      codigoQR: `QR-VAL-${Date.now()}-COP${montoSolicitadoCOP}-${solicitanteNombre.replace(/\s+/g, '')}-DIAN`,
      aprobadoPor: currentRole === 'custodio' ? config.custodioNombre : undefined,
    };

    onCrearVale(nuevoVale);
    setShowModal(false);
    setConcepto('');
    setMontoSolicitadoCOP(45000);
  };

  const ejecutarLegalizacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valeParaLegalizar) return;

    const anticipo = valeParaLegalizar.montoSolicitadoCOP;
    const gasto = gastoRealInput;
    const sobrante = Math.max(0, anticipo - gasto);

    onLegalizarVale(valeParaLegalizar.id, gasto, sobrante);
    setValeParaLegalizar(null);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Vales Digitales & Cronómetro Legal (3 a 5 Días Hábiles)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Gestión de Anticipos Provisionales con Código QR
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cada entrega de efectivo genera una constancia digital auditada con plazo estricto de legalización según manual de control interno.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-700/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Solicitar Nuevo Vale Provisional</span>
        </button>
      </div>

      {/* Listado de Vales con Semáforo de Días */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Registro Oficial de Vales de Caja Menor ({vales.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Regla: Vales vencidos bloquean nuevos anticipos al colaborador
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Código Vale</th>
                <th className="pb-3">Solicitante</th>
                <th className="pb-3">Concepto</th>
                <th className="pb-3 text-right">Monto (COP)</th>
                <th className="pb-3 text-center">Cronómetro Legal</th>
                <th className="pb-3 text-center">Estado</th>
                <th className="pb-3 text-right pr-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vales.map((vale) => {
                const semaforo = vale.fechaDesembolso
                  ? calcularDiasRestantesLegalizacion(vale.fechaDesembolso, config.plazoLegalizacionDias)
                  : null;

                return (
                  <tr key={vale.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 pl-2 font-mono font-bold text-amber-400">
                      {vale.codigoVale}
                    </td>

                    <td className="py-3">
                      <p className="font-semibold text-white">{vale.solicitante}</p>
                      <p className="text-[11px] text-slate-400">C.C. {vale.cedula} | {vale.cargo}</p>
                    </td>

                    <td className="py-3 max-w-[280px]">
                      <p className="text-slate-300 line-clamp-2">{vale.concepto}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Solicitado: {formatFechaCO(vale.fechaSolicitud)}
                      </span>
                    </td>

                    <td className="py-3 text-right font-mono font-bold text-white text-sm">
                      {formatCOP(vale.montoSolicitadoCOP)}
                    </td>

                    {/* Semáforo de Legalización */}
                    <td className="py-3 text-center">
                      {vale.estado === 'DESEMBOLSADO' && semaforo ? (
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                            semaforo.estadoSemaforo === 'VERDE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : semaforo.estadoSemaforo === 'AMARILLO'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-black'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>
                              {semaforo.diasRestantes >= 0
                                ? `${semaforo.diasRestantes} días hábiles restan`
                                : `VENCIDO (${Math.abs(semaforo.diasRestantes)}d)`}
                            </span>
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">Límite: 5 días máx</span>
                        </div>
                      ) : vale.estado === 'LEGALIZADO' ? (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Legalizado OK</span>
                        </span>
                      ) : vale.estado === 'PENDIENTE_APROBACION' ? (
                        <span className="text-[11px] text-slate-400">Por desembolsar</span>
                      ) : (
                        <span className="text-[11px] text-rose-400">Rechazado</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        vale.estado === 'DESEMBOLSADO'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : vale.estado === 'LEGALIZADO'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : vale.estado === 'PENDIENTE_APROBACION'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {vale.estado.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver QR */}
                        <button
                          onClick={() => onVerQrModal(vale)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                          title="Ver Código QR y Recibo de Entrega"
                        >
                          <QrCode className="w-4 h-4 text-emerald-400" />
                        </button>

                        {/* Desembolso por el custodio */}
                        {vale.estado === 'PENDIENTE_APROBACION' && (currentRole === 'custodio' || currentRole === 'contabilidad') && (
                          <button
                            onClick={() => onDesembolsarVale(vale.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition cursor-pointer"
                          >
                            Desembolsar
                          </button>
                        )}

                        {/* Legalización rápida */}
                        {vale.estado === 'DESEMBOLSADO' && (
                          <button
                            onClick={() => {
                              setValeParaLegalizar(vale);
                              setGastoRealInput(vale.montoSolicitadoCOP);
                            }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition cursor-pointer"
                          >
                            Legalizar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: SOLICITAR VALE DIGITAL CON VALIDACIÓN PREVIA DE REGLAS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  <span>Nueva Solicitud de Anticipo / Vale Provisional</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fondo Fijo Impresos El Día S.A.S. - Operación exclusiva en COP
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Presets para demostrar cumplimiento normativo en vivo */}
            <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                Probar Reglas del Estatuto Tributario y Control Interno:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setPresetPrueba('valido')}
                  className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[11px] cursor-pointer"
                >
                  ✓ Vale Válido ($52k)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPrueba('nomina')}
                  className="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[11px] cursor-pointer"
                  title="Bloqueo automático de nómina y sueldos"
                >
                  🚫 Prohibición Nómina
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPrueba('prestamo')}
                  className="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[11px] cursor-pointer"
                  title="Bloqueo de préstamos personales"
                >
                  🚫 Préstamo Personal
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPrueba('materia_prima')}
                  className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[11px] cursor-pointer"
                  title="Bloqueo materias primas litográficas"
                >
                  ⚠️ Materia Prima (Propalcote)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPrueba('exceso_tope')}
                  className="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[11px] cursor-pointer"
                  title="Bloqueo por exceso de tope $250k"
                >
                  🚫 Exceso Tope ($350k)
                </button>
              </div>
            </div>

            {/* ALERTA DE RECHAZO AUTOMÁTICO EN CASO DE GASTO PROHIBIDO */}
            {checkProhibicion.bloqueado && (
              <div className="mb-4 p-3.5 bg-rose-950/40 border-2 border-rose-500/60 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <span className="font-mono font-black text-rose-300 text-base">$</span>
                  <span>RECHAZO AUTOMÁTICO POR NORMATIVA VIGENTE</span>
                </div>
                <p className="text-rose-200">{checkProhibicion.motivo}</p>
                <div className="bg-slate-900/80 p-2 rounded text-[11px] text-slate-300 border border-slate-800">
                  <strong className="text-amber-400">Fundamento Legal:</strong> {checkProhibicion.fundamentoLegal}
                </div>
                <p className="text-[11px] text-emerald-400 font-medium">
                  <strong>Acción Sugerida:</strong> {checkProhibicion.accionSugerida}
                </p>
              </div>
            )}

            <form onSubmit={handleCrearValeSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Colaborador Solicitante *
                  </label>
                  <input
                    type="text"
                    required
                    value={solicitanteNombre}
                    onChange={(e) => setSolicitanteNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cédula de Ciudadanía *
                  </label>
                  <input
                    type="text"
                    required
                    value={solicitanteCedula}
                    onChange={(e) => setSolicitanteCedula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Centro de Costos (Medellín)
                  </label>
                  <select
                    value={centroCostoId}
                    onChange={(e) => setCentroCostoId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {config.centrosCosto.map(cc => (
                      <option key={cc.id} value={cc.id}>{cc.codigo} - {cc.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Monto Solicitado (COP) *</span>
                    <span className="text-[10px] text-slate-400">Tope: {formatCOP(config.topePorComprobanteCOP)}</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={montoSolicitadoCOP}
                    onChange={(e) => setMontoSolicitadoCOP(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Concepto y Destino Específico del Anticipo *
                </label>
                <textarea
                  required
                  rows={2}
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Detalle exactamente la necesidad menor..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={checkProhibicion.bloqueado}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    checkProhibicion.bloqueado
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-700/20'
                  }`}
                >
                  <span>Emitir Vale Digital</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LEGALIZACIÓN RÁPIDA DE VALE */}
      {valeParaLegalizar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              Legalización de Vale: <span className="text-amber-400 font-mono">{valeParaLegalizar.codigoVale}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Colaborador: <strong className="text-white">{valeParaLegalizar.solicitante}</strong> | Anticipo entregado: <span className="font-mono text-emerald-400 font-bold">{formatCOP(valeParaLegalizar.montoSolicitadoCOP)}</span>
            </p>

            <form onSubmit={ejecutarLegalizacion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monto Real Gastado en Factura (COP) *
                </label>
                <input
                  type="number"
                  required
                  max={valeParaLegalizar.montoSolicitadoCOP}
                  value={gastoRealInput}
                  onChange={(e) => setGastoRealInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Reintegro de sobrante */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Anticipo Inicial:</span>
                  <span className="font-mono">{formatCOP(valeParaLegalizar.montoSolicitadoCOP)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 mt-1">
                  <span>Gasto Soportado:</span>
                  <span className="font-mono text-white">{formatCOP(gastoRealInput)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-emerald-400 mt-2 pt-2 border-t border-slate-800">
                  <span>Sobrante a Devolver a Caja:</span>
                  <span className="font-mono text-sm">
                    {formatCOP(Math.max(0, valeParaLegalizar.montoSolicitadoCOP - gastoRealInput))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setValeParaLegalizar(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Confirmar Legalización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
