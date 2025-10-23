import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { REAL_ESTATE_DAPP_ADDRESS, REAL_ESTATE_DAPP } from '../config/contract.config';

function SellerRegistration() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check if user is already registered as a seller
  const { data: isSeller, isLoading: checkingStatus, refetch } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'sellers',
    args: [address],
    enabled: !!address,
  });

  const handleRegister = async () => {
    try {
      toast.loading('Registering as seller...', { id: 'register' });
      
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'registerSeller',
        args: [], 
      });
    } catch (error) {
      toast.error(`Failed to register: ${error.message}`, { id: 'register' });
      console.error(error);
    }
  };

  // Handle successful registration
  useEffect(() => {
    if (isSuccess) {
      toast.success('✅ Successfully registered as seller!', { id: 'register' });
      refetch(); // Refresh seller status
    }
  }, [isSuccess, refetch]);

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto mt-10">
        <p className="text-yellow-800 text-center">Please connect your wallet first</p>
      </div>
    );
  }

  if (checkingStatus) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4">Checking seller status...</span>
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto mt-10">
        <div className="flex items-center justify-center gap-3">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-800 font-semibold text-lg">You are registered as a seller</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-2xl mx-auto mt-10">
      <div className="text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-yellow-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-yellow-900 mb-3">
          Seller Registration Required
        </h3>
        <p className="text-yellow-800 mb-6 text-lg">
          You need to register as a seller before you can create and list assets on the platform.
        </p>
        <button
          onClick={handleRegister}
          disabled={isPending || isConfirming}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Waiting for confirmation...' : 
           isConfirming ? 'Registering...' : 
           'Register as Seller'}
        </button>
        {(isPending || isConfirming) && (
          <p className="text-sm text-yellow-700 mt-3">
            Please confirm the transaction in your wallet
          </p>
        )}
      </div>
    </div>
  );
}

export default SellerRegistration;