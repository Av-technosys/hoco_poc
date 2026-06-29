import { useState, useEffect, useRef } from 'react'
import ChatBubble from '../components/ChatBubble'
import InputBar from '../components/InputBar'

export default function ChatPage({ mobile }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Namaste! 🙏 Main hoon Rahul, aapka Hocco Ice Cream sales agent. Aaj kya order karna chahenge? 😊`,
        }
    ])
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return

        const userMsg = { role: 'user', content: text }
        setMessages(prev => [...prev, userMsg])
        setLoading(true)

        // Placeholder for streaming response
        setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, message: text }),
            })

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop()

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const json = JSON.parse(line.replace('data: ', ''))

                    if (json.text) {
                        setMessages(prev => {
                            const updated = [...prev]
                            updated[updated.length - 1] = {
                                role: 'assistant',
                                content: updated[updated.length - 1].content + json.text,
                                streaming: true,
                            }
                            return updated
                        })
                    }

                    if (json.done) {
                        setMessages(prev => {
                            const updated = [...prev]
                            updated[updated.length - 1] = {
                                ...updated[updated.length - 1],
                                streaming: false,
                            }
                            return updated
                        })
                    }
                }
            }
        } catch (err) {
            setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: 'Oops! Kuch problem aa gayi. Dobara try karein. 🙏',
                    streaming: false,
                }
                return updated
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen max-w-md mx-auto border-4 border-y-2 bg-hocco-dark flex flex-col">

            {/* Header */}
            <div className="sticky top-0 bg-[#fdf7e7] border-b px-4 py-3 flex items-center gap-3">
                <img src="./hocco-logo.png" className=" size-10" />
                <div>
                    <p className="text-gray-900 font-semibold text-sm">Hocco Sales Agent</p>
                    <p className="text-green-400 text-xs font-semibold">24 * 7 Available</p>
                </div>
                {/* <div className="ml-auto text-gray-900 text-xs">+91 {mobile}</div> */}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg, i) => (
                    <ChatBubble key={i} message={msg} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <InputBar onSend={sendMessage} loading={loading} />
        </div>
    )
}