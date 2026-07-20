'use client'

interface ProductCardProps {
  code: string
  barcode: string | null
  description: string
  quantity: number
  existingCount: number | null
  saveMode: 'set' | 'add'
  onQuantityChange: (qty: number) => void
  onSaveModeChange: (mode: 'set' | 'add') => void
  onSave: () => void
  saving: boolean
  saved: boolean
}

export default function ProductCard({
  code,
  barcode,
  description,
  quantity,
  existingCount,
  saveMode,
  onQuantityChange,
  onSaveModeChange,
  onSave,
  saving,
  saved,
}: ProductCardProps) {
  const total = saveMode === 'add' && existingCount !== null
    ? existingCount + quantity
    : quantity

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

      {existingCount !== null && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
          <span className="text-gray-500">Conteo actual: </span>
          <span className="font-bold text-gray-800">{existingCount}</span>
          {saveMode === 'add' && (
            <span className="text-gray-500 ml-2">
              → Total: <span className="font-bold text-blue-600">{total}</span>
            </span>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantidad
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

      {existingCount !== null && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => onSaveModeChange('add')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
              saveMode === 'add'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Sumar
          </button>
          <button
            onClick={() => onSaveModeChange('set')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
              saveMode === 'set'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Reemplazar
          </button>
        </div>
      )}

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
