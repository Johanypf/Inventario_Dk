'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface ScannerProps {
  onScan: (code: string) => void
  onError?: (error: string) => void
  running: boolean
}

export default function Scanner({ onScan, onError, running }: ScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!running && scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [running])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (scannerRef.current) return
    setStarting(true)
    setCameraError(false)

    try {
      const scanner = new Html5Qrcode('scanner-container')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth: number) => ({
            width: Math.min(220, viewfinderWidth * 0.85),
            height: 90,
            x: (viewfinderWidth - Math.min(220, viewfinderWidth * 0.85)) / 2,
            y: 10,
          }),
        },
        (decodedText) => {
          onScan(decodedText.trim())
        },
        () => {}
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de cámara'
      setCameraError(true)
      onError?.(msg)
    }
    setStarting(false)
  }, [onScan, onError])

  return (
    <div className="relative">
      <div
        id="scanner-container"
        className="w-full max-w-md mx-auto overflow-hidden rounded-xl bg-black"
        style={{ minHeight: '200px', maxHeight: '220px' }}
      />

      {running && !scannerRef.current && !starting && !cameraError && (
        <button
          onClick={startCamera}
          className="mt-3 w-full py-3 bg-blue-600 text-white rounded-xl font-medium active:scale-[0.98]"
        >
          Iniciar Cámara
        </button>
      )}

      {starting && (
        <p className="text-sm text-gray-500 text-center mt-2">Iniciando cámara...</p>
      )}

      {running && scannerRef.current && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Enfoca el código de barras en el recuadro
        </p>
      )}

      {cameraError && (
        <div className="mt-3 text-center">
          <p className="text-sm text-red-500 mb-2">
            No se pudo acceder a la cámara. Usa la entrada manual.
          </p>
          <button
            onClick={startCamera}
            className="text-sm text-blue-600 underline"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  )
}
