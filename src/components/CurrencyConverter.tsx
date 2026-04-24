'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowRightLeft, X, Minus, RefreshCw } from 'lucide-react'

const CURRENCIES = [
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
]

// Fallback rates (ZAR base) - will be updated from API
const FALLBACK_RATES: Record<string, number> = {
  ZAR: 1,
  USD: 0.055,
  EUR: 0.050,
  GBP: 0.043,
  AUD: 0.083,
  CAD: 0.074,
  CHF: 0.048,
  JPY: 8.2,
  CNY: 0.40,
  INR: 4.6,
}

export function CurrencyConverterButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[10.5rem] right-6 z-40 h-10 w-10 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-colors flex items-center justify-center"
        title="Currency Converter"
      >
        <ArrowRightLeft className="h-5 w-5" />
      </button>
      {isOpen && <CurrencyConverterModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

export function CurrencyConverterModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('1')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('ZAR')
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

  const fetchRates = async () => {
    setIsLoading(true)
    try {
      // Using exchangerate-api.com free tier (no API key needed for basic usage)
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/ZAR')
      if (res.ok) {
        const data = await res.json()
        setRates(data.rates)
        setLastUpdated(new Date().toLocaleTimeString())
        localStorage.setItem('currency-rates', JSON.stringify({ rates: data.rates, time: Date.now() }))
      }
    } catch (error) {
      // Use cached rates if available
      const cached = localStorage.getItem('currency-rates')
      if (cached) {
        const { rates: cachedRates } = JSON.parse(cached)
        setRates(cachedRates)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Load cached rates or fetch new ones
    const cached = localStorage.getItem('currency-rates')
    if (cached) {
      const { rates: cachedRates, time } = JSON.parse(cached)
      setRates(cachedRates)
      // Refresh if older than 1 hour
      if (Date.now() - time > 3600000) {
        fetchRates()
      }
    } else {
      fetchRates()
    }
  }, [])

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

  const convert = () => {
    const amountNum = parseFloat(amount) || 0
    if (fromCurrency === toCurrency) return amountNum

    // Convert through ZAR as base
    const inZAR = fromCurrency === 'ZAR' ? amountNum : amountNum / rates[fromCurrency]
    const result = toCurrency === 'ZAR' ? inZAR : inZAR * rates[toCurrency]
    return result
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const result = convert()
  const fromSymbol = CURRENCIES.find(c => c.code === fromCurrency)?.symbol || ''
  const toSymbol = CURRENCIES.find(c => c.code === toCurrency)?.symbol || ''

  if (isMinimized) {
    return (
      <div
        ref={modalRef}
        className="fixed z-50 bg-blue-600 rounded-lg shadow-2xl select-none"
        style={{ left: position.x, top: position.y }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 text-white">
            <ArrowRightLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Currency</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-blue-100 hover:text-white transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-blue-100 hover:text-white transition-colors"
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
        className="flex items-center justify-between px-4 py-2 cursor-move bg-blue-600 rounded-t-xl"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-white">
          <ArrowRightLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Currency Converter</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={fetchRates}
            disabled={isLoading}
            className="p-1 text-blue-100 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh rates"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-blue-100 hover:text-white transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-blue-100 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Amount input */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 text-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* From currency */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4 text-gray-600 dark:text-gray-300 rotate-90" />
          </button>
        </div>

        {/* To currency */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Result */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Result</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {toSymbol}{result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {fromSymbol}{parseFloat(amount || '0').toLocaleString()} {fromCurrency} = {toSymbol}{result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
        {lastUpdated ? `Rates updated: ${lastUpdated}` : 'Using cached rates'}
      </div>
    </div>
  )
}
