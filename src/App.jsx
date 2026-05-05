import { useState } from 'react'

import Register from './pages/Register'
import Login from "./pages/Login";
import Chat from "./pages/Chat";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Register />
      <Login />
      <Chat />
    </>
  )
}

export default App
