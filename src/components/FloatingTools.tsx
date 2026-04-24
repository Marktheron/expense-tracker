'use client'

import { useState } from 'react'
import { Wrench, Calculator, StickyNote, ShoppingCart, ArrowRightLeft, Zap, X, Minus } from 'lucide-react'

// Import the modal components (we'll render them conditionally)
import dynamic from 'next/dynamic'

const CalculatorModal = dynamic(() => import('./Calculator').then(mod => ({ default: mod.CalculatorModal })), { ssr: false })
const NotepadModal = dynamic(() => import('./Notepad').then(mod => ({ default: mod.NotepadModal })), { ssr: false })
const ShoppingListModal = dynamic(() => import('./ShoppingList').then(mod => ({ default: mod.ShoppingListModal })), { ssr: false })
const CurrencyConverterModal = dynamic(() => import('./CurrencyConverter').then(mod => ({ default: mod.CurrencyConverterModal })), { ssr: false })
const QuickExpenseModal = dynamic(() => import('./QuickExpense').then(mod => ({ default: mod.QuickExpenseModal })), { ssr: false })

interface Tool {
  id: string
  icon: React.ReactNode
  color: string
  title: string
}

const tools: Tool[] = [
  { id: 'quick', icon: <Zap className="h-5 w-5" />, color: 'bg-purple-600 hover:bg-purple-500', title: 'Quick Expense' },
  { id: 'currency', icon: <ArrowRightLeft className="h-5 w-5" />, color: 'bg-blue-600 hover:bg-blue-500', title: 'Currency Converter' },
  { id: 'shopping', icon: <ShoppingCart className="h-5 w-5" />, color: 'bg-green-600 hover:bg-green-500', title: 'Shopping List' },
  { id: 'notepad', icon: <StickyNote className="h-5 w-5" />, color: 'bg-amber-500 hover:bg-amber-400', title: 'Notepad' },
  { id: 'calc', icon: <Calculator className="h-5 w-5" />, color: 'bg-gray-700 hover:bg-gray-600', title: 'Calculator' },
]

export function FloatingTools() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [openTools, setOpenTools] = useState<Set<string>>(new Set())

  const openTool = (toolId: string) => {
    setOpenTools(prev => new Set(prev).add(toolId))
  }

  const closeTool = (toolId: string) => {
    setOpenTools(prev => {
      const next = new Set(prev)
      next.delete(toolId)
      return next
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div
        className="fixed bottom-4 right-4 z-40 flex flex-col-reverse items-end gap-2"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Main toggle button */}
        <button
          className="h-10 w-10 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition-all flex items-center justify-center"
          title="Tools"
        >
          <Wrench className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        {/* Tool buttons */}
        {tools.map((tool, index) => (
          <button
            key={tool.id}
            onClick={() => openTool(tool.id)}
            className={`h-10 w-10 rounded-full text-white shadow-lg transition-all flex items-center justify-center ${tool.color}`}
            style={{
              opacity: isExpanded ? 1 : 0,
              transform: isExpanded ? 'translateX(0)' : 'translateX(20px)',
              transitionDelay: isExpanded ? `${index * 50}ms` : `${(tools.length - index - 1) * 30}ms`,
              transitionDuration: '200ms',
              pointerEvents: isExpanded ? 'auto' : 'none',
            }}
            title={tool.title}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Tool modals */}
      {openTools.has('calc') && <CalculatorModal onClose={() => closeTool('calc')} />}
      {openTools.has('notepad') && <NotepadModal onClose={() => closeTool('notepad')} />}
      {openTools.has('shopping') && <ShoppingListModal onClose={() => closeTool('shopping')} />}
      {openTools.has('currency') && <CurrencyConverterModal onClose={() => closeTool('currency')} />}
      {openTools.has('quick') && <QuickExpenseModal onClose={() => closeTool('quick')} />}
    </>
  )
}
