// src/pages/AdminAssetDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS } from '@/config/contract.config';
import { 
  ArrowLeft, Shield, CheckCircle, XCircle, DollarSign, 
  Users, TrendingUp, Settings, AlertCircle, Home, 
  RefreshCw, Eye, Trash2, Split, Download
} from 'lucide-react';

export const AdminAssetDetailsPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [notification, setNotification] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  // Form states
  const [numTokensToFractionalize, setNumTokensToFractionalize] = useState('');
  const [dividendAmount, setDividendAmount] = useState('');
  const [withdrawPermission, setWithdrawPermission] = useState(true);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Check if current user is admin
  const { data: isAdmin } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'isAdmin',
    args: address ? [address] : undefined,
  });

  // Check if current user is owner
  const { data: ownerAddress } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'owner',
  });

  const isOwner = address && ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase();

  // Fetch asset details
  const { data: assetData, refetch: refetchAsset, isLoading: loadingAsset } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getAssetDisplayInfo',
    args: propertyId ? [BigInt(propertyId)] : undefined,
  });

  // Fetch fractional buyers if fractionalized
  const { data: fractionalBuyers, refetch: refetchBuyers } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchFractionalAssetBuyers',
    args: assetData?.isFractionalized && propertyId ? [BigInt(propertyId)] : undefined,
  });

  // Fetch share listings
  const { data: shareListings, refetch: refetchListings } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getAssetShareListings',
    args: assetData?.isFractionalized && propertyId ? [BigInt(propertyId)] : undefined,
  });

  // Fetch accumulated payments
  const { data: accumulatedPayments } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getFractionalPayments',
    args: assetData?.isFractionalized && propertyId ? [BigInt(propertyId)] : undefined,
  });

  const loading = isPending || isConfirming || loadingAsset;

  // Redirect if not admin
  useEffect(() => {
    if (isConnected && isAdmin === false && !isOwner) {
      navigate('/');
    }
  }, [isAdmin, isOwner, isConnected, navigate]);

  // Refetch data after transaction
  useEffect(() => {
    if (!isPending && !isConfirming && hash) {
      refetchAsset();
      refetchBuyers();
      refetchListings();
    }
  }, [isPending, isConfirming, hash, refetchAsset, refetchBuyers, refetchListings]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatPrice = (price) => {
    return (Number(price) / 1000000).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Admin Actions
  const verifyAsset = async () => {
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'verifyAsset',
        args: [BigInt(propertyId)],
      });
      showNotification(`Asset #${propertyId} verification submitted!`, 'success');
      setActiveAction(null);
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  const confirmPayment = async () => {
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'confirmAssetPayment',
        args: [BigInt(propertyId)],
      });
      showNotification('Payment confirmation submitted!', 'success');
      setActiveAction(null);
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  const setWithdrawPermissions = async () => {
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'setBuyerCanWithdraw',
        args: [BigInt(propertyId), withdrawPermission],
      });
      showNotification('Withdrawal permission updated!', 'success');
      setActiveAction(null);
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  const delistAsset = async () => {
    if (!window.confirm('Are you sure you want to delist this asset? This action cannot be undone.')) {
      return;
    }
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'delistAsset',
        args: [BigInt(propertyId)],
      });
      showNotification('Asset delisting submitted!', 'success');
      setActiveAction(null);
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  const createFractionalAsset = async () => {
    if (!numTokensToFractionalize || Number(numTokensToFractionalize) <= 0) {
      showNotification('Please enter a valid number of tokens', 'error');
      return;
    }
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'createFractionalAsset',
        args: [BigInt(propertyId), BigInt(numTokensToFractionalize)],
      });
      showNotification('Fractionalization submitted!', 'success');
      setActiveAction(null);
      setNumTokensToFractionalize('');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  const distributeDividends = async () => {
    if (!dividendAmount || Number(dividendAmount) <= 0) {
      showNotification('Please enter a valid dividend amount', 'error');
      return;
    }
    try {
      const amount = BigInt(Math.floor(parseFloat(dividendAmount) * 1000000));
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'distributeFractionalDividends',
        args: [BigInt(propertyId), amount],
      });
      showNotification('Dividend distribution submitted!', 'success');
      setActiveAction(null);
      setDividendAmount('');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  if (loadingAsset) {
    return (
      <div className="min-h-screen bg-[#121317] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#CAAB5B] animate-spin mx-auto mb-4" />
          <p className="text-[#E1E2E2] text-lg">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (!assetData) {
    return (
      <div className="min-h-screen bg-[#121317] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#E1E2E2] mb-2">Asset Not Found</h2>
          <p className="text-[#6D6041] mb-6">The requested asset does not exist</p>
          <button
            onClick={() => navigate('/admin')}
            className="px-6 py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121317]">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-[#CAAB5B]/20 border border-[#CAAB5B]' : 'bg-red-500/20 border border-red-500'
        } max-w-md`}>
          <AlertCircle className={`w-5 h-5 ${notification.type === 'success' ? 'text-[#CAAB5B]' : 'text-red-500'}`} />
          <span className="text-[#E1E2E2]">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#111216] border-b border-[#2C2C2C]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-[#6D6041] hover:text-[#CAAB5B] transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#CAAB5B]/20 to-[#CAAB5B]/5 rounded-xl flex items-center justify-center">
                <Home className="w-8 h-8 text-[#CAAB5B]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#E1E2E2]">Property #{propertyId}</h1>
                <p className="text-[#6D6041]">Admin Asset Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {assetData.verified ? (
                <span className="px-4 py-2 bg-[#CAAB5B] text-[#121317] text-sm font-semibold rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <span className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-500 text-sm font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Unverified
                </span>
              )}
              
              <button
                onClick={() => {
                  refetchAsset();
                  refetchBuyers();
                  refetchListings();
                  showNotification('Data refreshed', 'success');
                }}
                className="p-2 bg-[#CAAB5B]/10 text-[#CAAB5B] rounded-lg hover:bg-[#CAAB5B]/20 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Asset Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Overview */}
            <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#E1E2E2] mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#CAAB5B]" />
                Asset Overview
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#121317] rounded-lg p-4">
                  <p className="text-xs text-[#6D6041] mb-1">Price</p>
                  <p className="text-2xl font-bold text-[#CAAB5B]">${formatPrice(assetData.price)}</p>
                </div>
                <div className="bg-[#121317] rounded-lg p-4">
                  <p className="text-xs text-[#6D6041] mb-1">Token ID</p>
                  <p className="text-2xl font-bold text-[#E1E2E2]">#{assetData.tokenId.toString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[#2C2C2C]">
                  <span className="text-[#6D6041]">Seller</span>
                  <span className="font-mono text-[#E1E2E2]">
                    {assetData.seller.slice(0, 10)}...{assetData.seller.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2C2C2C]">
                  <span className="text-[#6D6041]">Status</span>
                  <span className={`font-semibold ${assetData.sold ? 'text-[#6D6041]' : 'text-[#CAAB5B]'}`}>
                    {assetData.sold ? 'Sold' : 'Available'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2C2C2C]">
                  <span className="text-[#6D6041]">Payment Status</span>
                  <span className={`font-semibold ${assetData.isPaidFor ? 'text-[#CAAB5B]' : 'text-red-500'}`}>
                    {assetData.isPaidFor ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2C2C2C]">
                  <span className="text-[#6D6041]">Canceled</span>
                  <span className={`font-semibold ${assetData.isCanceled ? 'text-red-500' : 'text-[#CAAB5B]'}`}>
                    {assetData.isCanceled ? 'Yes' : 'No'}
                  </span>
                </div>
                {assetData.currentBuyer && assetData.currentBuyer !== '0x0000000000000000000000000000000000000000' && (
                  <div className="flex justify-between py-2 border-b border-[#2C2C2C]">
                    <span className="text-[#6D6041]">Current Buyer</span>
                    <span className="font-mono text-[#E1E2E2]">
                      {assetData.currentBuyer.slice(0, 10)}...{assetData.currentBuyer.slice(-8)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Fractional Info */}
            {assetData.isFractionalized && (
              <>
                <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6">
                  <h2 className="text-xl font-bold text-[#E1E2E2] mb-6 flex items-center gap-2">
                    <Split className="w-5 h-5 text-[#CAAB5B]" />
                    Fractionalization Details
                  </h2>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#CAAB5B]/10 border border-[#CAAB5B]/30 rounded-lg p-4">
                      <p className="text-xs text-[#CAAB5B] mb-1">Total Tokens</p>
                      <p className="text-2xl font-bold text-[#E1E2E2]">{assetData.totalFractionalTokens.toString()}</p>
                    </div>
                    <div className="bg-[#CAAB5B]/10 border border-[#CAAB5B]/30 rounded-lg p-4">
                      <p className="text-xs text-[#CAAB5B] mb-1">Remaining</p>
                      <p className="text-2xl font-bold text-[#E1E2E2]">{assetData.remainingFractionalTokens.toString()}</p>
                    </div>
                    <div className="bg-[#CAAB5B]/10 border border-[#CAAB5B]/30 rounded-lg p-4">
                      <p className="text-xs text-[#CAAB5B] mb-1">Price/Token</p>
                      <p className="text-xl font-bold text-[#E1E2E2]">${formatPrice(assetData.pricePerFractionalToken)}</p>
                    </div>
                  </div>

                  <div className="bg-[#121317] rounded-lg p-4">
                    <p className="text-sm text-[#6D6041] mb-1">Accumulated Payments</p>
                    <p className="text-2xl font-bold text-[#CAAB5B]">
                      ${formatPrice(assetData.accumulatedFractionalPayments)} USDC
                    </p>
                  </div>
                </div>

                {/* Fractional Buyers */}
                {fractionalBuyers && fractionalBuyers.length > 0 && (
                  <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6">
                    <h2 className="text-xl font-bold text-[#E1E2E2] mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#CAAB5B]" />
                      Shareholders ({fractionalBuyers.length})
                    </h2>

                    <div className="space-y-3">
                      {fractionalBuyers.map((buyer, index) => (
                        <div key={index} className="bg-[#121317] rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm text-[#E1E2E2] mb-1">
                              {buyer.buyer.slice(0, 10)}...{buyer.buyer.slice(-8)}
                            </p>
                            <p className="text-xs text-[#6D6041]">
                              {buyer.numTokens.toString()} tokens • {(Number(buyer.percentage) / 100).toFixed(2)}% ownership
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#CAAB5B]">
                              ${formatPrice(BigInt(buyer.numTokens) * assetData.pricePerFractionalToken)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Admin Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#E1E2E2] mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#CAAB5B]" />
                Admin Actions
              </h2>

              <div className="space-y-3">
                {!assetData.verified && (
                  <button
                    onClick={() => setActiveAction('verify')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors font-medium disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Verify Asset
                  </button>
                )}

                {!assetData.isPaidFor && assetData.currentBuyer !== '0x0000000000000000000000000000000000000000' && (
                  <button
                    onClick={() => setActiveAction('confirmPayment')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#CAAB5B]/10 border border-[#CAAB5B] text-[#CAAB5B] rounded-lg hover:bg-[#CAAB5B]/20 transition-colors font-medium disabled:opacity-50"
                  >
                    <DollarSign className="w-5 h-5" />
                    Confirm Payment
                  </button>
                )}

                <button
                  onClick={() => setActiveAction('withdrawPermission')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#CAAB5B]/10 border border-[#CAAB5B] text-[#CAAB5B] rounded-lg hover:bg-[#CAAB5B]/20 transition-colors font-medium disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  Withdrawal Settings
                </button>

                {!assetData.isFractionalized && !assetData.sold && (
                  <button
                    onClick={() => setActiveAction('fractionalize')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#CAAB5B]/10 border border-[#CAAB5B] text-[#CAAB5B] rounded-lg hover:bg-[#CAAB5B]/20 transition-colors font-medium disabled:opacity-50"
                  >
                    <Split className="w-5 h-5" />
                    Fractionalize Asset
                  </button>
                )}

                {assetData.isFractionalized && (
                  <button
                    onClick={() => setActiveAction('dividends')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#CAAB5B]/10 border border-[#CAAB5B] text-[#CAAB5B] rounded-lg hover:bg-[#CAAB5B]/20 transition-colors font-medium disabled:opacity-50"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Distribute Dividends
                  </button>
                )}

                {!assetData.sold && (
                  <button
                    onClick={() => setActiveAction('delist')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors font-medium disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delist Asset
                  </button>
                )}
              </div>
            </div>

            {/* Action Panel */}
            {activeAction && (
              <div className="bg-[#111216] border border-[#CAAB5B] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#E1E2E2]">
                    {activeAction === 'verify' && 'Verify Asset'}
                    {activeAction === 'confirmPayment' && 'Confirm Payment'}
                    {activeAction === 'withdrawPermission' && 'Withdrawal Permission'}
                    {activeAction === 'fractionalize' && 'Fractionalize Asset'}
                    {activeAction === 'dividends' && 'Distribute Dividends'}
                    {activeAction === 'delist' && 'Delist Asset'}
                  </h3>
                  <button
                    onClick={() => setActiveAction(null)}
                    className="text-[#6D6041] hover:text-[#E1E2E2]"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {activeAction === 'verify' && (
                  <div className="space-y-4">
                    <p className="text-sm text-[#6D6041]">
                      Mark this asset as verified and approved for purchase.
                    </p>
                    <button
                      onClick={verifyAsset}
                      disabled={loading}
                      className="w-full py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Verification'}
                    </button>
                  </div>
                )}

                {activeAction === 'confirmPayment' && (
                  <div className="space-y-4">
                    <p className="text-sm text-[#6D6041]">
                      Confirm that the buyer has made the payment for this asset.
                    </p>
                    <button
                      onClick={confirmPayment}
                      disabled={loading}
                      className="w-full py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </div>
                )}

                {activeAction === 'withdrawPermission' && (
                  <div className="space-y-4">
                    <p className="text-sm text-[#6D6041] mb-4">
                      Control whether buyers can withdraw funds for this asset.
                    </p>
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => setWithdrawPermission(true)}
                        className={`flex-1 py-3 rounded-lg border-2 transition-colors font-medium ${
                          withdrawPermission
                            ? 'border-[#CAAB5B] bg-[#CAAB5B]/10 text-[#CAAB5B]'
                            : 'border-[#2C2C2C] bg-[#121317] text-[#6D6041]'
                        }`}
                      >
                        Allow
                      </button>
                      <button
                        onClick={() => setWithdrawPermission(false)}
                        className={`flex-1 py-3 rounded-lg border-2 transition-colors font-medium ${
                          !withdrawPermission
                            ? 'border-red-500 bg-red-500/10 text-red-500'
                            : 'border-[#2C2C2C] bg-[#121317] text-[#6D6041]'
                        }`}
                      >
                        Block
                      </button>
                    </div>
                    <button
                      onClick={setWithdrawPermissions}
                      disabled={loading}
                      className="w-full py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Update Permission'}
                    </button>
                  </div>
                )}

                {activeAction === 'fractionalize' && (
                  <div className="space-y-4">
                    <p className="text-sm text-[#6D6041]">
                      Convert this whole asset into fractional tokens for shared ownership.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-[#E1E2E2] mb-2">
                        Number of Tokens
                      </label>
                      <input
                        type="number"
                        value={numTokensToFractionalize}
                        onChange={(e) => setNumTokensToFractionalize(e.target.value)}
                        placeholder="e.g., 1000"
                        className="w-full px-4 py-3 bg-[#121317] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent placeholder-[#6D6041]"
                      />
                    </div>
                    <button
                      onClick={createFractionalAsset}
                      disabled={loading || !numTokensToFractionalize}
                      className="w-full py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Fractionalize Asset'}
                    </button>
                  </div>
                )}

                {activeAction === 'dividends' && (
                  <div className="space-y-4">
                    <p className="text-sm text-[#6D6041]">
                      Distribute rental income or dividends to all shareholders proportionally.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-[#E1E2E2] mb-2">
                        Amount (USDC)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={dividendAmount}
                        onChange={(e) => setDividendAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-[#121317] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent placeholder-[#6D6041]"
                      />
                    </div>
                    <div className="bg-[#CAAB5B]/10 border border-[#CAAB5B]/30 rounded-lg p-3">
                      <p className="text-xs text-[#CAAB5B]">
                        This amount will be distributed to {fractionalBuyers?.length || 0} shareholders based on their ownership percentage.
                      </p>
                    </div>
                    <button
                      onClick={distributeDividends}
                      disabled={loading || !dividendAmount}
                      className="w-full py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Distribute Dividends'}
                    </button>
                  </div>
                )}

                {activeAction === 'delist' && (
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-500">Warning</p>
                          <p className="text-sm text-[#6D6041] mt-1">
                            This will permanently remove the asset from the marketplace. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={delistAsset}
                      disabled={loading}
                      className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Delisting'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};