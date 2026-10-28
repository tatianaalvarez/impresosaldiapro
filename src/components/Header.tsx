import React from 'react';
import { UserRole, FundConfig } from '../types';
import { formatCOP } from '../utils/formatters';
import { 
  Building2, 
  CheckCircle2, 
  UserCheck, 
  AlertTriangle, 
  FileText, 
  Lock, 
  Download, 
  Trash2, 
  GitBranch,
  Smartphone
} from 'lucide-react';

interface HeaderProps {
  config: FundConfig;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  efectivoFisicoCOP: number;
  valesActivosCOP: number;
  facturasLiquidadasCOP: number;
  onResetData: () => void;
  onOpenPdfManual?: () => void;
  onOpenCierreMes: () => void;
  onOpenPwaModal: () => void;
  periodoBloqueado: boolean;
  onReabrirPeriodo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  efectivoFisicoCOP,
  valesActivosCOP,
  facturasLiquidadasCOP,
  onResetData,
  onOpenPdfManual,
  onOpenCierreMes,
  onOpenPwaModal,
  periodoBloqueado,
  onReabrirPeriodo,
}) => {
  const fondoTotal = config.montoFondoTotalCOP;
  const ejecutadoCOP = valesActivosCOP + facturasLiquidadasCOP;
  const porcentajeEjecutado = Math.min(100, Math.round((ejecutadoCOP / fondoTotal) * 100));
  const alertaUmbral = porcentajeEjecutado >= config.umbralReembolsoPct;

  const rolesConfig: Record<UserRole, { label: string; nombre: string; badge: string; color: string }> = {
    custodio: {
      label: 'Custodio de Caja',
      nombre: config.custodioNombre,
      badge: 'Responsable Principal',
      color: 'bg-emerald-800 text-emerald-100 border-emerald-600',
    },
    solicitante: {
      label: 'Solicitante / Operario',
      nombre: 'Carlos Restrepo (Producción)',
      badge: 'Colaborador',
      color: 'bg-blue-800 text-blue-100 border-blue-600',
    },
    contabilidad: {
      label: 'Contabilidad / Revisoría',
      nombre: 'Dr. Andrés Gómez (TP 149204-T)',
      badge: 'Auditor NIIF',
      color: 'bg-purple-800 text-purple-100 border-purple-600',
    },
  };

  const navItems = [
    { id: 'dashboard', label: 'Ecuación & Saldos', icon: '📊' },
    { id: 'reconciliacion', label: 'Devoluciones & Reconciliación', icon: '💸' },
    { id: 'cierre_diario', label: 'Cierre Diario de Caja', icon: '📅' },
    { id: 'flujograma', label: 'Flujograma de Procesos', icon: '🔄' },
    { id: 'ocr', label: 'OCR & DIAN (Art. 616-1)', icon: '🧾' },
    { id: 'vales', label: 'Vales & Plazos (3-5d)', icon: '🎫' },
    { id: 'arqueo', label: 'Arqueo Sorpresivo COP', icon: '💰' },
    { id: 'puc', label: 'PUC & Exportación ERP', icon: '📑' },
    { id: 'tech', label: 'PostgreSQL & REST API', icon: '🏛️' },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Banner: Localización y Cumplimiento Normativo */}
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-400">NORMATIVA COLOMBIANA VIGENTE:</span>
          <span className="text-slate-300">DIAN Art. 616-1 (FEV/POS) | Art. 771-5 E.T. | Resolución 000167 | PUC 110505</span>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span>📍 {config.ciudad}</span>
          <span className="hidden sm:inline">|</span>
          <span className="font-mono text-slate-300">NIT: {config.nit}</span>

          {/* Botón PWA Instalar / Desinstalar */}
          <button
            onClick={onOpenPwaModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded transition text-xs font-medium cursor-pointer"
            title="Instalar o desinstalar la plataforma en este dispositivo"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instalar / Desinstalar App</span>
          </button>

          {onOpenPdfManual && (
            <button
              onClick={onOpenPdfManual}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded transition text-xs font-medium cursor-pointer"
              title="Abrir requerimientos y prompt técnico oficial"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ver PDF Requerimientos</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Período Cerrado y Bloqueado */}
      {periodoBloqueado && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 px-4 py-1.5 text-slate-950 text-xs font-black flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>PERÍODO CONTABLE OCTUBRE CERRADO & BLOQUEADO POR AUDITORÍA — NOTIFICACIÓN ENVIADA A CONTABILIDAD</span>
          </div>
          {onReabrirPeriodo && (
            <button
              onClick={onReabrirPeriodo}
              className="px-2 py-0.5 bg-slate-950 text-white rounded text-[10px] font-bold hover:bg-slate-900 cursor-pointer"
            >
              Reabrir Período (Revisoría)
            </button>
          )}
        </div>
      )}

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Brand & Company info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-emerald-400 font-black text-xl">
                ED
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {config.empresaNombre}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Caja Menor Oficial
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center flex-wrap gap-1.5 mt-0.5">
                <span>Fondo Fijo: <strong className="text-white font-mono">{formatCOP(config.montoFondoTotalCOP)}</strong></span>
                <span>•</span>
                <span>Tope Comprobante: <span className="text-slate-300 font-mono">{formatCOP(config.topePorComprobanteCOP)}</span></span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                  Pesos Colombianos (COP)
                </span>
              </p>
            </div>
          </div>

          {/* Quick Financial Indicators & Botón Destacado de Cierre de Mes */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* BOTÓN DESTACADO DE CIERRE DE MES (Para Custodia y Contabilidad) */}
            {(currentRole === 'custodio' || currentRole === 'contabilidad') && (
              <button
                onClick={onOpenCierreMes}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Ejecutar consolidación, informe PDF, planilla Excel, Siigo/Alegra y bloqueo del período"
              >
                <Lock className="w-4 h-4 text-slate-950" />
                <span>🔒 Cierre de Mes (COP)</span>
              </button>
            )}

            {/* Termómetro de reembolso */}
            <div className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2.5 ${
              alertaUmbral 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  {alertaUmbral ? '⚠️ Umbral Crítico (≥70%)' : 'Ejecución del Fondo'}
                </span>
                <span className="font-mono font-bold text-sm">
                  {porcentajeEjecutado}% ({formatCOP(ejecutadoCOP)})
                </span>
              </div>
              <div className="w-14 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${alertaUmbral ? 'bg-amber-400' : 'bg-emerald-400'}`} 
                  style={{ width: `${porcentajeEjecutado}%` }}
                />
              </div>
            </div>

            {/* Selector de Rol */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 p-1.5 rounded-xl">
              <UserCheck className="w-4 h-4 text-emerald-400 ml-1.5 hidden sm:block" />
              <div className="flex flex-col text-right pr-2">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Rol Activo</span>
                <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                  {rolesConfig[currentRole].nombre.split(' ')[0]}
                </span>
              </div>
              <select
                aria-label="Seleccionar rol de usuario activo"
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-slate-900 text-xs font-medium text-emerald-300 border border-slate-700 rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="custodio">👩‍💼 Custodio (Mariana)</option>
                <option value="solicitante">👷 Solicitante (Operario)</option>
                <option value="contabilidad">👔 Contabilidad (Auditor)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation con nueva pestaña de Flujograma */}
        <nav className="flex items-center gap-1 mt-4 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800 pt-3">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
