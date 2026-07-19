export interface Product {
  id: number
  code: string
  barcode: string | null
  description: string
  created_at: string
}

export interface Session {
  id: string
  name: string
  pin: string
  status: 'active' | 'completed'
  max_employees: number
  created_at: string
  completed_at: string | null
}

export interface SessionEmployee {
  id: number
  session_id: string
  employee_name: string
  joined_at: string
}

export interface Count {
  id: number
  session_id: string
  product_id: number
  quantity: number
  scanned_by: string
  created_at: string
  updated_at: string
}

export interface CountWithProduct extends Count {
  products: Product
}

export interface ScannedItem {
  code: string
  barcode: string | null
  description: string
  quantity: number
  scanned_by: string
}
