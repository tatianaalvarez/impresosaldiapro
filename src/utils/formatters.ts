export function formatCOP(amount: number): string {
  const num = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `$ ${num} COP`;
}

export function formatFechaCO(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatFechaCorta(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Calcula días hábiles restantes para legalización (máximo 5 días hábiles según política interna).
 */
export function calcularDiasRestantesLegalizacion(fechaDesembolsoISO: string, plazoDiasHabiles: number = 5): {
  diasRestantes: number;
  estadoSemaforo: 'VERDE' | 'AMARILLO' | 'ROJO_VENCIDO';
  mensaje: string;
} {
  const ahora = new Date();
  const desembolso = new Date(fechaDesembolsoISO);
  
  // Días transcurridos en tiempo real
  const msPorDia = 1000 * 60 * 60 * 24;
  const diasTranscurridos = Math.floor((ahora.getTime() - desembolso.getTime()) / msPorDia);
  const diasRestantes = plazoDiasHabiles - diasTranscurridos;

  if (diasRestantes < 0) {
    return {
      diasRestantes,
      estadoSemaforo: 'ROJO_VENCIDO',
      mensaje: `VENCIDO hace ${Math.abs(diasRestantes)} día(s). Colaborador bloqueado para nuevos vales hasta legalización.`,
    };
  } else if (diasRestantes <= 1) {
    return {
      diasRestantes,
      estadoSemaforo: 'AMARILLO',
      mensaje: `Urgente: queda ${diasRestantes === 0 ? 'menos de 24 horas' : '1 día hábil'} para legalizar el comprobante.`,
    };
  } else {
    return {
      diasRestantes,
      estadoSemaforo: 'VERDE',
      mensaje: `Al día: restan ${diasRestantes} días hábiles para adjuntar factura.`,
    };
  }
}
