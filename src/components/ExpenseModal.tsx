'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { TransactionForm } from './TransactionForm'

interface Category {
  id: string
  name: string
  color: string
}

interface ExpenseModalContextType {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const ExpenseModalContext = createContext<ExpenseModalContextType | null>(null)

export function useExpenseModal() {
  const context = useContext(ExpenseModalContext)
  if (!context) {
    throw new Error('useExpenseModal must be used within ExpenseModalProvider')
  }
  return context
}

export function ExpenseModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => setCategories(data))
        .catch(() => {})
    }
  }, [isOpen, categories.length])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeModal])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <ExpenseModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="flex min-h-full items-start justify-center p-4 pt-16">
            <div
              className="relative w-full max-w-[750px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Form content */}
              <div className="p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {categories.length > 0 ? (
                  <TransactionForm
                    categories={categories}
                    onSuccess={() => {
                      closeModal()
                      // Refresh the page to show new transaction
                      window.location.reload()
                    }}
                    onCancel={closeModal}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ExpenseModalContext.Provider>
  )
}
