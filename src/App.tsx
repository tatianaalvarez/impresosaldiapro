/**
 * Plataforma de Gestión de Caja Menor - Impresos El Día S.A.S. (Medellín, Colombia)
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  FundConfig, 
  Vale, 
  SoporteFiscalDIAN, 
  DenominacionConteo, 
  ArqueoActa, 
  ComprobanteCierreReembolso,
  ReciboReintegro,
  CierreDiarioActa
} from './types';
import { 
  INITIAL_CONFIG, 
  INITIAL_VALES, 
  INITIAL_SOPORTES, 
  INITIAL_DENOMINACIONES, 
  INITIAL_HISTORICO_ARQUEOS,
  INITIAL_REINTEGROS
} from './data/initialData';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ReconciliacionView } from './components/ReconciliacionView';
import { CierreDiarioView } from './components/CierreDiarioView';
import { FlujogramaView } from './components/FlujogramaView';
import { OcrCaptureView } from './components/OcrCaptureView';
import { ValesView } from './components/ValesView';
import { ArqueoView } from './components/ArqueoView';
import { PucClosingView } from './components/PucClosingView';
import { TechDocsView } from './components/TechDocsView';
import { QrModal } from './components/QrModal';
import { ActaModal } from './components/ActaModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { CierreMesModal } from './components/CierreMesModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { ReciboReintegroModal } from './components/ReciboReintegroModal';
import { ActaCierreDiarioModal } from './components/ActaCierreDiarioModal';

export default function App() {
  // Configuración del fondo
  const [config, setConfig] = useState<FundConfig>(() => {
    const saved = localStorage.getItem('caja_menor_config');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  // Vales Provisionales
  const [vales, setVales] = useState<Vale[]>(() => {
    const saved = localStorage.getItem('caja_menor_vales');
    return saved ? JSON.parse(saved) : INITIAL_VALES;
  });

  // Soportes Fiscales DIAN
  const [soportes, setSoportes] = useState<SoporteFiscalDIAN[]>(() => {
    const saved = localStorage.getItem('caja_menor_soportes');
    return saved ? JSON.parse(saved) : INITIAL_SOPORTES;
  });

  // Conteo de Denominaciones en Efectivo
  const [denominaciones, setDenominaciones] = useState<DenominacionConteo[]>(() => {
    const saved = localStorage.getItem('caja_menor_denominaciones');
    return saved ? JSON.parse(saved) : INITIAL_DENOMINACIONES;
  });

  // Histórico de Actas de Arqueo Inmutables
  const [historicoActas, setHistoricoActas] = useState<ArqueoActa[]>(() => {
    const saved = localStorage.getItem('caja_menor_actas');
    return saved ? JSON.parse(saved) : INITIAL_HISTORICO_ARQUEOS;
  });

  // Recibos Oficiales de Reintegro de Efectivo
  const [recibosReintegro, setRecibosReintegro] = useState<ReciboReintegro[]>(() => {
    const saved = localStorage.getItem('caja_menor_reintegros');
    return saved ? JSON.parse(saved) : INITIAL_REINTEGROS;
  });

  // Actas de Cierre Diario de Caja
  const [cierresDiariosHistorico, setCierresDiariosHistorico] = useState<CierreDiarioActa[]>(() => {
    const saved = localStorage.getItem('caja_menor_cierres_diarios');
    return saved ? JSON.parse(saved) : [];
  });

  // Rol activo y pestaña activa
  const [currentRole, setCurrentRole] = useState<UserRole>('custodio');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Estado del período contable (Bloqueo tras Cierre de Mes)
  const [periodoBloqueado, setPeriodoBloqueado] = useState<boolean>(() => {
    return localStorage.getItem('caja_menor_periodo_bloqueado') === 'true';
  });

  // Modales
  const [activeQrVale, setActiveQrVale] = useState<Vale | null>(null);
  const [activeActaModal, setActiveActaModal] = useState<ArqueoActa | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showCierreMesModal, setShowCierreMesModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [activeReciboModal, setActiveReciboModal] = useState<ReciboReintegro | null>(null);
  const [activeCierreDiarioModal, setActiveCierreDiarioModal] = useState<CierreDiarioActa | null>(null);

  // Persistencia en localStorage
  useEffect(() => {
    localStorage.setItem('caja_menor_vales', JSON.stringify(vales));
  }, [vales]);

  useEffect(() => {
    localStorage.setItem('caja_menor_soportes', JSON.stringify(soportes));
  }, [soportes]);

  useEffect(() => {
    localStorage.setItem('caja_menor_denominaciones', JSON.stringify(denominaciones));
  }, [denominaciones]);

  useEffect(() => {
    localStorage.setItem('caja_menor_actas', JSON.stringify(historicoActas));
  }, [historicoActas]);

  useEffect(() => {
    localStorage.setItem('caja_menor_reintegros', JSON.stringify(recibosReintegro));
  }, [recibosReintegro]);

  useEffect(() => {
    localStorage.setItem('caja_menor_cierres_diarios', JSON.stringify(cierresDiariosHistorico));
  }, [cierresDiariosHistorico]);

  useEffect(() => {
    localStorage.setItem('caja_menor_periodo_bloqueado', periodoBloqueado ? 'true' : 'false');
  }, [periodoBloqueado]);

  // Cálculos en tiempo real de la Ecuación Contable
  const efectivoFisicoCOP = denominaciones.reduce((acc, d) => acc + d.cantidad * d.valorUnitario, 0);
  const valesActivosCOP = vales
    .filter(v => v.estado === 'DESEMBOLSADO')
    .reduce((acc, v) => acc + v.montoSolicitadoCOP, 0);
  const facturasLiquidadasCOP = soportes.reduce((acc, s) => acc + s.desglose.totalCOP, 0);

  // Handlers para actualizar estado
  const handleCrearVale = (nuevoVale: Vale) => {
    if (periodoBloqueado) {
      alert('El período contable se encuentra cerrado y bloqueado por auditoría. Debe reabrirse el período para radicar nuevos anticipos.');
      return;
    }
    setVales(prev => [nuevoVale, ...prev]);
  };

  const handleDesembolsarVale = (valeId: string) => {
    if (periodoBloqueado) {
      alert('El período contable se encuentra cerrado y bloqueado.');
      return;
    }
    setVales(prev => prev.map(v => {
      if (v.id === valeId) {
        return {
          ...v,
          estado: 'DESEMBOLSADO',
          fechaDesembolso: new Date().toISOString(),
          fechaLimiteLegalizacion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          aprobadoPor: config.custodioNombre,
        };
      }
      return v;
    }));
  };

  const handleLegalizarVale = (valeId: string, gastoRealCOP: number, sobranteCOP: number) => {
    setVales(prev => prev.map(v => {
      if (v.id === valeId) {
        return {
          ...v,
          estado: 'LEGALIZADO',
          montoGastadoRealCOP: gastoRealCOP,
          sobranteReintegradoCOP: sobranteCOP,
        };
      }
      return v;
    }));

    // Si hubo sobrante en efectivo devuelto, reintegrarlo al saldo físico de la caja menor
    if (sobranteCOP > 0) {
      reintegrarEfectivoACaja(sobranteCOP);
    }
  };

  // Reintegrar sobrante en efectivo repartiendo en billetes/monedas
  const reintegrarEfectivoACaja = (montoReintegrarCOP: number) => {
    let restante = montoReintegrarCOP;
    setDenominaciones(prev => {
      const actualizadas = [...prev];
      for (let i = 0; i < actualizadas.length; i++) {
        const val = actualizadas[i].valorUnitario;
        if (restante >= val) {
          const sumar = Math.floor(restante / val);
          actualizadas[i].cantidad += sumar;
          actualizadas[i].subtotal = actualizadas[i].cantidad * val;
          restante %= val;
        }
      }
      return actualizadas;
    });
  };

  const handleEmitirReintegro = (nuevoRecibo: ReciboReintegro, valeId: string, gastoRealCOP: number, sobranteCOP: number) => {
    setRecibosReintegro(prev => [nuevoRecibo, ...prev]);

    // Actualizar vale a legalizado
    setVales(prev => prev.map(v => {
      if (v.id === valeId) {
        return {
          ...v,
          estado: 'LEGALIZADO',
          montoGastadoRealCOP: gastoRealCOP,
          sobranteReintegradoCOP: sobranteCOP,
        };
      }
      return v;
    }));

    // Restablecer saldo físico con el sobrante
    if (sobranteCOP > 0) {
      reintegrarEfectivoACaja(sobranteCOP);
    }

    // Abrir modal de vista e impresión del recibo
    setActiveReciboModal(nuevoRecibo);
  };

  const handleEmitirCierreDiario = (nuevaActa: CierreDiarioActa) => {
    setCierresDiariosHistorico(prev => [nuevaActa, ...prev]);
    setActiveCierreDiarioModal(nuevaActa);
  };

  const handleRegistrarSoporte = (nuevoSoporte: SoporteFiscalDIAN, valeIdParaLegalizar?: string) => {
    if (periodoBloqueado) {
      alert('El período contable se encuentra cerrado y bloqueado por auditoría.');
      return;
    }
    setSoportes(prev => [nuevoSoporte, ...prev]);

    // Si se asocia a un vale, marcar el vale como legalizado automáticamente
    if (valeIdParaLegalizar) {
      const vale = vales.find(v => v.id === valeIdParaLegalizar);
      const gasto = nuevoSoporte.desglose.totalCOP;
      const anticipo = vale ? vale.montoSolicitadoCOP : gasto;
      const sobrante = Math.max(0, anticipo - gasto);

      setVales(prev => prev.map(v => {
        if (v.id === valeIdParaLegalizar) {
          return {
            ...v,
            estado: 'LEGALIZADO',
            soporteId: nuevoSoporte.id,
            montoGastadoRealCOP: gasto,
            sobranteReintegradoCOP: sobrante,
          };
        }
        return v;
      }));

      if (sobrante > 0) {
        reintegrarEfectivoACaja(sobrante);
      }
    }
  };

  const handleActualizarDenominacion = (valorUnitario: number, cantidad: number) => {
    setDenominaciones(prev => prev.map(d => {
      if (d.valorUnitario === valorUnitario) {
        return {
          ...d,
          cantidad,
          subtotal: cantidad * valorUnitario,
        };
      }
      return d;
    }));
  };

  // Cuadre automático teórico
  const handleCuadreAutomatico = () => {
    const objetivoCOP = Math.max(0, config.montoFondoTotalCOP - valesActivosCOP - facturasLiquidadasCOP);
    let restante = objetivoCOP;

    const nuevasDenominaciones = denominaciones.map(d => ({ ...d, cantidad: 0, subtotal: 0 }));

    for (let i = 0; i < nuevasDenominaciones.length; i++) {
      const valor = nuevasDenominaciones[i].valorUnitario;
      if (restante >= valor) {
        const cant = Math.floor(restante / valor);
        nuevasDenominaciones[i].cantidad = cant;
        nuevasDenominaciones[i].subtotal = cant * valor;
        restante %= valor;
      }
    }

    setDenominaciones(nuevasDenominaciones);
  };

  const handleGuardarActa = (nuevaActa: ArqueoActa) => {
    setHistoricoActas(prev => [nuevaActa, ...prev]);
  };

  const handleEjecutarReembolso = (nuevoCierre: ComprobanteCierreReembolso) => {
    setSoportes([]);
    const nuevasDenominaciones = [...INITIAL_DENOMINACIONES];
    setDenominaciones(nuevasDenominaciones);
  };

  const handleConfirmarCierreMes = (notificacionEnviada: boolean) => {
    setPeriodoBloqueado(true);
  };

  const handleReabrirPeriodo = () => {
    if (confirm('¿Confirmas la reapertura del período contable para auditoría y ajustes?')) {
      setPeriodoBloqueado(false);
    }
  };

  const handleResetData = () => {
    if (confirm('¿Restablecer los datos de demostración de Impresos El Día S.A.S.?')) {
      setConfig(INITIAL_CONFIG);
      setVales(INITIAL_VALES);
      setSoportes(INITIAL_SOPORTES);
      setDenominaciones(INITIAL_DENOMINACIONES);
      setHistoricoActas(INITIAL_HISTORICO_ARQUEOS);
      setRecibosReintegro(INITIAL_REINTEGROS);
      setCierresDiariosHistorico([]);
      setPeriodoBloqueado(false);
      localStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Encabezado Principal con Indicadores en Vivo, Botón Cierre de Mes, PWA y Switcher de Rol */}
      <Header
        config={config}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        efectivoFisicoCOP={efectivoFisicoCOP}
        valesActivosCOP={valesActivosCOP}
        facturasLiquidadasCOP={facturasLiquidadasCOP}
        onResetData={handleResetData}
        onOpenPdfManual={() => setShowPdfModal(true)}
        onOpenCierreMes={() => setShowCierreMesModal(true)}
        onOpenPwaModal={() => setShowPwaModal(true)}
        periodoBloqueado={periodoBloqueado}
        onReabrirPeriodo={handleReabrirPeriodo}
      />

      {/* Contenido Dinámico de la Pestaña Activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            config={config}
            vales={vales}
            soportes={soportes}
            efectivoFisicoCOP={efectivoFisicoCOP}
            valesActivosCOP={valesActivosCOP}
            facturasLiquidadasCOP={facturasLiquidadasCOP}
            currentRole={currentRole}
            onNavigate={setActiveTab}
            onOpenNuevoVale={() => setActiveTab('vales')}
            onOpenOcr={() => setActiveTab('ocr')}
            onOpenArqueo={() => setActiveTab('arqueo')}
            onOpenCierreMes={() => setShowCierreMesModal(true)}
          />
        )}

        {/* PESTAÑA 1 NUEVA: DEVOLUCIONES DE DINERO Y RECONCILIACIÓN DE VALES */}
        {activeTab === 'reconciliacion' && (
          <ReconciliacionView
            config={config}
            vales={vales}
            soportes={soportes}
            recibosReintegro={recibosReintegro}
            onEmitirReintegro={handleEmitirReintegro}
            onVerReciboModal={(rec) => setActiveReciboModal(rec)}
            currentRole={currentRole}
          />
        )}

        {/* PESTAÑA 2 NUEVA: CIERRE DEL DÍA (CIERRE DIARIO DE CAJA) */}
        {activeTab === 'cierre_diario' && (
          <CierreDiarioView
            config={config}
            vales={vales}
            soportes={soportes}
            recibosReintegro={recibosReintegro}
            efectivoFisicoCOP={efectivoFisicoCOP}
            valesActivosCOP={valesActivosCOP}
            facturasLiquidadasCOP={facturasLiquidadasCOP}
            onEmitirCierreDiario={handleEmitirCierreDiario}
            onVerActaModal={(acta) => setActiveCierreDiarioModal(acta)}
            cierresDiariosHistorico={cierresDiariosHistorico}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'flujograma' && (
          <FlujogramaView />
        )}

        {activeTab === 'ocr' && (
          <OcrCaptureView
            config={config}
            vales={vales}
            soportes={soportes}
            onRegistrarSoporte={handleRegistrarSoporte}
          />
        )}

        {activeTab === 'vales' && (
          <ValesView
            config={config}
            vales={vales}
            currentRole={currentRole}
            onCrearVale={handleCrearVale}
            onDesembolsarVale={handleDesembolsarVale}
            onLegalizarVale={handleLegalizarVale}
            onVerQrModal={(vale) => setActiveQrVale(vale)}
          />
        )}

        {activeTab === 'arqueo' && (
          <ArqueoView
            config={config}
            denominaciones={denominaciones}
            onActualizarDenominacion={handleActualizarDenominacion}
            valesActivosCOP={valesActivosCOP}
            facturasLiquidadasCOP={facturasLiquidadasCOP}
            historicoActas={historicoActas}
            onGuardarActa={handleGuardarActa}
            onVerActaModal={(acta) => setActiveActaModal(acta)}
            onCuadreAutomatico={handleCuadreAutomatico}
          />
        )}

        {activeTab === 'puc' && (
          <PucClosingView
            config={config}
            soportes={soportes}
            onEjecutarReembolso={handleEjecutarReembolso}
          />
        )}

        {activeTab === 'tech' && (
          <TechDocsView />
        )}
      </main>

      {/* Footer Legal & Corporativo */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-400">{config.empresaNombre}</span> — NIT {config.nit} | {config.ciudad}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Cumplimiento DIAN Estatuto Tributario Art. 616-1 y Art. 771-5</span>
            <span>•</span>
            <button
              onClick={() => setShowPwaModal(true)}
              className="text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              Instalar / Desinstalar App
            </button>
            <span>•</span>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              Reiniciar Datos Demo
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL CIERRE DE MES AUTOMATIZADO */}
      {showCierreMesModal && (
        <CierreMesModal
          config={config}
          soportes={soportes}
          vales={vales}
          efectivoFisicoCOP={efectivoFisicoCOP}
          valesActivosCOP={valesActivosCOP}
          facturasLiquidadasCOP={facturasLiquidadasCOP}
          onConfirmarCierre={handleConfirmarCierreMes}
          onClose={() => setShowCierreMesModal(false)}
        />
      )}

      {/* MODAL PWA INSTALACIÓN Y DESINSTALACIÓN */}
      {showPwaModal && (
        <PWAInstallModal
          onClose={() => setShowPwaModal(false)}
          onResetData={handleResetData}
        />
      )}

      {/* MODAL RECIBO DIGITAL DE REINTEGRO DE EFECTIVO */}
      {activeReciboModal && (
        <ReciboReintegroModal
          recibo={activeReciboModal}
          config={config}
          onClose={() => setActiveReciboModal(null)}
        />
      )}

      {/* MODAL ACTA OFICIAL DE BALANCE Y CIERRE DIARIO */}
      {activeCierreDiarioModal && (
        <ActaCierreDiarioModal
          acta={activeCierreDiarioModal}
          config={config}
          onClose={() => setActiveCierreDiarioModal(null)}
        />
      )}

      {/* MODAL QR PARA VALE DIGITAL */}
      {activeQrVale && (
        <QrModal
          vale={activeQrVale}
          config={config}
          onClose={() => setActiveQrVale(null)}
        />
      )}

      {/* MODAL ACTA OFICIAL DE ARQUEO INMUTABLE */}
      {activeActaModal && (
        <ActaModal
          acta={activeActaModal}
          config={config}
          onClose={() => setActiveActaModal(null)}
        />
      )}

      {/* MODAL VISUALIZADOR DE REQUERIMIENTOS PDF */}
      {showPdfModal && (
        <PdfViewerModal
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
}
