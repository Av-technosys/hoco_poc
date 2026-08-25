import { useState, useRef } from 'react'
import { SendHorizonal, ImagePlus, X } from "lucide-react"

export default function InputBar({ onSend, loading }) {
    const [text, setText] = useState('')
    const [image, setImage] = useState(null)
    const fileInputRef = useRef(null)

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImage(reader.result)
            }
            reader.readAsDataURL(file)
        }
        e.target.value = null // reset input
    }

    const removeImage = () => {
        setImage(null)
    }

    const handleSend = () => {
        if ((!text.trim() && !image) || loading) return
        onSend(text, image)
        setText('')
        setImage(null)
    }

    return (
        <div className="sticky bottom-0 bg-[#fdf7e7] border-t border-white/10 flex flex-col">
            {image && (
                <div className="px-4 pt-3 pb-1 flex relative">
                    <div className="relative inline-block">
                        <img src={image} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-gray-300 shadow-sm" />
                        <button 
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}
            <div className="px-4 py-3 flex items-center gap-3">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="text-gray-500 hover:text-[#2d2b7e] transition disabled:opacity-40"
                >
                    <ImagePlus size={24} />
                </button>
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
                    disabled={loading || (!text.trim() && !image)}
                    className="w-11 h-11 rounded-3xl bg-[#2d2b7e] hover:bg-[#4f4d9f] flex-shrink-0 text-white flex items-center justify-center transition disabled:opacity-40"
                >
                    {loading ? '⏳' : <SendHorizonal size={20} />}
                </button>
            </div>
        </div>
    )
}