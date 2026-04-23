'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Search, Filter, ChevronDown, ChevronRight, Trash2, Edit, PlusCircle, StickyNote, X, Download, Store } from 'lucide-react'
import { useToast } from './Toast'

interface Category {
  id: string
  name: string
  color: string
}

interface LineItem {
  id: string
  description: string
  amount: number
  category: Category
}

interface Transaction {
  id: string
  date: string
  merchant: string
  notes: string | null
  lineItems: LineItem[]
}

interface Props {
  initialTransactions: Transaction[]
  categories: Category[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount)
}

export function TransactionList({ initialTransactions, categories }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedMerchant, setSelectedMerchant] = useState<string>('')
  const [expandedTx, setExpandedTx] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Get unique merchants sorted alphabetically
  const merchants = [...new Set(transactions.map((tx) => tx.merchant))].sort()

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      !searchQuery ||
      tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.lineItems.some((li) =>
        li.description.toLowerCase().includes(searchQuery.toLowerCase())
      )

    const matchesCategory =
      !selectedCategory ||
      tx.lineItems.some((li) => li.category.id === selectedCategory)

    const matchesMerchant =
      !selectedMerchant ||
      tx.merchant === selectedMerchant

    return matchesSearch && matchesCategory && matchesMerchant
  })

  const toggleExpand = (id: string) => {
    setExpandedTx((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getTransactionTotal = (tx: Transaction) =>
    tx.lineItems.reduce((sum, item) => sum + item.amount, 0)

  // Calculate category total when filtering
  const getCategoryTotal = () => {
    if (!selectedCategory) return 0
    return filteredTransactions.reduce((sum, tx) => {
      const categoryItems = tx.lineItems.filter((li) => li.category.id === selectedCategory)
      return sum + categoryItems.reduce((itemSum, item) => itemSum + item.amount, 0)
    }, 0)
  }

  // Calculate merchant total when filtering
  const getMerchantTotal = () => {
    if (!selectedMerchant) return 0
    return filteredTransactions.reduce((sum, tx) => {
      return sum + tx.lineItems.reduce((itemSum, item) => itemSum + item.amount, 0)
    }, 0)
  }

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name
    : null

  // Get matching line items when searching
  const getMatchingItems = () => {
    if (!searchQuery.trim()) return []

    const matches: { description: string; amount: number; category: Category }[] = []

    for (const tx of transactions) {
      for (const li of tx.lineItems) {
        if (li.description.toLowerCase().includes(searchQuery.toLowerCase())) {
          matches.push({
            description: li.description,
            amount: li.amount,
            category: li.category,
          })
        }
      }
    }

    // Group by normalized description
    const grouped: Record<string, { description: string; count: number; total: number; category: Category }> = {}
    for (const item of matches) {
      const key = item.description.toLowerCase().trim()
      if (!grouped[key]) {
        grouped[key] = {
          description: item.description,
          count: 0,
          total: 0,
          category: item.category,
        }
      }
      grouped[key].count++
      grouped[key].total += item.amount
    }

    return Object.values(grouped).sort((a, b) => b.total - a.total)
  }

  const matchingItems = getMatchingItems()

  const handleDelete = async (id: string) => {
    // Find the transaction to store for potential undo
    const txToDelete = transactions.find((tx) => tx.id === id)
    if (!txToDelete) return

    // Remove from UI immediately
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))

    // Delete from database immediately
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })

    // Show toast with undo option
    showToast('Transaction deleted', {
      label: 'Undo',
      onClick: async () => {
        // Re-create the transaction
        const payload = {
          date: txToDelete.date,
          merchant: txToDelete.merchant,
          notes: txToDelete.notes,
          lineItems: txToDelete.lineItems.map((li) => ({
            description: li.description,
            amount: li.amount,
            categoryId: li.category.id,
          })),
        }
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const newTx = await res.json()
          // Add back to UI with the new ID
          setTransactions((prev) => [...prev, {
            ...txToDelete,
            id: newTx.id,
          }].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        }
      },
    })
  }

  // Group items by category for display
  const groupByCategory = (lineItems: LineItem[]) => {
    const grouped: Record<string, { category: Category; items: LineItem[]; total: number }> = {}
    for (const item of lineItems) {
      if (!grouped[item.category.id]) {
        grouped[item.category.id] = {
          category: item.category,
          items: [],
          total: 0,
        }
      }
      grouped[item.category.id].items.push(item)
      grouped[item.category.id].total += item.amount
    }
    return Object.values(grouped).sort((a, b) => b.total - a.total)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-10 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-8 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedMerchant}
              onChange={(e) => setSelectedMerchant(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-8 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Merchants</option>
              {merchants.map((merchant) => (
                <option key={merchant} value={merchant}>
                  {merchant}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </a>
          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add Expense
          </Link>
        </div>
      </div>

      {/* Product search summary */}
      {searchQuery && matchingItems.length > 0 && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4">
          <h3 className="text-sm text-blue-600 dark:text-blue-400 mb-3">
            Items matching "{searchQuery}"
          </h3>
          <div className="space-y-2">
            {matchingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.category.color }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">{item.description}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({item.count})
                  </span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
          </div>
          {matchingItems.length > 1 && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 flex justify-between font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(matchingItems.reduce((sum, item) => sum + item.total, 0))}</span>
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {filteredTransactions.length > 0 && (
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredTransactions.map((tx) => {
            const isExpanded = expandedTx.has(tx.id)

            // Filter line items when searching
            const displayLineItems = searchQuery
              ? tx.lineItems.filter((li) =>
                  li.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : tx.lineItems

            const total = searchQuery
              ? displayLineItems.reduce((sum, item) => sum + item.amount, 0)
              : getTransactionTotal(tx)

            const categoryGroups = groupByCategory(displayLineItems)

            return (
              <div key={tx.id}>
                <div
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleExpand(tx.id)}
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    )}
                    <div className="flex -space-x-1">
                      {categoryGroups.slice(0, 3).map((group) => (
                        <div
                          key={group.category.id}
                          className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: group.category.color }}
                          title={group.category.name}
                        >
                          {group.items.length}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        {tx.merchant}
                        {tx.notes && (
                          <StickyNote className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" title={tx.notes} />
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(tx.date), 'PPP')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(total)}
                    </span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/transactions/${tx.id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={isDeleting === tx.id}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pl-14 space-y-3">
                    {categoryGroups.map((group) => (
                      <div key={group.category.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: group.category.color }}
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {group.category.name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({formatCurrency(group.total)})
                          </span>
                        </div>
                        <div className="ml-5 space-y-1">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">{item.description}</span>
                              <span className="text-gray-900 dark:text-white">
                                {formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <Link
                        href={`/transactions/${tx.id}/edit`}
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit transaction
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Filter totals */}
      {(selectedCategory || selectedMerchant) && filteredTransactions.length > 0 && (
        <div className="mt-4 rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">
            Total for{' '}
            {selectedMerchant && (
              <span className="font-medium text-gray-900 dark:text-white">{selectedMerchant}</span>
            )}
            {selectedMerchant && selectedCategory && ' / '}
            {selectedCategory && (
              <span className="font-medium text-gray-900 dark:text-white">{selectedCategoryName}</span>
            )}
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(selectedCategory ? getCategoryTotal() : getMerchantTotal())}
          </span>
        </div>
      )}

      {filteredTransactions.length === 0 && (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCategory || selectedMerchant
              ? 'No transactions match your filters.'
              : 'No transactions yet.'}
          </p>
          <Link
            href="/transactions/new"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <PlusCircle className="h-4 w-4" />
            Add your first expense
          </Link>
        </div>
      )}
    </div>
  )
}
