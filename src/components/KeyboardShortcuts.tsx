'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useExpenseModal } from './ExpenseModal'

export function KeyboardShortcuts() {
  const router = useRouter()
  const { openModal } = useExpenseModal()

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

      // N - New transaction (opens modal)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        openModal()
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
          'N - New transaction (modal)\n' +
          'T - Transactions\n' +
          'D - Dashboard\n' +
          'R - Reports\n' +
          '? - Show this help'
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, openModal])

  return null
}
