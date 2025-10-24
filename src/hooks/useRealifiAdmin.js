// hooks/useAdminActions.js
import { useCallback, useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getAddress, isAddress } from 'viem';
import { REAL_ESTATE_DAPP } from '@/config/contract.config'; // adjust path

function normalizeAddress(maybeAddress) {
  if (!maybeAddress) return null;
  try {
    return getAddress(maybeAddress.trim());
  } catch (e) {
    return null;
  }
}

function useWriteFlow(contractAddress, fnName) {
  // A wrapper to track write + receipt
  const [localError, setLocalError] = useState(null);
  const { writeContract, data: hash, isLoading: isWriteLoading, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isReceiptError, error: receiptError } = useWaitForTransactionReceipt({ hash });

  // combined isLoading and error
  const isLoading = Boolean(isWriteLoading || isConfirming);
  const error = writeError?.message || receiptError?.message || localError || null;

  useEffect(() => {
    // propagate underlying errors to localError for UI
    if (writeError) setLocalError(writeError.message);
    else if (receiptError) setLocalError(receiptError.message);
  }, [writeError, receiptError]);

  const call = useCallback(
    async (args = []) => {
      setLocalError(null);

      if (!contractAddress) {
        setLocalError('Contract address is required');
        return;
      }

      try {
        // do not await writeContract (wagmi returns immediate)
        writeContract({
          address: contractAddress,
          abi: REAL_ESTATE_DAPP,
          functionName: fnName,
          args,
        });
      } catch (err) {
        // defensive: some implementations may throw synchronously
        setLocalError(err?.message || 'Failed to submit transaction');
      }
    },
    [writeContract, contractAddress, fnName]
  );

  return {
    call,
    hash,
    isLoading,
    isSuccess,
    error,
  };
}

export function useAddAdmin(contractAddress) {
  const flow = useWriteFlow(contractAddress, 'addAdmin');

  const addAdmin = useCallback(
    async (rawAdminAddress) => {
      const clean = normalizeAddress(rawAdminAddress);
      if (!clean) {
        // return early and set local error via flow? set here:
        return Promise.resolve({ ok: false, error: 'Invalid address' });
      }
      // call returns immediately; the hook exposes isLoading/isSuccess
      flow.call([clean]);
      return Promise.resolve({ ok: true });
    },
    [flow]
  );

  return {
    addAdmin,
    hash: flow.hash,
    isLoading: flow.isLoading,
    isSuccess: flow.isSuccess,
    error: flow.error,
  };
}

export function useRemoveAdmin(contractAddress) {
  const flow = useWriteFlow(contractAddress, 'removeAdmin');

  const removeAdmin = useCallback(
    async (rawAdminAddress) => {
      const clean = normalizeAddress(rawAdminAddress);
      if (!clean) return Promise.resolve({ ok: false, error: 'Invalid address' });
      flow.call([clean]);
      return Promise.resolve({ ok: true });
    },
    [flow]
  );

  return {
    removeAdmin,
    hash: flow.hash,
    isLoading: flow.isLoading,
    isSuccess: flow.isSuccess,
    error: flow.error,
  };
}

export function useTransferOwnership(contractAddress) {
  const flow = useWriteFlow(contractAddress, 'transferOwnership');

  const transferOwnership = useCallback(
    async (rawNewOwner) => {
      const clean = normalizeAddress(rawNewOwner);
      if (!clean) return Promise.resolve({ ok: false, error: 'Invalid address' });
      flow.call([clean]);
      return Promise.resolve({ ok: true });
    },
    [flow]
  );

  return {
    transferOwnership,
    hash: flow.hash,
    isLoading: flow.isLoading,
    isSuccess: flow.isSuccess,
    error: flow.error,
  };
}

export function useRenounceOwnership(contractAddress) {
  const flow = useWriteFlow(contractAddress, 'renounceOwnership');

  const renounceOwnership = useCallback(async () => {
    flow.call([]); // no args
    return Promise.resolve({ ok: true });
  }, [flow]);

  return {
    renounceOwnership,
    hash: flow.hash,
    isLoading: flow.isLoading,
    isSuccess: flow.isSuccess,
    error: flow.error,
  };
}
