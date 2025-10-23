import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useCallback, useState, useEffect } from 'react';
import { parseAbi, isAddress } from 'viem';
import { REAL_ESTATE_DAPP } from '@/config/contract.config';



export function useAddAdmin(contractAddress) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const addAdmin = useCallback(
    async (adminAddress) => {
      if (!adminAddress || !contractAddress) {
        setError('Missing required parameters');
        return;
      }

      try {
        setError(null);
        setIsLoading(true);
        
        writeContract({
          address: contractAddress,
          abi: REAL_ESTATE_DAPP,
          functionName: 'addAdmin',
          args: [adminAddress],
        });
      } catch (err) {
        setError(err.message || 'Failed to add admin');
        setIsLoading(false);
      }
    },
    [writeContract, contractAddress]
  );

  return {
    addAdmin,
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useRemoveAdmin(contractAddress) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const removeAdmin = useCallback(
    async (adminAddress) => {
      if (!adminAddress || !contractAddress) {
        setError('Missing required parameters');
        return;
      }

      try {
        setError(null);
        setIsLoading(true);
        
        writeContract({
          address: contractAddress,
          abi: REALIFI_ABI,
          functionName: 'removeAdmin',
          args: [adminAddress],
        });
      } catch (err) {
        setError(err.message || 'Failed to remove admin');
        setIsLoading(false);
      }
    },
    [writeContract, contractAddress]
  );

  return {
    removeAdmin,
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useTransferOwnership(contractAddress) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transferOwnership = useCallback(
    async (newOwnerAddress) => {
      if (!newOwnerAddress || !contractAddress) {
        setError('Missing required parameters');
        return;
      }

      try {
        setError(null);
        setIsLoading(true);
        
        writeContract({
          address: contractAddress,
          abi: REALIFI_ABI,
          functionName: 'transferOwnership',
          args: [newOwnerAddress],
        });
      } catch (err) {
        setError(err.message || 'Failed to transfer ownership');
        setIsLoading(false);
      }
    },
    [writeContract, contractAddress]
  );

  return {
    transferOwnership,
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useRenounceOwnership(contractAddress) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const renounceOwnership = useCallback(async () => {
    if (!contractAddress) {
      setError('Contract address is required');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      writeContract({
        address: contractAddress,
        abi: REALIFI_ABI,
        functionName: 'renounceOwnership',
        args: [],
      });
    } catch (err) {
      setError(err.message || 'Failed to renounce ownership');
      setIsLoading(false);
    }
  }, [writeContract, contractAddress]);

  return {
    renounceOwnership,
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash,
  };
}