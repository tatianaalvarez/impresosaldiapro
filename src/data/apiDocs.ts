export interface ApiEndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  rolesAutorizados: string[];
  normativaAsociada: string;
  sampleRequest?: Record<string, unknown>;
  sampleResponse: Record<string, unknown>;
}

export const REST_API_DOCS: ApiEndpointDoc[] = [
  {
    method: 'GET',
    path: '/api/v1/caja-menor/estado-en-vivo',
    summary: 'Consulta de saldos en tiempo real y ecuación contable',
    description: 'Devuelve el estado del fondo ($2.000.000 COP), desglose entre efectivo físico, vales provisionales vigentes y facturas radicadas, junto con la alerta de umbral de reembolso (70%).',
    rolesAutorizados: ['CUSTODIO', 'CONTABILIDAD_REVISORIA', 'SOLICITANTE'],
    normativaAsociada: 'Principio de Fondo Fijo y Ecuación Patrimonial Contable.',
    sampleResponse: {
      status: 'success',
      data: {
        moneda: 'COP',
        fondoTotalCOP: 2000000,
        efectivoFisicoCOP: 1505000,
        valesProvisionalesCOP: 185000,
        facturasLiquidadasCOP: 310000,
        totalEcuacionCOP: 2000000,
        diferenciaCOP: 0,
        porcentajeEjecutado: 24.75,
        umbralReembolsoCriticoPct: 70,
        requiereReembolso: false,
        custodio: 'Mariana López',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/v1/vales/solicitar',
    summary: 'Radicación de solicitud de vale provisional con validación de prohibiciones',
    description: 'Aplica el motor de reglas automáticas. Rechaza inmediatamente solicitudes que superen el tope ($250.000 COP) o que correspondan a nómina, seguridad social, préstamos o materias primas litográficas.',
    rolesAutorizados: ['SOLICITANTE'],
    normativaAsociada: 'Art. 771-5 E.T., Art. 108 E.T. y Manual de Control Interno Impresos El Día S.A.S.',
    sampleRequest: {
      solicitanteCedula: '1.037.649.201',
      centroCostoCodigo: 'CC-103',
      montoSolicitadoCOP: 65000,
      concepto: 'Mensajería urgente muestras impresas a cliente Envigado',
    },
    sampleResponse: {
      status: 'success',
      data: {
        id: 'val-001',
        codigoVale: 'VAL-2026-041',
        estado: 'PENDIENTE_APROBACION',
        montoSolicitadoCOP: 65000,
        mensaje: 'Solicitud aprobada preliminarmente por control de reglas normativas.',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/v1/vales/{id}/desembolsar-qr',
    summary: 'Desembolso en efectivo y generación de constancia digital con QR',
    description: 'El custodio entrega el efectivo físico en COP y activa el cronómetro legal de 5 días hábiles para su legalización.',
    rolesAutorizados: ['CUSTODIO'],
    normativaAsociada: 'Control interno de plazos de anticipos provisionales (3 a 5 días).',
    sampleResponse: {
      status: 'success',
      data: {
        codigoVale: 'VAL-2026-041',
        estado: 'DESEMBOLSADO',
        fechaDesembolso: '2026-10-26T09:00:00Z',
        fechaLimiteLegalizacion: '2026-10-31T17:00:00Z',
        qrData: 'QR-VAL-2026-041-COP65000-MATEOHENAO-DIAN',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/v1/soportes/ocr-validar-dian',
    summary: 'Extracción inteligente OCR y validación fiscal tributaria DIAN',
    description: 'Valida Factura Electrónica (Art. 616-1), tiquete POS o genera Documento Soporte electrónico. Extrae NIT con dígito de verificación (Módulo 11), desglose de IVA (19%/5%), cálculo de ICA Medellín (7x1000) y detecta compras fraccionadas consecutivas.',
    rolesAutorizados: ['CUSTODIO', 'SOLICITANTE'],
    normativaAsociada: 'Estatuto Tributario Art. 616-1, Resolución 000167 DIAN, Acuerdo 066 Medellín.',
    sampleRequest: {
      tipoDocumento: 'FACTURA_ELECTRONICA',
      numeroConsecutivo: 'SETP-98214',
      nitEmisor: '830037946',
      razonSocial: 'Panamericana Librería y Papelería S.A.',
      totalCOP: 48000,
      cufe: 'c4fe8a912b7740e58f01bda34911f939ac018f29ab782194bb8019aa912384910029b418',
    },
    sampleResponse: {
      status: 'success',
      dianValidation: {
        valido: true,
        dvCalculado: '3',
        dvValido: true,
        cufeValido: true,
        alertaFraccionamiento: false,
        iva19COP: 7664,
        icaMedellinCOP: 282,
        cuentaPucSugerida: '519525 - Elementos de Papelería',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/v1/arqueo/ejecutar-conteo',
    summary: 'Registro de arqueo sorpresivo con conteo por denominaciones y acta inmutable',
    description: 'Recibe el conteo físico de cada denominación colombiana ($100k hasta $2k y monedas). Compara con el saldo teórico de la ecuación y genera el acta sellada criptográficamente con SHA-256.',
    rolesAutorizados: ['CUSTODIO', 'CONTABILIDAD_REVISORIA'],
    normativaAsociada: 'Norma de Auditoría NIA 500 / Principio de Devengo NIIF.',
    sampleRequest: {
      auditorNombre: 'Dr. Andrés Gómez (Revisoría Fiscal)',
      observaciones: 'Arqueo sorpresa realizado a las 11:30 am.',
      conteoDenominaciones: [
        { valor: 100000, cantidad: 8 },
        { valor: 50000, cantidad: 8 },
        { valor: 20000, cantidad: 6 },
        { valor: 10000, cantidad: 4 },
      ],
    },
    sampleResponse: {
      status: 'success',
      acta: {
        consecutivo: 'ACTA-ARQ-2026-019',
        estadoCuadre: 'CUADRADO',
        totalArqueadoCOP: 2000000,
        diferenciaCOP: 0,
        hashInmutableSHA256: 'sha256:dian-98f2b1a-medellin-impresos-el-dia-20261028',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/v1/cierre/generar-reembolso-erps',
    summary: 'Cierre del ciclo, generación de asiento PUC y exportación Siigo / Alegra',
    description: 'Liquida las facturas radicadas, genera la imputación contable a la cuenta 110505 y cuentas de gasto (5135, 5145, 5195, 2408, 2368) y genera los archivos planos para Siigo Nube y Alegra.',
    rolesAutorizados: ['CONTABILIDAD_REVISORIA'],
    normativaAsociada: 'Plan Único de Cuentas (PUC) y Normas Internacionales de Información Financiera NIIF.',
    sampleResponse: {
      status: 'success',
      reembolso: {
        consecutivo: 'REEMB-2026-005',
        totalReembolsarCOP: 310000,
        registrosPUC: 6,
        siigoExportReady: true,
        alegraExportReady: true,
      },
    },
  },
];
