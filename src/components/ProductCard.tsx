'use client'

interface ProductCardProps {
  code: string
  barcode: string | null
  description: string
  quantity: number
  onQuantityChange: (qty: number) => void
  onSave: () => void
  saving: boolean
  saved: boolean
}

export default function ProductCard({
  code,
  barcode,
  description,
  quantity,
  onQuantityChange,
  onSave,
  saving,
  saved,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-5 border border-blue-100">
      <div className="mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Producto</p>
        <p className="text-lg font-bold text-gray-900">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-gray-500">Código</p>
          <p className="font-mono font-medium text-gray-800">{code}</p>
        </div>
        {barcode && (
          <div>
            <p className="text-gray-500">Código de Barras</p>
            <p className="font-mono font-medium text-gray-800">{barcode}</p>
          </div>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantidad contada
        </label>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => onQuantityChange(Math.max(0, parseInt(e.target.value) || 0))}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          className="w-full text-center text-2xl font-bold py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
        />
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-semibold text-lg transition-all active:scale-[0.98] ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50`}
      >
        {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
      </button>
    </div>
  )
}
