import React from 'react'
import { useContext, useEffect, useState } from 'react'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { getUserDisplayName, getUserInitials, isAiUser, isGroupChat } from '../lib/utils';

function RightSidebar() {

    const { selectedUser, messages } = useContext(ChatContext);
    const { logout, onlineUsers } = useContext(AuthContext);
    const [msgImages, setMsgImages] = useState([]);

// Geet all the images from the messages and set them to state
    useEffect(() => {
      setMsgImages((messages || []).filter(msg => msg.image).map(msg => msg.image));
    }, [messages]);

  const aiChat = isAiUser(selectedUser);
  const groupChat = isGroupChat(selectedUser);

  return selectedUser && (
    <aside className={`relative hidden h-full overflow-y-auto rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,18,34,0.96),rgba(10,18,34,0.74))] text-white lg:block`}>
        <div className='mx-auto flex flex-col items-center gap-3 px-6 pb-6 pt-10 text-center text-xs font-light'>
            {aiChat ? (
              <div className='flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-violet-300 via-cyan-300 to-blue-500 text-2xl font-semibold text-slate-950 shadow-xl shadow-cyan-500/15'>
                AI
              </div>
            ) : groupChat ? (
              <div className='flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-amber-300 to-orange-500 text-2xl font-semibold text-slate-950 shadow-xl shadow-orange-500/15'>
                {getUserInitials(selectedUser)}
              </div>
            ) : selectedUser?.profilePic ? (
              <img src={selectedUser?.profilePic} alt="" className='h-24 w-24 rounded-[28px] object-cover shadow-xl shadow-black/20' />
            ) : (
              <div className='flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-cyan-300 to-blue-500 text-2xl font-semibold text-slate-950 shadow-xl shadow-cyan-500/15'>
                {getUserInitials(selectedUser)}
              </div>
            )}
            <div className='rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-400'>
              {groupChat ? 'Group Details' : 'Contact Profile'}
            </div>
            <h1 className='px-4 text-2xl font-semibold text-white'>
              {getUserDisplayName(selectedUser)}
            </h1>
            <div className='flex items-center gap-2 text-sm text-slate-400'>
              <span className={`h-2.5 w-2.5 rounded-full ${aiChat || groupChat || (onlineUsers || []).includes(selectedUser?._id) ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
              {aiChat ? 'Always available' : groupChat ? `${selectedUser?.members?.length || 0} members` : ((onlineUsers || []).includes(selectedUser?._id) ? 'Online now' : 'Offline')}
            </div>
            <p className='max-w-[240px] text-sm leading-6 text-slate-400'>{selectedUser.bio || 'No bio added yet.'}</p>
        </div>

        <div className='px-6'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='rounded-2xl border border-white/8 bg-white/4 p-4'>
              <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>{aiChat ? 'Mode' : groupChat ? 'Members' : 'Media'}</p>
              <p className='mt-2 text-lg font-semibold text-white'>{aiChat ? 'AI chat' : groupChat ? (selectedUser?.members?.length || 0) : msgImages.length}</p>
            </div>
            <div className='rounded-2xl border border-white/8 bg-white/4 p-4'>
              <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>Messages</p>
              <p className='mt-2 text-lg font-semibold text-white'>{messages?.length || 0}</p>
            </div>
          </div>
        </div>

        <hr className="mx-6 my-6 border-white/8"/>
        <div className="px-6 text-xs">
          <p className='text-[11px] uppercase tracking-[0.22em] text-slate-500'>{aiChat ? 'What you can ask' : groupChat ? 'Members' : 'Shared media'}</p>
          <div className='mt-4 grid max-h-[280px] grid-cols-2 gap-3 overflow-y-auto pr-1'>
            {aiChat ? (
              <>
                {["Draft replies", "Summaries", "Captions", "Ideas", "Planning", "Rewrite tone"].map((item) => (
                  <div key={item} className='rounded-2xl border border-white/8 bg-white/4 px-3 py-4 text-sm text-slate-200'>
                    {item}
                  </div>
                ))}
              </>
            ) : groupChat ? (
              <>
                {(selectedUser?.members || []).map((member) => (
                  <div key={member._id} className='rounded-2xl border border-white/8 bg-white/4 px-3 py-4 text-sm text-slate-200'>
                    {getUserDisplayName(member)}
                  </div>
                ))}
              </>
            ) : msgImages.map((url, index) => (
              <div key={index} onClick={()=>
                window.open(url)}
                className='cursor-pointer overflow-hidden rounded-2xl border border-white/8 bg-white/4'>
                <img src={url} alt="" className='h-28 w-full object-cover transition duration-300 hover:scale-105' />
              </div>
            ))}
            {!aiChat && !groupChat && !msgImages.length && (
              <div className='col-span-2 rounded-2xl border border-dashed border-white/10 bg-white/3 px-4 py-8 text-center text-sm text-slate-400'>
                Shared images will show up here.
              </div>
            )}
          </div>
        </div>
  <button onClick={()=> logout()} className='mx-6 my-6 w-[calc(100%-3rem)] rounded-2xl border border-rose-300/15 bg-rose-400/10 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-400/15'>
        Logout
        </button>

    </aside>
  )
  

}



export default RightSidebar
