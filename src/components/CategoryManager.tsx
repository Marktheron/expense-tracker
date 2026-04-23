'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
  usageCount: number
}

interface Props {
  initialCategories: Category[]
}

const COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#84CC16', // lime
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#EC4899', // pink
  '#6B7280', // gray
]

export function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const startEditing = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(category.color)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return

    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    })

    if (res.ok) {
      const updated = await res.json()
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...updated, usageCount: c.usageCount } : c))
      )
      setEditingId(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setIsAdding(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })

      if (res.ok) {
        const category = await res.json()
        setCategories((prev) => [...prev, { ...category, usageCount: 0 }])
        setNewName('')
        setNewColor(COLORS[0])
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string, usageCount: number) => {
    if (usageCount > 0) {
      alert(
        `This category is used by ${usageCount} item(s). Remove all items from this category before deleting.`
      )
      return
    }

    if (!confirm('Are you sure you want to delete this category?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h2>

        {/* Category List */}
        <div className="space-y-2 mb-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {editingId === category.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value.toUpperCase())}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={editColor.toUpperCase()}
                    onChange={(e) => {
                      let val = e.target.value.toUpperCase()
                      if (!val.startsWith('#')) val = '#' + val
                      if (/^#[0-9A-F]{0,6}$/.test(val)) setEditColor(val)
                    }}
                    className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1.5 text-sm font-mono"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 min-w-[120px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(category.id)}
                  />
                  <button
                    onClick={() => handleUpdate(category.id)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{category.color.toUpperCase()}</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      ({category.usageCount} item{category.usageCount !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(category)}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.usageCount)}
                      disabled={deletingId === category.id}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Category */}
        <form onSubmit={handleAdd} className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Category</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[150px]">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value.toUpperCase())}
                className="w-9 h-9 rounded cursor-pointer border-0"
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
                className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-2 text-sm font-mono"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`h-7 w-7 rounded-md transition-all ${
                    newColor.toUpperCase() === color.toUpperCase() ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={!newName.trim() || isAdding}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
