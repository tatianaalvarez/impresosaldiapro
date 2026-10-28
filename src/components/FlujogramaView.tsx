import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  GitBranch, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Scan, 
  Receipt, 
  Scale, 
  FileSpreadsheet, 
  ArrowDown, 
  ArrowRight, 
  Building2, 
  Banknote, 
  Lock,
  UserCheck
} from 'lucide-react';

export const FlujogramaView: React.FC = () => {
  const [rolFiltro, setRolFiltro] = useState<'TODOS' | 'SOLICITANTE' | 'CUSTODIO' | 'CONTABILIDAD'>('TODOS');
  const [pasoSeleccionado, setPasoSeleccionado] = useState<number | null>(null);

  const pasosFlujo = [
    {
      paso: 1,
      titulo: 'Paso 1: Solicitud de Vale Provisional / Anticipo',
      rol: 'SOLICITANTE',
      rolNombre: 'Colaborador / Operario de Planta',
      rolBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icono: <Banknote className="w-5 h-5 text-blue-400" />,
      descripcion: 'El solicitante ingresa el concepto justificado y el monto exacto en Pesos Colombianos (COP) vía App móvil o Web.',
      controles: ['Monto en COP', 'Asociación a Centro de Costos Medellín', 'Descripción operativa'],
      esPuntoControl: false,
    },
    {
      paso: 2,
      titulo: 'PUNTO DE CONTROL 1: Verificación de Prohibiciones Legales y Topes',
      rol: 'CUSTODIO',
      rolNombre: 'Custodio de Caja (Mariana López)',
      rolBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icono: <span className="font-mono font-black text-rose-400 text-lg">$</span>,
      descripcion: 'El motor de reglas evalúa automáticamente si el monto supera el tope de $250.000 COP o si incurre en prohibiciones legales taxativas.',
      controles: [
        '¿Excede tope de $250.000 COP? ➔ RECHAZADO (Trámite por Tesorería General)',
        '¿Gasto prohibido? Nómina/salarios (Art. 771-5 E.T.) ➔ RECHAZADO',
        '¿Préstamos personales o calamidad? ➔ RECHAZADO',
        '¿Materia prima principal litográfica (tintas offset/propalcote)? ➔ RECHAZADO',
        '¿Aprobado por Custodio? ➔ APROBADO',
      ],
      esPuntoControl: true,
      colorBorde: 'border-rose-500/50 bg-rose-950/20',
    },
    {
      paso: 3,
      titulo: 'Paso 2: Desembolso en Efectivo & Emisión de Vale Digital con QR',
      rol: 'CUSTODIO',
      rolNombre: 'Custodio de Caja (Mariana López)',
      rolBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icono: <QrCode className="w-5 h-5 text-amber-400" />,
      descripcion: 'Entrega física del efectivo en billetes/monedas en COP. Se emite el comprobante digital con código QR y se inicia el cronómetro legal de 3 a 5 días hábiles.',
      controles: [
        'Entrega física en COP con constancia',
        'Generación de código QR único de trazabilidad',
        'Activación de cuenta regresiva de 5 días hábiles de plazo',
      ],
      esPuntoControl: false,
    },
    {
      paso: 4,
      titulo: 'Paso 3: Compra en Comercio y Captura Móvil del Soporte',
      rol: 'SOLICITANTE',
      rolNombre: 'Colaborador / Operario de Planta',
      rolBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icono: <Scan className="w-5 h-5 text-cyan-400" />,
      descripcion: 'El colaborador adquiere el insumo en el comercio local de Medellín y escanea la factura o tiquete POS con la cámara móvil.',
      controles: [
        'Exigencia de Factura Electrónica con CUFE o POS con CUDE',
        'Captura fotográfica inmediata',
        'Registro de fecha y comercio emisor',
      ],
      esPuntoControl: false,
    },
    {
      paso: 5,
      titulo: 'PUNTO DE CONTROL 2: Escaneo OCR & Validación Tributaria DIAN',
      rol: 'CUSTODIO',
      rolNombre: 'Motor DIAN & Custodio',
      rolBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icono: <Receipt className="w-5 h-5 text-blue-400" />,
      descripcion: 'Extracción inteligente de campos fiscales y validación obligatoria según el Artículo 616-1 del Estatuto Tributario y normatividad de Medellín.',
      controles: [
        'Extracción de NIT y validación del Dígito de Verificación (Módulo 11 DIAN)',
        'Extracción de CUFE / CUDE y número consecutivo autorizado',
        'Desglose tributario: Subtotal, IVA (19% o 5%) e ICA Medellín (7x1000)',
        'Si el proveedor no está obligado a facturar ➔ Generación de Documento Soporte Electrónico (Res. 000167)',
        'Detección automática de compras consecutivas fraccionadas al mismo NIT',
      ],
      esPuntoControl: true,
      colorBorde: 'border-blue-500/50 bg-blue-950/20',
    },
    {
      paso: 6,
      titulo: 'Paso 4: Legalización del Vale & Devolución de Sobrantes',
      rol: 'SOLICITANTE',
      rolNombre: 'Solicitante y Custodio',
      rolBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icono: <Clock className="w-5 h-5 text-emerald-400" />,
      descripcion: 'Mapeo del gasto real de la factura contra el vale inicial entregado. Se reintegra el sobrante en efectivo a la caja menor o se causa el reintegro.',
      controles: [
        'Cálculo de sobrante: Anticipo - Gasto Real',
        'Reintegro de efectivo físico a la caja',
        'Cambio de estado a LEGALIZADO antes de vencer los 5 días hábiles',
      ],
      esPuntoControl: false,
    },
    {
      paso: 7,
      titulo: 'PUNTO DE CONTROL 3: Arqueo en Tiempo Real & Ecuación Contable',
      rol: 'CONTABILIDAD',
      rolNombre: 'Contabilidad & Custodia',
      rolBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icono: <Scale className="w-5 h-5 text-amber-400" />,
      descripcion: 'Monitoreo continuo de la ecuación contable inmutable: Fondo Total ($2.000.000 COP) = Efectivo Físico + Vales Provisionales + Facturas Liquidadas.',
      controles: [
        'Verificación de diferencia ($0 COP = Cuadrado)',
        'Conteo físico sorpresivo por denominación de billetes y monedas colombianas',
        'Sellado con hash inmutable SHA-256 y firmas digitales',
        'Disparo automático de alerta si el fondo ejecutado alcanza el 70%',
      ],
      esPuntoControl: true,
      colorBorde: 'border-amber-500/50 bg-amber-950/20',
    },
    {
      paso: 8,
      titulo: 'Paso 5: Cierre de Mes, Asiento PUC 110505 y Exportación ERP',
      rol: 'CONTABILIDAD',
      rolNombre: 'Contabilidad / Revisor Fiscal (Dr. Andrés Gómez)',
      rolBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icono: <FileSpreadsheet className="w-5 h-5 text-indigo-400" />,
      descripcion: 'Consolidación de soportes, causación contable bajo el Plan Único de Cuentas (cuenta 110505 y cuentas de gasto 5135, 5145, 5195), generación del informe ejecutivo en PDF, planilla en Excel, plano Siigo y JSON Alegra.',
      controles: [
        'Causación contable bajo principio de devengo (Débitos = Créditos)',
        'Generación de Informe Ejecutivo en PDF y Planilla Excel',
        'Descarga de archivo plano para Siigo Nube y JSON para Alegra',
        'Bloqueo temporal del periodo cerrado y notificación a contabilidad',
      ],
      esPuntoControl: false,
    },
    {
      paso: 9,
      titulo: 'FIN: Reembolso Bancario y Restablecimiento del Fondo Fijo',
      rol: 'CONTABILIDAD',
      rolNombre: 'Tesorería General & Contabilidad',
      rolBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icono: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      descripcion: 'Tesorería gira desde la cuenta corriente en Bancolombia el valor total de las facturas liquidadas, reabasteciendo el efectivo físico a $2.000.000 COP.',
      controles: [
        'Giro electrónico Bancolombia',
        'Reintegro de efectivo físico a caja de seguridad',
        'Reapertura del ciclo mensual de caja menor',
      ],
      esPuntoControl: false,
    },
  ];

  const pasosFiltrados = pasosFlujo.filter(p => {
    if (rolFiltro === 'TODOS') return true;
    return p.rol === rolFiltro || p.rol === 'TODOS';
  });

  return (
    <div className="space-y-6">
      {/* Cabecera del Flujograma */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <GitBranch className="w-4 h-4" />
            <span>Flujograma Oficial de Procesos & Puntos de Control Legal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Ciclo Completo de Caja Menor - Impresos El Día S.A.S.
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Secuencia estandarizada de 9 pasos con roles diferenciados y controles de cumplimiento DIAN y NIIF.
          </p>
        </div>

        {/* Filtro por Rol */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Filtrar por:</span>
          {(['TODOS', 'SOLICITANTE', 'CUSTODIO', 'CONTABILIDAD'] as const).map(rol => (
            <button
              key={rol}
              onClick={() => setRolFiltro(rol)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                rolFiltro === rol
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {rol === 'TODOS' ? 'Ver Todos (9)' : rol === 'SOLICITANTE' ? '👷 Solicitante' : rol === 'CUSTODIO' ? '👩‍💼 Custodio' : '👔 Contabilidad'}
            </button>
          ))}
        </div>
      </div>

      {/* Vista de Swimlanes / Secuencia del Flujo */}
      <div className="space-y-4">
        {pasosFiltrados.map((item, idx) => {
          const isSelected = pasoSeleccionado === item.paso;
          return (
            <div key={item.paso} className="relative">
              {/* Conector de línea entre pasos */}
              {idx < pasosFiltrados.length - 1 && (
                <div className="absolute left-8 top-full h-4 w-0.5 bg-slate-700 z-10" />
              )}

              <div
                onClick={() => setPasoSeleccionado(isSelected ? null : item.paso)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-lg ${
                  item.esPuntoControl
                    ? item.colorBorde || 'border-rose-500/40 bg-rose-950/15'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                } ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0">
                      {item.icono}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.rolBadge}`}>
                          {item.rolNombre}
                        </span>
                        {item.esPuntoControl && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Punto de Control Legal
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{item.titulo}</h3>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">Paso {item.paso} de 9</span>
                    <span className="text-slate-500 text-sm">
                      {isSelected ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 pl-13">{item.descripcion}</p>

                {/* Detalle expandido de controles */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-slate-800 pl-13 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Validaciones y Reglas Automatizadas en el Sistema:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.controles.map((c, cIdx) => (
                        <div key={cIdx} className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen de Responsabilidades por Rol */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-3">
            <span className="text-xl">👷</span>
            <h4>Responsabilidad del Solicitante</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-2">
            <li>• Solicitar fondos únicamente para gastos autorizados y de cuantía menor en Pesos Colombianos (COP).</li>
            <li>• Exigir Factura Electrónica de Venta o Tiquete POS al comerciante.</li>
            <li>• Legalizar y devolver sobrantes en un plazo improrrogable de 3 a 5 días hábiles.</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
            <span className="text-xl">👩‍💼</span>
            <h4>Responsabilidad del Custodio (Mariana)</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-2">
            <li>• Custodiar el fondo fijo físico asignado de $2.000.000 COP en caja de seguridad.</li>
            <li>• Validar que ninguna solicitud corresponda a nómina, préstamos o materias primas litográficas.</li>
            <li>• Generar el vale digital con QR al entregar el efectivo y tramitar la reposición al alcanzar el 70%.</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-3">
            <span className="text-xl">👔</span>
            <h4>Responsabilidad de Contabilidad / Revisoría</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-2">
            <li>• Ejecutar arqueos sorpresivos desglosados por denominaciones colombianas con actas inmutables SHA-256.</li>
            <li>• Imputar al Plan Único de Cuentas (cuenta 110505) bajo principio de devengo.</li>
            <li>• Exportar datos a Siigo Nube y Alegra, y autorizar el giro de reembolso bancario.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
