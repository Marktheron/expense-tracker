'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function KeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      // N - New transaction
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        router.push('/transactions/new')
      }

      // T - Transactions list
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        router.push('/transactions')
      }

      // D - Dashboard
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        router.push('/')
      }

      // R - Reports
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        router.push('/reports')
      }

      // ? - Show help (could expand later)
      if (e.key === '?') {
        e.preventDefault()
        alert(
          'Keyboard Shortcuts:\n\n' +
          'N - New transaction\n' +
          'T - Transactions\n' +
          'D - Dashboard\n' +
          'R - Reports\n' +
          '? - Show this help'
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return null
}
