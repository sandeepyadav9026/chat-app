import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { getUserDisplayName, getUserInitials } from '../lib/utils'
import { compressImage } from '../lib/image'

function ProfilePage() {
  const {authUser,updateProfile,isUpdatingProfile} = useContext(AuthContext);

  const [selectedImg, setSelectedImg] = useState(null)
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName || authUser.fullname || "")
  const [bio, setBio] = useState(authUser.bio)



  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedImg){
      const success = await updateProfile({fullName: name,bio});
      if (success) {
        navigate('/');
      }
      return;   
  
    }
    const optimizedProfileImage = await compressImage(selectedImg, {
      maxWidth: 900,
      maxHeight: 900,
      quality: 0.72,
    });
    const success = await updateProfile({fullName: name,bio,profilePic: optimizedProfileImage});
    if (success) {
      navigate('/');
    }
  }


  return (
    <div className='flex min-h-screen items-center justify-center px-4 py-8'>
      <div className="grid w-full max-w-5xl gap-6 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,23,41,0.92),rgba(8,15,28,0.95))] text-gray-300 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className='order-2 flex flex-col justify-between border-t border-white/8 p-8 lg:order-1 lg:border-r lg:border-t-0'>
          <div>
            <div className='inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-100'>
              Personalize profile
            </div>
            <h2 className='mt-6 text-3xl font-semibold text-white'>Make your account feel like you.</h2>
            <p className='mt-4 text-sm leading-7 text-slate-400'>
              Update your photo, name, and short bio so the rest of the app feels finished and professional.
            </p>
          </div>

          <div className='mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6'>
            <div className='flex items-center gap-4'>
              {selectedImg || authUser?.profilePic ? (
                <img className='h-20 w-20 rounded-[24px] object-cover' src={selectedImg ? URL.createObjectURL(selectedImg) : authUser?.profilePic} alt=""/>
              ) : (
                <div className='flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-cyan-300 to-blue-500 text-2xl font-semibold text-slate-950'>
                  {getUserInitials(authUser)}
                </div>
              )}
              <div>
                <p className='text-lg font-semibold text-white'>{name || getUserDisplayName(authUser)}</p>
                <p className='mt-1 text-sm text-slate-400'>{bio || 'Add a short bio for your profile card.'}</p>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="order-1 flex flex-col gap-5 p-8 lg:order-2 lg:p-10">
          <h3 className="text-lg font-medium text-white">Profile details</h3>
          <label  htmlFor="avatar" className="flex items-center gap-3 cursor-pointer">    
            <input onChange={(e)=>setSelectedImg(e.target.files[0])} type='file' id='avatar' accept='.png,.jpg,.jpeg' hidden />
            <img src={selectedImg ? URL.createObjectURL(selectedImg) : (authUser?.profilePic || assets.avatar_icon)} alt="" className='h-14 w-14 rounded-2xl object-cover'/>
            <span className='text-sm text-slate-300'>Upload profile image</span>
          </label>
          <input type="text" required placeholder='Your name' value={name} onChange={(e)=>setName(e.target.value)} className='rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition focus:border-cyan-300/40'/>
          <textarea required placeholder='Your bio' value={bio} onChange={(e)=>setBio(e.target.value)} className='rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition focus:border-cyan-300/40' rows={4} />
          <div className='flex gap-3 pt-2'>
            <button type="submit" disabled={isUpdatingProfile} className="rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60">{isUpdatingProfile ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" onClick={() => navigate('/')} className='rounded-2xl border border-white/10 px-6 py-3 text-sm text-white transition hover:bg-white/5'>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage
