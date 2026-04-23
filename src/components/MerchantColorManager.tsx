'use client'

import { useState } from 'react'
import { Plus, Trash2, Store } from 'lucide-react'

interface MerchantColor {
  id: string
  name: string
  color: string
}

interface Props {
  initialMerchants: MerchantColor[]
}

export function MerchantColorManager({ initialMerchants }: Props) {
  const [merchants, setMerchants] = useState(initialMerchants)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6B7280')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newName.trim()) return

    const res = await fetch('/api/merchant-colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    })

    if (res.ok) {
      const merchant = await res.json()
      setMerchants((prev) => [...prev, merchant].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewColor('#6B7280')
      setIsAdding(false)
    }
  }

  const handleUpdate = async (id: string, name: string, color: string) => {
    const res = await fetch(`/api/merchant-colors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })

    if (res.ok) {
      const updated = await res.json()
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? updated : m)).sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/merchant-colors/${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setMerchants((prev) => prev.filter((m) => m.id !== id))
    }
  }

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Merchant Colors</h2>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Add merchant names and their brand colors. These will show as colored initials in transaction lists.
      </p>

      {isAdding && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value.toUpperCase())}
            className="w-10 h-10 rounded cursor-pointer border-0"
          />
          <input
            type="text"
            value={newColor.toUpperCase()}
            onChange={(e) => {
              let val = e.target.value.toUpperCase()
              if (!val.startsWith('#')) val = '#' + val
              if (/^#[0-9A-F]{0,6}$/.test(val)) setNewColor(val)
            }}
            placeholder="#000000"
            className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-2 text-sm font-mono"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Merchant name"
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAdding(false)
              setNewName('')
              setNewColor('#6B7280')
            }}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="space-y-2">
        {merchants.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            No merchant colors yet. Add your first one!
          </p>
        ) : (
          merchants.map((merchant) => (
            <MerchantRow
              key={merchant.id}
              merchant={merchant}
              isEditing={editingId === merchant.id}
              onEdit={() => setEditingId(merchant.id)}
              onSave={(name, color) => handleUpdate(merchant.id, name, color)}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(merchant.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface MerchantRowProps {
  merchant: MerchantColor
  isEditing: boolean
  onEdit: () => void
  onSave: (name: string, color: string) => void
  onCancel: () => void
  onDelete: () => void
}

function MerchantRow({ merchant, isEditing, onEdit, onSave, onCancel, onDelete }: MerchantRowProps) {
  const [name, setName] = useState(merchant.name)
  const [color, setColor] = useState(merchant.color)

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value.toUpperCase())}
          className="w-8 h-8 rounded cursor-pointer border-0"
        />
        <input
          type="text"
          value={color.toUpperCase()}
          onChange={(e) => {
            let val = e.target.value.toUpperCase()
            if (!val.startsWith('#')) val = '#' + val
            if (/^#[0-9A-F]{0,6}$/.test(val)) setColor(val)
          }}
          className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1.5 text-sm font-mono"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-sm"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onSave(name, color)}
        />
        <button
          onClick={() => onSave(name, color)}
          className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={() => {
            setName(merchant.name)
            setColor(merchant.color)
            onCancel()
          }}
          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ backgroundColor: merchant.color }}
      >
        {merchant.name.charAt(0).toUpperCase()}
      </div>
      <span className="flex-1 text-gray-900 dark:text-white">{merchant.name}</span>
      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{merchant.color.toUpperCase()}</span>
      <button
        onClick={onEdit}
        className="px-2 py-1 text-xs text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
