import { useState } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS } from '../config/contract.config';
import { formatUnits, parseUnits } from 'viem';

export function SellerDashboard() {
  const { address, isConnected } = useAccount();
  const [actionTokenId, setActionTokenId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  
  // Fractionalization inputs
  const [totalTokens, setTotalTokens] = useState('100');
  
  // Dividend inputs
  const [dividendAmount, setDividendAmount] = useState('');

  // Check if user is a registered seller
  const { data: isSeller, isLoading: isSellerLoading, isError: isSellerError, error: sellerError, refetch: refetchSeller } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'sellers',
    args: address ? [address] : undefined,
  });

  // Fetch seller's assets
  const { data: assets, isLoading, isError, error: assetsError, refetch } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getSellerAssets',
    args: address ? [address] : undefined,
  });

  // Get seller metrics
  const { data: sellerMetrics, isError: isMetricsError, error: metricsError, refetch: refetchMetrics } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getSellerMetrics',
    args: address ? [address] : undefined,
  });

  // Transaction handling
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDelistClick = (asset) => {
    setSelectedAsset(asset);
    setActionType('delist');
    setShowConfirmModal(true);
  };

  const handleConfirmPaymentClick = (asset) => {
    setSelectedAsset(asset);
    setActionType('confirm');
    setShowConfirmModal(true);
  };

  const handleFractionalizeClick = (asset) => {
    setSelectedAsset(asset);
    setActionType('fractionalize');
    setShowConfirmModal(true);
  };

  const handleDividendClick = (asset) => {
    setSelectedAsset(asset);
    setActionType('dividend');
    setShowConfirmModal(true);
  };

  const handleDelistAsset = async () => {
    if (!selectedAsset) return;

    try {
      setActionTokenId(selectedAsset.tokenId);
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'delistAsset',
        args: [selectedAsset.tokenId],
      });
    } catch (err) {
      console.error('Error delisting asset:', err);
      alert('Failed to delist asset: ' + (err.message || 'Unknown error. Please check your wallet and try again.'));
      setActionTokenId(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedAsset) return;

    try {
      setActionTokenId(selectedAsset.tokenId);
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'confirmAssetPayment',
        args: [selectedAsset.tokenId],
      });
    } catch (err) {
      console.error('Error confirming payment:', err);
      alert('Failed to confirm payment: ' + (err.message || 'Unknown error. Please check your wallet and try again.'));
      setActionTokenId(null);
    }
  };

  const handleFractionalizeAsset = async () => {
    if (!selectedAsset || !totalTokens) return;

    try {
      setActionTokenId(selectedAsset.tokenId);
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'createFractionalAsset',
        args: [selectedAsset.tokenId, BigInt(totalTokens)],
      });
    } catch (err) {
      console.error('Error fractionalizing asset:', err);
      alert('Failed to fractionalize asset: ' + (err.message || 'Unknown error. Please check your wallet and try again.'));
      setActionTokenId(null);
    }
  };

  const handleDistributeDividend = async () => {
    if (!selectedAsset || !dividendAmount) return;

    try {
      setActionTokenId(selectedAsset.tokenId);
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'distributeFractionalDividends',
        args: [selectedAsset.tokenId, parseUnits(dividendAmount, 6)], // USDC has 6 decimals
      });
    } catch (err) {
      console.error('Error distributing dividend:', err);
      alert('Failed to distribute dividend: ' + (err.message || 'Unknown error. Please check your wallet and sufficient USDC balance.'));
      setActionTokenId(null);
    }
  };

  // Reset state and refetch when transaction succeeds
  if (isSuccess && actionTokenId) {
    setTimeout(() => {
      setActionTokenId(null);
      setActionType(null);
      setShowConfirmModal(false);
      setSelectedAsset(null);
      setTotalTokens('100');
      setDividendAmount('');
      refetch();
    }, 2000);
  }

  const { 
  data: registerHash, 
  writeContract: registerSeller, 
  isPending: isRegisterPending 
} = useWriteContract();

const { 
  isLoading: isRegisterConfirming, 
  isSuccess: isRegisterSuccess 
} = useWaitForTransactionReceipt({
  hash: registerHash,
});

// Add registration handler
const handleRegisterSeller = async () => {
  try {
    setIsRegistering(true);
    registerSeller({
      address: REAL_ESTATE_DAPP_ADDRESS,
      abi: REAL_ESTATE_DAPP,
      functionName: 'registerSeller',
    });
  } catch (err) {
    console.error('Error registering as seller:', err);
    alert('Failed to register as seller: ' + (err.message || 'Unknown error. Please check your wallet and try again.'));
    setIsRegistering(false);
  }
};

// Refetch seller status when registration succeeds
if (isRegisterSuccess) {
  setTimeout(() => {
    setIsRegistering(false);
    window.location.reload(); // Reload to update seller status
  }, 2000);
}

// Handle seller status loading
if (isSellerLoading) {
  return (
    <div className="bg-[#121317] min-h-screen py-10 px-5 flex justify-center items-center">
      <div className="text-center">
        <div className="text-5xl mb-4">⏳</div>
        <div className="text-[#E1E2E2] text-lg mb-2">
          Checking seller status...
        </div>
        <div className="text-[#6D6041] text-sm">
          Please wait while we verify your account
        </div>
      </div>
    </div>
  );
}

// Handle seller status error
if (isSellerError) {
  return (
    <div className="bg-[#121317] min-h-screen py-10 px-5 flex justify-center items-center">
      <div className="bg-[#111216] border border-[#f44336] rounded-xl p-10 text-center max-w-[500px]">
        <div className="text-5xl mb-4">⚠️</div>
        <div className="text-[#E1E2E2] text-lg mb-2">
          Failed to Check Seller Status
        </div>
        <div className="text-[#6D6041] text-sm mb-4">
          {sellerError?.message || 'Unable to verify your seller status. Please check your wallet connection and network.'}
        </div>
        <button
          onClick={() => refetchSeller()}
          className="py-3.5 px-7 bg-[#CAAB5B] text-[#121317] border-none rounded-lg text-base font-bold cursor-pointer transition-opacity"
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          🔄 Retry
        </button>
      </div>
    </div>
  );
}

// Update the "Not a Registered Seller" section
if (!isSeller) {
  return (
    <div className="bg-[#121317] min-h-screen py-10 px-5 flex justify-center items-center">
      <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-10 text-center max-w-[500px]">
        <div className="text-5xl mb-4">🏠</div>
        <div className="text-[#E1E2E2] text-lg mb-2">
          Not a Registered Seller
        </div>
        <div className="text-[#6D6041] text-sm mb-6">
          You need to register as a seller to access this dashboard and list your real estate assets
        </div>

        {/* Transaction Status for Registration */}
        {registerHash && (
          <div className="mb-6 p-4 bg-[#121317] border border-[#2C2C2C] rounded-xl text-left">
            {isRegisterConfirming && (
              <div className="text-[#CAAB5B] mb-2 font-bold">
                ⏳ Registration confirming...
              </div>
            )}
            {isRegisterSuccess && (
              <div className="text-[#4CAF50] mb-2 font-bold">
                ✓ Registration successful! Redirecting...
              </div>
            )}
            <div className="text-[#6D6041] text-xs mb-1">
              Transaction Hash:
            </div>
            <div className="text-[#E1E2E2] text-[11px] font-mono break-all">
              {registerHash}
            </div>
          </div>
        )}

        <button
          onClick={handleRegisterSeller}
          disabled={isRegisterPending || isRegisterConfirming || isRegistering}
          className="py-3.5 px-7 border-none rounded-lg text-base font-bold transition-opacity w-full"
          style={{
            backgroundColor: isRegisterPending || isRegisterConfirming || isRegistering ? '#2C2C2C' : '#CAAB5B',
            color: isRegisterPending || isRegisterConfirming || isRegistering ? '#6D6041' : '#121317',
            cursor: isRegisterPending || isRegisterConfirming || isRegistering ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isRegisterPending && !isRegisterConfirming && !isRegistering) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRegisterPending && !isRegisterConfirming && !isRegistering) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isRegisterPending && 'Confirm in wallet...'}
          {isRegisterConfirming && 'Registering...'}
          {isRegisterSuccess && 'Success! Redirecting...'}
          {!isRegisterPending && !isRegisterConfirming && !isRegisterSuccess && 'Register as Seller'}
        </button>

        <div className="mt-4 p-3 bg-[#121317] border border-[#2C2C2C] rounded-lg text-xs text-[#6D6041] text-center">
          ℹ️ Free to register - no fees required
        </div>
      </div>
    </div>
  );
}

  if (!isConnected) {
    return (
      <div className="bg-[#121317] min-h-screen py-10 px-5 flex justify-center items-center">
        <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-10 text-center max-w-[400px]">
          <div className="text-5xl mb-4">🔒</div>
          <div className="text-[#E1E2E2] text-lg mb-2">
            Connect Your Wallet
          </div>
          <div className="text-[#6D6041] text-sm">
            Please connect your wallet to access the seller dashboard
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[#121317] min-h-screen py-10 px-5 flex justify-center items-center">
        <div className="text-[#E1E2E2] text-lg">
          Loading your assets...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#121317] min-h-screen py-10 px-5 flex justify-center items-center">
        <div className="bg-[#111216] border border-[#f44336] rounded-xl p-10 text-center max-w-[500px]">
          <div className="text-5xl mb-4">❌</div>
          <div className="text-[#E1E2E2] text-lg mb-2">
            Error Loading Assets
          </div>
          <div className="text-[#6D6041] text-sm mb-4">
            {assetsError?.message || 'Unable to load your assets. This could be due to network issues or wallet connection problems.'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.location.reload()}
              className="py-3.5 px-5 bg-[#2C2C2C] text-[#E1E2E2] border-none rounded-lg text-sm font-bold cursor-pointer transition-opacity"
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => refetch()}
              className="py-3.5 px-5 bg-[#CAAB5B] text-[#121317] border-none rounded-lg text-sm font-bold cursor-pointer transition-opacity"
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableAssets = assets?.filter(
    asset => !asset.sold && !asset.isCanceled && !asset.isFractionalized
  ) || [];

  const fractionalizedAssets = assets?.filter(
    asset => asset.isFractionalized
  ) || [];

  const pendingPaymentAssets = assets?.filter(
    asset => asset.currentBuyer !== '0x0000000000000000000000000000000000000000' && !asset.isPaidFor
  ) || [];

  const soldAssets = assets?.filter(asset => asset.sold) || [];

  return (
    <div className="bg-[#121317] min-h-screen py-10 px-5">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-[#CAAB5B] text-[32px] font-bold m-0 mb-2">
              Seller Dashboard
            </h1>
            <p className="text-[#6D6041] text-sm m-0">
              Manage your real estate listings
            </p>
          </div>
          <div className="bg-[#111216] border border-[#CAAB5B] rounded-lg py-2 px-4 text-[#CAAB5B] text-sm font-bold">
            🏷️ Seller
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-10">
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-5">
            <div className="text-[#6D6041] text-xs mb-2">
              TOTAL LISTINGS
            </div>
            <div className="text-[#E1E2E2] text-[28px] font-bold">
              {assets?.length || 0}
            </div>
          </div>
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-5">
            <div className="text-[#6D6041] text-xs mb-2">
              AVAILABLE
            </div>
            <div className="text-[#CAAB5B] text-[28px] font-bold">
              {availableAssets.length}
            </div>
          </div>
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-5">
            <div className="text-[#6D6041] text-xs mb-2">
              FRACTIONALIZED
            </div>
            <div className="text-[#CAAB5B] text-[28px] font-bold">
              {fractionalizedAssets.length}
            </div>
          </div>
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-5">
            <div className="text-[#6D6041] text-xs mb-2">
              SOLD
            </div>
            <div className="text-[#4CAF50] text-[28px] font-bold">
              {soldAssets.length}
            </div>
          </div>
        </div>

        {sellerMetrics && (
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6 mb-10">
            <h3 className="text-[#E1E2E2] text-lg font-bold mb-4">
              Performance Metrics
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
              <div>
                <div className="text-[#6D6041] text-xs mb-1">
                  Confirmed Sales
                </div>
                <div className="text-[#4CAF50] text-2xl font-bold">
                  {sellerMetrics[0]?.toString() || '0'}
                </div>
              </div>
              <div>
                <div className="text-[#6D6041] text-xs mb-1">
                  Canceled Sales
                </div>
                <div className="text-[#f44336] text-2xl font-bold">
                  {sellerMetrics[1]?.toString() || '0'}
                </div>
              </div>
              <div>
                <div className="text-[#6D6041] text-xs mb-1">
                  Success Rate
                </div>
                <div className="text-[#CAAB5B] text-2xl font-bold">
                  {sellerMetrics[0] && sellerMetrics[1]
                    ? `${Math.round((Number(sellerMetrics[0]) / (Number(sellerMetrics[0]) + Number(sellerMetrics[1]))) * 100)}%`
                    : '0%'}
                </div>
              </div>
            </div>
          </div>
        )}

        {hash && (
          <div className="mb-6 p-4 bg-[#111216] border border-[#2C2C2C] rounded-xl">
            {isConfirming && (
              <div className="text-[#CAAB5B] mb-2 font-bold">
                ⏳ Transaction confirming...
              </div>
            )}
            {isSuccess && (
              <div className="text-[#4CAF50] mb-2 font-bold">
                ✓ Action completed successfully!
              </div>
            )}
            <div className="text-[#6D6041] text-xs mb-1">
              Transaction Hash:
            </div>
            <div className="text-[#E1E2E2] text-xs font-mono break-all">
              {hash}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-[#111216] border border-[#f44336] rounded-xl">
            <div className="flex justify-between items-start mb-2">
              <div className="text-[#f44336] font-bold">
                ❌ Transaction Error
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-transparent border-none text-[#6D6041] text-xl cursor-pointer p-0"
              >
                ×
              </button>
            </div>
            <div className="text-[#E1E2E2] text-sm mb-3">
              {error.message || 'An error occurred during the transaction'}
            </div>
            <div className="text-[#6D6041] text-xs">
              💡 Tip: Make sure you have enough tokens and gas, and that you're on the correct network
            </div>
          </div>
        )}

        {/* Metrics Error Warning */}
        {isMetricsError && (
          <div className="mb-6 p-4 bg-[#111216] border border-[#ff9800] rounded-xl">
            <div className="text-[#ff9800] font-bold mb-2">
              ⚠️ Metrics Unavailable
            </div>
            <div className="text-[#E1E2E2] text-sm mb-3">
              Unable to load performance metrics: {metricsError?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => refetchMetrics()}
              className="py-2 px-4 bg-[#ff9800] text-[#121317] border-none rounded-lg text-xs font-bold cursor-pointer transition-opacity"
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              🔄 Retry Loading Metrics
            </button>
          </div>
        )}

        {pendingPaymentAssets.length > 0 && (
          <>
            <h2 className="text-[#ff9800] text-2xl font-bold mb-6 flex items-center gap-2">
              <span>⏳</span> Pending Payment Confirmation ({pendingPaymentAssets.length})
            </h2>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 mb-12">
              {pendingPaymentAssets.map((asset) => (
                <SellerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onDelist={handleDelistClick}
                  onConfirmPayment={handleConfirmPaymentClick}
                  onFractionalize={handleFractionalizeClick}
                  onDividend={handleDividendClick}
                  isProcessing={actionTokenId === asset.tokenId}
                  isPending={isPending}
                  isConfirming={isConfirming}
                  showConfirmPayment
                />
              ))}
            </div>
          </>
        )}

        {availableAssets.length > 0 && (
          <>
            <h2 className="text-[#CAAB5B] text-2xl font-bold mb-6 flex items-center gap-2">
              <span>🏠</span> Available Listings ({availableAssets.length})
            </h2>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 mb-12">
              {availableAssets.map((asset) => (
                <SellerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onDelist={handleDelistClick}
                  onConfirmPayment={handleConfirmPaymentClick}
                  onFractionalize={handleFractionalizeClick}
                  onDividend={handleDividendClick}
                  isProcessing={actionTokenId === asset.tokenId}
                  isPending={isPending}
                  isConfirming={isConfirming}
                />
              ))}
            </div>
          </>
        )}

        {fractionalizedAssets.length > 0 && (
          <>
            <h2 className="text-[#CAAB5B] text-2xl font-bold mb-6 flex items-center gap-2">
              <span>🔹</span> Fractionalized Assets ({fractionalizedAssets.length})
            </h2>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 mb-12">
              {fractionalizedAssets.map((asset) => (
                <SellerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onDelist={handleDelistClick}
                  onConfirmPayment={handleConfirmPaymentClick}
                  onFractionalize={handleFractionalizeClick}
                  onDividend={handleDividendClick}
                  isProcessing={actionTokenId === asset.tokenId}
                  isPending={isPending}
                  isConfirming={isConfirming}
                  isFractionalized
                />
              ))}
            </div>
          </>
        )}

        {soldAssets.length > 0 && (
          <>
            <h2 className="text-[#4CAF50] text-2xl font-bold mb-6 flex items-center gap-2">
              <span>✓</span> Sold Assets ({soldAssets.length})
            </h2>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
              {soldAssets.map((asset) => (
                <SellerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onDelist={handleDelistClick}
                  onConfirmPayment={handleConfirmPaymentClick}
                  onFractionalize={handleFractionalizeClick}
                  onDividend={handleDividendClick}
                  isProcessing={false}
                  isPending={false}
                  isConfirming={false}
                  isSold
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {assets && assets.length === 0 && (
          <div className="text-center py-[60px] px-5 text-[#6D6041]">
            <div className="text-5xl mb-4">🏠</div>
            <div className="text-lg mb-2">No assets listed yet</div>
            <div className="text-sm">
              Create your first asset to get started
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[1000] p-5">
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-2xl p-8 max-w-[500px] w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="m-0 text-2xl font-bold"
                style={{
                  color: actionType === 'delist' ? '#f44336' : 
                         actionType === 'fractionalize' ? '#CAAB5B' :
                         actionType === 'dividend' ? '#4CAF50' : '#4CAF50'
                }}>
                {actionType === 'delist' && 'Delist Asset'}
                {actionType === 'confirm' && 'Confirm Payment'}
                {actionType === 'fractionalize' && 'Fractionalize Asset'}
                {actionType === 'dividend' && 'Distribute Dividends'}
              </h2>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedAsset(null);
                  setActionType(null);
                }}
                className="bg-transparent border-none text-[#6D6041] text-2xl cursor-pointer p-0 w-8 h-8"
              >
                ×
              </button>
            </div>

            {/* Asset Details */}
            <div className="bg-[#121317] border border-[#2C2C2C] rounded-xl p-5 mb-6">
              <div className="flex justify-between mb-3">
                <span className="text-[#6D6041] text-sm">Token ID</span>
                <span className="text-[#E1E2E2] text-sm font-bold">
                  #{selectedAsset.tokenId.toString()}
                </span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-[#6D6041] text-sm">Price</span>
                <span className="text-[#CAAB5B] text-lg font-bold">
                  {formatUnits(selectedAsset.price, 6)} USDC
                </span>
              </div>
              {actionType === 'confirm' && selectedAsset.currentBuyer && (
                <div className="flex justify-between">
                  <span className="text-[#6D6041] text-sm">Buyer</span>
                  <span className="text-[#E1E2E2] text-xs font-mono">
                    {selectedAsset.currentBuyer.slice(0, 6)}...{selectedAsset.currentBuyer.slice(-4)}
                  </span>
                </div>
              )}
              {actionType === 'fractionalize' && (
                <div className="flex justify-between">
                  <span className="text-[#6D6041] text-sm">Status</span>
                  <span className="text-[#E1E2E2] text-sm">
                    {selectedAsset.verified ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
              )}
              {actionType === 'dividend' && (
                <>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#6D6041] text-sm">Total Tokens</span>
                    <span className="text-[#E1E2E2] text-sm">
                      {selectedAsset.totalFractionalTokens?.toString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6041] text-sm">Remaining Tokens</span>
                    <span className="text-[#E1E2E2] text-sm">
                      {selectedAsset.remainingFractionalTokens?.toString() || '0'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Fractionalize Input */}
            {actionType === 'fractionalize' && (
              <div className="mb-6">
                <label className="text-[#6D6041] text-sm block mb-2">
                  Number of Fractional Tokens
                </label>
                <input
                  type="number"
                  value={totalTokens}
                  onChange={(e) => setTotalTokens(e.target.value)}
                  placeholder="100"
                  className="w-full p-3 bg-[#121317] border border-[#2C2C2C] rounded-lg text-[#E1E2E2] text-sm"
                />
                <div className="text-[#6D6041] text-xs mt-2">
                  Price per token: {totalTokens && Number(totalTokens) > 0 
                    ? formatUnits(BigInt(selectedAsset.price.toString()) / BigInt(totalTokens), 6)
                    : '0'} USDC
                </div>
              </div>
            )}

            {/* Dividend Input */}
            {actionType === 'dividend' && (
              <div className="mb-6">
                <label className="text-[#6D6041] text-sm block mb-2">
                  Total Dividend Amount (USDC)
                </label>
                <input
                  type="number"
                  value={dividendAmount}
                  onChange={(e) => setDividendAmount(e.target.value)}
                  placeholder="1000"
                  step="0.01"
                  className="w-full p-3 bg-[#121317] border border-[#2C2C2C] rounded-lg text-[#E1E2E2] text-sm"
                />
                <div className="text-[#6D6041] text-xs mt-2">
                  This will be distributed proportionally to all token holders
                </div>
              </div>
            )}

            {/* Warning/Info Message */}
            <div className="rounded-xl p-4 mb-6 text-sm text-[#E1E2E2]"
              style={{
                backgroundColor: actionType === 'delist' ? '#f4433620' : 
                               actionType === 'fractionalize' ? '#CAAB5B20' :
                               actionType === 'dividend' ? '#4CAF5020' : '#4CAF5020',
                border: `1px solid ${actionType === 'delist' ? '#f44336' : 
                                      actionType === 'fractionalize' ? '#CAAB5B' :
                                      actionType === 'dividend' ? '#4CAF50' : '#4CAF50'}`
              }}>
              {actionType === 'delist' && (
                <>
                  <div className="font-bold mb-2 text-[#f44336]">
                    ⚠️ Warning
                  </div>
                  This will remove the asset from the marketplace. This action cannot be undone.
                </>
              )}
              {actionType === 'confirm' && (
                <>
                  <div className="font-bold mb-2 text-[#4CAF50]">
                    ✓ Confirm Payment
                  </div>
                  By confirming, you acknowledge that you have received the payment from the buyer. 
                  The asset ownership will be transferred to the buyer.
                </>
              )}
              {actionType === 'fractionalize' && (
                <>
                  <div className="font-bold mb-2 text-[#CAAB5B]">
                    🔹 Fractionalize Asset
                  </div>
                  This will convert your asset into {totalTokens} fractional tokens. Buyers can purchase 
                  individual tokens, allowing for partial ownership. You cannot undo this action.
                </>
              )}
              {actionType === 'dividend' && (
                <>
                  <div className="font-bold mb-2 text-[#4CAF50]">
                    💰 Distribute Dividends
                  </div>
                  The total amount of {dividendAmount} USDC will be distributed proportionally to all 
                  fractional token holders based on their ownership percentage.
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedAsset(null);
                  setActionType(null);
                }}
                disabled={isPending || isConfirming}
                className="py-3.5 bg-[#2C2C2C] text-[#E1E2E2] border-none rounded-xl text-sm font-bold"
                style={{
                  cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={
                  actionType === 'delist' ? handleDelistAsset : 
                  actionType === 'confirm' ? handleConfirmPayment :
                  actionType === 'fractionalize' ? handleFractionalizeAsset :
                  actionType === 'dividend' ? handleDistributeDividend : undefined
                }
                disabled={
                  isPending || isConfirming || 
                  (actionType === 'fractionalize' && (!totalTokens || Number(totalTokens) <= 0)) ||
                  (actionType === 'dividend' && (!dividendAmount || Number(dividendAmount) <= 0))
                }
                className="py-3.5 border-none rounded-xl text-sm font-bold text-white transition-opacity"
                style={{
                  backgroundColor: isPending || isConfirming 
                    ? '#2C2C2C' 
                    : actionType === 'delist' ? '#f44336' : 
                      actionType === 'fractionalize' ? '#CAAB5B' :
                      actionType === 'dividend' ? '#4CAF50' : '#4CAF50',
                  color: isPending || isConfirming ? '#6D6041' : '#fff',
                  cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isPending && !isConfirming) e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  if (!isPending && !isConfirming) e.currentTarget.style.opacity = '1';
                }}
              >
                {isPending && 'Confirm in wallet...'}
                {isConfirming && 'Processing...'}
                {!isPending && !isConfirming && (
                  actionType === 'delist' ? 'Delist' : 
                  actionType === 'confirm' ? 'Confirm Payment' :
                  actionType === 'fractionalize' ? 'Fractionalize' :
                  actionType === 'dividend' ? 'Distribute' : 'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Updated Seller Asset Card Component
function SellerAssetCard({
  asset,
  onDelist,
  onConfirmPayment,
  onFractionalize,
  onDividend,
  isProcessing,
  isPending,
  isConfirming,
  showConfirmPayment = false,
  isSold = false,
  isFractionalized = false
}) {
  return (
    <div
      className="bg-[#111216] rounded-xl p-6 transition-all"
      style={{
        border: `1px solid ${isSold ? '#4CAF50' : isFractionalized ? '#CAAB5B' : showConfirmPayment ? '#ff9800' : '#2C2C2C'}`,
      }}
      onMouseEnter={(e) => {
        if (!isSold) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(202, 171, 91, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSold) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#2C2C2C]">
        <div className="bg-[#CAAB5B] text-[#121317] py-1.5 px-3 rounded-md text-sm font-bold">
          #{asset.tokenId.toString()}
        </div>
        <div className="py-1.5 px-3 rounded-md text-xs font-medium text-white"
          style={{
            backgroundColor: isSold ? '#4CAF50' : asset.verified ? '#4CAF50' : '#ff9800',
          }}>
          {isSold ? '✓ Sold' : asset.verified ? '✓ Verified' : '⏳ Pending'}
        </div>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="text-[#6D6041] text-xs mb-1 uppercase tracking-wider">
          Price
        </div>
        <div className="text-[#CAAB5B] text-[28px] font-bold">
          {formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      {/* Fractional Info */}
      {isFractionalized && (
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-3 mb-5">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <div className="text-[#6D6041] text-[11px] mb-1">
                Total Tokens
              </div>
              <div className="text-[#E1E2E2] text-base font-bold">
                {asset.totalFractionalTokens?.toString() || '0'}
              </div>
            </div>
            <div>
              <div className="text-[#6D6041] text-[11px] mb-1">
                Remaining
              </div>
              <div className="text-[#CAAB5B] text-base font-bold">
                {asset.remainingFractionalTokens?.toString() || '0'}
              </div>
            </div>
          </div>
          <div>
            <div className="text-[#6D6041] text-[11px] mb-1">
              Price per Token
            </div>
            <div className="text-[#E1E2E2] text-sm font-bold">
              {asset.pricePerFractionalToken ? formatUnits(asset.pricePerFractionalToken, 6) : '0'} USDC
            </div>
          </div>
        </div>
      )}

      {/* Buyer Info (if applicable) */}
      {showConfirmPayment && asset.currentBuyer && (
        <div className="mb-5">
          <div className="text-[#6D6041] text-xs mb-1 uppercase tracking-wider">
            Buyer
          </div>
          <div className="text-[#E1E2E2] text-sm font-mono bg-[#121317] py-2 px-3 rounded-md overflow-hidden text-ellipsis">
            {asset.currentBuyer.slice(0, 10)}...{asset.currentBuyer.slice(-8)}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex gap-3 pt-4 border-t border-[#2C2C2C] mb-5">
        <div className="flex-1">
          <div className="text-[#6D6041] text-[11px] mb-1">
            Status
          </div>
          <div className="text-[#E1E2E2] text-sm font-medium">
            {isSold ? 'Sold' : 
             isFractionalized ? 'Fractionalized' :
             showConfirmPayment ? 'Awaiting Confirmation' : 'Listed'}
          </div>
        </div>
        {isFractionalized && (
          <div className="flex-1">
            <div className="text-[#6D6041] text-[11px] mb-1">
              Type
            </div>
            <div className="text-[#E1E2E2] text-sm font-medium">
              Fractional
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isSold && (
        <div className="grid gap-3"
          style={{
            gridTemplateColumns: showConfirmPayment ? '1fr 1fr' : isFractionalized ? '1fr 1fr' : '1fr 1fr'
          }}>
          {showConfirmPayment && (
            <button
              onClick={() => onConfirmPayment(asset)}
              disabled={isPending || isConfirming || isProcessing}
              className="py-3 border-none rounded-lg text-sm font-bold transition-opacity"
              style={{
                backgroundColor: isPending || isConfirming || isProcessing ? '#2C2C2C' : '#4CAF50',
                color: isPending || isConfirming || isProcessing ? '#6D6041' : '#fff',
                cursor: isPending || isConfirming || isProcessing ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isPending && !isConfirming && !isProcessing) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPending && !isConfirming && !isProcessing) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              ✓ Confirm
            </button>
          )}
          
          {!isFractionalized && !showConfirmPayment && asset.verified && (
            <button
              onClick={() => onFractionalize(asset)}
              disabled={isPending || isConfirming || isProcessing}
              className="py-3 border-none rounded-lg text-sm font-bold transition-opacity"
              style={{
                backgroundColor: isPending || isConfirming || isProcessing ? '#2C2C2C' : '#CAAB5B',
                color: isPending || isConfirming || isProcessing ? '#6D6041' : '#121317',
                cursor: isPending || isConfirming || isProcessing ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isPending && !isConfirming && !isProcessing) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPending && !isConfirming && !isProcessing) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              🔹 Fractionalize
            </button>
          )}

          {isFractionalized && (
            <button
              onClick={() => onDividend(asset)}
              disabled={isPending || isConfirming || isProcessing}
              className="py-3 border-none rounded-lg text-sm font-bold transition-opacity"
              style={{
                backgroundColor: isPending || isConfirming || isProcessing ? '#2C2C2C' : '#4CAF50',
                color: isPending || isConfirming || isProcessing ? '#6D6041' : '#fff',
                cursor: isPending || isConfirming || isProcessing ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isPending && !isConfirming && !isProcessing) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPending && !isConfirming && !isProcessing) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              💰 Dividend
            </button>
          )}

          <button
            onClick={() => onDelist(asset)}
            disabled={isPending || isConfirming || isProcessing}
            className="py-3 border-none rounded-lg text-sm font-bold text-white transition-opacity"
            style={{
              backgroundColor: isPending || isConfirming || isProcessing ? '#2C2C2C' : '#f44336',
              color: isPending || isConfirming || isProcessing ? '#6D6041' : '#fff',
              cursor: isPending || isConfirming || isProcessing ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isPending && !isConfirming && !isProcessing) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isPending && !isConfirming && !isProcessing) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            🗑️ Delist
          </button>
        </div>
      )}

      {isSold && (
        <div className="w-full py-3 bg-[#2C2C2C] text-[#4CAF50] border-none rounded-lg text-sm font-bold text-center">
          ✓ Sale Completed
        </div>
      )}
    </div>
  );
}