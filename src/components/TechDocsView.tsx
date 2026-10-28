import React, { useState } from 'react';
import { POSTGRES_DDL_SCRIPT } from '../data/postgresSchema';
import { REST_API_DOCS, ApiEndpointDoc } from '../data/apiDocs';
import { 
  Database, 
  Terminal, 
  GitBranch, 
  Copy, 
  Check, 
  Send, 
  Scale, 
  FileCode,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const TechDocsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'db' | 'api' | 'flow' | 'legal'>('db');
  const [copiedSql, setCopiedSql] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointDoc>(REST_API_DOCS[0]);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isExecutingApi, setIsExecutingApi] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(POSTGRES_DDL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestEndpoint = (endpoint: ApiEndpointDoc) => {
    setSelectedEndpoint(endpoint);
    setIsExecutingApi(true);
    setTestResult(null);

    setTimeout(() => {
      setIsExecutingApi(false);
      setTestResult(JSON.stringify(endpoint.sampleResponse, null, 2));
    }, 350);
  };

  const tablesList = [
    { name: 'configuracion_fondo_fijo', desc: 'Parámetros del fondo en COP, tope y umbral del 70%' },
    { name: 'vales_provisionales', desc: 'Anticipos con QR, estado y cronómetro (3-5 días)' },
    { name: 'soportes_fiscales_dian', desc: 'Facturas FEV con CUFE, POS, Documento Soporte y desglose IVA/ICA' },
    { name: 'arqueos_caja_menor', desc: 'Actas inmutables con hash SHA-256 y ecuación contable' },
    { name: 'arqueos_denominaciones_efectivo', desc: 'Conteo desglosado por denominaciones colombianas' },
    { name: 'reembolsos_cierre_contable', desc: 'Cierre del periodo y archivos para Siigo / Alegra' },
    { name: 'asientos_puc_caja', desc: 'Imputación de causación contable a la cuenta 110505 y cuentas de gasto' },
    { name: 'centros_costos', desc: 'Áreas operativas de Impresos El Día S.A.S. en Medellín' },
    { name: 'usuarios_sistema', desc: 'Custodio, solicitantes y revisoría fiscal' },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Especificaciones Técnicas & Entregables de Ingeniería</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Arquitectura de Software, Base de Datos PostgreSQL & API REST
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Entregables formales según requerimientos para Impresos El Día S.A.S. (Medellín, Colombia).
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('db')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'db' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            PostgreSQL DDL
          </button>
          <button
            onClick={() => setActiveSubTab('api')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'api' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            API REST
          </button>
          <button
            onClick={() => setActiveSubTab('flow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'flow' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Flujograma Roles
          </button>
          <button
            onClick={() => setActiveSubTab('legal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'legal' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Matriz Legal DIAN
          </button>
        </div>
      </div>

      {/* SUBTAB 1: ESQUEMA DE BASE DE DATOS POSTGRESQL */}
      {activeSubTab === 'db' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Modelo Relacional en PostgreSQL 16+</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Diseño normalizado con llaves foráneas, triggers de control contra fraccionamiento y constraints para moneda estricta en COP.
              </p>

              <div className="space-y-2">
                {tablesList.map(t => (
                  <div key={t.name} className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs">
                    <span className="font-mono font-bold text-cyan-300 block">{t.name}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>caja_menor_impresos_el_dia.sql</span>
                </h3>

                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? '¡Copiado!' : 'Copiar DDL Completo'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[580px] overflow-y-auto text-[11px] font-mono text-cyan-300">
                <pre className="whitespace-pre-wrap">{POSTGRES_DDL_SCRIPT}</pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 mt-3 text-xs text-slate-400 flex items-center justify-between">
              <span>Incluye triggers PL/pgSQL para detección de fraccionamiento y chequeo de CUFE.</span>
              <span className="text-emerald-400 font-mono">PostgreSQL v16 Listo</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ESPECIFICACIÓN DE ENDPOINTS REST & TEST RUNNER */}
      {activeSubTab === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Endpoints REST Oficiales de la Plataforma</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Arquitectura RESTful con autenticación por Bearer token y autorización RBAC por roles.
            </p>

            <div className="space-y-2.5">
              {REST_API_DOCS.map((ep, idx) => (
                <div
                  key={idx}
                  onClick={() => handleTestEndpoint(ep)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedEndpoint.path === ep.path
                      ? 'bg-cyan-950/30 border-cyan-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      ep.method === 'GET' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-white text-[11px] truncate">{ep.path}</span>
                  </div>
                  <p className="font-semibold text-slate-200 mt-1.5">{ep.summary}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Roles: {ep.rolesAutorizados.join(', ')}</span>
                    <span className="text-cyan-400 flex items-center gap-1">Probar →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-300">
                      {selectedEndpoint.method}
                    </span>
                    <span className="font-mono font-bold text-white text-sm">
                      {selectedEndpoint.path}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedEndpoint.summary}</p>
                </div>

                <button
                  onClick={() => handleTestEndpoint(selectedEndpoint)}
                  disabled={isExecutingApi}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isExecutingApi ? 'Ejecutando...' : 'Ejecutar Test'}</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                    Descripción & Justificación Normativa:
                  </span>
                  <p className="text-slate-300">{selectedEndpoint.description}</p>
                  <span className="text-cyan-400 text-[11px] block mt-1.5">
                    <strong>Norma:</strong> {selectedEndpoint.normativaAsociada}
                  </span>
                </div>

                {selectedEndpoint.sampleRequest && (
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                      Cuerpo de la Petición (JSON Request Body):
                    </span>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 max-h-36 overflow-y-auto">
                      <pre>{JSON.stringify(selectedEndpoint.sampleRequest, null, 2)}</pre>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">
                      Respuesta Simulada en Tiempo Real (HTTP 200 OK):
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Status: 200 OK</span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 max-h-56 overflow-y-auto">
                    <pre>{testResult || JSON.stringify(selectedEndpoint.sampleResponse, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 mt-4 text-xs text-slate-400">
              Validaciones de token JWT y headers con estándares de seguridad DIAN.
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: FLUJOGRAMA DE ROLES Y PUNTOS DE CONTROL */}
      {activeSubTab === 'flow' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              <span>Flujograma Operativo y Puntos de Control Legal por Roles</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Secuencia punta a punta desde la necesidad de compra hasta el reembolso contable en Impresos El Día S.A.S.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rol 1: Solicitante */}
            <div className="bg-slate-950/70 border border-blue-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                    ROL 1
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Colaborador / Solicitante</h4>
                </div>
                <span className="text-xl">👷</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-0.5">1. Solicitud en COP</strong>
                  <span>Ingresa el concepto y monto exacto vía app móvil/web.</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-0.5">2. Compra en Comercio</strong>
                  <span>Efectúa la compra menor y exige Factura Electrónica o tiquete POS.</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-0.5">3. Captura OCR Móvil</strong>
                  <span>Escanea la factura para extraer campos DIAN y devolver sobrante.</span>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200">
                  <strong className="block text-amber-300 mb-0.5">⚠️ Plazo Mandatorio:</strong>
                  <span>Dispone de 3 a 5 días hábiles para legalizar o queda bloqueado.</span>
                </div>
              </div>
            </div>

            {/* Rol 2: Custodio */}
            <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                    ROL 2
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Custodio (Mariana López)</h4>
                </div>
                <span className="text-xl">👩‍💼</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-0.5">1. Control de Prohibiciones</strong>
                  <span>Verifica que no sea nómina, préstamos ni materias primas principales.</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-0.5">2. Desembolso & QR</strong>
                  <span>Entrega el efectivo en pesos y emite vale digital auditado.</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-0.5">3. Arqueo Diario</strong>
                  <span>Monitorea la ecuación: Fondo = Efectivo + Vales + Facturas.</span>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-200">
                  <strong className="block text-emerald-300 mb-0.5">✓ Disparo de Reposición:</strong>
                  <span>Al alcanzar el umbral del 70%, tramita el cierre ante contabilidad.</span>
                </div>
              </div>
            </div>

            {/* Rol 3: Contabilidad */}
            <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                    ROL 3
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Contabilidad / Auditoría</h4>
                </div>
                <span className="text-xl">👔</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-0.5">1. Auditoría Sorpresiva</strong>
                  <span>Conteo de denominaciones colombianas y acta sellada con SHA-256.</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-0.5">2. Imputación PUC</strong>
                  <span>Afecta la cuenta 110505 y cuentas de gasto según principio de devengo.</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-0.5">3. Exportación ERP</strong>
                  <span>Genera plano Siigo y JSON Alegra sin duplicidad de digitación.</span>
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-200">
                  <strong className="block text-purple-300 mb-0.5">✓ Transferencia Bancaria:</strong>
                  <span>Ordena giro bancario para restablecer el fondo físico a $2.000.000 COP.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: MATRIZ DE CUMPLIMIENTO LEGAL & DIAN */}
      {activeSubTab === 'legal' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <span>Matriz Normativa Tributaria y Contable para Colombia</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Fundamentos legales aplicables a la caja menor de Impresos El Día S.A.S. (Medellín).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-mono text-emerald-400 font-bold block">Art. 616-1 del Estatuto Tributario</span>
              <h4 className="font-bold text-white text-sm">Facturación Electrónica y Soportes Deducibles</h4>
              <p className="text-slate-300">
                Todo gasto de caja menor debe estar respaldado por Factura Electrónica de Venta con CUFE, POS electrónico con CUDE o Documento Soporte electrónico emitido a no obligados. Sin este requisito, el gasto es NO DEDUCIBLE en la Declaración de Renta.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-mono text-emerald-400 font-bold block">Art. 771-5 del Estatuto Tributario</span>
              <h4 className="font-bold text-white text-sm">Bancarización y Límites de Pagos en Efectivo</h4>
              <p className="text-slate-300">
                Establece los topes máximos de reconocimiento fiscal para pagos en efectivo. Por ello, la caja menor se restringe a pagos de cuantía menor ($250.000 COP) y urgencias operativas, prohibiendo su uso para transacciones mayores.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-mono text-emerald-400 font-bold block">Resolución 000167 de la DIAN</span>
              <h4 className="font-bold text-white text-sm">Documento Soporte en Adquisiciones con No Obligados</h4>
              <p className="text-slate-300">
                Cuando se adquiere un bien o servicio a una persona natural no obligada a facturar (ej. acarreos menores, reparaciones artesanales), la empresa debe generar y transmitir electrónicamente el Documento Soporte ante el webservice de la DIAN.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-mono text-emerald-400 font-bold block">Acuerdo 066 Municipio de Medellín</span>
              <h4 className="font-bold text-white text-sm">Impuesto de Industria y Comercio (ICA)</h4>
              <p className="text-slate-300">
                Reglamenta las tarifas de ICA en Medellín (7x1000 y 11.04x1000). El sistema liquida automáticamente la provisión territorial para la correcta causación contable en cuentas 2368.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
