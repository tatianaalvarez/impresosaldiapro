import React, { useState } from 'react';
import { FundConfig, DenominacionConteo, ArqueoActa, Vale, SoporteFiscalDIAN } from '../types';
import { formatCOP, formatFechaCO } from '../utils/formatters';
import { generarHashInmutable } from '../utils/colombiaDian';
import confetti from 'canvas-confetti';
import { 
  Coins, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Hash, 
  PenTool, 
  Sparkles, 
  History,
  Printer
} from 'lucide-react';

interface ArqueoViewProps {
  config: FundConfig;
  denominaciones: DenominacionConteo[];
  onActualizarDenominacion: (valorUnitario: number, cantidad: number) => void;
  valesActivosCOP: number;
  facturasLiquidadasCOP: number;
  historicoActas: ArqueoActa[];
  onGuardarActa: (nuevaActa: ArqueoActa) => void;
  onVerActaModal: (acta: ArqueoActa) => void;
  onCuadreAutomatico: () => void;
}

export const ArqueoView: React.FC<ArqueoViewProps> = ({
  config,
  denominaciones,
  onActualizarDenominacion,
  valesActivosCOP,
  facturasLiquidadasCOP,
  historicoActas,
  onGuardarActa,
  onVerActaModal,
  onCuadreAutomatico,
}) => {
  const [auditorNombre, setAuditorNombre] = useState('Dr. Andrés Gómez (Revisoría Fiscal TP 149204-T)');
  const [observaciones, setObservaciones] = useState('Arqueo sorpresivo ordinario de control interno en Medellín.');
  const [firmaCustodio, setFirmaCustodio] = useState('Mariana López');
  const [firmaAuditor, setFirmaAuditor] = useState('Andrés Gómez');
  const [actaGuardadaReciente, setActaGuardadaReciente] = useState<ArqueoActa | null>(null);

  // Cálculo del efectivo físico
  const efectivoFisicoTotal = denominaciones.reduce((acc, d) => acc + d.cantidad * d.valorUnitario, 0);

  // Ecuación de Arqueo
  const fondoAsignado = config.montoFondoTotalCOP;
  const totalArqueado = efectivoFisicoTotal + valesActivosCOP + facturasLiquidadasCOP;
  const diferencia = totalArqueado - fondoAsignado;

  let estadoCuadre: 'CUADRADO' | 'SOBRANTE' | 'FALTANTE' = 'CUADRADO';
  if (diferencia > 0) estadoCuadre = 'SOBRANTE';
  else if (diferencia < 0) estadoCuadre = 'FALTANTE';

  const handleGuardarActaSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const actaId = `arq-${Date.now()}`;
    const consecutivo = `ACTA-ARQ-2026-${Math.floor(100 + Math.random() * 900)}`;
    const fechaHora = new Date().toISOString();

    const hash = generarHashInmutable({
      consecutivo,
      fechaHora,
      fondoAsignado,
      efectivoFisicoTotal,
      valesActivosCOP,
      facturasLiquidadasCOP,
      diferencia,
      denominaciones,
      custodio: config.custodioNombre,
      auditor: auditorNombre,
    });

    const nuevaActa: ArqueoActa = {
      id: actaId,
      consecutivo,
      fechaHora,
      custodioNombre: config.custodioNombre,
      auditorNombre,
      fondoAsignadoCOP: fondoAsignado,
      efectivoFisicoTotalCOP: efectivoFisicoTotal,
      valesProvisionalesCOP: valesActivosCOP,
      facturasLiquidadasCOP,
      totalArqueadoCOP: totalArqueado,
      diferenciaCOP: diferencia,
      estadoCuadre,
      desgloseEfectivo: [...denominaciones],
      observaciones,
      hashInmutableSHA256: hash,
      firmaCustodio: `${firmaCustodio} - Custodio Oficial`,
      firmaAuditor: `${firmaAuditor} - Revisor Fiscal`,
    };

    onGuardarActa(nuevaActa);
    setActaGuardadaReciente(nuevaActa);

    if (estadoCuadre === 'CUADRADO') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Coins className="w-4 h-4" />
            <span>Módulo de Auditoría Sorpresiva & Conteo Físico en COP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Arqueo de Caja Menor por Denominaciones Colombianas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Conteo de billetes ($100k-$2k) y monedas de curso legal de la República de Colombia, conciliado contra la ecuación de fondo fijo.
          </p>
        </div>

        <button
          onClick={onCuadreAutomatico}
          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          title="Ajusta las cantidades automáticamente para coincidir con el saldo teórico"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ajustar Conteo Teórico Exacto ($0 Dif.)</span>
        </button>
      </div>

      {/* Tarjeta de Conciliación en Vivo (Ecuación) */}
      <div className={`p-5 rounded-2xl border transition shadow-xl ${
        estadoCuadre === 'CUADRADO'
          ? 'bg-slate-900 border-emerald-500/50'
          : estadoCuadre === 'SOBRANTE'
          ? 'bg-slate-900 border-amber-500/50'
          : 'bg-slate-900 border-rose-500/50'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
              estadoCuadre === 'CUADRADO'
                ? 'bg-emerald-500/20 text-emerald-400'
                : estadoCuadre === 'SOBRANTE'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-rose-500/20 text-rose-400'
            }`}>
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Resultado de Conciliación en Vivo
              </span>
              <h3 className="text-lg font-black text-white">
                {estadoCuadre === 'CUADRADO' && '✓ CAJA PERFECTAMENTE CUADRADA'}
                {estadoCuadre === 'SOBRANTE' && '⚠️ SOBRANTE DE DINERO EN CAJA'}
                {estadoCuadre === 'FALTANTE' && '🚫 FALTANTE DE DINERO EN CAJA'}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase">Diferencia Neta</span>
            <p className={`font-mono text-xl font-black ${
              estadoCuadre === 'CUADRADO'
                ? 'text-emerald-400'
                : estadoCuadre === 'SOBRANTE'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              {formatCOP(diferencia)}
            </p>
          </div>
        </div>

        {/* Los 4 componentes de la ecuación en el arqueo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px]">Efectivo Físico Conteo:</span>
            <p className="font-mono font-bold text-base text-emerald-400 mt-0.5">
              {formatCOP(efectivoFisicoTotal)}
            </p>
            <span className="text-[10px] text-slate-500">Billetes + Monedas</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px]">Vales Provisionales:</span>
            <p className="font-mono font-bold text-base text-amber-400 mt-0.5">
              {formatCOP(valesActivosCOP)}
            </p>
            <span className="text-[10px] text-slate-500">Anticipos vigentes</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px]">Facturas Liquidadas:</span>
            <p className="font-mono font-bold text-base text-blue-400 mt-0.5">
              {formatCOP(facturasLiquidadasCOP)}
            </p>
            <span className="text-[10px] text-slate-500">Soportes DIAN</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px]">Fondo Fijo Asignado:</span>
            <p className="font-mono font-bold text-base text-white mt-0.5">
              {formatCOP(fondoAsignado)}
            </p>
            <span className="text-[10px] text-slate-500">Resolución de apertura</span>
          </div>
        </div>
      </div>

      {/* Grid: Desglose de Denominaciones vs Generación de Acta Inmutable */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabla interactiva de conteo de billetes y monedas */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Conteo Físico por Denominación en Pesos Colombianos</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Subtotal: {formatCOP(efectivoFisicoTotal)}
            </span>
          </div>

          {/* Billetes */}
          <div className="mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
              💵 Billetes de Curso Legal (Banco de la República)
            </span>
            <div className="space-y-2">
              {denominaciones.filter(d => d.esBillete).map((den) => (
                <div key={den.valorUnitario} className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="w-28 font-mono font-bold text-emerald-300">
                    {formatCOP(den.valorUnitario)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onActualizarDenominacion(den.valorUnitario, Math.max(0, den.cantidad - 1))}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={den.cantidad}
                      onChange={(e) => onActualizarDenominacion(den.valorUnitario, Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onActualizarDenominacion(den.valorUnitario, den.cantidad + 1)}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="w-28 text-right font-mono font-bold text-white">
                    {formatCOP(den.cantidad * den.valorUnitario)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monedas */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
              🪙 Monedas Metálicas
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {denominaciones.filter(d => !d.esBillete).map((den) => (
                <div key={den.valorUnitario} className="bg-slate-950/60 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-semibold">{formatCOP(den.valorUnitario)}</span>
                  <input
                    type="number"
                    min={0}
                    value={den.cantidad}
                    onChange={(e) => onActualizarDenominacion(den.valorUnitario, Math.max(0, Number(e.target.value)))}
                    className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                  />
                  <span className="font-mono text-emerald-400 font-bold">{formatCOP(den.cantidad * den.valorUnitario)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emisión de Acta Oficial Inmutable */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Emisión de Acta Inmutable (NIIF / NIA 500)</span>
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                SHA-256 Sello
              </span>
            </div>

            <form onSubmit={handleGuardarActaSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custodio Responsable
                </label>
                <input
                  type="text"
                  disabled
                  value={`${config.custodioNombre} (${config.custodioCargo})`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Auditor / Revisor Fiscal Presente *
                </label>
                <input
                  type="text"
                  required
                  value={auditorNombre}
                  onChange={(e) => setAuditorNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observaciones y Conclusiones del Arqueo
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Firmas Digitales */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Firma Digital Custodio</label>
                  <input
                    type="text"
                    required
                    value={firmaCustodio}
                    onChange={(e) => setFirmaCustodio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Firma Digital Auditor</label>
                  <input
                    type="text"
                    required
                    value={firmaAuditor}
                    onChange={(e) => setFirmaAuditor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 cursor-pointer"
              >
                <span className="font-mono font-black text-sm">$</span>
                <span>Firmar y Generar Acta Inmutable Oficial</span>
              </button>
            </form>
          </div>

          {/* Histórico Reciente de Actas */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Actas de Arqueo Previamente Selladas ({historicoActas.length})</span>
            </span>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {historicoActas.map((acta) => (
                <div key={acta.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">{acta.consecutivo}</span>
                    <p className="text-[10px] text-slate-400">{formatFechaCO(acta.fechaHora)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold">{formatCOP(acta.totalArqueadoCOP)}</span>
                    <button
                      onClick={() => onVerActaModal(acta)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium cursor-pointer"
                    >
                      Ver Acta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
