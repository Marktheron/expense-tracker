'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Copy,
  Hamburger,
  Fuel,
  Cross,
  Home,
  SoapDispenserDroplet,
  Car,
  Zap,
  Film,
  Shirt,
  UtensilsCrossed,
  CreditCard,
  MoreHorizontal,
  Landmark,
  X,
  type LucideIcon,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
}

interface LineItemInput {
  id: string
  description: string
  amount: string
  categoryId: string
  vitalityQualifying: boolean
}

interface ExistingTransaction {
  id: string
  date: string
  merchant: string
  notes: string | null
  lineItems: {
    id: string
    description: string
    amount: number
    categoryId: string
    vitalityQualifying: boolean
  }[]
}

interface Props {
  categories: Category[]
  transaction?: ExistingTransaction
  onSuccess?: () => void
  onCancel?: () => void
}

// Map category names to icons
const categoryIcons: Record<string, LucideIcon> = {
  'Groceries': Hamburger,
  'Fuel': Fuel,
  'Medical': Cross,
  'Household': Home,
  'Toiletries': SoapDispenserDroplet,
  'Transport': Car,
  'Utilities': Zap,
  'Entertainment': Film,
  'Clothing': Shirt,
  'Dining Out': UtensilsCrossed,
  'Subscriptions': CreditCard,
  'Debt': Landmark,
  'Other': MoreHorizontal,
}

// Custom category display order (categories not listed here will appear at the end alphabetically)
const categoryOrder: string[] = [
  'Groceries',
  'Medical',
  'Fuel',
  'Household',
  'Toiletries',
  'Transport',
  'Utilities',
  'Entertainment',
  'Clothing',
  'Dining Out',
  'Subscriptions',
  'Other',
  'Debt',
]

function getCategoryIcon(name: string): LucideIcon {
  return categoryIcons[name] || MoreHorizontal
}

function sortCategories<T extends { name: string }>(cats: T[]): T[] {
  return [...cats].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.name)
    const bIndex = categoryOrder.indexOf(b.name)
    // If both in order list, sort by order
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    // If only one is in list, it comes first
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    // Otherwise alphabetical
    return a.name.localeCompare(b.name)
  })
}

export function TransactionForm({ categories, transaction, onSuccess, onCancel }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [date, setDate] = useState(
    transaction?.date
      ? format(new Date(transaction.date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
  )
  const [merchant, setMerchant] = useState(transaction?.merchant || '')
  const [notes, setNotes] = useState(transaction?.notes || '')
  const [showNotes, setShowNotes] = useState(!!transaction?.notes)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const merchantInputRef = useRef<HTMLInputElement>(null)

  // Merchant autocomplete
  const [recentMerchants, setRecentMerchants] = useState<string[]>([])
  const [showMerchantSuggestions, setShowMerchantSuggestions] = useState(false)
  const [selectedMerchantIndex, setSelectedMerchantIndex] = useState(-1)

  // Category tooltip
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null)

  // Vitality tracking (Checkers and Dischem)
  const [vitalityProducts, setVitalityProducts] = useState<string[]>([])
  const isVitalityMerchant = merchant.toLowerCase().includes('checkers') || merchant.toLowerCase().includes('dischem')

  useEffect(() => {
    // Focus merchant input on mount
    merchantInputRef.current?.focus()
  }, [])

  useEffect(() => {
    // Fetch recent merchants on mount
    fetch('/api/merchants')
      .then((res) => res.json())
      .then((data) => {
        // Extract unique merchant names
        const names = data.map((m: { merchant: string }) => m.merchant)
        setRecentMerchants([...new Set(names)] as string[])
      })
      .catch(() => {})

    // Fetch vitality products (remembered)
    fetch('/api/vitality-products')
      .then((res) => res.json())
      .then(setVitalityProducts)
      .catch(() => {})
  }, [])

  // Filter merchants based on input
  const filteredMerchants = merchant.trim()
    ? recentMerchants.filter((m) =>
        m.toLowerCase().includes(merchant.toLowerCase())
      )
    : []

  const selectMerchant = (name: string) => {
    setMerchant(name)
    setShowMerchantSuggestions(false)
  }

  // Line items grouped by category
  const initialLineItems: LineItemInput[] = transaction?.lineItems.map((li) => ({
    id: crypto.randomUUID(),
    description: li.description,
    amount: li.amount.toString(),
    categoryId: li.categoryId,
    vitalityQualifying: li.vitalityQualifying || false,
  })) || []

  const [lineItems, setLineItems] = useState<LineItemInput[]>(initialLineItems)
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null)

  // Track which category accordions are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(initialLineItems.map((li) => li.categoryId))
  )

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const addLineItem = (categoryId: string) => {
    const newId = crypto.randomUUID()
    setLineItems((prev) => [
      ...prev,
      {
        id: newId,
        description: '',
        amount: '',
        categoryId,
        vitalityQualifying: false,
      },
    ])
    setExpandedCategories((prev) => new Set([...prev, categoryId]))
    setLastAddedItemId(newId)
  }

  const updateLineItem = (id: string, field: 'description' | 'amount', value: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  // Check for vitality product on blur (when leaving description field)
  const checkVitalityOnBlur = (id: string) => {
    if (!isVitalityMerchant) return
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const normalizedValue = item.description.toLowerCase().trim()
        if (!normalizedValue) return item
        const isVitalityProduct = vitalityProducts.some(
          (p) => p === normalizedValue || normalizedValue.includes(p) || p.includes(normalizedValue)
        )
        if (isVitalityProduct && !item.vitalityQualifying) {
          return { ...item, vitalityQualifying: true }
        }
        return item
      })
    )
  }

  const toggleVitality = (id: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, vitalityQualifying: !item.vitalityQualifying } : item
      )
    )
  }

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id))
  }

  const duplicateLineItem = (id: string) => {
    const item = lineItems.find((li) => li.id === id)
    if (!item) return
    const newId = crypto.randomUUID()
    setLineItems((prev) => [
      ...prev,
      {
        id: newId,
        description: item.description,
        amount: item.amount,
        categoryId: item.categoryId,
        vitalityQualifying: item.vitalityQualifying,
      },
    ])
    setLastAddedItemId(newId)
  }

  const getLineItemsForCategory = (categoryId: string) =>
    lineItems.filter((item) => item.categoryId === categoryId)

  const getCategoryTotal = (categoryId: string) =>
    getLineItemsForCategory(categoryId).reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    )

  const getGrandTotal = () =>
    lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)

  const categoriesWithItems = categories.filter(
    (cat) => getLineItemsForCategory(cat.id).length > 0
  )

  const categoriesWithoutItems = categories.filter(
    (cat) => getLineItemsForCategory(cat.id).length === 0
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant.trim() || lineItems.length === 0) return

    setIsSubmitting(true)

    const payload = {
      date,
      merchant: merchant.trim(),
      notes: notes.trim() || null,
      lineItems: lineItems
        .filter((item) => item.description.trim() && parseFloat(item.amount) > 0)
        .map((item) => ({
          description: item.description.trim(),
          amount: parseFloat(item.amount),
          categoryId: item.categoryId,
          vitalityQualifying: item.vitalityQualifying,
        })),
    }

    try {
      const url = transaction
        ? `/api/transactions/${transaction.id}`
        : '/api/transactions'
      const method = transaction ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/transactions')
          router.refresh()
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {transaction ? 'Edit Expense' : 'Add Expense'}
        </h1>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !merchant.trim() || lineItems.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : transaction ? 'Update' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => onCancel ? onCancel() : router.back()}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Transaction Details
            </h2>
            {!showNotes && (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add note
              </button>
            )}
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            Total: R{getGrandTotal().toFixed(2)}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Merchant / Store
            </label>
            <input
              ref={merchantInputRef}
              type="text"
              id="merchant"
              value={merchant}
              onChange={(e) => {
                setMerchant(e.target.value)
                setShowMerchantSuggestions(true)
                setSelectedMerchantIndex(-1)
              }}
              onBlur={() => setTimeout(() => setShowMerchantSuggestions(false), 200)}
              onKeyDown={(e) => {
                const suggestions = filteredMerchants.slice(0, 8)
                if (!showMerchantSuggestions || suggestions.length === 0) return

                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setSelectedMerchantIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                  )
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedMerchantIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                  )
                } else if (e.key === 'Enter' && selectedMerchantIndex >= 0) {
                  e.preventDefault()
                  selectMerchant(suggestions[selectedMerchantIndex])
                  setSelectedMerchantIndex(-1)
                } else if (e.key === 'Escape') {
                  setShowMerchantSuggestions(false)
                  setSelectedMerchantIndex(-1)
                }
              }}
              placeholder="e.g., Woolworths, Shell, Chemist"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 px-3 py-2 pr-9 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              autoComplete="off"
            />
            {merchant && (
              <button
                type="button"
                onClick={() => {
                  setMerchant('')
                  merchantInputRef.current?.focus()
                }}
                className="absolute right-3 top-[calc(50%+2px)] -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showMerchantSuggestions && filteredMerchants.length > 0 && !transaction && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredMerchants.slice(0, 8).map((name, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectMerchant(name)}
                    className={`w-full text-left px-3 py-2 ${
                      index === selectedMerchantIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-gray-900 dark:text-white">{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date
            </label>
            <div className="mt-1 flex gap-2">
              <input
                ref={dateInputRef}
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={() => dateInputRef.current?.showPicker()}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                required
              />
              <button
                type="button"
                onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}
                className={`px-3 py-2 text-sm rounded-md border transition-colors cursor-pointer ${
                  date === format(new Date(), 'yyyy-MM-dd')
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  setDate(format(yesterday, 'yyyy-MM-dd'))
                }}
                className={`px-3 py-2 text-sm rounded-md border transition-colors cursor-pointer ${
                  date === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Yesterday
              </button>
            </div>
          </div>
          {showNotes && (
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                {!notes.trim() && (
                  <button
                    type="button"
                    onClick={() => setShowNotes(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    Hide
                  </button>
                )}
              </div>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                autoFocus
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[60px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Line Items by Category */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Category icon buttons - always visible at top */}
        <div className="mb-4 relative">
          <div className="flex flex-wrap gap-2">
            {sortCategories(categories).map((category) => {
              const Icon = getCategoryIcon(category.name)
              const hasItems = getLineItemsForCategory(category.id).length > 0
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => addLineItem(category.id)}
                  onMouseMove={(e) => setTooltip({ name: category.name, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                  className="group cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all group-hover:opacity-100"
                    style={hasItems
                      ? { backgroundColor: category.color }
                      : undefined
                    }
                  >
                    <div
                      className={`absolute w-9 h-9 rounded-full transition-opacity ${
                        hasItems ? 'opacity-0' : 'opacity-0 group-hover:opacity-30'
                      }`}
                      style={{ backgroundColor: category.color }}
                    />
                    <Icon
                      className={`h-5 w-5 transition-colors relative z-10 ${
                        hasItems ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    />
                  </div>
                </button>
              )
            })}
          </div>
          {tooltip && (
            <div
              className="fixed z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none"
              style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
            >
              {tooltip.name}
            </div>
          )}
        </div>

        {/* Categories with items */}
        {categoriesWithItems.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            {categoriesWithItems.map((category) => (
              <CategoryAccordion
                key={category.id}
                category={category}
                lineItems={getLineItemsForCategory(category.id)}
                isExpanded={expandedCategories.has(category.id)}
                onToggle={() => toggleCategory(category.id)}
                onAddItem={() => addLineItem(category.id)}
                onUpdateItem={updateLineItem}
                onRemoveItem={removeLineItem}
                onDuplicateItem={duplicateLineItem}
                onToggleVitality={toggleVitality}
                onBlurVitality={checkVitalityOnBlur}
                total={getCategoryTotal(category.id)}
                lastAddedItemId={lastAddedItemId}
                showVitality={isVitalityMerchant}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !merchant.trim() || lineItems.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : transaction ? 'Update' : 'Save Transaction'}
        </button>
        <button
          type="button"
          onClick={() => onCancel ? onCancel() : router.back()}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface CategoryAccordionProps {
  category: Category
  lineItems: LineItemInput[]
  isExpanded: boolean
  onToggle: () => void
  onAddItem: () => void
  onUpdateItem: (id: string, field: 'description' | 'amount', value: string) => void
  onRemoveItem: (id: string) => void
  onDuplicateItem: (id: string) => void
  onToggleVitality: (id: string) => void
  onBlurVitality: (id: string) => void
  total: number
  lastAddedItemId: string | null
  showVitality: boolean
}

function CategoryAccordion({
  category,
  lineItems,
  isExpanded,
  onToggle,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
  onToggleVitality,
  onBlurVitality,
  total,
  lastAddedItemId,
  showVitality,
}: CategoryAccordionProps) {
  const Icon = getCategoryIcon(category.name)
  const descriptionRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (lastAddedItemId && descriptionRefs.current[lastAddedItemId]) {
      descriptionRefs.current[lastAddedItemId]?.focus()
    }
  }, [lastAddedItemId])

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onAddItem()
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: category.color }}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({lineItems.length} item{lineItems.length !== 1 ? 's' : ''})
          </span>
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">R{total.toFixed(2)}</span>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3 bg-white dark:bg-gray-800">
          {lineItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {showVitality && (
                <button
                  type="button"
                  onClick={() => onToggleVitality(item.id)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                    item.vitalityQualifying
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  style={item.vitalityQualifying ? { backgroundColor: '#EC1B5B' } : undefined}
                  title={item.vitalityQualifying ? 'Vitality qualifying (click to remove)' : 'Mark as Vitality qualifying'}
                >
                  V
                </button>
              )}
              <input
                type="text"
                ref={(el) => { descriptionRefs.current[item.id] = el }}
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                onBlur={() => onBlurVitality(item.id)}
                placeholder="Item description"
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  R
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.amount}
                  onChange={(e) => onUpdateItem(item.id, 'amount', e.target.value)}
                  onKeyDown={handleAmountKeyDown}
                  placeholder="0.00"
                  className="w-28 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 pl-7 pr-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => onDuplicateItem(item.id)}
                className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
                title="Duplicate item"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                title="Remove item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddItem}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </div>
      )}
    </div>
  )
}
