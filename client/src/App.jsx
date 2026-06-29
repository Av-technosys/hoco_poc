import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'

export default function App() {
  const [mobile, setMobile] = useState(null)

  return mobile
    ? <ChatPage mobile={mobile} />
    : <LoginPage onLogin={setMobile} />
}