import React, { useEffect, useRef, useContext }   from 'react'
import assets from '../assets/assets'
import { formatMessageDate, formatMessageTime, getUserDisplayName, isAiUser, isGroupChat } from '../lib/utils'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { compressImage } from '../lib/image'
import { FiTrash2 } from 'react-icons/fi'
import { FiPhone, FiVideo } from 'react-icons/fi'
import { CallContext } from '../../context/CallContext'



function ChatContainer() {
   const {messages, selectedUser, setSelectedUser, sendMessage, getMessages, deleteMessage, isSendingMessage} = useContext(ChatContext);
   const {authUser, onlineUsers} = useContext(AuthContext);
   const { startCall, activeCall } = useContext(CallContext);
       const scrollEnd =useRef()


       const [input, setInput] = useState('');

      // Handle sending a message
      const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return null; 
        await sendMessage({text: input.trim()});
        setInput("");
      }

      // Handle sending an image 
      const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if(!file || !file.type.startsWith('image/')) {
          toast.error("select an image file");
          return;

        }
        const optimizedImage = await compressImage(file, {
          maxWidth: 1440,
          maxHeight: 1440,
          quality: 0.68,
        });
        await sendMessage({image: optimizedImage});
        e.target.value = ""
      }
          

      useEffect(() => {
        if(selectedUser) {
          getMessages(selectedUser);
        }
        }, [selectedUser, getMessages]);

       useEffect(() => {
        if(scrollEnd.current && messages){
        scrollEnd.current?.scrollIntoView({ behavior: 'smooth' })
        }  
       }, [messages])

      const groupedMessages = Array.isArray(messages)
        ? messages.reduce((groups, message) => {
            if (!message) return groups;

            const label = formatMessageDate(message.createdAt);
            const latestGroup = groups[groups.length - 1];

            if (latestGroup?.label === label) {
              latestGroup.items.push(message);
            } else {
              groups.push({ label, items: [message] });
            }

            return groups;
          }, [])
        : [];

      const sharedMediaCount = (messages || []).filter((message) => message?.image).length;
      const totalMessages = (messages || []).length;
      const isSelectedUserOnline = (onlineUsers || []).includes(selectedUser?._id);
      const aiChat = isAiUser(selectedUser);
      const groupChat = isGroupChat(selectedUser);
      const callInProgressWithSelectedUser = activeCall?.user?._id === selectedUser?._id;
      const isCallActionDisabled = groupChat || !isSelectedUserOnline || (Boolean(activeCall) && !callInProgressWithSelectedUser);

  return selectedUser ? (
    <section className='relative flex h-full min-h-[70vh] flex-col overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,15,28,0.95),rgba(9,18,35,0.92))]'>
      <div className='flex items-center gap-4 border-b border-white/8 px-4 py-4 sm:px-6'>
          <button type="button" onClick={()=> setSelectedUser(null)} className='flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/4 lg:hidden'>
            <img src={assets.arrow_icon} alt="Back" className='max-w-4'/>
          </button>
          {aiChat ? (
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-300 via-cyan-300 to-blue-500 text-sm font-semibold text-slate-950'>
              AI
            </div>
          ) : groupChat ? (
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-sm font-semibold text-slate-950'>
              {selectedUser?.name?.slice(0, 2)?.toUpperCase() || 'GR'}
            </div>
          ) : (
            <img src={selectedUser.profilePic || assets.avatar_icon}  alt="" className='h-12 w-12 rounded-2xl object-cover' />
          )}
          <div className='min-w-0 flex-1'>
            <p className='truncate text-lg font-semibold text-white'>{getUserDisplayName(selectedUser)}</p>
            <p className='mt-1 text-sm text-slate-400'>
              {aiChat ? 'Ask for rewrites, ideas, summaries, and quick help' : groupChat ? `${selectedUser?.members?.length || 0} members in this conversation` : (isSelectedUserOnline ? 'Online now and ready to chat' : 'Offline right now')}
            </p>
          </div>
          {!aiChat && !groupChat && (
            <div className='flex items-center gap-2'>
              <button
                type='button'
                disabled={isCallActionDisabled}
                onClick={() => startCall(selectedUser, "audio")}
                className='inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50'
                title={isSelectedUserOnline ? 'Start voice call' : 'User is offline'}
              >
                <FiPhone size={18} />
              </button>
              <button
                type='button'
                disabled={isCallActionDisabled}
                onClick={() => startCall(selectedUser, "video")}
                className='inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50'
                title={isSelectedUserOnline ? 'Start video call' : 'User is offline'}
              >
                <FiVideo size={18} />
              </button>
            </div>
          )}
          <div className='hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-2 text-xs text-emerald-100 sm:flex'>
            <span className={`h-2 w-2 rounded-full ${aiChat || isSelectedUserOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {aiChat ? 'Available' : (isSelectedUserOnline ? 'Live' : 'Away')}
          </div>
          <img src={assets.help_icon} alt="" className='hidden max-w-5 opacity-70 lg:block' />
        </div>
        <div className='grid gap-3 border-b border-white/8 px-4 py-3 text-xs text-slate-300 sm:grid-cols-3 sm:px-6'>
          <div className='rounded-2xl border border-white/8 bg-white/4 px-4 py-3'>
            <p className='uppercase tracking-[0.25em] text-slate-500'>{aiChat ? 'Session' : groupChat ? 'Members' : 'Messages'}</p>
            <p className='mt-2 text-lg font-semibold text-white'>{groupChat ? (selectedUser?.members?.length || 0) : totalMessages}</p>
          </div>
          <div className='rounded-2xl border border-white/8 bg-white/4 px-4 py-3'>
            <p className='uppercase tracking-[0.25em] text-slate-500'>{aiChat ? 'Mode' : groupChat ? 'Messages' : 'Shared Media'}</p>
            <p className='mt-2 text-lg font-semibold text-white'>{aiChat ? 'Assistant' : groupChat ? totalMessages : sharedMediaCount}</p>
          </div>
          <div className='rounded-2xl border border-white/8 bg-white/4 px-4 py-3'>
            <p className='uppercase tracking-[0.25em] text-slate-500'>{aiChat ? 'Response speed' : 'Status'}</p>
            <p className='mt-2 text-lg font-semibold text-white'>{aiChat ? 'Low latency' : groupChat ? 'Group chat' : (isSelectedUserOnline ? 'Available' : 'Quiet mode')}</p>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto px-4 py-5 sm:px-6'>
          {groupedMessages.length ? groupedMessages.map((group) => (
            <div key={group.label} className='mb-6'>
              <div className='mb-4 flex justify-center'>
                <span className='rounded-full border border-white/8 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400'>
                  {group.label}
                </span>
              </div>

              <div className='space-y-4'>
                {group.items.map((msg, index) => {
                  const isOwnMessage = aiChat
                    ? msg?.role === "user"
                    : groupChat
                      ? String(msg?.senderId?._id || msg?.senderId) === authUser?._id
                      : msg?.senderId === authUser?._id;
                  const canDelete = aiChat ? true : isOwnMessage;
                  const senderName = groupChat ? getUserDisplayName(msg?.senderId) : getUserDisplayName(selectedUser);
                  const senderProfilePic = groupChat ? msg?.senderId?.profilePic : selectedUser?.profilePic;

                  return (
                    <div key={msg._id || index} className={`group flex items-end gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      {!isOwnMessage && (
                        aiChat ? (
                          <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-300 via-cyan-300 to-blue-500 text-[10px] font-semibold text-slate-950'>AI</div>
                        ) : (
                          <img src={senderProfilePic || assets.avatar_icon} alt="" className='h-8 w-8 rounded-xl object-cover' />
                        )
                      )}

                      <div className={`max-w-[82%] sm:max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                        {groupChat && !isOwnMessage && (
                          <p className='px-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80'>{senderName}</p>
                        )}
                        {msg?.image ? (
                          <img src={msg.image} alt="Shared" className='max-w-[260px] rounded-3xl border border-white/10 object-cover shadow-lg shadow-black/20' />
                        ) : (
                          <p className={`rounded-3xl px-4 py-3 text-sm leading-6 break-words shadow-lg shadow-black/15 ${isOwnMessage ? 'rounded-br-md bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950' : 'rounded-bl-md border border-white/8 bg-white/8 text-white'}`}>
                            {msg?.text}
                          </p>
                        )}
                        <div className='flex items-center gap-3 px-1 text-xs text-slate-500'>
                          <p>{formatMessageTime(msg?.createdAt)}</p>
                          {canDelete && (
                            <button type='button' onClick={() => deleteMessage(msg._id)} className='inline-flex items-center gap-1 opacity-70 transition hover:text-rose-200 hover:opacity-100'>
                              <FiTrash2 size={12} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {isOwnMessage && (
                        <img src={authUser?.profilePic || assets.avatar_icon} alt="" className='h-8 w-8 rounded-xl object-cover' />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )) : (
            <div className='flex h-full min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/3 px-6 text-center'>
              <div className='rounded-3xl bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-200'>Fresh conversation</div>
              <h3 className='mt-5 text-2xl font-semibold text-white'>{aiChat ? 'Ask Pulse AI anything' : 'Start with something memorable'}</h3>
              <p className='mt-3 max-w-md text-sm leading-6 text-slate-400'>
                {aiChat
                  ? 'Use AI for rewrites, planning, captions, summaries, and quick answers without leaving your inbox.'
                  : groupChat
                    ? 'Invite people in, share updates, and keep the whole conversation in one place.'
                    : 'Send a welcome message, ask a quick question, or share an image to kick things off.'}
              </p>
            </div>
          )}
          <div ref= {scrollEnd} />
        </div>

        <div className='border-t border-white/8 p-4 sm:p-6'>
          <div className='flex items-end gap-3 rounded-[28px] border border-white/10 bg-white/4 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.25)]'>
            <div className='flex-1'> 
              <textarea
                onChange={(e)=> setInput(e.target.value)}
                value={input}
                onKeyDown={(e)=> {
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleSendMessage(e);
                  }
                }}
                rows={1}
                placeholder={aiChat ? 'Ask Pulse AI...' : `Message ${getUserDisplayName(selectedUser)}...`}
                className='max-h-32 min-h-[52px] w-full resize-none bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-400'
              />
              {!aiChat && (
                <>
                  <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
                  <label htmlFor="image" className='inline-flex cursor-pointer items-center gap-2 px-2 pt-1 text-xs text-slate-400 transition hover:text-white'>
                    <img src={assets.gallery_icon} alt="" className='w-4' />
                    Share image
                  </label>
                </>
              )}
            </div>
            <button disabled={isSendingMessage} onClick={() => handleSendMessage({ preventDefault: () => {} })} type="button" className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70'>
              <img src={assets.send_button} alt="Send" className='w-5' />
            </button>
          </div>
        </div>
    </section>

  ) : (
    <section className='hidden h-full min-h-[70vh] flex-col items-center justify-center rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_35%),linear-gradient(180deg,rgba(8,15,28,0.95),rgba(9,18,35,0.92))] px-8 text-center lg:flex'>
      <div className='rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-100'>
        QuickChat
      </div>
      <img src={assets.logo_icon} className='mt-8 max-w-20' alt="QuickChat"/>
      <h2 className='mt-8 text-4xl font-semibold text-white'>Private conversations, simple sharing, instant help</h2>
      <p className='mt-4 max-w-xl text-sm leading-7 text-slate-400'>
        Open a chat, update your status, share photos, or switch to Pulse AI whenever you need quick assistance.
      </p>
    </section>
  )
}

export default ChatContainer
