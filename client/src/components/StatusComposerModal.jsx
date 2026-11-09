import React, { useState } from 'react';
import { compressImage } from '../lib/image';

function StatusComposerModal({ isOpen, onClose, onSubmit, isSaving }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [isPreparingImage, setIsPreparingImage] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsPreparingImage(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.68,
      });
      setImage(compressed);
    } finally {
      setIsPreparingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await onSubmit({
      text,
      image,
    });

    if (success) {
      setText('');
      setImage('');
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md'>
      <form onSubmit={handleSubmit} className='w-full max-w-md rounded-[28px] border border-white/10 bg-[#08111f] p-6 text-white shadow-2xl'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-xs uppercase tracking-[0.3em] text-cyan-200/70'>Status</p>
            <h3 className='mt-1 text-xl font-semibold'>Share an update</h3>
          </div>
          <button type="button" onClick={onClose} className='rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-300'>
            Close
          </button>
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          placeholder='What would you like to share?'
          className='mt-5 w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none placeholder:text-slate-400'
        />

        <label className='mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300'>
          <span>{isPreparingImage ? 'Optimizing image...' : image ? 'Image selected' : 'Add photo status'}</span>
          <input type='file' accept='image/png,image/jpeg,image/webp' className='hidden' onChange={handleImageChange} />
          <span className='rounded-full bg-cyan-300 px-3 py-1 text-xs font-semibold text-slate-950'>Choose</span>
        </label>

        {image && <img src={image} alt="Status preview" className='mt-4 h-44 w-full rounded-3xl object-cover' />}

        <button
          type='submit'
          disabled={isSaving || isPreparingImage || (!text.trim() && !image)}
          className='mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {isSaving ? 'Updating...' : 'Post status'}
        </button>
      </form>
    </div>
  );
}

export default StatusComposerModal;
