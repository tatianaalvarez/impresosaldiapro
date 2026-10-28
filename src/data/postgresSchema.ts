/**
 * ESQUEMA DE BASE DE DATOS RELACIONAL EN POSTGRESQL (v16+)
 * Para: Plataforma de Gestión de Caja Menor - Impresos El Día S.A.S. (Medellín, Colombia)
 * Cumplimiento: DIAN Art. 616-1, Art. 771-5, NIIF para PYMES, Estatuto Tributario de Medellín.
 */

export const POSTGRES_DDL_SCRIPT = `-- ============================================================================
-- BASE DE DATOS: caja_menor_impresos_el_dia_db
-- MOTOR: PostgreSQL 16+
-- NORMAS: Estatuto Tributario DIAN (Colombia), Ley 2155, Art. 616-1, Art. 771-5
-- ============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUMERADOS (DOMINIOS NORMATIVOS)
CREATE TYPE tipo_soporte_dian_enum AS ENUM (
    'FACTURA_ELECTRONICA',           -- Factura Electrónica de Venta (FEV) con CUFE
    'TIQUETE_POS_ELECTRONICO',       -- Documento equivalente POS electrónico con CUDE
    'DOCUMENTO_SOPORTE_NO_OBLIGADO'  -- Documento Soporte electrónico compras a no obligados
);

CREATE TYPE estado_vale_enum AS ENUM (
    'PENDIENTE_APROBACION',
    'DESEMBOLSADO',
    'LEGALIZADO',
    'VENCIDO',
    'RECHAZADO'
);

CREATE TYPE estado_arqueo_enum AS ENUM (
    'CUADRADO',
    'SOBRANTE',
    'FALTANTE'
);

CREATE TYPE rol_usuario_enum AS ENUM (
    'CUSTODIO',
    'SOLICITANTE',
    'CONTABILIDAD_REVISORIA'
);

-- ============================================================================
-- 3. TABLA: centros_costos
-- Centros de costo operativos y administrativos de Impresos El Día S.A.S.
-- ============================================================================
CREATE TABLE centros_costos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,       -- ej: 'CC-101', 'CC-102'
    nombre VARCHAR(120) NOT NULL,             -- ej: 'Producción y Litografía'
    responsable_nombre VARCHAR(120) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLA: usuarios_sistema
-- Custodio, colaboradores operarios y jefes contables
-- ============================================================================
CREATE TABLE usuarios_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula VARCHAR(30) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    cargo VARCHAR(100) NOT NULL,
    rol rol_usuario_enum NOT NULL DEFAULT 'SOLICITANTE',
    centro_costo_id UUID REFERENCES centros_costos(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLA: configuracion_fondo_fijo
-- Parámetros normativos de la caja menor en Pesos Colombianos (COP)
-- ============================================================================
CREATE TABLE configuracion_fondo_fijo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_nombre VARCHAR(150) NOT NULL DEFAULT 'Impresos El Día S.A.S.',
    empresa_nit VARCHAR(20) NOT NULL DEFAULT '900.548.219-4',
    ciudad VARCHAR(80) NOT NULL DEFAULT 'Medellín, Antioquia',
    moneda VARCHAR(3) NOT NULL DEFAULT 'COP',
    monto_fondo_total_cop NUMERIC(14, 2) NOT NULL DEFAULT 2000000.00,
    tope_maximo_comprobante_cop NUMERIC(14, 2) NOT NULL DEFAULT 250000.00,
    umbral_reembolso_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 70.00,
    plazo_legalizacion_dias_habiles INT NOT NULL DEFAULT 5,
    custodio_usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    acta_apertura_resolucion VARCHAR(100) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Restricciones de integridad financiera
    CONSTRAINT chk_moneda_estricta_cop CHECK (moneda = 'COP'),
    CONSTRAINT chk_monto_fondo_positivo CHECK (monto_fondo_total_cop > 0),
    CONSTRAINT chk_tope_valido CHECK (tope_maximo_comprobante_cop > 0 AND tope_maximo_comprobante_cop < monto_fondo_total_cop),
    CONSTRAINT chk_umbral_valido CHECK (umbral_reembolso_porcentaje BETWEEN 50.00 AND 95.00),
    CONSTRAINT chk_plazo_legalizacion CHECK (plazo_legalizacion_dias_habiles BETWEEN 3 AND 5)
);

-- ============================================================================
-- 6. TABLA: vales_provisionales
-- Anticipos temporales con código QR y control de plazos (3-5 días hábiles)
-- ============================================================================
CREATE TABLE vales_provisionales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_vale VARCHAR(30) NOT NULL UNIQUE,     -- ej: 'VAL-2026-0045'
    solicitante_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    centro_costo_id UUID NOT NULL REFERENCES centros_costos(id),
    monto_solicitado_cop NUMERIC(14, 2) NOT NULL,
    concepto_gasto TEXT NOT NULL,
    estado estado_vale_enum NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_desembolso TIMESTAMPTZ,
    fecha_limite_legalizacion TIMESTAMPTZ,
    custodio_desembolso_id UUID REFERENCES usuarios_sistema(id),
    codigo_qr_entrega TEXT NOT NULL,
    monto_gastado_real_cop NUMERIC(14, 2) DEFAULT 0.00,
    sobrante_reintegrado_cop NUMERIC(14, 2) DEFAULT 0.00,
    motivo_rechazo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_monto_solicitado_positivo CHECK (monto_solicitado_cop > 0)
);

CREATE INDEX idx_vales_estado ON vales_provisionales(estado);
CREATE INDEX idx_vales_fecha_limite ON vales_provisionales(fecha_limite_legalizacion);

-- ============================================================================
-- 7. TABLA: soportes_fiscales_dian
-- Facturas electrónicas, tiquetes POS con CUDE y Documentos Soporte validados
-- ============================================================================
CREATE TABLE soportes_fiscales_dian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_soporte tipo_soporte_dian_enum NOT NULL,
    numero_consecutivo VARCHAR(50) NOT NULL,
    cufe_o_cude VARCHAR(120),                     -- 64 o 96 caracteres hexadecimales DIAN
    fecha_emision TIMESTAMPTZ NOT NULL,
    nit_emisor VARCHAR(20) NOT NULL,              -- NIT sin dígito
    digito_verificacion CHAR(1) NOT NULL,         -- Módulo 11 DIAN
    razon_social_emisor VARCHAR(200) NOT NULL,
    direccion_emisor VARCHAR(200),
    municipio_emisor VARCHAR(100) DEFAULT 'Medellín',
    concepto_gasto TEXT NOT NULL,
    
    -- Imputación Contable PUC
    cuenta_puc_codigo VARCHAR(20) NOT NULL,       -- ej: '513525', '514510', '519525'
    cuenta_puc_nombre VARCHAR(150) NOT NULL,
    centro_costo_id UUID NOT NULL REFERENCES centros_costos(id),
    vale_asociado_id UUID REFERENCES vales_provisionales(id),
    
    -- Desglose Tributario Colombiano (COP)
    subtotal_gravado_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    subtotal_exento_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    iva_19_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    iva_5_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    ica_tarifa VARCHAR(20) DEFAULT '7x1000',
    ica_valor_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retefuente_tarifa VARCHAR(20) DEFAULT '0%',
    retefuente_valor_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_cop NUMERIC(14, 2) NOT NULL,
    
    -- Control Fiscal y Antifraude
    valido_dian BOOLEAN NOT NULL DEFAULT TRUE,
    observaciones_dian TEXT,
    alerta_fraccionamiento BOOLEAN NOT NULL DEFAULT FALSE,
    alerta_fraccionamiento_detalle TEXT,
    reembolsado BOOLEAN NOT NULL DEFAULT FALSE,
    reembolso_id UUID,
    registrado_por_usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_nit_consecutivo UNIQUE(nit_emisor, numero_consecutivo),
    CONSTRAINT chk_total_positivo CHECK (total_cop > 0)
);

CREATE INDEX idx_soportes_nit ON soportes_fiscales_dian(nit_emisor, fecha_emision);
CREATE INDEX idx_soportes_cufe ON soportes_fiscales_dian(cufe_o_cude);
CREATE INDEX idx_soportes_reembolsado ON soportes_fiscales_dian(reembolsado);

-- ============================================================================
-- 8. TABLA: arqueos_caja_menor
-- Actas inmutables de auditoría sorpresiva y verificación de la ecuación contable
-- ============================================================================
CREATE TABLE arqueos_caja_menor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consecutivo_acta VARCHAR(40) NOT NULL UNIQUE,  -- ej: 'ACTA-ARQ-2026-019'
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    custodio_usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    auditor_usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    fondo_fijo_asignado_cop NUMERIC(14, 2) NOT NULL,
    efectivo_fisico_cop NUMERIC(14, 2) NOT NULL,
    vales_provisionales_cop NUMERIC(14, 2) NOT NULL,
    facturas_liquidadas_cop NUMERIC(14, 2) NOT NULL,
    total_arqueado_cop NUMERIC(14, 2) NOT NULL,     -- Efectivo + Vales + Facturas
    diferencia_cop NUMERIC(14, 2) NOT NULL,         -- Total Arqueado - Fondo Asignado
    estado_cuadre estado_arqueo_enum NOT NULL,
    observaciones TEXT,
    hash_inmutable_sha256 TEXT NOT NULL,            -- Sello criptográfico
    firma_digital_custodio TEXT NOT NULL,
    firma_digital_auditor TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. TABLA: arqueos_denominaciones_efectivo
-- Desglose por billetes y monedas colombianas de curso legal
-- ============================================================================
CREATE TABLE arqueos_denominaciones_efectivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    arqueo_id UUID NOT NULL REFERENCES arqueos_caja_menor(id) ON DELETE CASCADE,
    denominacion_valor_cop INT NOT NULL,           -- 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50
    es_billete BOOLEAN NOT NULL,
    cantidad INT NOT NULL DEFAULT 0,
    subtotal_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_cantidad_no_negativa CHECK (cantidad >= 0)
);

-- ============================================================================
-- 10. TABLA: reembolsos_cierre_contable
-- Cierres de caja para reembolso bancario y exportación a Siigo / Alegra
-- ============================================================================
CREATE TABLE reembolsos_cierre_contable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consecutivo VARCHAR(40) NOT NULL UNIQUE,      -- ej: 'REEMB-2026-005'
    fecha_cierre TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_reembolso_cop NUMERIC(14, 2) NOT NULL,
    cantidad_comprobantes INT NOT NULL,
    archivo_plano_siigo TEXT,
    json_export_alegra JSONB,
    aprobado_contabilidad BOOLEAN NOT NULL DEFAULT FALSE,
    contador_usuario_id UUID REFERENCES usuarios_sistema(id),
    banco_origen VARCHAR(80) DEFAULT 'Bancolombia Cta Corriente # 104-98412-90',
    referencia_transferencia VARCHAR(60),
    fecha_pago_transferencia TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. TABLA: asientos_puc_caja
-- Movimientos de causación contable según Plan Único de Cuentas (PUC)
-- ============================================================================
CREATE TABLE asientos_puc_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reembolso_id UUID NOT NULL REFERENCES reembolsos_cierre_contable(id) ON DELETE CASCADE,
    soporte_id UUID REFERENCES soportes_fiscales_dian(id),
    cuenta_puc_codigo VARCHAR(20) NOT NULL,       -- ej: '110505', '513525', '240801'
    cuenta_puc_nombre VARCHAR(150) NOT NULL,
    tercero_nit VARCHAR(20) NOT NULL,
    tercero_nombre VARCHAR(150) NOT NULL,
    debito_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    credito_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    concepto_detalle TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 12. FUNCIÓN Y TRIGGER: DETECCIÓN AUTOMÁTICA DE FRACCIONAMIENTO
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_verificar_fraccionamiento_compras()
RETURNS TRIGGER AS $$
DECLARE
    v_total_acumulado NUMERIC(14,2);
    v_tope_comprobante NUMERIC(14,2);
BEGIN
    SELECT tope_maximo_comprobante_cop INTO v_tope_comprobante
    FROM configuracion_fondo_fijo
    WHERE activo = TRUE
    LIMIT 1;

    SELECT COALESCE(SUM(total_cop), 0) INTO v_total_acumulado
    FROM soportes_fiscales_dian
    WHERE nit_emisor = NEW.nit_emisor
      AND fecha_emision::DATE = NEW.fecha_emision::DATE
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF (v_total_acumulado + NEW.total_cop) > v_tope_comprobante THEN
        NEW.alerta_fraccionamiento := TRUE;
        NEW.alerta_fraccionamiento_detalle := FORMAT(
            'Posible fraccionamiento detectado: Compras acumuladas al NIT %s hoy suman $%s COP, excediendo el tope de $%s COP.',
            NEW.nit_emisor, (v_total_acumulado + NEW.total_cop), v_tope_comprobante
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_fraccionamiento
BEFORE INSERT OR UPDATE ON soportes_fiscales_dian
FOR EACH ROW
EXECUTE FUNCTION fn_verificar_fraccionamiento_compras();
`;
