import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { isAddress, getAddress } from 'viem';
import { useAddAdmin } from '@/hooks/useRealifiAdmin'; // path to the hook above

export function AddAdminModal({ contractAddress, isOpen, onClose, onSuccess }) {
  const { address: userAddress } = useAccount();
  const [adminAddress, setAdminAddress] = useState('');
  const [localError, setLocalError] = useState('');
  const { addAdmin, isLoading, isSuccess, error: hookError } = useAddAdmin(contractAddress);

  // populate UI errors from hook
  useEffect(() => {
    if (hookError) setLocalError(hookError);
  }, [hookError]);

  // on success: clear and close
  useEffect(() => {
    if (isSuccess) {
      setAdminAddress('');
      setLocalError('');
      onSuccess?.();
      onClose?.();
    }
  }, [isSuccess, onSuccess, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!adminAddress.trim()) {
      setLocalError('Please enter an admin address');
      return;
    }

    const trimmed = adminAddress.trim();
    if (!isAddress(trimmed)) {
      setLocalError('Invalid Ethereum address');
      return;
    }

    if (trimmed.toLowerCase() === userAddress?.toLowerCase()) {
      setLocalError('You cannot add yourself as admin');
      return;
    }

    // convert to checksummed address before sending
    let checksummed;
    try {
      checksummed = getAddress(trimmed);
    } catch (err) {
      setLocalError('Invalid address (checksum failed)');
      return;
    }

    // Call hook
    const res = await addAdmin(checksummed);
    // addAdmin resolves immediately; rely on isLoading/isSuccess for progress
    if (res?.ok === false) {
      setLocalError(res.error || 'Failed to start transaction');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-section rounded-xl p-6 w-full max-w-md border border-border">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Add Admin</h2>

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

          {/* Inline debug state (remove in prod) */}
          <div className="text-xs text-text-subtle">
            <div>Loading: {isLoading ? 'true' : 'false'}</div>
            <div>Success: {isSuccess ? 'true' : 'false'}</div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => onClose?.()}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-xl border border-border text-text-primary hover:bg-main transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-xl bg-gold text-main font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
