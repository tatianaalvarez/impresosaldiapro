import React, { useState } from 'react';
import { SoporteFiscalDIAN, Vale, FundConfig, TipoSoporte } from '../types';
import { formatCOP, formatFechaCO } from '../utils/formatters';
import { 
  validarNitColombiano, 
  detectarFraccionamiento, 
  calcularImpuestosGasto 
} from '../utils/colombiaDian';
import { 
  Scan, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Building2, 
  Receipt,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Copy
} from 'lucide-react';

interface OcrCaptureViewProps {
  config: FundConfig;
  vales: Vale[];
  soportes: SoporteFiscalDIAN[];
  onRegistrarSoporte: (nuevoSoporte: SoporteFiscalDIAN, valeIdParaLegalizar?: string) => void;
  onLegalizarValeDirecto?: (valeId: string, gastoRealCOP: number) => void;
}

export const OcrCaptureView: React.FC<OcrCaptureViewProps> = ({
  config,
  vales,
  soportes,
  onRegistrarSoporte,
}) => {
  // Estado del formulario OCR / Soporte
  const [tipoSoporte, setTipoSoporte] = useState<TipoSoporte>('FACTURA_ELECTRONICA');
  const [numeroConsecutivo, setNumeroConsecutivo] = useState('');
  const [cufe, setCufe] = useState('');
  const [nitEmisor, setNitEmisor] = useState('');
  const [dvEmisor, setDvEmisor] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [municipio, setMunicipio] = useState('Medellín');
  const [conceptoGasto, setConceptoGasto] = useState('');
  const [centroCostoId, setCentroCostoId] = useState(config.centrosCosto[0]?.id || 'CC-101');
  const [valeAsociadoId, setValeAsociadoId] = useState<string>('');
  const [cuentaPuc, setCuentaPuc] = useState('519525');
  
  // Montos
  const [montoTotalCOP, setMontoTotalCOP] = useState<number>(0);
  const [tipoTarifaIVA, setTipoTarifaIVA] = useState<'GRAVADO_19' | 'GRAVADO_5' | 'EXENTO'>('GRAVADO_19');
  const [aplicaIcaMedellin, setAplicaIcaMedellin] = useState(true);

  // Estados interactivos
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrSuccessMessage, setOcrSuccessMessage] = useState<string | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [alertaFraccionamientoDetectada, setAlertaFraccionamientoDetectada] = useState<string | null>(null);

  // Vales vigentes disponibles para legalizar
  const valesDisponibles = vales.filter(v => v.estado === 'DESEMBOLSADO');

  // Catálogo de Cuentas PUC para Caja Menor
  const catalogoPUC: Record<string, string> = {
    '513525': '513525 - Gastos de Transporte, Fletes y Acarreos',
    '513535': '513535 - Servicios de Aseo y Cafetería',
    '513540': '513540 - Correo, Portes y Telegramas',
    '514510': '514510 - Mantenimiento y Reparaciones Menores Locativas',
    '519525': '519525 - Elementos de Papelería y Útiles de Oficina',
    '519530': '519530 - Útiles de Aseo y Limpieza',
    '519565': '519565 - Taxis y Buses (Transporte Urbano Medellín)',
    '519595': '519595 - Otros Gastos Menores Diversos',
  };

  // Cálculo en vivo de impuestos
  const impuestosCalculados = calcularImpuestosGasto(montoTotalCOP, tipoTarifaIVA, aplicaIcaMedellin);

  // Validación de NIT DIAN en vivo
  const validacionNit = validarNitColombiano(nitEmisor, dvEmisor);

  // Presets para probar rápidamente el motor OCR y de reglas
  const aplicarPreset = (tipo: 'valida_papeleria' | 'valida_ferreteria' | 'doc_soporte' | 'intento_fraccionamiento' | 'exceso_tope') => {
    setIsProcessingOcr(true);
    setOcrSuccessMessage(null);
    setErrorValidacion(null);
    setAlertaFraccionamientoDetectada(null);

    setTimeout(() => {
      setIsProcessingOcr(false);
      if (tipo === 'valida_papeleria') {
        setTipoSoporte('FACTURA_ELECTRONICA');
        setNumeroConsecutivo('FE-99201');
        setCufe('d1a980bc293847a98234be1029348123049182390481239084019238401923849102');
        setNitEmisor('830037946');
        setDvEmisor('3');
        setRazonSocial('Panamericana Librería y Papelería S.A.');
        setMunicipio('Medellín');
        setConceptoGasto('Marcadores indelebles, cintas de empaque y resmas para rotulación de empaques');
        setCentroCostoId('CC-102');
        setCuentaPuc('519525');
        setMontoTotalCOP(89000);
        setTipoTarifaIVA('GRAVADO_19');
        setAplicaIcaMedellin(true);
        setOcrSuccessMessage('OCR DIAN: Factura Electrónica leída con éxito. CUFE certificado y DV validado.');
      } else if (tipo === 'valida_ferreteria') {
        setTipoSoporte('FACTURA_ELECTRONICA');
        setNumeroConsecutivo('FE-10492');
        setCufe('981240182390184bceda091248102934810293481029348102934810293481029348');
        setNitEmisor('900987654');
        setDvEmisor('7');
        setRazonSocial('Ferretería El Poblado Medellín S.A.S.');
        setMunicipio('Medellín');
        setConceptoGasto('Cintas aislantes, terminales eléctricas y fusibles para panel de control');
        setCentroCostoId('CC-105');
        setCuentaPuc('514510');
        setMontoTotalCOP(115000);
        setTipoTarifaIVA('GRAVADO_19');
        setAplicaIcaMedellin(true);
        setOcrSuccessMessage('OCR DIAN: Factura Electrónica válida de proveedor local en Medellín.');
      } else if (tipo === 'doc_soporte') {
        setTipoSoporte('DOCUMENTO_SOPORTE_NO_OBLIGADO');
        setNumeroConsecutivo(`DS-2026-${Math.floor(1000 + Math.random() * 9000)}`);
        setCufe('');
        setNitEmisor('71984210');
        setDvEmisor('4');
        setRazonSocial('Guillermo Henao (Persona Natural no obligada a facturar)');
        setMunicipio('Medellín');
        setConceptoGasto('Servicio de transporte y motocarro urgente para entrega de planchas litográficas');
        setCentroCostoId('CC-103');
        setCuentaPuc('513525');
        setMontoTotalCOP(60000);
        setTipoTarifaIVA('EXENTO');
        setAplicaIcaMedellin(true);
        setOcrSuccessMessage('OCR: Documento Soporte Electrónico para no obligado generado conforme a la Resolución 000167 de la DIAN.');
      } else if (tipo === 'intento_fraccionamiento') {
        // Usa el NIT de Ferretería San Ignacio que ya tiene compras hoy en initialData (900123456)
        setTipoSoporte('FACTURA_ELECTRONICA');
        setNumeroConsecutivo('FE-88125');
        setCufe('fracc-9481920-cufe-repetido-mismo-dia-san-ignacio');
        setNitEmisor('900123456');
        setDvEmisor('1');
        setRazonSocial('Ferretería y Tornillos San Ignacio Medellín S.A.S.');
        setMunicipio('Medellín');
        setConceptoGasto('Segunda compra consecutiva de tuercas y repuestos en el mismo día');
        setCentroCostoId('CC-105');
        setCuentaPuc('514510');
        setMontoTotalCOP(180000); // 135000 existente + 180000 = 315000 > 250000 tope!
        setTipoTarifaIVA('GRAVADO_19');
        setAplicaIcaMedellin(true);

        const checkFracc = detectarFraccionamiento(
          '900123456',
          180000,
          soportes,
          config.topePorComprobanteCOP,
          new Date().toISOString()
        );
        if (checkFracc.esFraccionamiento) {
          setAlertaFraccionamientoDetectada(checkFracc.detalles || 'Posible compra fraccionada');
        }
      } else if (tipo === 'exceso_tope') {
        setTipoSoporte('FACTURA_ELECTRONICA');
        setNumeroConsecutivo('FE-77410');
        setCufe('cufe-exceso-tope-320000-cop');
        setNitEmisor('890900608');
        setDvEmisor('9');
        setRazonSocial('Almacenes Éxito S.A.');
        setMunicipio('Medellín');
        setConceptoGasto('Compra de papelería masiva e insumos varios de cafetería');
        setCentroCostoId('CC-104');
        setCuentaPuc('519525');
        setMontoTotalCOP(320000); // Excede tope de 250.000 COP
        setTipoTarifaIVA('GRAVADO_19');
        setAplicaIcaMedellin(true);
        setErrorValidacion(`El monto ($ 320.000 COP) supera el tope máximo estatutario de ${formatCOP(config.topePorComprobanteCOP)} por comprobante.`);
      }
    }, 450);
  };

  const handleGuardarSoporte = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    // Validar tope por comprobante
    if (montoTotalCOP > config.topePorComprobanteCOP) {
      setErrorValidacion(`Bloqueo de Control Interno: El valor de la factura (${formatCOP(montoTotalCOP)}) supera el tope máximo permitido de ${formatCOP(config.topePorComprobanteCOP)}. Debe tramitarse por Tesorería General.`);
      return;
    }

    if (montoTotalCOP <= 0) {
      setErrorValidacion('El valor del comprobante debe ser mayor a $ 0 COP.');
      return;
    }

    // Validar NIT
    if (!nitEmisor.trim()) {
      setErrorValidacion('Debe ingresar el NIT o RUT del proveedor emisor.');
      return;
    }

    // Validar duplicado exacto
    const yaExiste = soportes.some(
      s => s.nitEmisor.replace(/\D/g, '') === nitEmisor.replace(/\D/g, '') &&
           s.numeroConsecutivo.trim().toLowerCase() === numeroConsecutivo.trim().toLowerCase()
    );
    if (yaExiste) {
      setErrorValidacion(`Factura duplicada: Ya existe un comprobante registrado con NIT ${nitEmisor} y número ${numeroConsecutivo}.`);
      return;
    }

    // Verificar fraccionamiento
    const fraccCheck = detectarFraccionamiento(
      nitEmisor,
      montoTotalCOP,
      soportes,
      config.topePorComprobanteCOP,
      new Date().toISOString()
    );

    const nuevoSoporte: SoporteFiscalDIAN = {
      id: `sop-${Date.now()}`,
      tipo: tipoSoporte,
      numeroConsecutivo: numeroConsecutivo || `FE-${Math.floor(10000 + Math.random() * 90000)}`,
      cufeOCude: cufe || (tipoSoporte === 'FACTURA_ELECTRONICA' ? `cufe-dian-${Date.now()}-medellin-gen` : undefined),
      fechaEmision: new Date().toISOString(),
      nitEmisor: nitEmisor.trim(),
      digitoVerificacion: validacionNit.dvCalculado,
      razonSocialEmisor: razonSocial || 'Proveedor Local Medellín',
      direccionEmisor: 'Medellín, Antioquia',
      municipioEmisor: municipio,
      conceptoGasto: conceptoGasto || 'Gasto menor operativo para Impresos El Día S.A.S.',
      cuentaPucCodigo: cuentaPuc,
      cuentaPucNombre: catalogoPUC[cuentaPuc] || 'Gastos Diversos',
      centroCostoId,
      valeAsociadoId: valeAsociadoId || undefined,
      desglose: impuestosCalculados,
      validoDIAN: true,
      observacionesDIAN: tipoSoporte === 'FACTURA_ELECTRONICA' 
        ? 'Factura Electrónica validada con éxito ante DIAN (Art. 616-1 E.T.).'
        : tipoSoporte === 'TIQUETE_POS_ELECTRONICO'
        ? 'Tiquete POS con CUDE debidamente transmitido.'
        : 'Documento Soporte Electrónico para no obligado generado (Res. 000167).',
      alertaFraccionamiento: fraccCheck.esFraccionamiento,
      alertaFraccionamientoDetalle: fraccCheck.detalles,
      registradoPor: config.custodioNombre,
      fechaRegistro: new Date().toISOString(),
    };

    onRegistrarSoporte(nuevoSoporte, valeAsociadoId || undefined);

    // Resetear formulario
    setNumeroConsecutivo('');
    setCufe('');
    setNitEmisor('');
    setDvEmisor('');
    setRazonSocial('');
    setConceptoGasto('');
    setMontoTotalCOP(0);
    setValeAsociadoId('');
    setOcrSuccessMessage('✓ Soporte fiscal radicado e imputado contablemente en la caja menor.');
    setAlertaFraccionamientoDetectada(null);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo OCR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Scan className="w-4 h-4" />
            <span>Motor OCR Inteligente & Validación Fiscal DIAN</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Recepción de Facturas Electrónicas y Documento Soporte
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cumplimiento estricto del Artículo 616-1 del Estatuto Tributario y Resolución 000167 de la DIAN para deducibilidad de costos en Impresos El Día S.A.S.
          </p>
        </div>

        {/* Presets de prueba rápida */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold">Simular OCR con Presets:</span>
          <button
            type="button"
            onClick={() => aplicarPreset('valida_papeleria')}
            className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-medium cursor-pointer transition"
          >
            📄 Factura Panamericana (FEV)
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('valida_ferreteria')}
            className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium cursor-pointer transition"
          >
            🔩 Ferretería Medellín (ICA)
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('doc_soporte')}
            className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-medium cursor-pointer transition"
          >
            📝 Documento Soporte (No Obligado)
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('intento_fraccionamiento')}
            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium cursor-pointer transition"
            title="Prueba el algoritmo anti-fraccionamiento de compras"
          >
            ⚠️ Simular Fraccionamiento
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('exceso_tope')}
            className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-medium cursor-pointer transition"
            title="Prueba el bloqueo por exceso de tope"
          >
            🚫 Supera Tope ($320k)
          </button>
        </div>
      </div>

      {/* Grid: Formulario de Radicación vs Historial de Facturas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Ingreso / OCR */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>Datos del Comprobante Fiscal en Pesos Colombianos (COP)</span>
            </h3>
            {isProcessingOcr && (
              <span className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>Extrayendo campos DIAN...</span>
              </span>
            )}
          </div>

          {/* Mensajes de Alerta y Éxito */}
          {ocrSuccessMessage && (
            <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{ocrSuccessMessage}</span>
            </div>
          )}

          {errorValidacion && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {alertaFraccionamientoDetectada && (
            <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">ALERTA DE CONTROL INTERNO (ANTI-FRACCIONAMIENTO):</p>
                <p className="mt-0.5">{alertaFraccionamientoDetectada}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleGuardarSoporte} className="space-y-4">
            {/* Tipo de Documento DIAN */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Soporte Fiscal (Estatuto Tributario Colombia)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoSoporte('FACTURA_ELECTRONICA')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                    tipoSoporte === 'FACTURA_ELECTRONICA'
                      ? 'bg-blue-500/20 border-blue-500 text-white font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold">Factura Electrónica (FEV)</p>
                  <p className="text-[10px] text-slate-400">Art. 616-1 con CUFE</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoSoporte('TIQUETE_POS_ELECTRONICO')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                    tipoSoporte === 'TIQUETE_POS_ELECTRONICO'
                      ? 'bg-blue-500/20 border-blue-500 text-white font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold">POS Electrónico</p>
                  <p className="text-[10px] text-slate-400">Tiquete con CUDE</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoSoporte('DOCUMENTO_SOPORTE_NO_OBLIGADO')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                    tipoSoporte === 'DOCUMENTO_SOPORTE_NO_OBLIGADO'
                      ? 'bg-purple-500/20 border-purple-500 text-white font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold">Documento Soporte</p>
                  <p className="text-[10px] text-slate-400">Res. 000167 No Obligados</p>
                </button>
              </div>
            </div>

            {/* Número Consecutivo & CUFE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número Consecutivo de Factura *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: SETP-94812"
                  value={numeroConsecutivo}
                  onChange={(e) => setNumeroConsecutivo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código CUFE / CUDE (DIAN)
                </label>
                <input
                  type="text"
                  placeholder="Cadena hex DIAN de validación..."
                  value={cufe}
                  onChange={(e) => setCufe(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono truncate"
                />
              </div>
            </div>

            {/* Proveedor: NIT con validación Módulo 11 & Razón Social */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>NIT / RUT Emisor *</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${
                    validacionNit.valido ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                  }`}>
                    DV calculado: {validacionNit.dvCalculado}
                  </span>
                </label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    required
                    placeholder="ej: 900548219"
                    value={nitEmisor}
                    onChange={(e) => setNitEmisor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="text"
                    maxLength={1}
                    placeholder="DV"
                    value={dvEmisor || validacionNit.dvCalculado}
                    onChange={(e) => setDvEmisor(e.target.value)}
                    className="w-12 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-center text-emerald-400 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Razón Social o Nombre del Emisor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Panamericana Librería y Papelería S.A."
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Concepto del Gasto */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Concepto Detallado del Gasto *
              </label>
              <input
                type="text"
                required
                placeholder="Descripción del insumo o servicio menor..."
                value={conceptoGasto}
                onChange={(e) => setConceptoGasto(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Imputación PUC & Centro de Costos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cuenta de Gasto (Plan Único de Cuentas - PUC)
                </label>
                <select
                  value={cuentaPuc}
                  onChange={(e) => setCuentaPuc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {Object.entries(catalogoPUC).map(([cod, desc]) => (
                    <option key={cod} value={cod}>{desc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Centro de Costos (Impresos El Día S.A.S.)
                </label>
                <select
                  value={centroCostoId}
                  onChange={(e) => setCentroCostoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {config.centrosCosto.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.codigo} - {cc.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Legalización de Vale Existente (Opcional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>¿Legaliza un Vale Provisional Entregado Previamente?</span>
                <span className="text-[10px] text-amber-400">Cierra el vale y libera la provisión</span>
              </label>
              <select
                value={valeAsociadoId}
                onChange={(e) => setValeAsociadoId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- No asocia vale (Gasto directo radicado) --</option>
                {valesDisponibles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.codigoVale} | {v.solicitante} - Anticipo: {formatCOP(v.montoSolicitadoCOP)}
                  </option>
                ))}
              </select>
            </div>

            {/* Importe Total en COP e Impuestos */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">
                    Total Factura en COP *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-emerald-400 font-mono font-bold text-xs">COP</span>
                    <input
                      type="number"
                      required
                      min={100}
                      max={config.topePorComprobanteCOP * 2} // Permite probar rechazo si escribe > 250k
                      value={montoTotalCOP || ''}
                      onChange={(e) => setMontoTotalCOP(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Tope: {formatCOP(config.topePorComprobanteCOP)}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tratamiento de IVA
                  </label>
                  <select
                    value={tipoTarifaIVA}
                    onChange={(e) => setTipoTarifaIVA(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="GRAVADO_19">Gravado 19% General</option>
                    <option value="GRAVADO_5">Gravado 5% Reducido</option>
                    <option value="EXENTO">Exento / No responsable</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={aplicaIcaMedellin}
                      onChange={(e) => setAplicaIcaMedellin(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                    <span>Calcular ICA Medellín (7x1000)</span>
                  </label>
                </div>
              </div>

              {/* Resumen de Liquidación Tributaria */}
              {montoTotalCOP > 0 && (
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Base Gravada:</span>
                    <p className="font-mono text-slate-200">{formatCOP(impuestosCalculados.subtotalGravadoCOP)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">IVA (19% o 5%):</span>
                    <p className="font-mono text-emerald-400">
                      {formatCOP(impuestosCalculados.iva19COP + impuestosCalculados.iva5COP)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">ICA Medellín:</span>
                    <p className="font-mono text-slate-200">{formatCOP(impuestosCalculados.icaValorCOP)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Total Liquidado:</span>
                    <p className="font-mono font-bold text-white">{formatCOP(impuestosCalculados.totalCOP)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 cursor-pointer"
            >
              <span className="font-mono font-black text-sm">$</span>
              <span>Validar con DIAN y Radicar en Caja Menor (COP)</span>
            </button>
          </form>
        </div>

        {/* Historial de Comprobantes Radicados en la Caja Menor */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Soportes Fiscales en Cartera ({soportes.length})</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Total: {formatCOP(soportes.reduce((acc, s) => acc + s.desglose.totalCOP, 0))}
              </span>
            </div>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {soportes.map((soporte) => (
                <div
                  key={soporte.id}
                  className={`p-3.5 rounded-xl border text-xs transition ${
                    soporte.alertaFraccionamiento
                      ? 'bg-amber-950/20 border-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-white text-xs">
                          {soporte.numeroConsecutivo}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          soporte.tipo === 'FACTURA_ELECTRONICA'
                            ? 'bg-blue-500/20 text-blue-300'
                            : soporte.tipo === 'TIQUETE_POS_ELECTRONICO'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {soporte.tipo === 'FACTURA_ELECTRONICA' ? 'FEV' : soporte.tipo === 'TIQUETE_POS_ELECTRONICO' ? 'POS' : 'DOC SOP'}
                        </span>
                        {soporte.alertaFraccionamiento && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                            ⚠️ Fraccionado
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-200 mt-1">{soporte.razonSocialEmisor}</p>
                      <p className="text-[11px] text-slate-400">NIT: {soporte.nitEmisor}-{soporte.digitoVerificacion}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-sm text-white">
                        {formatCOP(soporte.desglose.totalCOP)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        IVA: {formatCOP(soporte.desglose.iva19COP + soporte.desglose.iva5COP)}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    {soporte.conceptoGasto}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>PUC: <strong className="text-slate-300">{soporte.cuentaPucCodigo}</strong></span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>DIAN Validado</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Soportes listos para reintegro contable:</span>
            <span className="font-semibold text-slate-300">{soportes.length} facturas válidas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
