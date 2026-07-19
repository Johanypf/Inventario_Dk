'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface ScannerProps {
  onScan: (code: string) => void
  onError?: (error: string) => void
  running: boolean
}

export default function Scanner({ onScan, onError, running }: ScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameraError, setCameraError] = useState(false)

  useEffect(() => {
    if (!running) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
      return
    }

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('scanner-container')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
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
    }

    startScanner()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [running, onScan, onError])

  return (
    <div className="relative">
      <div
        id="scanner-container"
        className="w-full max-w-md mx-auto overflow-hidden rounded-xl bg-black"
        style={{ minHeight: '250px' }}
      />
      {cameraError && (
        <p className="text-sm text-red-500 text-center mt-2">
          No se pudo acceder a la cámara. Usa la entrada manual.
        </p>
      )}
    </div>
  )
}
