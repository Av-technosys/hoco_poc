import { useState } from 'react'
import { SendHorizonal } from "lucide-react"

export default function InputBar({ onSend, loading }) {
    const [text, setText] = useState('')

    const handleSend = () => {
        if (!text.trim() || loading) return
        onSend(text)
        setText('')
    }

    return (
        <div className="px-4 py-3 sticky bottom-0 bg-[#fdf7e7] border-t border-white/10 flex items-center gap-3">
            <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your order or question..."
                className="flex-1 bg-white shadow border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 text-sm placeholder-gray-500 outline-none focus:border-hocco-pink transition"
            />
            <button
                onClick={handleSend}
                disabled={loading || !text.trim()}
                className="w-11 h-11 rounded-3xl bg-[#2d2b7e] hover:bg-[#4f4d9f] text-white flex items-center justify-center transition disabled:opacity-40"
            >
                {loading ? '⏳' : <SendHorizonal size={20} />}
            </button>
        </div>
    )
}