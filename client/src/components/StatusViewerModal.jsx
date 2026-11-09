import React from 'react';
import { formatRelativeTime, getUserDisplayName } from '../lib/utils';

function StatusViewerModal({ entry, onClose, onDelete }) {
  if (!entry) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md'>
      <div className='w-full max-w-lg rounded-[30px] border border-white/10 bg-[#08111f] p-4 text-white shadow-2xl sm:p-6'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <img src={entry.user?.profilePic || ''} alt="" className='h-12 w-12 rounded-2xl object-cover bg-white/5' />
            <div>
              <p className='text-lg font-semibold'>{getUserDisplayName(entry.user)}</p>
              <p className='text-sm text-slate-400'>{entry.items.length} update{entry.items.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className='rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-300'>
            Close
          </button>
        </div>

        <div className='mt-5 space-y-4'>
          {entry.items.map((item) => (
            <div key={item._id} className='rounded-[28px] border border-white/10 bg-white/5 p-4'>
              <div className='flex items-center justify-between gap-4'>
                <p className='text-xs uppercase tracking-[0.25em] text-slate-500'>{formatRelativeTime(item.createdAt)}</p>
                {onDelete && (
                  <button type='button' onClick={() => onDelete(item._id)} className='text-xs text-rose-200'>
                    Delete
                  </button>
                )}
              </div>
              {item.image && <img src={item.image} alt="" className='mt-3 h-64 w-full rounded-[24px] object-cover' />}
              {item.text && <p className='mt-3 text-sm leading-7 text-slate-100'>{item.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatusViewerModal;
