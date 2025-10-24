import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { AddAdminModal } from '@/components/admin/AddAdminModal';
import { RemoveAdminModal } from '../components/admin/RemoveAdminModal';
import { TransferOwnershipModal } from '../components/admin/TransferOwnershipModal';
import { RenounceOwnershipModal } from '../components/admin/RenounceOwnershipModal';

const REALIFI_CONTRACT_ADDRESS = '0x8262dfA64c7fd013241CBAB524f2319b271F29AE';

export default function AdminControlPanel() {
  const { address, isConnected } = useAccount();
  const [activeModal, setActiveModal] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-main p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-section rounded-xl p-8 border border-border text-center">
            <p className="text-text-primary">Please connect your wallet to access the admin panel</p>
          </div>
        </div>
      </div>
    );
  }

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const handleSuccess = () => {
    setSuccessMessage('Transaction submitted successfully!');
    setActiveModal(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <div className="min-h-screen bg-main p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Admin Control Panel</h1>
        <p className="text-text-subtle mb-8">Manage ReaLiFi contract settings and permissions</p>

        {successMessage && (
          <div className="mb-6 bg-green-500 bg-opacity-10 border border-green-500 rounded-xl p-4">
            <p className="text-green-400 text-sm">{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Admin */}
          <div className="bg-section rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Add Admin</h2>
            <p className="text-text-subtle text-sm mb-4">Grant admin privileges to a new address</p>
            <button
              onClick={() => setActiveModal('addAdmin')}
              className="w-full px-4 py-2 rounded-xl bg-gold text-main font-semibold hover:bg-opacity-90 transition-colors"
            >
              Add Admin
            </button>
          </div>

          {/* Remove Admin */}
          <div className="bg-section rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Remove Admin</h2>
            <p className="text-text-subtle text-sm mb-4">Revoke admin privileges from an address</p>
            <button
              onClick={() => setActiveModal('removeAdmin')}
              className="w-full px-4 py-2 rounded-xl bg-gold text-main font-semibold hover:bg-opacity-90 transition-colors"
            >
              Remove Admin
            </button>
          </div>

          {/* Transfer Ownership */}
          <div className="bg-section rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Transfer Ownership</h2>
            <p className="text-text-subtle text-sm mb-4">Transfer contract ownership to another address</p>
            <button
              onClick={() => setActiveModal('transferOwnership')}
              className="w-full px-4 py-2 rounded-xl bg-gold text-main font-semibold hover:bg-opacity-90 transition-colors"
            >
              Transfer Ownership
            </button>
          </div>

          {/* Renounce Ownership */}
          <div className="bg-section rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Renounce Ownership</h2>
            <p className="text-text-subtle text-sm mb-4">Permanently remove your contract ownership</p>
            <button
              onClick={() => setActiveModal('renounceOwnership')}
              className="w-full px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-opacity-90 transition-colors"
            >
              Renounce Ownership
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-section rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Account Information</h3>
          <div className="space-y-2">
            <p className="text-text-primary">
              <span className="text-text-subtle">Connected Address:</span> {address}
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddAdminModal
        contractAddress={REALIFI_CONTRACT_ADDRESS}
        isOpen={activeModal === 'addAdmin'}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
      <RemoveAdminModal
        contractAddress={REALIFI_CONTRACT_ADDRESS}
        isOpen={activeModal === 'removeAdmin'}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
      <TransferOwnershipModal
        contractAddress={REALIFI_CONTRACT_ADDRESS}
        isOpen={activeModal === 'transferOwnership'}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
      <RenounceOwnershipModal
        contractAddress={REALIFI_CONTRACT_ADDRESS}
        isOpen={activeModal === 'renounceOwnership'}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}