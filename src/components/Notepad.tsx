'use client'

import { useState, useRef, useEffect } from 'react'
import { StickyNote, X, Minus } from 'lucide-react'

export function NotepadButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[4.5rem] right-6 z-40 h-10 w-10 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-400 transition-colors flex items-center justify-center"
        title="Notepad"
      >
        <StickyNote className="h-5 w-5" />
      </button>
      {isOpen && <NotepadModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

export function NotepadModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notepad-text') || ''
    }
    return ''
  })
  const [isMinimized, setIsMinimized] = useState(false)

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 360, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('notepad-text', text)
  }, [text])

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

  const clearNotes = () => {
    setText('')
  }

  if (isMinimized) {
    return (
      <div
        ref={modalRef}
        className="fixed z-50 bg-amber-500 rounded-lg shadow-2xl select-none"
        style={{ left: position.x, top: position.y }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 text-white">
            <StickyNote className="h-4 w-4" />
            <span className="text-sm font-medium">Notepad</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-amber-100 hover:text-white transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-amber-100 hover:text-white transition-colors"
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
      className="fixed z-50 w-72 bg-amber-50 dark:bg-gray-800 rounded-xl shadow-2xl select-none border border-amber-200 dark:border-gray-700"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header - draggable */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-move bg-amber-500 rounded-t-xl"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-white">
          <StickyNote className="h-4 w-4" />
          <span className="text-sm font-medium">Notepad</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-amber-100 hover:text-white transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-amber-100 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div className="p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type notes here..."
          className="w-full h-48 p-2 text-sm bg-transparent dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 resize-none focus:outline-none rounded-lg border border-amber-200 dark:border-gray-600"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-amber-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <span>{text.length} chars</span>
        <button
          onClick={clearNotes}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
