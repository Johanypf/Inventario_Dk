'use client'

import { useState, useEffect, useCallback, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import Scanner from '@/components/Scanner'
import ProductCard from '@/components/ProductCard'
import { playSuccess, playError } from '@/lib/sound'

export default function InventoryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const scanningRef = useRef(false)
  const [employeeName, setEmployeeName] = useState('')
  const [scanMode, setScanMode] = useState<'scanner' | 'manual'>('scanner')
  const [scannerRunning, setScannerRunning] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [sessionInfo, setSessionInfo] = useState<{ name: string; pin: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [existingCount, setExistingCount] = useState<number | null>(null)
  const [saveMode, setSaveMode] = useState<'set' | 'add'>('add')
  const productIdRef = useRef<number | null>(null)
  const countsCache = useRef<Record<number, number>>({})

  useEffect(() => {
    const name = localStorage.getItem('dk_employee_name')
    const sid = localStorage.getItem('dk_session_id')
    if (!name || sid !== sessionId) {
      router.push('/')
      return
    }
    setEmployeeName(name)
    getSupabase()
      .from('sessions')
      .select('name, pin')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => {
        if (data) setSessionInfo(data)
      })
  }, [sessionId, router])

  useEffect(() => {
    const channel = getSupabase()
      .channel('counts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'counts', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const pid = payload.new.product_id as number
          const qty = payload.new.quantity as number
          countsCache.current[pid] = qty
          if (pid === productIdRef.current) {
            setExistingCount(qty)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'counts', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const pid = payload.new.product_id as number
          const qty = payload.new.quantity as number
          countsCache.current[pid] = qty
          if (pid === productIdRef.current) {
            setExistingCount(qty)
          }
        }
      )
      .subscribe()
    return () => { getSupabase().removeChannel(channel) }
  }, [sessionId])

  const handleScan = useCallback(async (code: string) => {
    if (scanningRef.current) return
    scanningRef.current = true
    setScannerRunning(false)
    setError('')
    setSaved(false)
    setSearchInput(code)
    setQuantity(1)
    await lookupProduct(code)
    scanningRef.current = false
  }, [])

  async function handleManualSearch() {
    if (!searchInput.trim()) return
    setError('')
    setSaved(false)
    setQuantity(1)
    await lookupProduct(searchInput.trim())
  }

  async function lookupProduct(code: string) {
    setSearching(true)
    setProduct(null)
    setExistingCount(null)
    setSaveMode('add')

    const { data } = await getSupabase().from('products')
      .select('*')
      .or(`code.eq.${code},barcode.eq.${code}`)
      .maybeSingle()

    if (data) {
      playSuccess()
      const pid = data.id
      productIdRef.current = pid
      setProduct(data as Product)
      setScannerRunning(false)

      if (pid in countsCache.current) {
        setExistingCount(countsCache.current[pid])
      }

      getSupabase().from('counts')
        .select('quantity')
        .eq('session_id', sessionId)
        .eq('product_id', pid)
        .maybeSingle()
        .then(({ data: existing }) => {
          if (existing) {
            countsCache.current[pid] = existing.quantity
            if (productIdRef.current === pid) {
              setExistingCount(existing.quantity)
            }
          }
        })
    } else {
      playError()
      setError(`Producto no encontrado: "${code}"`)
    }
    setSearching(false)
  }

  async function handleSave() {
    if (!product || saving) return
    setSaving(true)
    setError('')

    if (saveMode === 'add' && existingCount !== null) {
      const { data: newQty, error: err } = await getSupabase().rpc('increment_count', {
        p_session_id: sessionId,
        p_product_id: product.id,
        p_quantity: quantity,
        p_scanned_by: employeeName,
      })

      if (err) {
        playError()
        setError(err.message)
      } else {
        playSuccess()
        setSaved(true)
        countsCache.current[product.id] = newQty as number
        setExistingCount(newQty as number)
        setTimeout(() => {
          setProduct(null)
          productIdRef.current = null
          setSearchInput('')
          setQuantity(1)
          setSaved(false)
          setScannerRunning(true)
        }, 1200)
      }
    } else {
      const { data: newQty, error: err } = await getSupabase().rpc('set_count', {
        p_session_id: sessionId,
        p_product_id: product.id,
        p_quantity: quantity,
        p_scanned_by: employeeName,
      })

      if (err) {
        playError()
        setError(err.message)
      } else {
        playSuccess()
        setSaved(true)
        countsCache.current[product.id] = newQty as number
        setExistingCount(newQty as number)
        setTimeout(() => {
          setProduct(null)
          productIdRef.current = null
          setSearchInput('')
          setQuantity(1)
          setSaved(false)
          setScannerRunning(true)
        }, 1200)
      }
    }
    setSaving(false)
  }

  return (
    <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => { router.push('/') }}
        className="text-gray-500 p-2"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-900">
            {sessionInfo?.name || 'Inventario'}
          </h1>
          <p className="text-xs text-gray-500">
            PIN: <span className="font-mono">{sessionInfo?.pin}</span>
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('dk_session_id')
            router.push('/')
          }}
          className="text-red-500 text-sm font-medium"
        >
          Salir
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-white rounded-xl p-1 shadow-sm mb-4 border border-gray-200">
        <button
          onClick={() => { setScanMode('scanner'); setScannerRunning(true); setProduct(null); setError('') }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            scanMode === 'scanner' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'
          }`}
        >
          Escáner
        </button>
        <button
          onClick={() => { setScanMode('manual'); setScannerRunning(false); setProduct(null); setError('') }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            scanMode === 'manual' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'
          }`}
        >
          Manual
        </button>
      </div>

      {/* Scanner */}
      {scanMode === 'scanner' && (
        <div className="mb-4">
          <Scanner
            onScan={handleScan}
            onError={(msg) => setError(msg)}
            running={scannerRunning && !product}
          />
        </div>
      )}

      {/* Manual input */}
      {scanMode === 'manual' && !product && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingresa código o código de barras
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="Código o código de barras"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleManualSearch}
              disabled={searching || !searchInput.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 active:scale-[0.98]"
            >
              {searching ? '...' : 'Buscar'}
            </button>
          </div>
        </div>
      )}

      {/* Scanning indicator */}
      {searching && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-gray-500">Buscando producto...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => { setError(''); setScannerRunning(true) }}
            className="text-red-600 text-sm font-medium mt-1 underline"
          >
            Escanear otro
          </button>
        </div>
      )}

      {/* Product card */}
      {product && (
        <div className="mb-4">
          <ProductCard
            code={product.code}
            barcode={product.barcode}
            description={product.description}
            quantity={quantity}
            existingCount={existingCount}
            saveMode={saveMode}
            onQuantityChange={setQuantity}
            onSaveModeChange={setSaveMode}
            onSave={handleSave}
            saving={saving}
            saved={saved}
          />
          <button
            onClick={() => {
              setProduct(null)
              productIdRef.current = null
              setExistingCount(null)
              setSearchInput('')
              setQuantity(1)
              setSaved(false)
              setScannerRunning(true)
            }}
            className="w-full mt-2 py-2 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] transition-all"
          >
            Escanear otro código
          </button>
        </div>
      )}

    </main>
  )
}
