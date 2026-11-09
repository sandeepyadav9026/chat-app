import React ,{ useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import {Toaster} from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'
import CallModal from './components/CallModal.jsx'


function App() {
  const {authUser, isCheckingAuth} = useContext(AuthContext);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-300 backdrop-blur-xl">
          Checking your session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute right-[-5%] top-[10%] h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[20%] h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#0f1b2d",
            color: "#f8fafc",
            border: "1px solid rgba(148, 163, 184, 0.18)",
          },
        }}
      />

      <Routes>
        <Route path='/' element={authUser ? <HomePage />: <Navigate to="/login" />} />
        {/* <Route path='/signup' element={<SignUpPage />} /> */}
        <Route path='/login' element={<LoginPage />} />
        <Route path='/profile' element={authUser ? <ProfilePage />: <Navigate to="/login"/>} />

      </Routes>
      <CallModal />
    </div>
  )
}

export default App
