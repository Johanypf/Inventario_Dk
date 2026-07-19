'use client'

import { useEffect } from 'react'

export default function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('SW registrado'))
        .catch((err) => console.error('Error registrando SW:', err))
    }
  }, [])

  return null
}
