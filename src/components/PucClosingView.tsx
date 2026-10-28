import React, { useState } from 'react';
import { FundConfig, SoporteFiscalDIAN, AsientoPUCDetalle, ComprobanteCierreReembolso } from '../types';
import { formatCOP, formatFechaCO } from '../utils/formatters';
import { 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  Send, 
  Receipt, 
  BookOpen, 
  Building2, 
  Copy, 
  FileText,
  Banknote
} from 'lucide-react';

interface PucClosingViewProps {
  config: FundConfig;
  soportes: SoporteFiscalDIAN[];
  onEjecutarReembolso: (nuevoCierre: ComprobanteCierreReembolso) => void;
}

export const PucClosingView: React.FC<PucClosingViewProps> = ({
  config,
  soportes,
  onEjecutarReembolso,
}) => {
  const [aprobadoContador, setAprobadoContador] = useState(true);
  const [bancoOrigen, setBancoOrigen] = useState('Bancolombia Cta Corriente # 104-98412-90 (Medellín)');
  const [referenciaTransferencia, setReferenciaTransferencia] = useState(`TRANSF-${Date.now().toString().slice(-6)}`);
  const [copiedSiigo, setCopiedSiigo] = useState(false);
  const [copiedAlegra, setCopiedAlegra] = useState(false);

  // Total a reembolsar
  const totalReembolsoCOP = soportes.reduce((acc, s) => acc + s.desglose.totalCOP, 0);

  // Generar Asientos PUC detallados
  const asientosPUC: AsientoPUCDetalle[] = [];

  soportes.forEach((soporte) => {
    // 1. Débito a la cuenta de Gasto específica (por la base)
    const baseGasto = soporte.desglose.subtotalGravadoCOP + soporte.desglose.subtotalExentoCOP;
    asientosPUC.push({
      cuentaCodigo: soporte.cuentaPucCodigo,
      cuentaNombre: soporte.cuentaPucNombre,
      terceroNit: soporte.nitEmisor,
      terceroNombre: soporte.razonSocialEmisor,
      debitoCOP: baseGasto,
      creditoCOP: 0,
      concepto: `${soporte.numeroConsecutivo}: ${soporte.conceptoGasto}`,
    });

    // 2. Débito al IVA descontable (si aplica)
    const totalIVA = soporte.desglose.iva19COP + soporte.desglose.iva5COP;
    if (totalIVA > 0) {
      asientosPUC.push({
        cuentaCodigo: '240801',
        cuentaNombre: 'Impuesto sobre las Ventas por Pagar (IVA Descontable en Compras)',
        terceroNit: soporte.nitEmisor,
        terceroNombre: soporte.razonSocialEmisor,
        debitoCOP: totalIVA,
        creditoCOP: 0,
        concepto: `IVA 19%/5% s/ ${soporte.numeroConsecutivo}`,
      });
    }

    // 3. Crédito a Caja Menor (110505) por el total pagado en efectivo
    asientosPUC.push({
      cuentaCodigo: '110505',
      cuentaNombre: 'Caja Menor Principal - Impresos El Día S.A.S.',
      terceroNit: config.nit,
      terceroNombre: config.empresaNombre,
      debitoCOP: 0,
      creditoCOP: soporte.desglose.totalCOP,
      concepto: `Descargo Caja Menor s/ ${soporte.numeroConsecutivo}`,
    });
  });

  const totalDebitos = asientosPUC.reduce((acc, a) => acc + a.debitoCOP, 0);
  const totalCreditos = asientosPUC.reduce((acc, a) => acc + a.creditoCOP, 0);
  const asientosCuadrados = totalDebitos === totalCreditos;

  // Generación de Archivo Plano para Siigo Nube
  // Formato: TipoComprobante,Consecutivo,Fecha,Cuenta,NIT,Sucursal,CentroCostos,Debito,Credito,Descripcion
  const fechaHoy = new Date().toISOString().split('T')[0];
  const archivoPlanoSiigo = [
    'TIPO_COMPROBANTE|CONSECUTIVO|FECHA|CUENTA_PUC|NIT_TERCERO|CENTRO_COSTOS|DEBITO_COP|CREDITO_COP|CONCEPTO_DETALLE',
    ...asientosPUC.map((a, idx) => 
      `CC-RC|0042|${fechaHoy}|${a.cuentaCodigo}|${a.terceroNit}|101|${a.debitoCOP}|${a.creditoCOP}|${a.concepto.replace(/\|/g, '')}`
    )
  ].join('\n');

  // Generación de JSON para Alegra API / Import
  const jsonExportAlegra = JSON.stringify({
    empresa: {
      nombre: config.empresaNombre,
      nit: config.nit,
      ciudad: config.ciudad,
    },
    tipoDocumento: 'ComprobanteDeEgresoReembolso',
    fecha: fechaHoy,
    cuentaBancariaReposicion: bancoOrigen,
    referenciaBancaria: referenciaTransferencia,
    totalReembolsoCOP,
    custodio: config.custodioNombre,
    partidas: asientosPUC.map(a => ({
      cuentaContable: a.cuentaCodigo,
      nombreCuenta: a.cuentaNombre,
      identificacionTercero: a.terceroNit,
      nombreTercero: a.terceroNombre,
      debito: a.debitoCOP,
      credito: a.creditoCOP,
      descripcion: a.concepto,
    }))
  }, null, 2);

  const handleDescargarSiigo = () => {
    const blob = new Blob([archivoPlanoSiigo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Siigo_CajaMenor_ImpresosElDia_${fechaHoy}.txt`;
    link.click();
    setCopiedSiigo(true);
    setTimeout(() => setCopiedSiigo(false), 2500);
  };

  const handleDescargarAlegra = () => {
    const blob = new Blob([jsonExportAlegra], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Alegra_Reembolso_CajaMenor_${fechaHoy}.json`;
    link.click();
    setCopiedAlegra(true);
    setTimeout(() => setCopiedAlegra(false), 2500);
  };

  const handleProcesarReembolso = () => {
    if (soportes.length === 0) {
      alert('No hay facturas pendientes por reembolsar en este momento.');
      return;
    }

    const nuevoCierre: ComprobanteCierreReembolso = {
      id: `reemb-${Date.now()}`,
      consecutivo: `REEMB-2026-${Math.floor(10 + Math.random() * 90)}`,
      fechaCierre: new Date().toISOString(),
      totalReembolsoCOP,
      cantidadComprobantes: soportes.length,
      asientosPUC,
      archivoPlanoSiigo,
      jsonExportAlegra,
      aprobadoContador,
      fechaPagoTransferencia: new Date().toISOString(),
    };

    onEjecutarReembolso(nuevoCierre);
    alert(`¡Reembolso ${nuevoCierre.consecutivo} procesado exitosamente!\nSe han reintegrado ${formatCOP(totalReembolsoCOP)} al efectivo físico de la caja menor.`);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Mapeo PUC (Cuenta 110505) & Integración ERP (Siigo / Alegra)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Cierre Contable, Causación NIIF y Reembolso Bancario
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cumplimiento del principio contable de devengo (acumulación) y generación de archivos compatibles para Siigo Nube y Alegra.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDescargarSiigo}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-700/20"
          >
            <Download className="w-4 h-4" />
            <span>{copiedSiigo ? '¡Archivo Descargado!' : 'Exportar Plano Siigo (.txt)'}</span>
          </button>

          <button
            onClick={handleDescargarAlegra}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-700/20"
          >
            <Download className="w-4 h-4" />
            <span>{copiedAlegra ? '¡JSON Descargado!' : 'Exportar JSON Alegra'}</span>
          </button>
        </div>
      </div>

      {/* Tarjeta de Resumen del Reembolso Pendiente */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total a Reembolsar</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatCOP(totalReembolsoCOP)}
          </p>
          <span className="text-[11px] text-slate-400">{soportes.length} comprobantes validados</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Cuenta Contable Caja</span>
          <p className="text-lg font-bold text-white font-mono mt-1">
            110505
          </p>
          <span className="text-[11px] text-slate-400">Caja Menor Principal</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Estado de Partida Doble</span>
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-400">
              Débitos = Créditos ({formatCOP(totalDebitos)})
            </p>
          </div>
          <span className="text-[11px] text-slate-400">Principio de devengo NIIF</span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleProcesarReembolso}
            disabled={soportes.length === 0}
            className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              soportes.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-700/20'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Aprobar y Reembolsar a Caja (COP)</span>
          </button>
          <span className="text-[10px] text-slate-400 text-center">
            Repone el efectivo físico de la caja menor
          </span>
        </div>
      </div>

      {/* Grid: Asiento Contable PUC vs Vista Previa Siigo/Alegra */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabla del Asiento Contable PUC */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Causación y Asiento Contable PUC de Caja Menor</span>
            </h3>
            <span className="text-xs font-mono text-slate-300">
              {asientosPUC.length} movimientos generados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Cuenta PUC</th>
                  <th className="pb-3">Nombre Cuenta</th>
                  <th className="pb-3">Tercero (NIT / Razón Social)</th>
                  <th className="pb-3 text-right">Débito (COP)</th>
                  <th className="pb-3 text-right pr-2">Crédito (COP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {asientosPUC.map((a, index) => (
                  <tr key={index} className="hover:bg-slate-800/40 transition text-[11px]">
                    <td className="py-2.5 pl-2 font-bold text-indigo-400">{a.cuentaCodigo}</td>
                    <td className="py-2.5 text-slate-300 font-sans max-w-[200px] truncate">{a.cuentaNombre}</td>
                    <td className="py-2.5 text-slate-400 font-sans max-w-[180px] truncate">
                      {a.terceroNit} - {a.terceroNombre}
                    </td>
                    <td className="py-2.5 text-right font-bold text-white">
                      {a.debitoCOP > 0 ? formatCOP(a.debitoCOP) : '-'}
                    </td>
                    <td className="py-2.5 text-right pr-2 font-bold text-emerald-400">
                      {a.creditoCOP > 0 ? formatCOP(a.creditoCOP) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 font-mono font-black text-xs text-white">
                  <td colSpan={3} className="py-3 pl-2 text-right uppercase font-sans">
                    Sumas Iguales (Partida Doble):
                  </td>
                  <td className="py-3 text-right text-white">{formatCOP(totalDebitos)}</td>
                  <td className="py-3 text-right pr-2 text-emerald-400">{formatCOP(totalCreditos)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Vista Previa de Archivo Plano Siigo */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                <span>Estructura Siigo Nube</span>
              </h3>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">
                TXT / CSV
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Archivo estructurado listo para importar en el módulo de contabilidad de Siigo sin digitación manual.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-72">
              <pre className="whitespace-pre-wrap">{archivoPlanoSiigo}</pre>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Banco Reposición:</span>
              <span className="text-white font-medium">Bancolombia</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Soporte de Egreso:</span>
              <span className="text-emerald-400 font-mono font-bold">CE-2026-0042</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
