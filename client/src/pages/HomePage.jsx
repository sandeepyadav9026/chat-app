import React ,{useContext}from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'


function HomePage() {
  const {selectedUser} = useContext(ChatContext);

  return (
    <div className='relative min-h-screen px-3 py-3 sm:px-6 sm:py-6 lg:px-8'>
      <div className='mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-7xl flex-col gap-4 lg:min-h-[calc(100vh-3rem)]'>
        <div className='rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl'>
          <div className='flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4'>
            <div>
              <p className='text-xs uppercase tracking-[0.35em] text-cyan-200/70'>QuickChat</p>
              <h1 className='mt-1 text-2xl font-semibold text-white sm:text-3xl'>Messages, status updates, and AI help in one place</h1>
            </div>
            <div className='rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-100'>
              {selectedUser ? 'Chat open' : 'Choose a chat to get started'}
            </div>
          </div>
        </div>

        <div className={`grid flex-1 gap-4 overflow-hidden rounded-[32px] border border-white/10 bg-[#091223]/85 p-2 shadow-[0_20px_120px_rgba(2,8,23,0.55)] backdrop-blur-2xl ${selectedUser ? 'grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_320px]' : 'grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]'}`}>
        <Sidebar />
        <ChatContainer/>
        <RightSidebar/>
        </div>
      </div>
    </div>
  )
}

export default HomePage
