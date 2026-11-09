import React, { useState , useContext}from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'
import { getUserDisplayName } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const [currState, setCurrState] = useState("Sign up")
  const [fullname, setFullname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  
  const {login, authUser, logout} = useContext(AuthContext);
  const navigate = useNavigate();


  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if(currState === "Sign up" && !isDataSubmitted ) {
      setIsDataSubmitted(true)
      return;
    } 
    const success = await login(currState==="Sign up" ? 'signup' : 'login', {fullname,email,password,bio});
    if (success) navigate('/');
  }
     
  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8'>
      <div className='grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <div className='rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_30%),linear-gradient(180deg,rgba(12,23,41,0.92),rgba(8,15,28,0.95))] p-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]'>
          <div className='inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-100'>
            Stay connected
          </div>
          <img src={assets.logo_big} alt="" className='mt-8 w-[min(32vw,250px)]' />
          <h1 className='mt-10 text-4xl font-semibold leading-tight sm:text-5xl'>Private chats, status updates, and instant AI support.</h1>
          <p className='mt-5 max-w-xl text-sm leading-7 text-slate-300'>
            Talk one-to-one, share moments that disappear after 24 hours, update your profile, and get quick help from Pulse AI whenever you need it.
          </p>
          <div className='mt-8 grid gap-3 sm:grid-cols-3'>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
              <p className='text-xs uppercase tracking-[0.22em] text-slate-400'>Realtime</p>
              <p className='mt-2 text-sm text-white'>Socket-powered online presence</p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
              <p className='text-xs uppercase tracking-[0.22em] text-slate-400'>Media</p>
              <p className='mt-2 text-sm text-white'>Image sharing built into the flow</p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
              <p className='text-xs uppercase tracking-[0.22em] text-slate-400'>Profiles</p>
              <p className='mt-2 text-sm text-white'>Custom bio and avatar support</p>
            </div>
          </div>
        </div>

      <form onSubmit={onSubmitHandler}className='rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,23,41,0.92),rgba(8,15,28,0.95))] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8'>
      {authUser && (
        <div className='mb-6 rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-4'>
          <p className='text-xs uppercase tracking-[0.28em] text-cyan-100/80'>Current session</p>
          <p className='mt-2 text-lg font-semibold text-white'>{getUserDisplayName(authUser)}</p>
          <p className='mt-2 text-sm text-slate-300'>
            You are already signed in. Continue with this account or log out to switch user.
          </p>
          <div className='mt-4 flex flex-wrap gap-3'>
            <button type="button" onClick={() => navigate('/')} className='rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950'>
              Continue to chats
            </button>
            <button type="button" onClick={logout} className='rounded-2xl border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5'>
              Logout and switch account
            </button>
          </div>
        </div>
      )}
      <h2 className='flex items-center justify-between text-2xl font-medium'>
        {currState}
        {isDataSubmitted && <button type="button" onClick={()=> setIsDataSubmitted(false)} className='flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5'><img src={assets.arrow_icon} alt="" className='w-4 cursor-pointer'/></button>}
        
        </h2>
        <p className='mt-2 text-sm text-slate-400'>
          {currState === "Sign up" ? 'Create your account and personalize your identity.' : 'Sign in to continue your conversations.'}
        </p>
        <div className='mt-8 flex flex-col gap-4'>
        {currState === "Sign up" && !isDataSubmitted && (
          <input onChange={(e)=>setFullname(e.target.value)} value={fullname} type="text" placeholder='Full Name' className='rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition focus:border-cyan-300/40' required />
        )  }
        {!isDataSubmitted && (
          <>
             <input onChange={(e)=>setEmail(e.target.value)} type="email" placeholder='Email Address' className='rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition focus:border-cyan-300/40' required />
             <input onChange={(e)=> setPassword(e.target.value)} type="password" placeholder='Password' className='rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition focus:border-cyan-300/40' required />
          </>
         
        )}
        {currState === "Sign up" && isDataSubmitted && (
          <textarea onChange={(e)=> setBio(e.target.value)}  value={bio} rows={4} placeholder='Provide a short bio...' className='rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition focus:border-cyan-300/40' required />
        )
      }
        </div>
        <button type='submit' className='mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 py-3 text-sm font-semibold text-slate-950 cursor-pointer shadow-lg shadow-cyan-500/20'>
          {currState === "Sign up" ? "Create Account" : "Login Now"}

        </button>
        <div className='mt-5 flex items-start gap-3 text-sm text-slate-400'>
          <input type="checkbox" className='mt-1 accent-cyan-300'/>
          <p>Agree to the terms of use & privacy policy.</p>

        </div>
        <div className='mt-6 flex flex-col gap-2'>
          {currState === "Sign up" ? (
            <p className='text-sm text-slate-400'>Already have an account? <span onClick={()=>{setCurrState("Login");setIsDataSubmitted(false)}}className='font-medium text-cyan-300 cursor-pointer'>Login here</span></p>
          ) : (
            <p className='text-sm text-slate-400' >Create an account <span onClick={()=>setCurrState("Sign up")}className='font-medium text-cyan-300 cursor-pointer' >Click here</span></p> 
            )}

        </div>
        
      </form>
      </div>
    </div>
  )
}

export default LoginPage
