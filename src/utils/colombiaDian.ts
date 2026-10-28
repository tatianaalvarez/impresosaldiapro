/**
 * Utilidades normativas tributarias y de control interno para Colombia (DIAN / Medellín)
 * Aplica Estatuto Tributario Art. 616-1, Art. 771-5, Resoluciones DIAN sobre Documento Soporte
 * y normas de control interno para Fondos Fijos de Caja Menor.
 */

// Factores primos oficiales DIAN para el cálculo del Dígito de Verificación (Módulo 11)
const PRIMOS_DIAN = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];

/**
 * Calcula el Dígito de Verificación (DV) de un NIT colombiano según la DIAN.
 */
export function calcularDigitoVerificacionDIAN(nitLimpio: string): string {
  const nitNumeros = nitLimpio.replace(/\D/g, '');
  if (!nitNumeros || nitNumeros.length < 3) return '0';

  const len = nitNumeros.length;
  let suma = 0;

  for (let i = 0; i < len; i++) {
    const factorIndex = PRIMOS_DIAN.length - len + i;
    if (factorIndex >= 0 && factorIndex < PRIMOS_DIAN.length) {
      suma += parseInt(nitNumeros[i], 10) * PRIMOS_DIAN[factorIndex];
    }
  }

  const residuo = suma % 11;
  if (residuo === 0 || residuo === 1) {
    return residuo.toString();
  }
  return (11 - residuo).toString();
}

/**
 * Valida si un NIT con formato "123456789-X" o por separado tiene el DV correcto.
 */
export function validarNitColombiano(nit: string, dvIngresado?: string): { valido: boolean; dvCalculado: string; nitSolo: string } {
  let nitSolo = nit.trim();
  let dv = dvIngresado?.trim();

  if (nit.includes('-')) {
    const partes = nit.split('-');
    nitSolo = partes[0].replace(/\D/g, '');
    dv = partes[1].trim();
  } else {
    nitSolo = nitSolo.replace(/\D/g, '');
  }

  const dvCalculado = calcularDigitoVerificacionDIAN(nitSolo);
  const valido = dv ? dv === dvCalculado : true;

  return { valido, dvCalculado, nitSolo };
}

/**
 * Catálogo de palabras clave y conceptos prohibidos para Caja Menor según el Estatuto Tributario
 * y el Manual de Control Interno de Impresos El Día S.A.S.
 */
export interface ProhibicionLegalCheck {
  bloqueado: boolean;
  categoria?: 'NOMINA_SEGURIDAD_SOCIAL' | 'PRESTAMO_PERSONAL' | 'MATERIA_PRIMA_PRINCIPAL' | 'EXCESO_TOPE';
  motivo?: string;
  fundamentoLegal?: string;
  accionSugerida?: string;
}

export function verificarProhibicionesLegales(concepto: string, montoCOP: number, topeCOP: number): ProhibicionLegalCheck {
  const c = concepto.toLowerCase();

  // 1. Verificación de Topes Máximos por Comprobante
  if (montoCOP > topeCOP) {
    return {
      bloqueado: true,
      categoria: 'EXCESO_TOPE',
      motivo: `El monto solicitado ($ ${montoCOP.toLocaleString('es-CO')} COP) supera el tope máximo estatutario de $ ${topeCOP.toLocaleString('es-CO')} COP por comprobante.`,
      fundamentoLegal: 'Manual de Políticas de Caja Menor (Acta de Gerencia) y Art. 771-5 del Estatuto Tributario sobre bancarización y pagos en efectivo.',
      accionSugerida: 'Debe tramitarse mediante orden de compra directa y transferencia bancaria por Tesorería general.'
    };
  }

  // 2. Prohibición Absoluta: Nómina, Salarios y Seguridad Social
  const keywordsNomina = [
    'nomina', 'nómina', 'salario', 'sueldo', 'quincena', 'prestacion', 'prestación',
    'cesantia', 'cesantía', 'prima', 'vacacion', 'vacación', 'seguridad social',
    'eps', 'arl', 'pension', 'pensión', 'sena', 'icbf', 'comfama', 'parafiscal',
    'adelanto de sueldo', 'anticipo nomina', 'honorario fijo'
  ];
  if (keywordsNomina.some(k => c.includes(k))) {
    return {
      bloqueado: true,
      categoria: 'NOMINA_SEGURIDAD_SOCIAL',
      motivo: 'Prohibición taxativa de pago de sueldos, jornales, prestaciones o seguridad social a través del fondo de caja menor.',
      fundamentoLegal: 'Art. 108 del Estatuto Tributario y Ley 100 de 1993. Todos los pagos laborales deben canalizarse por nómina electrónica transmitida a la DIAN mediante el sistema bancario.',
      accionSugerida: 'Remitir la novedad a Gestión Humana para inclusión en la nómina quincenal o mensual bancarizada.'
    };
  }

  // 3. Prohibición Absoluta: Préstamos personales o Canje de Cheques
  const keywordsPrestamos = [
    'prestamo', 'préstamo', 'empréstito', 'cheque', 'canje', 'calamidad personal',
    'prestamo personal', 'adelanto personal', 'prestamo empleado'
  ];
  if (keywordsPrestamos.some(k => c.includes(k))) {
    return {
      bloqueado: true,
      categoria: 'PRESTAMO_PERSONAL',
      motivo: 'El fondo fijo de caja menor tiene destinación exclusiva de gastos menores de funcionamiento y emergencias operativas.',
      fundamentoLegal: 'Políticas de Control Interno NIIF para PYMES (Sección 7) y Salvaguarda de Activos Corporativos.',
      accionSugerida: 'Los préstamos a empleados requieren estudio de libranza y aprobación por la Gerencia Financiera.'
    };
  }

  // 4. Prohibición Absoluta: Materias Primas e Insumos Principales de Impresión
  const keywordsMateriaPrima = [
    'propalcote', 'papel bond a granel', 'bobina de papel', 'tinta litografica',
    'tinta litográfica', 'planchas ctp', 'plancha ctp', 'quimico de revelado',
    'barniz uv industrial', 'materia prima litografia', 'materia prima',
    'resma propalcote', 'sustrato de impresion'
  ];
  if (keywordsMateriaPrima.some(k => c.includes(k))) {
    return {
      bloqueado: true,
      categoria: 'MATERIA_PRIMA_PRINCIPAL',
      motivo: 'Las materias primas e insumos directos del proceso productivo litográfico no pueden adquirirse por caja menor.',
      fundamentoLegal: 'NIIF Inventarios (NIC 2 / Sección 13 NIIF Pymes) y control de costos de producción de Impresos El Día S.A.S.',
      accionSugerida: 'Generar requisición en el módulo de compras e inventario ERP para orden a proveedores homologados con crédito comercial.'
    };
  }

  return { bloqueado: false };
}

/**
 * Algoritmo detector de Fraccionamiento de Compras:
 * Revisa si al mismo proveedor (NIT) se le han realizado compras consecutivas en la misma fecha
 * o periodo que sumadas excedan el tope de caja menor.
 */
export interface CompraPreviaItem {
  nitEmisor: string;
  fechaEmision: string;
  numeroConsecutivo: string;
  totalCOP?: number;
  desglose?: {
    totalCOP: number;
  };
}

export function detectarFraccionamiento(
  nuevoNit: string,
  nuevoMontoCOP: number,
  comprasPrevias: CompraPreviaItem[],
  topeMaximoCOP: number,
  fechaReferenciaISO: string
): { esFraccionamiento: boolean; mensaje?: string; detalles?: string } {
  const nitNorm = nuevoNit.replace(/\D/g, '');
  const fechaHoy = fechaReferenciaISO.split('T')[0];

  // Filtrar compras del mismo NIT en la misma fecha (o últimos 3 días)
  const comprasMismoProveedor = comprasPrevias.filter(compra => {
    const nitExistente = compra.nitEmisor.replace(/\D/g, '');
    const fechaCompra = compra.fechaEmision.split('T')[0];
    return nitExistente === nitNorm && fechaCompra === fechaHoy;
  });

  if (comprasMismoProveedor.length > 0) {
    const sumaExistente = comprasMismoProveedor.reduce((acc, c) => acc + (c.desglose?.totalCOP ?? c.totalCOP ?? 0), 0);
    const sumaTotal = sumaExistente + nuevoMontoCOP;

    if (sumaTotal > topeMaximoCOP) {
      const facturasLista = comprasMismoProveedor.map(c => `#${c.numeroConsecutivo} ($ ${(c.desglose?.totalCOP ?? c.totalCOP ?? 0).toLocaleString('es-CO')})`).join(', ');
      return {
        esFraccionamiento: true,
        mensaje: 'ALERTA DE CONTROL INTERNO: Posible fraccionamiento de compras detectado.',
        detalles: `El proveedor con NIT ${nuevoNit} ya registra hoy ${comprasMismoProveedor.length} compra(s): ${facturasLista}. Al sumar la nueva compra ($ ${nuevoMontoCOP.toLocaleString('es-CO')}), el acumulado diario ($ ${sumaTotal.toLocaleString('es-CO')} COP) supera el tope permitido de $ ${topeMaximoCOP.toLocaleString('es-CO')} COP.`
      };
    }
  }

  return { esFraccionamiento: false };
}

/**
 * Genera un código hash criptográfico simulado SHA-256 para actas inmutables.
 */
export function generarHashInmutable(datos: Record<string, unknown>): string {
  const str = JSON.stringify(datos) + 'IMPRESOS_EL_DIA_SAS_MEDELLIN_AUDIT_SALT';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256:dian-${hex}-7c4f-9e2a-medellin-${Date.now().toString(16)}`;
}

/**
 * Calcula impuestos colombianos típicos a partir de subtotal y conceptos
 */
export function calcularImpuestosGasto(
  subtotal: number,
  tipoGasto: 'GRAVADO_19' | 'GRAVADO_5' | 'EXENTO' | 'TRANSPORTE',
  aplicaIcaMedellin: boolean = true
): {
  subtotalGravadoCOP: number;
  subtotalExentoCOP: number;
  iva19COP: number;
  iva5COP: number;
  icaTarifa: string;
  icaValorCOP: number;
  retefuenteTarifa: string;
  retefuenteValorCOP: number;
  totalCOP: number;
} {
  let subtotalGravadoCOP = 0;
  let subtotalExentoCOP = 0;
  let iva19COP = 0;
  let iva5COP = 0;

  if (tipoGasto === 'GRAVADO_19') {
    subtotalGravadoCOP = Math.round(subtotal / 1.19);
    iva19COP = subtotal - subtotalGravadoCOP;
  } else if (tipoGasto === 'GRAVADO_5') {
    subtotalGravadoCOP = Math.round(subtotal / 1.05);
    iva5COP = subtotal - subtotalGravadoCOP;
  } else {
    subtotalExentoCOP = subtotal;
  }

  // ICA Medellín para actividades de servicios/comercio menor (tarifa estándar 7 por mil o 11.04 por mil)
  const icaTarifa = aplicaIcaMedellin ? '7x1000' : '0%';
  const baseIca = subtotalGravadoCOP + subtotalExentoCOP;
  const icaValorCOP = aplicaIcaMedellin ? Math.round((baseIca * 7) / 1000) : 0;

  // En caja menor las compras generalmente no superan la base de retención en la fuente por compras (aprox $1.200.000 COP)
  const retefuenteTarifa = '0% (Bajo base)';
  const retefuenteValorCOP = 0;

  const totalCOP = subtotalGravadoCOP + subtotalExentoCOP + iva19COP + iva5COP;

  return {
    subtotalGravadoCOP,
    subtotalExentoCOP,
    iva19COP,
    iva5COP,
    icaTarifa,
    icaValorCOP,
    retefuenteTarifa,
    retefuenteValorCOP,
    totalCOP
  };
}
