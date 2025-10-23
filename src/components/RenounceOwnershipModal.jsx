import React, { useState, useEffect } from 'react';
import { useRenounceOwnership } from '@/hooks/useRealifiAdmin';

export function RenounceOwnershipModal({ contractAddress, isOpen, onClose, onSuccess }) {
  const [confirmed, setConfirmed] = useState(false);
  const { renounceOwnership, isLoading, isSuccess, error } = useRenounceOwnership(contractAddress);

  useEffect(() => {
    if (isSuccess) {
      setConfirmed(false);
      onSuccess?.();
    }
  }, [isSuccess, onSuccess]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirmed) {
      renounceOwnership();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-section rounded-xl p-6 w-full max-w-md border border-border">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Renounce Ownership</h2>
        <p className="text-text-subtle text-sm mb-4">This will permanently remove your ownership of the contract. This action cannot be undone.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-xl p-3">
            <p className="text-red-400 text-sm">⚠️ Warning: The contract will have no owner after this action.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="confirm" className="text-text-primary text-sm cursor-pointer">
              I understand this is irreversible
            </label>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
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
              disabled={isLoading || !confirmed}
              className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Renouncing...' : 'Renounce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
