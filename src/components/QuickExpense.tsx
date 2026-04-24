'use client'

import { useState, useRef, useEffect } from 'react'
import { Zap, X, Minus, Check } from 'lucide-react'

interface QuickExpenseData {
  id: string
  merchant: string
  amount: string
  category: string
  date: string
  notes: string
}

export function QuickExpenseButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[13.5rem] right-6 z-40 h-10 w-10 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-500 transition-colors flex items-center justify-center"
        title="Quick Expense"
      >
        <Zap className="h-5 w-5" />
      </button>
      {isOpen && <QuickExpenseModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

export function QuickExpenseModal({ onClose }: { onClose: () => void }) {
  const [drafts, setDrafts] = useState<QuickExpenseData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quick-expense-drafts')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => {})
  }, [])

  // Save drafts to localStorage
  useEffect(() => {
    localStorage.setItem('quick-expense-drafts', JSON.stringify(drafts))
  }, [drafts])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect()
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      setIsDragging(true)
    }
  }

  const saveDraft = () => {
    if (!merchant.trim() && !amount.trim()) return

    const draft: QuickExpenseData = {
      id: Date.now().toString(),
      merchant: merchant.trim(),
      amount: amount.trim(),
      category,
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    }
    setDrafts([draft, ...drafts])
    clearForm()
  }

  const clearForm = () => {
    setMerchant('')
    setAmount('')
    setCategory('')
    setNotes('')
  }

  const removeDraft = (id: string) => {
    setDrafts(drafts.filter(d => d.id !== id))
  }

  const clearAllDrafts = () => {
    setDrafts([])
  }

  if (isMinimized) {
    return (
      <div
        ref={modalRef}
        className="fixed z-50 bg-purple-600 rounded-lg shadow-2xl select-none"
        style={{ left: position.x, top: position.y }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 text-white">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Quick ({drafts.length})</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-purple-100 hover:text-white transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-purple-100 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={modalRef}
      className="fixed z-50 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl select-none border border-gray-200 dark:border-gray-700"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header - draggable */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-move bg-purple-600 rounded-t-xl"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-white">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">Quick Expense</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-purple-100 hover:text-white transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-purple-100 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="Merchant"
          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 px-2 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={saveDraft}
          disabled={!merchant.trim() && !amount.trim()}
          className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save Draft
        </button>
      </div>

      {/* Drafts list */}
      {drafts.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Drafts ({drafts.length})
            </span>
            <button
              onClick={clearAllDrafts}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Clear all
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {draft.merchant || 'No merchant'}
                  </p>
                  <p className="text-xs text-gray-500">
                    R{draft.amount || '0'} · {draft.date}
                  </p>
                </div>
                <button
                  onClick={() => removeDraft(draft.id)}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
        Drafts saved locally · Add to full form later
      </div>
    </div>
  )
}
