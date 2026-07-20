-- Función para incrementar conteo atómicamente (evita race conditions)
CREATE OR REPLACE FUNCTION increment_count(
  p_session_id UUID,
  p_product_id BIGINT,
  p_quantity INTEGER,
  p_scanned_by TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_quantity INTEGER;
BEGIN
  INSERT INTO counts (session_id, product_id, quantity, scanned_by)
  VALUES (p_session_id, p_product_id, p_quantity, p_scanned_by)
  ON CONFLICT (session_id, product_id) 
  DO UPDATE SET 
    quantity = counts.quantity + p_quantity,
    updated_at = NOW(),
    scanned_by = p_scanned_by
  RETURNING quantity INTO v_new_quantity;
  
  RETURN v_new_quantity;
END;
$$;

-- Función para establecer conteo (reemplazar)
CREATE OR REPLACE FUNCTION set_count(
  p_session_id UUID,
  p_product_id BIGINT,
  p_quantity INTEGER,
  p_scanned_by TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_quantity INTEGER;
BEGIN
  INSERT INTO counts (session_id, product_id, quantity, scanned_by)
  VALUES (p_session_id, p_product_id, p_quantity, p_scanned_by)
  ON CONFLICT (session_id, product_id) 
  DO UPDATE SET 
    quantity = p_quantity,
    updated_at = NOW(),
    scanned_by = p_scanned_by
  RETURNING quantity INTO v_new_quantity;
  
  RETURN v_new_quantity;
END;
$$;
