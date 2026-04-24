'use client'

import { useState, useRef, useEffect } from 'react'
import { Calculator as CalcIcon, X, Minus } from 'lucide-react'

export function CalculatorButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full bg-gray-700 text-white shadow-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
        title="Calculator"
      >
        <CalcIcon className="h-5 w-5" />
      </button>
      {isOpen && <CalculatorModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

export function CalculatorModal({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 280, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

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

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
    } else if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const result = calculate(previousValue, inputValue, operation)
      setDisplay(String(result))
      setPreviousValue(result)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return b !== 0 ? a / b : 0
      default: return b
    }
  }

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const inputValue = parseFloat(display)
      const result = calculate(previousValue, inputValue, operation)
      setDisplay(String(result))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(true)
    }
  }

  const handlePercentage = () => {
    const value = parseFloat(display)
    setDisplay(String(value / 100))
  }

  const handlePlusMinus = () => {
    const value = parseFloat(display)
    setDisplay(String(value * -1))
  }

  const Button = ({
    children,
    onClick,
    className = ''
  }: {
    children: React.ReactNode
    onClick: () => void
    className?: string
  }) => (
    <button
      onClick={onClick}
      className={`h-12 rounded-lg font-medium text-lg transition-colors ${className}`}
    >
      {children}
    </button>
  )

  if (isMinimized) {
    return (
      <div
        ref={modalRef}
        className="fixed z-50 bg-gray-800 rounded-lg shadow-2xl select-none"
        style={{ left: position.x, top: position.y }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 text-white">
            <CalcIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Calculator</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
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
      className="fixed z-50 w-64 bg-gray-800 rounded-xl shadow-2xl select-none"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header - draggable */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-move border-b border-gray-700"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-white">
          <CalcIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Calculator</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Display */}
      <div className="px-4 py-3">
        <div className="text-right text-3xl font-light text-white truncate">
          {display}
        </div>
        {operation && previousValue !== null && (
          <div className="text-right text-sm text-gray-500">
            {previousValue} {operation}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1 p-2">
        <Button onClick={clear} className="bg-gray-600 text-white hover:bg-gray-500">
          C
        </Button>
        <Button onClick={handlePlusMinus} className="bg-gray-600 text-white hover:bg-gray-500">
          +/-
        </Button>
        <Button onClick={handlePercentage} className="bg-gray-600 text-white hover:bg-gray-500">
          %
        </Button>
        <Button onClick={() => performOperation('/')} className="bg-orange-500 text-white hover:bg-orange-400">
          ÷
        </Button>

        <Button onClick={() => inputDigit('7')} className="bg-gray-700 text-white hover:bg-gray-600">
          7
        </Button>
        <Button onClick={() => inputDigit('8')} className="bg-gray-700 text-white hover:bg-gray-600">
          8
        </Button>
        <Button onClick={() => inputDigit('9')} className="bg-gray-700 text-white hover:bg-gray-600">
          9
        </Button>
        <Button onClick={() => performOperation('*')} className="bg-orange-500 text-white hover:bg-orange-400">
          ×
        </Button>

        <Button onClick={() => inputDigit('4')} className="bg-gray-700 text-white hover:bg-gray-600">
          4
        </Button>
        <Button onClick={() => inputDigit('5')} className="bg-gray-700 text-white hover:bg-gray-600">
          5
        </Button>
        <Button onClick={() => inputDigit('6')} className="bg-gray-700 text-white hover:bg-gray-600">
          6
        </Button>
        <Button onClick={() => performOperation('-')} className="bg-orange-500 text-white hover:bg-orange-400">
          −
        </Button>

        <Button onClick={() => inputDigit('1')} className="bg-gray-700 text-white hover:bg-gray-600">
          1
        </Button>
        <Button onClick={() => inputDigit('2')} className="bg-gray-700 text-white hover:bg-gray-600">
          2
        </Button>
        <Button onClick={() => inputDigit('3')} className="bg-gray-700 text-white hover:bg-gray-600">
          3
        </Button>
        <Button onClick={() => performOperation('+')} className="bg-orange-500 text-white hover:bg-orange-400">
          +
        </Button>

        <Button onClick={() => inputDigit('0')} className="col-span-2 bg-gray-700 text-white hover:bg-gray-600">
          0
        </Button>
        <Button onClick={inputDecimal} className="bg-gray-700 text-white hover:bg-gray-600">
          .
        </Button>
        <Button onClick={handleEquals} className="bg-orange-500 text-white hover:bg-orange-400">
          =
        </Button>
      </div>
    </div>
  )
}
