import React from 'react';
import { FundConfig, Vale, SoporteFiscalDIAN, UserRole } from '../types';
import { formatCOP } from '../utils/formatters';
import { 
  Scale, 
  Coins, 
  Receipt, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Building, 
  FileCheck,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  config: FundConfig;
  vales: Vale[];
  soportes: SoporteFiscalDIAN[];
  efectivoFisicoCOP: number;
  valesActivosCOP: number;
  facturasLiquidadasCOP: number;
  currentRole: UserRole;
  onNavigate: (tabId: string) => void;
  onOpenNuevoVale: () => void;
  onOpenOcr: () => void;
  onOpenArqueo: () => void;
  onOpenCierreMes?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  vales,
  soportes,
  efectivoFisicoCOP,
  valesActivosCOP,
  facturasLiquidadasCOP,
  currentRole,
  onNavigate,
  onOpenNuevoVale,
  onOpenOcr,
  onOpenArqueo,
  onOpenCierreMes,
}) => {
  const fondoTotal = config.montoFondoTotalCOP;
  const sumaEcuacion = efectivoFisicoCOP + valesActivosCOP + facturasLiquidadasCOP;
  const diferencia = sumaEcuacion - fondoTotal;
  const estaCuadrado = diferencia === 0;

  const montoEjecutado = valesActivosCOP + facturasLiquidadasCOP;
  const porcentajeEjecutado = Math.min(100, Math.round((montoEjecutado / fondoTotal) * 100));
  const alertaUmbral = porcentajeEjecutado >= config.umbralReembolsoPct;

  // Vales pendientes o próximos a vencer
  const valesEnMora = vales.filter(v => v.estado === 'VENCIDO');
  const valesVigentes = vales.filter(v => v.estado === 'DESEMBOLSADO');

  // Facturas con alerta de fraccionamiento
  const facturasAlerta = soportes.filter(s => s.alertaFraccionamiento);

  // Agrupación por centros de costo
  const gastosPorCentroCosto = config.centrosCosto.map(cc => {
    const totalSoportes = soportes
      .filter(s => s.centroCostoId === cc.id)
      .reduce((acc, s) => acc + s.desglose.totalCOP, 0);
    const totalVales = vales
      .filter(v => v.centroCostoId === cc.id && v.estado === 'DESEMBOLSADO')
      .reduce((acc, v) => acc + v.montoSolicitadoCOP, 0);
    return {
      ...cc,
      totalComprometido: totalSoportes + totalVales,
    };
  });

  return (
    <div className="space-y-6">
      {/* Alerta de Umbral de Reembolso Crítico (70%) */}
      {alertaUmbral && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                  Umbral Crítico Superado ({porcentajeEjecutado}%)
                </span>
                <span className="text-xs text-amber-200">Estatuto de Control Interno Impresos El Día</span>
              </div>
              <h2 className="text-lg font-bold text-amber-100 mt-1">
                Fondo ejecutado en {formatCOP(montoEjecutado)} de {formatCOP(fondoTotal)}
              </h2>
              <p className="text-xs text-amber-200/90 mt-0.5">
                La política de tesorería exige tramitar la solicitud formal de reembolso contable al alcanzar el {config.umbralReembolsoPct}% para no desabastecer la caja física en Medellín.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('puc')}
            className="w-full md:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span>Generar Reembolso & Asiento PUC</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECCIÓN PRINCIPAL: ECUACIÓN CONTABLE DE CAJA MENOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Ecuación Contable del Fondo Fijo (Art. 771-5 E.T. / NIIF)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Fondo Total = Efectivo Físico + Vales Provisionales + Facturas Liquidadas
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
              estaCuadrado
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              {estaCuadrado ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>CUADRADO PERFECTO ($ 0 Dif.)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>{diferencia > 0 ? `SOBRANTE: ${formatCOP(diferencia)}` : `FALTANTE: ${formatCOP(Math.abs(diferencia))}`}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Los 4 Bloques de la Ecuación */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          {/* Fondo Total Asignado */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Fondo Fijo Parametrizado
              </span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {formatCOP(fondoTotal)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Asignado por Acta de Gerencia a <span className="text-emerald-400 font-medium">{config.custodioNombre}</span>
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Tope Comprobante:</span>
              <span className="font-mono font-semibold text-slate-200">{formatCOP(config.topePorComprobanteCOP)}</span>
            </div>
          </div>

          {/* = Efectivo Físico */}
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>[ = ] Efectivo en Caja</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Físico</span>
              </div>
              <p className="text-2xl font-black text-emerald-300 font-mono mt-1">
                {formatCOP(efectivoFisicoCOP)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Billetes y monedas de denominación colombiana en caja de seguridad.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={onOpenArqueo}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Hacer Arqueo Sorpresivo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* + Vales Provisionales */}
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>[ + ] Vales Vigentes</span>
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                  {valesVigentes.length} vales
                </span>
              </div>
              <p className="text-2xl font-black text-amber-300 font-mono mt-1">
                {formatCOP(valesActivosCOP)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Anticipos con QR bajo plazo de legalización (3 a 5 días hábiles).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => onNavigate('vales')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Ver cronómetros</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* + Facturas Liquidadas */}
          <div className="bg-slate-950/70 border border-blue-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>[ + ] Facturas DIAN</span>
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                  {soportes.length} soportes
                </span>
              </div>
              <p className="text-2xl font-black text-blue-300 font-mono mt-1">
                {formatCOP(facturasLiquidadasCOP)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Facturas Electrónicas, POS y Documentos Soporte validados.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => onNavigate('ocr')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Validar nuevo soporte</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra de progreso de ejecución */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">Distribución física del fondo de caja menor:</span>
            <span className="font-mono font-medium text-slate-300">
              Efectivo: {Math.round((efectivoFisicoCOP / fondoTotal) * 100)}% | Vales: {Math.round((valesActivosCOP / fondoTotal) * 100)}% | Facturas: {Math.round((facturasLiquidadasCOP / fondoTotal) * 100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${(efectivoFisicoCOP / fondoTotal) * 100}%` }}
              title={`Efectivo: ${formatCOP(efectivoFisicoCOP)}`}
            />
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${(valesActivosCOP / fondoTotal) * 100}%` }}
              title={`Vales: ${formatCOP(valesActivosCOP)}`}
            />
            <div 
              className="bg-blue-500 h-full transition-all duration-500" 
              style={{ width: `${(facturasLiquidadasCOP / fondoTotal) * 100}%` }}
              title={`Facturas: ${formatCOP(facturasLiquidadasCOP)}`}
            />
          </div>
        </div>
      </div>

      {/* Grid: Controles de Ley & Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Matriz de Control Legal Automatizado */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">$</span>
                <span>Puntos de Control Legal Automatizados (Estatuto Tributario)</span>
              </div>
              <span className="text-xs text-slate-400">Verificaciones en vivo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Control 1: Anti-Fraccionamiento */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <span className="font-semibold text-xs text-white">Anti-Fraccionamiento de Compras</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                    ACTIVO
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Detección inteligente de facturas divididas consecutivas al mismo NIT en la misma jornada para eludir el tope de {formatCOP(config.topePorComprobanteCOP)}.
                </p>
                <div className="mt-2 text-[11px] text-emerald-400/90 font-mono">
                  {facturasAlerta.length === 0 ? '✓ Sin alertas activas de fraccionamiento' : `⚠️ ${facturasAlerta.length} compras consecutivas detectadas`}
                </div>
              </div>

              {/* Control 2: Prohibiciones Taxativas */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <span className="font-semibold text-xs text-white">Rechazo de Gastos Prohibidos</span>
                  </div>
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-mono">
                    BLOQUEO AUTO
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Rechazo de solicitudes de nómina (Art. 771-5 E.T.), préstamos personales y materias primas litográficas (papel propalcote, tintas offset industriales).
                </p>
                <div className="mt-2 text-[11px] text-rose-400/90 font-mono">
                  ✓ Motor de reglas con cita legal automática
                </div>
              </div>

              {/* Control 3: Validación DIAN & CUFE */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <span className="font-semibold text-xs text-white">Validez DIAN (Art. 616-1 E.T.)</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">
                    OCR + CUFE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Exigencia obligatoria de Factura Electrónica con CUFE, POS electrónico con CUDE o Documento Soporte electrónico para proveedores no obligados a facturar.
                </p>
                <div className="mt-2 text-[11px] text-blue-400/90 font-mono">
                  ✓ Verificación DV Módulo 11 DIAN integrada
                </div>
              </div>

              {/* Control 4: Plazo de Legalización */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <span className="font-semibold text-xs text-white">Plazos de Vales (3-5 días)</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">
                    SEMÁFORO
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Cronómetro legal. Bloqueo inmediato para nuevos anticipos a cualquier colaborador que presente un vale vencido sin legalizar con factura.
                </p>
                <div className="mt-2 text-[11px] text-amber-400/90 font-mono">
                  {valesEnMora.length === 0 ? '✓ Sin colaboradores en mora actualmente' : `⚠️ ${valesEnMora.length} colaboradores con plazo vencido`}
                </div>
              </div>
            </div>
          </div>

          {/* Centros de Costos en Medellín */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Building className="w-5 h-5 text-indigo-400" />
                <span>Ejecución por Centros de Costo (Medellín)</span>
              </div>
              <span className="text-xs text-slate-400">Impresos El Día S.A.S.</span>
            </div>

            <div className="space-y-3">
              {gastosPorCentroCosto.map(cc => {
                const pct = Math.round((cc.totalComprometido / (fondoTotal || 1)) * 100);
                return (
                  <div key={cc.id} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div>
                        <span className="font-semibold text-white">{cc.codigo} - {cc.nombre}</span>
                        <span className="text-slate-400 ml-2">({cc.responsable})</span>
                      </div>
                      <span className="font-mono font-bold text-slate-200">{formatCOP(cc.totalComprometido)} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Col 3: Acciones Rápidas & Vales en Curso */}
        <div className="space-y-4">
          {/* Botones de acción según rol */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Acciones Operativas Rápidas</span>
            </h3>
            <div className="space-y-2.5">
              {onOpenCierreMes && (currentRole === 'custodio' || currentRole === 'contabilidad') && (
                <button
                  onClick={onOpenCierreMes}
                  className="w-full py-3 px-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-between shadow-xl shadow-emerald-500/20 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>Cierre de Mes Automatizado (COP)</span>
                  </span>
                  <span className="text-[10px] bg-slate-950 text-emerald-300 font-bold px-2 py-0.5 rounded">PDF + Excel + ERP</span>
                </button>
              )}

              <button
                onClick={onOpenNuevoVale}
                className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-between shadow-lg shadow-emerald-700/20 cursor-pointer"
              >
                <span>➕ Solicitar Vale Provisional (COP)</span>
                <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded">Tope {formatCOP(config.topePorComprobanteCOP)}</span>
              </button>

              <button
                onClick={onOpenOcr}
                className="w-full py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-between shadow-lg shadow-blue-700/20 cursor-pointer"
              >
                <span>📷 Escanear Factura con OCR DIAN</span>
                <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded">Art. 616-1</span>
              </button>

              <button
                onClick={onOpenArqueo}
                className="w-full py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span>💵 Ejecutar Conteo de Billetes COP</span>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-white">Acta Inmutable</span>
              </button>

              <button
                onClick={() => onNavigate('puc')}
                className="w-full py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span>📚 Plan Único Cuentas (PUC 110505)</span>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-white">Siigo / Alegra</span>
              </button>
            </div>
          </div>

          {/* Vales Provisionales en Monitoreo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Vales Activos en Custodia</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{valesVigentes.length} vigentes</span>
            </div>

            <div className="space-y-3">
              {valesVigentes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No hay vales en curso. Todo el fondo está en efectivo físico o facturado.</p>
              ) : (
                valesVigentes.map(vale => (
                  <div key={vale.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400">{vale.codigoVale}</span>
                      <span className="font-mono font-bold text-white">{formatCOP(vale.montoSolicitadoCOP)}</span>
                    </div>
                    <p className="text-slate-300 font-medium truncate">{vale.solicitante} ({vale.cargo})</p>
                    <p className="text-slate-400 text-[11px] line-clamp-1">{vale.concepto}</p>
                    <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
                      <span>Plazo: 5 días hábiles</span>
                      <span className="text-emerald-400 font-medium">En cronómetro</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
