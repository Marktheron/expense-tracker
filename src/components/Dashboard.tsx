'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { PlusCircle, TrendingUp, TrendingDown, Receipt, Wallet, StickyNote, ShoppingCart, Activity } from 'lucide-react'
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
} from 'recharts'

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

interface CategoryBreakdown {
  category: Category
  total: number
}

interface DailySpending {
  date: string
  amount: number
}

interface TopProduct {
  description: string
  count: number
  total: number
  category: Category
}

interface CategoryChange {
  category: Category
  thisMonth: number
  lastMonth: number
}

interface MonthComparison {
  thisMonth: number
  lastMonth: number
  lastMonthName: string
  categoryChanges: CategoryChange[]
}

interface SpendingPace {
  thisMonth: number
  lastMonthSamePoint: number
  dayOfMonth: number
}

interface Stats {
  totalSpending: number
  categoryBreakdown: CategoryBreakdown[]
  transactionCount: number
  lineItemsCount: number
  dailySpending: DailySpending[]
  recentTransactions: Transaction[]
  currentMonth: string
  topProducts: TopProduct[]
  monthComparison: MonthComparison
  spendingPace: SpendingPace
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount)
}

export function Dashboard({ stats }: { stats: Stats }) {
  const getTransactionTotal = (tx: Transaction) =>
    tx.lineItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">{stats.currentMonth}</p>
        </div>
        <Link
          href="/transactions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Add Expense
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalSpending)}
              </p>
              {stats.monthComparison.lastMonth > 0 && (
                <p className={`text-xs flex items-center gap-1 mt-1 ${
                  stats.monthComparison.thisMonth > stats.monthComparison.lastMonth
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}>
                  {stats.monthComparison.thisMonth > stats.monthComparison.lastMonth ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatCurrency(Math.abs(stats.monthComparison.thisMonth - stats.monthComparison.lastMonth))}
                  {' '}vs {stats.monthComparison.lastMonthName}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
              <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Line Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.lineItemsCount}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
              <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Spending Pace</p>
              {stats.spendingPace.lastMonthSamePoint > 0 ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.spendingPace.thisMonth > stats.spendingPace.lastMonthSamePoint ? 'Ahead' : 'Behind'}
                  </p>
                  <p className={`text-xs flex items-center gap-1 mt-1 ${
                    stats.spendingPace.thisMonth > stats.spendingPace.lastMonthSamePoint
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {stats.spendingPace.thisMonth > stats.spendingPace.lastMonthSamePoint ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatCurrency(Math.abs(stats.spendingPace.thisMonth - stats.spendingPace.lastMonthSamePoint))}
                    {' '}by day {stats.spendingPace.dayOfMonth}
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">—</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Spending Chart */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Spending
          </h2>
          {stats.dailySpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.dailySpending}>
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
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-gray-400 dark:text-gray-500">
              No spending data this month
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            By Category
          </h2>
          {stats.categoryBreakdown.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.categoryBreakdown}
                    dataKey="total"
                    nameKey="category.name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                  >
                    {stats.categoryBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.category.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.categoryBreakdown.slice(0, 5).map((item) => (
                  <div key={item.category.id} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.category.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
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
            <div className="flex h-[200px] items-center justify-center text-gray-400 dark:text-gray-500">
              No spending data this month
            </div>
          )}
        </div>
      </div>

      {/* Bottom 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Comparison */}
        {stats.monthComparison.categoryChanges.length > 0 && (
          <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                vs {stats.monthComparison.lastMonthName}
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {stats.monthComparison.categoryChanges
                .sort((a, b) => (b.thisMonth - b.lastMonth) - (a.thisMonth - a.lastMonth))
                .slice(0, 5)
                .map((item) => {
                  const diff = item.thisMonth - item.lastMonth
                  const isUp = diff > 0
                  return (
                    <div
                      key={item.category.id}
                      className="flex items-center justify-between px-4 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.category.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{item.category.name}</span>
                      </div>
                      <span className={`text-sm font-medium flex items-center gap-1 ${
                        isUp ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isUp ? '+' : ''}{formatCurrency(diff)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Top Products */}
        {stats.topProducts.length > 0 && (
          <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Products
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {stats.topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 dark:text-gray-500 w-4">{index + 1}.</span>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: product.category.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[120px]">{product.description}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    {formatCurrency(product.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent
            </h2>
            <Link
              href="/transactions"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          {stats.recentTransactions.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recentTransactions.slice(0, 5).map((tx) => (
                <li key={tx.id}>
                  <Link
                    href={`/transactions/${tx.id}`}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1">
                        {[...new Set(tx.lineItems.map((li) => li.category.color))]
                          .slice(0, 2)
                          .map((color, i) => (
                            <div
                              key={i}
                              className="h-6 w-6 rounded-full border-2 border-white dark:border-gray-800"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-1">
                          {tx.merchant}
                          {tx.notes && (
                            <StickyNote className="h-3 w-3 text-gray-400 dark:text-gray-500" title={tx.notes} />
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(tx.date), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {formatCurrency(getTransactionTotal(tx))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400 dark:text-gray-500">
              No transactions yet.{' '}
              <Link href="/transactions/new" className="ml-1 text-blue-600 dark:text-blue-400">
                Add one
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
