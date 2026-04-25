'use client'

import { useState } from 'react'
import { Wrench, Calculator, StickyNote, ShoppingCart, ArrowRightLeft, Zap } from 'lucide-react'

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

interface Props {
  onOpenTool: (toolId: string) => void
}

export function FloatingToolbar({ onOpenTool }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-2"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Main toggle button */}
      <button
        className="h-12 w-12 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition-all flex items-center justify-center"
        title="Tools"
      >
        <Wrench className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Tool buttons */}
      {tools.map((tool, index) => (
        <button
          key={tool.id}
          onClick={() => onOpenTool(tool.id)}
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
  )
}
