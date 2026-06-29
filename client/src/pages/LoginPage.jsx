import { useState } from 'react'
import axios from 'axios'

export default function LoginPage({ onLogin }) {
    const [number, setNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleStart = async () => {
        if (number.length < 10) {
            setError('Please enter a valid 10-digit mobile number')
            return
        }
        setLoading(true)
        setError('')
        try {
            await axios.post('http://localhost:5000/api/session/start', { mobile: number })
            onLogin(number)
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">

                {/* Logo / Brand */}
                {/* <div className="text-center mb-10">
                    <img src="./hocco-logo.png" className="mt-1.5 size-20 mx-auto mb-4" />
                    <h1 className="text-6xl font-bold text-[#2d2b7e]">Hocco</h1>
                    <p className="text-gray-400 mt-2">Dealer Sales Portal</p>
                </div> */}
                <img src="./hocco-logo-full-blue.png" className=' h-20 mb-8 mx-auto w-auto' />
                {/* Card */}
                <div className="bg-[#d9effd] backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/20">
                    <h2 style={{
                        fontFamily: "Poetsen One"
                    }} className="text-black text-xl  mb-1">Welcome, Dealer! 👋</h2>
                    <p className="text-gray-700 text-sm mb-6">Enter your mobile number to chat with our sales agent</p>

                    <label className="text-gray-500 font-semibold text-sm mb-1 block">Mobile Number</label>
                    <div className="flex items-center bg-white border border-white/20 rounded-xl px-4 py-3 mb-4 focus-within:border-hocco-pink transition">
                        <span className="text-gray-400 mr-2 text-sm">+91</span>
                        <input
                            type="tel"
                            maxLength={10}
                            value={number}
                            onChange={e => setNumber(e.target.value.replace(/\D/, ''))}
                            onKeyDown={e => e.key === 'Enter' && handleStart()}
                            placeholder="98XXXXXXXX"
                            className=" text-black outline-none flex-1 text-sm placeholder-gray-500"
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="w-full bg-hocco-pink hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                    >
                        {loading ? 'Connecting...' : 'Start Chatting 💬'}
                    </button>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">Powered by <a target='_blank' href='https://www.avolvelabs.com/'><span className=' underline'>Avolve Labs</span></a> </p>
            </div>
        </div>
    )
}