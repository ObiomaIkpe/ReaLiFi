import React, { useState, useEffect } from 'react';
import { isAddress } from 'viem';
import { useRemoveAdmin } from '@/hooks/useRealifiAdmin';

export function RemoveAdminModal({ contractAddress, isOpen, onClose, onSuccess }) {
  const [adminAddress, setAdminAddress] = useState('');
  const [localError, setLocalError] = useState('');
  const { removeAdmin, isLoading, isSuccess, error: hookError } = useRemoveAdmin(contractAddress);

  useEffect(() => {
    if (isSuccess) {
      setAdminAddress('');
      setLocalError('');
      onSuccess?.();
    }
  }, [isSuccess, onSuccess]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (!adminAddress.trim()) {
      setLocalError('Please enter an admin address');
      return;
    }

    if (!isAddress(adminAddress)) {
      setLocalError('Invalid Ethereum address');
      return;
    }

    removeAdmin(adminAddress);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-section rounded-xl p-6 w-full max-w-md border border-border">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Remove Admin</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-subtle mb-2">Admin Address</label>
            <input
              type="text"
              value={adminAddress}
              onChange={(e) => setAdminAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-main border border-border rounded-xl px-4 py-2 text-text-primary placeholder-text-subtle focus:outline-none focus:border-gold transition-colors"
              disabled={isLoading}
            />
          </div>

          {(localError || hookError) && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-xl p-3">
              <p className="text-red-400 text-sm">{localError || hookError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-xl border border-border text-text-primary hover:bg-main transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Removing...' : 'Remove Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}