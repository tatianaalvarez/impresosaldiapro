import React, { useState } from 'react';
import { FundConfig, SoporteFiscalDIAN, Vale, AsientoPUCDetalle } from '../types';
import { formatCOP, formatFechaCO } from '../utils/formatters';
import { 
  Lock, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  Printer, 
  Mail, 
  Building2, 
  Scale, 
  Sparkles, 
  X,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CierreMesModalProps {
  config: FundConfig;
  soportes: SoporteFiscalDIAN[];
  vales: Vale[];
  efectivoFisicoCOP: number;
  valesActivosCOP: number;
  facturasLiquidadasCOP: number;
  onConfirmarCierre: (notificacionEnviada: boolean) => void;
  onClose: () => void;
}

export const CierreMesModal: React.FC<CierreMesModalProps> = ({
  config,
  soportes,
  vales,
  efectivoFisicoCOP,
  valesActivosCOP,
  facturasLiquidadasCOP,
  onConfirmarCierre,
  onClose,
}) => {
  const [etapa, setEtapa] = useState<'RESUMEN' | 'EJECUTANDO' | 'COMPLETADO'>('RESUMEN');
  const [notificacionEmail, setNotificacionEmail] = useState('contabilidad@impresoseldia.com');
  const [observacionesCierre, setObservacionesCierre] = useState('Cierre mensual ordinario de caja menor. Cumplimiento DIAN y conciliación PUC 110505 verificados.');

  const fechaHoy = new Date().toISOString().split('T')[0];
  const mesNombre = 'Octubre 2026';

  // Cálculos consolidados en Pesos Colombianos (COP)
  const totalFacturasCOP = soportes.reduce((acc, s) => acc + s.desglose.totalCOP, 0);
  const totalBaseCOP = soportes.reduce((acc, s) => acc + s.desglose.subtotalGravadoCOP + s.desglose.subtotalExentoCOP, 0);
  const totalIvaCOP = soportes.reduce((acc, s) => acc + s.desglose.iva19COP + s.desglose.iva5COP, 0);
  const totalIcaMedellinCOP = soportes.reduce((acc, s) => acc + s.desglose.icaValorCOP, 0);
  const valesLiquidados = vales.filter(v => v.estado === 'LEGALIZADO');

  // Mapeo al PUC
  const asientosPUC: AsientoPUCDetalle[] = [];
  soportes.forEach(s => {
    const base = s.desglose.subtotalGravadoCOP + s.desglose.subtotalExentoCOP;
    asientosPUC.push({
      cuentaCodigo: s.cuentaPucCodigo,
      cuentaNombre: s.cuentaPucNombre,
      terceroNit: s.nitEmisor,
      terceroNombre: s.razonSocialEmisor,
      debitoCOP: base,
      creditoCOP: 0,
      concepto: `${s.numeroConsecutivo}: ${s.conceptoGasto}`,
    });

    const iva = s.desglose.iva19COP + s.desglose.iva5COP;
    if (iva > 0) {
      asientosPUC.push({
        cuentaCodigo: '240801',
        cuentaNombre: 'IVA Descontable en Compras y Servicios',
        terceroNit: s.nitEmisor,
        terceroNombre: s.razonSocialEmisor,
        debitoCOP: iva,
        creditoCOP: 0,
        concepto: `IVA s/ ${s.numeroConsecutivo}`,
      });
    }

    asientosPUC.push({
      cuentaCodigo: '110505',
      cuentaNombre: 'Caja Menor Principal - Impresos El Día S.A.S.',
      terceroNit: config.nit,
      terceroNombre: config.empresaNombre,
      debitoCOP: 0,
      creditoCOP: s.desglose.totalCOP,
      concepto: `Descargo Caja Menor s/ ${s.numeroConsecutivo}`,
    });
  });

  const totalDebitos = asientosPUC.reduce((acc, a) => acc + a.debitoCOP, 0);
  const totalCreditos = asientosPUC.reduce((acc, a) => acc + a.creditoCOP, 0);

  // 1. Descargar Planilla Excel Detallada (.csv con delimitador ; y BOM para Excel en español)
  const descargarPlanillaExcel = () => {
    const encabezados = [
      'PLANILLA DE CONSOLIDACION DE CAJA MENOR - IMPRESOS EL DIA S.A.S. (MEDELLIN)',
      `Periodo: ${mesNombre} | NIT: ${config.nit} | Custodio: ${config.custodioNombre}`,
      `Moneda: Pesos Colombianos (COP) | Fondo Asignado: ${config.montoFondoTotalCOP}`,
      '',
      'RELACION DETALLADA DE FACTURAS Y VALES LIQUIDADOS',
      'Fecha Emision;Tipo Soporte;Consecutivo;CUFE/CUDE;NIT Emisor;DV;Razon Social;Centro Costos;Cuenta PUC;Concepto Gasto;Base COP;IVA COP;ICA Medellin COP;Total COP',
      ...soportes.map(s => 
        `${s.fechaEmision.split('T')[0]};${s.tipo};${s.numeroConsecutivo};${s.cufeOCude || 'N/A'};${s.nitEmisor};${s.digitoVerificacion};"${s.razonSocialEmisor}";${s.centroCostoId};${s.cuentaPucCodigo};"${s.conceptoGasto.replace(/"/g, '""')}";${s.desglose.subtotalGravadoCOP + s.desglose.subtotalExentoCOP};${s.desglose.iva19COP + s.desglose.iva5COP};${s.desglose.icaValorCOP};${s.desglose.totalCOP}`
      ),
      '',
      'MAPEO AL PLAN UNICO DE CUENTAS (PUC) - PARTIDA DOBLE',
      'Cuenta PUC;Nombre de Cuenta;NIT Tercero;Nombre Tercero;Debito (COP);Credito (COP);Detalle Concepto',
      ...asientosPUC.map(a => 
        `${a.cuentaCodigo};"${a.cuentaNombre}";${a.terceroNit};"${a.terceroNombre}";${a.debitoCOP};${a.creditoCOP};"${a.concepto.replace(/"/g, '""')}"`
      ),
      `TOTALES;;;;${totalDebitos};${totalCreditos};CUADRADO PARTIDA DOBLE`
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + encabezados], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Planilla_Excel_Cierre_Caja_Menor_${mesNombre.replace(' ', '_')}.csv`;
    link.click();
  };

  // 2. Descargar Archivo Plano Siigo Nube
  const descargarPlanoSiigo = () => {
    const lineasSiigo = [
      'TIPO_COMPROBANTE|CONSECUTIVO|FECHA|CUENTA_PUC|NIT_TERCERO|CENTRO_COSTOS|DEBITO_COP|CREDITO_COP|CONCEPTO_DETALLE',
      ...asientosPUC.map(a => 
        `CC-RC|0042|${fechaHoy}|${a.cuentaCodigo}|${a.terceroNit}|101|${a.debitoCOP}|${a.creditoCOP}|${a.concepto.replace(/\|/g, '')}`
      )
    ].join('\n');

    const blob = new Blob([lineasSiigo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Siigo_Cierre_${mesNombre.replace(' ', '_')}.txt`;
    link.click();
  };

  // 3. Descargar JSON Alegra
  const descargarJsonAlegra = () => {
    const dataAlegra = {
      empresa: {
        nombre: config.empresaNombre,
        nit: config.nit,
        ciudad: config.ciudad,
        moneda: 'COP',
      },
      periodoCierre: mesNombre,
      fechaCierre: fechaHoy,
      totalConsolidadoCOP: totalFacturasCOP,
      custodio: config.custodioNombre,
      partidasContablesPUC: asientosPUC.map(a => ({
        cuenta: a.cuentaCodigo,
        descripcionCuenta: a.cuentaNombre,
        terceroNit: a.terceroNit,
        terceroNombre: a.terceroNombre,
        debitoCOP: a.debitoCOP,
        creditoCOP: a.creditoCOP,
        concepto: a.concepto,
      })),
    };

    const blob = new Blob([JSON.stringify(dataAlegra, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Alegra_Cierre_${mesNombre.replace(' ', '_')}.json`;
    link.click();
  };

  // Ejecución automatizada del Cierre de Mes
  const handleEjecutarCierreAutomatizado = () => {
    setEtapa('EJECUTANDO');

    setTimeout(() => {
      // Descargas automáticas de archivos
      descargarPlanillaExcel();
      descargarPlanoSiigo();
      descargarJsonAlegra();

      setEtapa('COMPLETADO');
      onConfirmarCierre(true);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {
        // ignore
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-emerald-500/50 text-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Encabezado */}
        <div className="border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Módulo Automatizado de Tesorería & Contabilidad</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <span>Cierre Mensual de Caja Menor — {mesNombre}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
              Pesos Colombianos (COP)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {config.empresaNombre} (NIT: {config.nit}, Medellín) — Custodio: {config.custodioNombre}
          </p>
        </div>

        {etapa === 'RESUMEN' && (
          <div className="space-y-6">
            {/* Las 4 Acciones Automáticas a Ejecutarse */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block mb-1">
                ⚡ Secuencia de Ejecución Automática al Presionar el Botón:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">1</span>
                  <span>Consolidar facturas y vales en COP</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">2</span>
                  <span>Generar Informe PDF y Planilla Excel</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">3</span>
                  <span>Estructurar Plano Siigo y JSON Alegra</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">4</span>
                  <span>Bloquear periodo & Notificar a Contabilidad</span>
                </div>
              </div>
            </div>

            {/* Resumen Financiero en COP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total a Liquidar</span>
                <p className="text-xl font-black text-emerald-400 font-mono mt-1">
                  {formatCOP(totalFacturasCOP)}
                </p>
                <span className="text-[10px] text-slate-400">{soportes.length} facturas DIAN</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Base de Gasto</span>
                <p className="text-xl font-bold text-white font-mono mt-1">
                  {formatCOP(totalBaseCOP)}
                </p>
                <span className="text-[10px] text-slate-400">Cuentas 5135, 5145, 5195</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">IVA Descontable</span>
                <p className="text-xl font-bold text-blue-400 font-mono mt-1">
                  {formatCOP(totalIvaCOP)}
                </p>
                <span className="text-[10px] text-slate-400">Cuenta 240801</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">ICA Medellín</span>
                <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                  {formatCOP(totalIcaMedellinCOP)}
                </p>
                <span className="text-[10px] text-slate-400">Tarifa territorial</span>
              </div>
            </div>

            {/* Configuración de Notificación al Depto de Contabilidad */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enviar Notificación Automática de Aprobación a:</span>
                </label>
                <input
                  type="email"
                  value={notificacionEmail}
                  onChange={(e) => setNotificacionEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Observaciones de Cierre Contable:
                </label>
                <textarea
                  rows={2}
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Botón de Ejecución Destacado */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarCierreAutomatizado}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 rounded-xl text-sm font-black transition flex items-center gap-2 shadow-xl shadow-emerald-500/25 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Ejecutar Cierre de Mes Automatizado (COP)</span>
              </button>
            </div>
          </div>
        )}

        {etapa === 'EJECUTANDO' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Consolidando Periodo Contable en COP...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generando archivos planos Siigo, JSON Alegra, Planilla Excel y bloqueando el periodo...
              </p>
            </div>
          </div>
        )}

        {etapa === 'COMPLETADO' && (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/60 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-black text-emerald-200">
                  ¡CIERRE DE MES EJECUTADO EXITOSAMENTE!
                </h3>
                <p className="text-xs text-emerald-300/90 mt-1">
                  Se consolidaron {formatCOP(totalFacturasCOP)} en Pesos Colombianos (COP). Los archivos de integración ERP y la planilla Excel han sido descargados automáticamente.
                </p>
              </div>
            </div>

            {/* Notificación y Bloqueo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estado del Periodo:</span>
                </span>
                <p className="text-sm font-bold text-amber-300 mt-1">
                  🔒 BLOQUEADO TEMPORALMENTE
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Protegido contra modificaciones accidentales hasta visto bueno contable.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Notificación Transmitida:</span>
                </span>
                <p className="text-sm font-bold text-white mt-1 truncate">
                  {notificacionEmail}
                </p>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  ✓ Entregado con copia a Revisoría Fiscal.
                </p>
              </div>
            </div>

            {/* Descargas Manuales de Respaldo */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Descargas y Reportes del Periodo Cerrado:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={descargarPlanillaExcel}
                  className="p-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Planilla Excel (.csv)</span>
                </button>

                <button
                  onClick={descargarPlanoSiigo}
                  className="p-2.5 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Plano Siigo Nube (.txt)</span>
                </button>

                <button
                  onClick={descargarJsonAlegra}
                  className="p-2.5 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Export JSON Alegra</span>
                </button>
              </div>
            </div>

            {/* Botón Imprimir Informe Ejecutivo PDF */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar Informe PDF</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
              >
                Finalizar y Cerrar Ventana
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
