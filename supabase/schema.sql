-- =============================================
-- Esquema de base de datos para Inventario DK
-- =============================================

-- Productos importados del sistema POS
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  barcode TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_barcode ON products(barcode);

-- Sesiones de inventario
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  pin TEXT NOT NULL DEFAULT '1234',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  max_employees INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Empleados en una sesión
CREATE TABLE session_employees (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, employee_name)
);

-- Conteos de inventario por producto por sesión
CREATE TABLE counts (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  scanned_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

CREATE INDEX idx_counts_session ON counts(session_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_counts_updated_at
  BEFORE UPDATE ON counts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Row Level Security (opcional, se puede activar luego)
-- =============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE counts ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para acceso interno
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on session_employees" ON session_employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on counts" ON counts FOR ALL USING (true) WITH CHECK (true);
