export type UserRole = 'custodio' | 'solicitante' | 'contabilidad';

export interface CentroCosto {
  id: string;
  codigo: string;
  nombre: string;
  responsable: string;
}

export interface FundConfig {
  empresaNombre: string;
  nit: string;
  ciudad: string;
  montoFondoTotalCOP: number;
  topePorComprobanteCOP: number;
  umbralReembolsoPct: number; // e.g. 70
  custodioNombre: string;
  custodioCargo: string;
  plazoLegalizacionDias: number; // 3 a 5 días
  centrosCosto: CentroCosto[];
}

export type TipoSoporte = 'FACTURA_ELECTRONICA' | 'TIQUETE_POS_ELECTRONICO' | 'DOCUMENTO_SOPORTE_NO_OBLIGADO';

export type EstadoVale = 'PENDIENTE_APROBACION' | 'DESEMBOLSADO' | 'LEGALIZADO' | 'VENCIDO' | 'RECHAZADO';

export interface Vale {
  id: string;
  codigoVale: string; // ej: VAL-2026-089
  solicitante: string;
  cedula: string;
  cargo: string;
  centroCostoId: string;
  montoSolicitadoCOP: number;
  concepto: string;
  fechaSolicitud: string;
  fechaDesembolso?: string;
  fechaLimiteLegalizacion?: string;
  estado: EstadoVale;
  soporteId?: string;
  montoGastadoRealCOP?: number;
  sobranteReintegradoCOP?: number;
  codigoQR: string;
  rechazoMotivo?: string;
  aprobadoPor?: string;
}

export interface ImpuestosDesglose {
  subtotalGravadoCOP: number;
  subtotalExentoCOP: number;
  iva19COP: number;
  iva5COP: number;
  icaTarifa: string; // ej: "7x1000"
  icaValorCOP: number;
  retefuenteTarifa: string; // ej: "2.5%" o "0%"
  retefuenteValorCOP: number;
  totalCOP: number;
}

export interface SoporteFiscalDIAN {
  id: string;
  tipo: TipoSoporte;
  numeroConsecutivo: string; // ej: SETT-94821
  cufeOCude?: string; // 64 o 96 caracteres hex
  fechaEmision: string;
  nitEmisor: string;
  digitoVerificacion: string;
  razonSocialEmisor: string;
  direccionEmisor: string;
  municipioEmisor: string; // Medellín
  conceptoGasto: string;
  cuentaPucCodigo: string; // ej: 513525
  cuentaPucNombre: string;
  centroCostoId: string;
  valeAsociadoId?: string;
  desglose: ImpuestosDesglose;
  validoDIAN: boolean;
  observacionesDIAN: string;
  alertaFraccionamiento?: boolean;
  alertaFraccionamientoDetalle?: string;
  imagenUrl?: string;
  registradoPor: string;
  fechaRegistro: string;
}

export interface DenominacionConteo {
  valorUnitario: number;
  esBillete: boolean;
  cantidad: number;
  subtotal: number;
}

export interface ArqueoActa {
  id: string;
  consecutivo: string; // ej: ARQ-2026-014
  fechaHora: string;
  custodioNombre: string;
  auditorNombre: string;
  fondoAsignadoCOP: number;
  efectivoFisicoTotalCOP: number;
  valesProvisionalesCOP: number;
  facturasLiquidadasCOP: number;
  totalArqueadoCOP: number; // Efectivo + Vales + Facturas
  diferenciaCOP: number; // totalArqueado - fondoAsignado (0 = Cuadrado, >0 Sobrante, <0 Faltante)
  estadoCuadre: 'CUADRADO' | 'SOBRANTE' | 'FALTANTE';
  desgloseEfectivo: DenominacionConteo[];
  observaciones: string;
  hashInmutableSHA256: string;
  firmaCustodio: string;
  firmaAuditor: string;
}

export interface AsientoPUCDetalle {
  cuentaCodigo: string;
  cuentaNombre: string;
  terceroNit: string;
  terceroNombre: string;
  debitoCOP: number;
  creditoCOP: number;
  concepto: string;
}

export interface ComprobanteCierreReembolso {
  id: string;
  consecutivo: string; // REEMB-2026-004
  fechaCierre: string;
  totalReembolsoCOP: number;
  cantidadComprobantes: number;
  asientosPUC: AsientoPUCDetalle[];
  archivoPlanoSiigo: string;
  jsonExportAlegra: string;
  aprobadoContador: boolean;
  fechaPagoTransferencia?: string;
}

export interface FacturaResumenItem {
  id: string;
  numeroConsecutivo: string;
  tipo: TipoSoporte;
  razonSocialEmisor: string;
  nitEmisor: string;
  conceptoGasto: string;
  totalCOP: number;
  fechaEmision: string;
}

export interface ReciboReintegro {
  id: string;
  consecutivo: string; // ej: REINT-2026-008
  fechaHora: string;
  valeId: string;
  codigoVale: string;
  colaboradorNombre: string;
  colaboradorCedula: string;
  colaboradorCargo: string;
  montoEntregadoCOP: number;
  montoUtilizadoCOP: number;
  sobranteDevueltoCOP: number; // Monto Entregado - Monto Utilizado
  custodioReceptor: string;
  facturasAsociadas: FacturaResumenItem[];
  observaciones?: string;
  hashVerificacionSHA256: string;
  firmaColaborador: string;
  firmaCustodio: string;
}

export interface MovimientoDiario {
  id: string;
  hora: string;
  tipo: 'DESEMBOLSO_VALE' | 'FACTURA_COMPRA' | 'REINTEGRO_SOBRANTE';
  colaborador: string;
  colaboradorCargo?: string;
  proveedor?: string;
  proveedorNit?: string;
  referenciaComprobante: string; // ej: VAL-2026-041, FE-98214, REINT-2026-008
  entradaEfectivoCOP: number;
  salidaEfectivoCOP: number;
  saldoResultanteCOP: number;
  concepto: string;
  centroCostoNombre: string;
}

export interface CierreDiarioActa {
  id: string;
  consecutivo: string; // ej: CIERRE-DIA-2026-10-28
  fecha: string;
  fechaHoraEmision: string;
  saldoInicialDiaCOP: number;
  totalAnticiposEntregadosCOP: number;
  totalFacturasRecibidasCOP: number;
  totalSobrantesReintegradosCOP: number;
  saldoFinalEfectivoCOP: number;
  fondoFijoTotalCOP: number;
  movimientos: MovimientoDiario[];
  observaciones: string;
  hashInmutableSHA256: string;
  firmaCustodio: string;
  firmaAuditor: string;
}

