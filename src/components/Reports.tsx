'use client'

import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'

interface Category {
  id: string
  name: string
  color: string
}

interface CategoryBreakdown {
  category: Category
  total: number
}

interface DailySpending {
  date: string
  amount: number
}

interface Stats {
  totalSpending: number
  categoryBreakdown: CategoryBreakdown[]
  transactionCount: number
  dailySpending: DailySpending[]
}

interface Props {
  categories: Category[]
}

type Period = 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'custom'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount)
}

export function Reports({ categories }: Props) {
  const [period, setPeriod] = useState<Period>('this-month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const getDateRange = () => {
    const now = new Date()
    switch (period) {
      case 'this-month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        }
      case 'last-month':
        const lastMonth = subMonths(now, 1)
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        }
      case 'last-3-months':
        return {
          start: startOfMonth(subMonths(now, 2)),
          end: endOfMonth(now),
        }
      case 'this-year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
        }
      case 'custom':
        return {
          start: customStart ? new Date(customStart) : startOfMonth(now),
          end: customEnd ? new Date(customEnd) : endOfMonth(now),
        }
    }
  }

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const { start, end } = getDateRange()
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })

      try {
        const res = await fetch(`/api/stats?${params}`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } finally {
        setLoading(false)
      }
    }

    if (period !== 'custom' || (customStart && customEnd)) {
      fetchStats()
    }
  }, [period, customStart, customEnd])

  const getPeriodLabel = () => {
    const { start, end } = getDateRange()
    if (period === 'this-month' || period === 'last-month') {
      return format(start, 'MMMM yyyy')
    }
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {[
              { value: 'this-month', label: 'This Month' },
              { value: 'last-month', label: 'Last Month' },
              { value: 'last-3-months', label: 'Last 3 Months' },
              { value: 'this-year', label: 'This Year' },
              { value: 'custom', label: 'Custom' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value as Period)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  period === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                ref={startDateRef}
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                onClick={() => startDateRef.current?.showPicker()}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm cursor-pointer"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                ref={endDateRef}
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                onClick={() => endDateRef.current?.showPicker()}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm cursor-pointer"
              />
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{getPeriodLabel()}</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : stats ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spending</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalSpending)}
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.transactionCount}
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg per Transaction</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.transactionCount > 0
                  ? formatCurrency(stats.totalSpending / stats.transactionCount)
                  : '$0.00'}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Spending Over Time */}
            <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Spending Over Time
              </h2>
              {stats.dailySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailySpending}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'd MMM')}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(date) => format(new Date(String(date)), 'PPP')}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-gray-400 dark:text-gray-500">
                  No data for this period
                </div>
              )}
            </div>

            {/* Category Pie Chart */}
            <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                By Category
              </h2>
              {stats.categoryBreakdown.length > 0 ? (
                <div className="flex">
                  <ResponsiveContainer width="50%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        dataKey="total"
                        nameKey="category.name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={index} fill={entry.category.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
                    {stats.categoryBreakdown.map((item) => (
                      <div key={item.category.id} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.category.color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 truncate">
                          {item.category.name}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-gray-400 dark:text-gray-500">
                  No data for this period
                </div>
              )}
            </div>
          </div>

          {/* Category Bar Chart */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Category Comparison
            </h2>
            {stats.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={stats.categoryBreakdown}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="category.name"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {stats.categoryBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.category.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[400px] items-center justify-center text-gray-400 dark:text-gray-500">
                No data for this period
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Unable to load report data</p>
        </div>
      )}
    </div>
  )
}
