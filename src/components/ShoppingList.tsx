'use client'

import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react'

interface ShoppingItem {
  id: string
  text: string
  checked: boolean
}

export function ShoppingListButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[7.5rem] right-6 z-40 h-10 w-10 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-500 transition-colors flex items-center justify-center"
        title="Shopping List"
      >
        <ShoppingCart className="h-5 w-5" />
      </button>
      {isOpen && <ShoppingListModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

export function ShoppingListModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shopping-list')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [newItem, setNewItem] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('shopping-list', JSON.stringify(items))
  }, [items])

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

  const addItem = () => {
    if (!newItem.trim()) return
    setItems([...items, { id: Date.now().toString(), text: newItem.trim(), checked: false }])
    setNewItem('')
    inputRef.current?.focus()
  }

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const uncheckAll = () => {
    setItems(items.map(item => ({ ...item, checked: false })))
  }

  const clearChecked = () => {
    setItems(items.filter(item => !item.checked))
  }

  const clearAll = () => {
    setItems([])
  }

  const uncheckedCount = items.filter(i => !i.checked).length
  const checkedCount = items.filter(i => i.checked).length

  if (isMinimized) {
    return (
      <div
        ref={modalRef}
        className="fixed z-50 bg-green-600 rounded-lg shadow-2xl select-none"
        style={{ left: position.x, top: position.y }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 text-white">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm font-medium">Shopping ({uncheckedCount})</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-green-100 hover:text-white transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-green-100 hover:text-white transition-colors"
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
      className="fixed z-50 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl select-none border border-gray-200 dark:border-gray-700"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header - draggable */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-move bg-green-600 rounded-t-xl"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-white">
          <ShoppingCart className="h-4 w-4" />
          <span className="text-sm font-medium">Shopping List</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-green-100 hover:text-white transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-green-100 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add item */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          <input
            ref={inputRef}
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add item..."
            className="flex-1 px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button
            onClick={addItem}
            className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="max-h-64 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">
            No items yet
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 group"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {item.text}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          <span>{uncheckedCount} left{checkedCount > 0 && `, ${checkedCount} done`}</span>
          <div className="flex gap-2">
            {checkedCount > 0 && (
              <>
                <button onClick={uncheckAll} className="text-blue-600 hover:text-blue-700">
                  Uncheck
                </button>
                <button onClick={clearChecked} className="text-green-600 hover:text-green-700">
                  Clear done
                </button>
              </>
            )}
            <button onClick={clearAll} className="text-red-500 hover:text-red-600">
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
