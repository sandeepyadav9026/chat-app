import React ,{useContext, useEffect, useState}from 'react'
import  assets from '../assets/assets'
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

import { ChatContext } from '../../context/ChatContext'
import { AI_CONTACT_ID, formatRelativeTime, getUserDisplayName, getUserInitials, isAiUser, isGroupChat } from '../lib/utils';
import StatusComposerModal from './StatusComposerModal';
import StatusViewerModal from './StatusViewerModal';
import CreateGroupModal from './CreateGroupModal';
import { FiUsers } from 'react-icons/fi';


function Sidebar() {

    const {getusers,users,selectedUser,setSelectedUser,unseenMessages,setUnseenMessages,statuses,getStatuses,createStatus,createGroup,deleteStatus,isCreatingStatus,isCreatingGroup} = useContext(ChatContext);

    const{logout,onlineUsers,authUser} = useContext(AuthContext);

  const [input,setInput] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [activeStatusEntry, setActiveStatusEntry] = useState(null);
    const navigate = useNavigate();

    const filteredUsers = (input && String(input).trim() !== '')
      ? (Array.isArray(users) ? users.filter((user) => {
          const name = (user?.fullname || user?.fullName || '').toString();
          return name.toLowerCase().includes(String(input).toLowerCase());
        }) : [])
      : (users || []);

    useEffect(()=>{
      getusers();
      getStatuses();
    },[onlineUsers, getusers, getStatuses])

    const totalUnread = Object.values(unseenMessages || {}).reduce((sum, value) => sum + value, 0);
    const activeNow = Array.isArray(users)
      ? users.filter((user) => (onlineUsers || []).includes(user._id)).length
      : 0;
    const myStatusEntry = statuses.find((entry) => entry.user?._id === authUser?._id);


  return (
    <>
    <aside className={ `relative h-full overflow-y-auto rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,18,34,0.96),rgba(10,18,34,0.74))] p-5 text-white ${selectedUser ? "max-lg:hidden" : ''}` }>
      <div className='pb-5'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20'>
              {getUserInitials(authUser)}
            </div>
            <div>
              <p className='text-xs uppercase tracking-[0.25em] text-slate-400'>Workspace</p>
              <p className='text-lg font-semibold text-white'>{getUserDisplayName(authUser)}</p>
            </div>
          </div>
          <div className="group relative py-2">
            <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer opacity-80 transition group-hover:opacity-100' />
            <div className='absolute right-0 top-full z-20 hidden w-40 rounded-2xl border border-white/10 bg-[#0f1a2d] p-3 text-gray-100 shadow-2xl group-hover:block' >
              <p onClick={()=>navigate('/profile')} className='cursor-pointer rounded-xl px-3 py-2 text-sm transition hover:bg-white/6'>Edit Profile</p>
              <p onClick={()=> logout()} className='mt-1 cursor-pointer rounded-xl px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-400/10'>Logout</p>
            </div>
          </div>
        </div>

        <div className='mt-5 grid grid-cols-2 gap-3'>
          <div className='rounded-2xl border border-white/8 bg-white/4 p-4'>
            <p className='text-xs uppercase tracking-[0.2em] text-slate-400'>Unread</p>
            <p className='mt-2 text-2xl font-semibold text-white'>{totalUnread}</p>
          </div>
          <div className='rounded-2xl border border-white/8 bg-white/4 p-4'>
            <p className='text-xs uppercase tracking-[0.2em] text-slate-400'>Online</p>
            <p className='mt-2 text-2xl font-semibold text-emerald-300'>{activeNow}</p>
          </div>
        </div>

        <div className='mt-5 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3'>
          <img src={assets.search_icon} alt="Search" className='w-3 opacity-70' />
          <input onChange={(e)=>setInput(e.target.value)} type="text" className='flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400' placeholder='Search chats, contacts, or AI'  />
        </div>
      </div>

      <div className='mb-5'>
        <div className='mb-3 flex items-center justify-between'>
          <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Status</p>
          <button type='button' onClick={() => setIsComposerOpen(true)} className='rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100'>
            {myStatusEntry ? 'Update' : 'Add'}
          </button>
        </div>
        <div className='flex gap-3 overflow-x-auto pb-1'>
          <button type='button' onClick={() => myStatusEntry ? setActiveStatusEntry(myStatusEntry) : setIsComposerOpen(true)} className='min-w-[88px] rounded-3xl border border-white/10 bg-white/4 p-3 text-left'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-semibold text-slate-950'>
              {getUserInitials(authUser)}
            </div>
            <p className='mt-3 text-sm font-medium text-white'>You</p>
            <p className='mt-1 text-xs text-slate-400'>{myStatusEntry ? `${myStatusEntry.items.length} live` : 'Add status'}</p>
          </button>

          {statuses
            .filter((entry) => entry.user?._id !== authUser?._id)
            .map((entry) => (
              <button key={entry.user?._id} type='button' onClick={() => setActiveStatusEntry(entry)} className='min-w-[88px] rounded-3xl border border-white/10 bg-white/4 p-3 text-left'>
                <img src={entry.user?.profilePic || assets.avatar_icon} alt="" className='h-12 w-12 rounded-2xl object-cover' />
                <p className='mt-3 truncate text-sm font-medium text-white'>{getUserDisplayName(entry.user)}</p>
                <p className='mt-1 text-xs text-slate-400'>{formatRelativeTime(entry.items[0]?.createdAt)}</p>
              </button>
            ))}
        </div>
      </div>

      <div className='mb-5 rounded-[28px] border border-white/8 bg-white/4 p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Groups</p>
            <p className='mt-2 text-sm text-slate-300'>Start a shared conversation without changing your existing chats.</p>
          </div>
          <button type='button' onClick={() => setIsCreateGroupOpen(true)} className='inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-medium text-cyan-100'>
            <FiUsers size={14} />
            New group
          </button>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        {filteredUsers.length ? filteredUsers.map((user) => (
           <button
            type="button"
            onClick={() => { setSelectedUser(user); if (!isAiUser(user)) { setUnseenMessages(prev => ({ ...(prev || {}), [user._id]: 0 })); } }}
            key={user._id}
            className={`relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${selectedUser?._id === user._id ? 'border-cyan-300/30 bg-cyan-300/10 shadow-lg shadow-cyan-500/8' : 'border-transparent bg-white/3 hover:border-white/8 hover:bg-white/6'}`}
          >
            <div className='relative'>
              {isAiUser(user) ? (
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-300 via-cyan-300 to-blue-500 text-sm font-semibold text-slate-950'>
                  AI
                </div>
              ) : isGroupChat(user) ? (
                user?.image ? (
                  <img src={user.image} alt="" className='h-12 w-12 rounded-2xl object-cover'/>
                ) : (
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-sm font-semibold text-slate-950'>
                    {getUserInitials(user)}
                  </div>
                )
              ) : (
                <>
                  <img src={user?.profilePic || assets.avatar_icon } alt="" className='h-12 w-12 rounded-2xl object-cover'/>
                  {(onlineUsers || []).includes(user._id) && <span className='absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0b1525] bg-emerald-400' />}
                </>
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium text-white'>{getUserDisplayName(user)}</p>
              <p className='mt-1 truncate text-xs text-slate-400'>{isAiUser(user) ? 'Always available for help' : isGroupChat(user) ? `${user?.members?.length || 0} members` : (user?.bio || 'Available for conversation')}</p>
            </div>
            {user._id === AI_CONTACT_ID ? (
              <p className='rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-[11px] font-medium text-violet-100'>AI</p>
            ) : isGroupChat(user) ? (
              <p className='rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-medium text-amber-100'>Group</p>
            ) : (
              (unseenMessages?.[user._id] > 0) && <p className='flex h-7 min-w-7 items-center justify-center rounded-full bg-cyan-400 px-2 text-xs font-semibold text-slate-950'>{unseenMessages?.[user._id]}</p>
            )}
            {isGroupChat(user) && unseenMessages?.[user._id] > 0 && (
              <p className='absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-cyan-400 px-2 text-xs font-semibold text-slate-950'>{unseenMessages?.[user._id]}</p>
            )}
          </button>
          )) : (
            <div className='rounded-2xl border border-dashed border-white/10 bg-white/3 px-4 py-8 text-center text-sm text-slate-400'>
              No users matched your search.
            </div>
          )}
      </div>
    </aside>
    <StatusComposerModal
      isOpen={isComposerOpen}
      onClose={() => setIsComposerOpen(false)}
      onSubmit={createStatus}
      isSaving={isCreatingStatus}
    />
    <StatusViewerModal
      entry={activeStatusEntry}
      onClose={() => setActiveStatusEntry(null)}
      onDelete={activeStatusEntry?.user?._id === authUser?._id ? deleteStatus : null}
    />
    <CreateGroupModal
      isOpen={isCreateGroupOpen}
      users={(users || []).filter((user) => !isAiUser(user) && !isGroupChat(user))}
      isSaving={isCreatingGroup}
      onClose={() => setIsCreateGroupOpen(false)}
      onSubmit={createGroup}
    />
    </>
  )
}

export default Sidebar;
