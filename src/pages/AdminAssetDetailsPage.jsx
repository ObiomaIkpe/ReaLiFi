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
  const { tokenId: propertyId } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [notification, setNotification] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState(0);

  // Form states
  const [numTokensToFractionalize, setNumTokensToFractionalize] = useState('');
  const [dividendAmount, setDividendAmount] = useState('');
  const [withdrawPermission, setWithdrawPermission] = useState(true);

  // Metadata state
  const [metadata, setMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

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

  // Fetch metadata from IPFS
  useEffect(() => {
    if (!assetData?.tokenURI) return;
    
    setMetadataLoading(true);
    fetch(assetData.tokenURI)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch metadata');
        return res.json();
      })
      .then(data => {
        setMetadata(data);
        setMetadataLoading(false);
      })
      .catch(err => {
        console.error('Error fetching metadata:', err);
        setMetadataLoading(false);
      });
  }, [assetData?.tokenURI]);

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
    }
  }, [isPending, isConfirming, hash, refetchAsset, refetchBuyers]);

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

  // Calculate financial metrics
  const netMonthlyIncome = metadata?.financialDetails 
    ? parseFloat(metadata.financialDetails.monthlyRevenue || 0) - parseFloat(metadata.financialDetails.monthlyExpenses || 0)
    : 0;

  const annualROI = metadata?.financialDetails?.purchasePrice
    ? ((netMonthlyIncome * 12) / parseFloat(metadata.financialDetails.purchasePrice)) * 100
    : 0;

  if (loadingAsset || metadataLoading) {
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
            onClick={() => navigate('/admin-dashboard')}
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
            onClick={() => navigate('/admin-dashboard')}
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
                <h1 className="text-3xl font-bold text-[#E1E2E2]">
                  {metadata?.propertyDetails?.title || `Property #${propertyId}`}
                </h1>
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
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6">
              <div className="relative w-full h-96 bg-[#121317] rounded-lg overflow-hidden mb-4">
                {metadata?.media?.images && metadata.media.images.length > 0 ? (
                  <img 
                    src={metadata.media.images[selectedImage]?.url}
                    alt={`Property image ${selectedImage + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => window.open(metadata.media.images[selectedImage]?.url, '_blank')}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#6D6041] gap-3">
                    <Home className="w-16 h-16" />
                    <div className="text-sm">No images available</div>
                  </div>
                )}

                {assetData.verified && (
                  <div className="absolute top-4 right-4 bg-[#4CAF50] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                    ✓ Verified
                  </div>
                )}

                {assetData.isFractionalized && (
                  <div className="absolute top-4 left-4 bg-[#CAAB5B] text-[#121317] px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                    🔹 Fractional
                  </div>
                )}

                {metadata?.media?.images && metadata.media.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs">
                    {selectedImage + 1} / {metadata.media.images.length}
                  </div>
                )}
              </div>

              {metadata?.media?.images && metadata.media.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {metadata.media.images.map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt={`Thumbnail ${i + 1}`}
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                        selectedImage === i ? 'border-[#CAAB5B] opacity-100' : 'border-[#2C2C2C] opacity-60 hover:opacity-80'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Property Info Card */}
            <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2C2C2C]">
                <h2 className="text-xl font-bold text-[#E1E2E2]">Property Information</h2>
                <span className="bg-[#2C2C2C] text-[#6D6041] px-3 py-1 rounded-lg text-xs">
                  Token #{propertyId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#121317] rounded-lg p-4">
                  <p className="text-xs text-[#6D6041] mb-1">Price</p>
                  <p className="text-2xl font-bold text-[#CAAB5B]">${formatPrice(assetData.price)}</p>
                </div>
                <div className="bg-[#121317] rounded-lg p-4">
                  <p className="text-xs text-[#6D6041] mb-1">Location</p>
                  <p className="text-lg font-bold text-[#E1E2E2]">
                    {metadata?.propertyDetails?.location || 'N/A'}
                  </p>
                </div>
              </div>

              {metadata?.propertyDetails?.type && (
                <div className="flex gap-2 mb-4">
                  <span className="bg-[#2C2C2C] text-[#E1E2E2] px-3 py-1 rounded-lg text-sm">
                    {metadata.propertyDetails.type}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[#2C2C2C]">
                  <span className="text-[#6D6041]">Seller</span>
                  <span className="font-mono text-[#E1E2E2] text-sm">
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
                {metadata?.timestamp && (
                  <div className="flex justify-between py-2 border-b border-[#2C2C2C]">
                    <span className="text-[#6D6041]">Listed on</span>
                    <span className="text-[#E1E2E2] text-sm">
                      {new Date(metadata.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tabbed Content */}
            <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl overflow-hidden">
              <div className="flex border-b border-[#2C2C2C] overflow-x-auto">
                <TabButton 
                  label="Overview" 
                  isActive={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                />
                <TabButton 
                  label="Financials" 
                  isActive={activeTab === 'financials'}
                  onClick={() => setActiveTab('financials')}
                />
                <TabButton 
                  label="Documents" 
                  isActive={activeTab === 'documents'}
                  onClick={() => setActiveTab('documents')}
                />
                {assetData.isFractionalized && (
                  <TabButton 
                    label="Investors" 
                    isActive={activeTab === 'investors'}
                    onClick={() => setActiveTab('investors')}
                    badge={fractionalBuyers?.length}
                  />
                )}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <OverviewTab metadata={metadata} />
                )}
                {activeTab === 'financials' && (
                  <FinancialsTab 
                    metadata={metadata}
                    netMonthlyIncome={netMonthlyIncome}
                    annualROI={annualROI}
                    formatPrice={formatPrice}
                  />
                )}
                {activeTab === 'documents' && (
                  <DocumentsTab metadata={metadata} />
                )}
                {activeTab === 'investors' && assetData.isFractionalized && (
                  <InvestorsTab 
                    fractionalBuyers={fractionalBuyers}
                    assetData={assetData}
                    formatPrice={formatPrice}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Admin Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6 sticky top-6">
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

// Tab Button Component
function TabButton({ label, isActive, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-fit px-6 py-4 text-sm font-bold border-b-2 transition-all relative ${
        isActive
          ? 'bg-[#121317] border-[#CAAB5B] text-[#CAAB5B]'
          : 'bg-transparent text-[#6D6041] border-transparent hover:text-[#CAAB5B]/70'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 bg-[#CAAB5B] text-[#121317] rounded-full min-w-[20px] h-5 text-xs flex items-center justify-center font-bold px-1.5">
          {badge}
        </span>
      )}
    </button>
  );
}

// Overview Tab Component
function OverviewTab({ metadata }) {
  return (
    <div>
      <h3 className="text-[#CAAB5B] text-lg font-bold mb-4">Property Description</h3>
      <p className="text-[#E1E2E2] leading-relaxed mb-6">
        {metadata?.propertyDetails?.description || 'No description available'}
      </p>

      {metadata?.ownerInformation && (
        <>
          <h3 className="text-[#CAAB5B] text-lg font-bold mb-4 mt-8">Owner Information</h3>
          <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              {metadata.ownerInformation.fullName && (
                <div>
                  <div className="text-xs text-[#6D6041] mb-1">Full Name</div>
                  <div className="text-sm text-[#E1E2E2]">{metadata.ownerInformation.fullName}</div>
                </div>
              )}
              {metadata.ownerInformation.email && (
                <div>
                  <div className="text-xs text-[#6D6041] mb-1">Email</div>
                  <div className="text-sm text-[#E1E2E2]">{metadata.ownerInformation.email}</div>
                </div>
              )}
              {metadata.ownerInformation.phone && (
                <div>
                  <div className="text-xs text-[#6D6041] mb-1">Phone</div>
                  <div className="text-sm text-[#E1E2E2]">{metadata.ownerInformation.phone}</div>
                </div>
              )}
            </div>
            <div className="mt-3 p-3 bg-[#ff9800]/10 border border-[#ff9800] rounded-lg">
              <p className="text-xs text-[#ff9800]">
                ℹ️ Contact information is provided by the seller. Verify independently before transacting.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Financials Tab Component
function FinancialsTab({ metadata, netMonthlyIncome, annualROI, formatPrice }) {
  const financials = metadata?.financialDetails;

  if (!financials) {
    return (
      <div className="text-center py-10 text-[#6D6041]">
        <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No financial information available</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[#CAAB5B] text-lg font-bold mb-4">Financial Details</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
          <div className="text-xs text-[#6D6041] mb-1">Purchase Price</div>
          <div className="text-xl font-bold text-[#E1E2E2]">
            ${parseFloat(financials.purchasePrice || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
          <div className="text-xs text-[#6D6041] mb-1">Tokenization Value</div>
          <div className="text-xl font-bold text-[#E1E2E2]">
            ${parseFloat(financials.tokenizationValue || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
          <div className="text-xs text-[#6D6041] mb-1">Potential Gain</div>
          <div className="text-xl font-bold text-[#4CAF50]">
            {(((parseFloat(financials.tokenizationValue) - parseFloat(financials.purchasePrice)) / parseFloat(financials.purchasePrice)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <h3 className="text-[#CAAB5B] text-lg font-bold mb-4 mt-8">Monthly Cash Flow</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
          <div className="text-xs text-[#6D6041] mb-1">Monthly Revenue</div>
          <div className="text-xl font-bold text-[#4CAF50]">
            ${parseFloat(financials.monthlyRevenue || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
          <div className="text-xs text-[#6D6041] mb-1">Monthly Expenses</div>
          <div className="text-xl font-bold text-[#f44336]">
            ${parseFloat(financials.monthlyExpenses || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
          <div className="text-xs text-[#6D6041] mb-1">Net Monthly Income</div>
          <div className={`text-xl font-bold ${netMonthlyIncome >= 0 ? 'text-[#4CAF50]' : 'text-[#f44336]'}`}>
            ${netMonthlyIncome.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
          <div className="text-xs text-[#6D6041] mb-1">Annual ROI</div>
          <div className={`text-xl font-bold ${annualROI >= 0 ? 'text-[#4CAF50]' : 'text-[#f44336]'}`}>
            {annualROI.toFixed(2)}%
          </div>
        </div>
      </div>

      {netMonthlyIncome < 0 && (
        <div className="bg-[#f44336]/10 border border-[#f44336] rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-[#f44336] flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-[#f44336] mb-1">⚠️ Negative Cash Flow</div>
              <div className="text-sm text-[#E1E2E2]">
                This property currently operates at a monthly loss of ${Math.abs(netMonthlyIncome).toLocaleString()}.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Documents Tab Component
function DocumentsTab({ metadata }) {
  const documents = metadata?.media?.documents;

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-10 text-[#6D6041]">
        <div className="text-5xl mb-3">📄</div>
        <p>No documents available</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[#CAAB5B] text-lg font-bold mb-4">Legal Documents</h3>
      
      <div className="space-y-3">
        {documents.map((doc, i) => (
          <div
            key={i}
            className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">📄</div>
              <div>
                <div className="text-sm font-bold text-[#E1E2E2] mb-1">{doc.name}</div>
                <div className="text-xs text-[#6D6041]">Stored on IPFS</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(doc.url, '_blank')}
                className="px-4 py-2 bg-[#CAAB5B] text-[#121317] rounded-lg text-xs font-bold hover:bg-[#CAAB5B]/90 transition-colors"
              >
                View
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = doc.url;
                  link.download = doc.name;
                  link.click();
                }}
                className="px-4 py-2 bg-[#2C2C2C] text-[#E1E2E2] rounded-lg text-xs font-bold hover:bg-[#2C2C2C]/80 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-[#4CAF50]/10 border border-[#4CAF50] rounded-lg">
        <p className="text-xs text-[#4CAF50]">
          🔒 All documents are securely stored on IPFS and verified by platform administrators.
        </p>
      </div>
    </div>
  );
}

// Investors Tab Component
function InvestorsTab({ fractionalBuyers, assetData, formatPrice }) {
  if (!fractionalBuyers || fractionalBuyers.length === 0) {
    return (
      <div className="text-center py-10 text-[#6D6041]">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="mb-2">No investors yet</p>
        <p className="text-sm">Waiting for first fractional purchase</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[#CAAB5B] text-lg font-bold mb-4">
        Current Investors ({fractionalBuyers.length})
      </h3>

      <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4 mb-6 grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-[#6D6041] mb-1">Total Investors</div>
          <div className="text-2xl font-bold text-[#E1E2E2]">{fractionalBuyers.length}</div>
        </div>
        <div>
          <div className="text-xs text-[#6D6041] mb-1">Tokens Sold</div>
          <div className="text-2xl font-bold text-[#4CAF50]">
            {Number(assetData.totalFractionalTokens) - Number(assetData.remainingFractionalTokens)} / {Number(assetData.totalFractionalTokens)}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#6D6041] mb-1">% Sold</div>
          <div className="text-2xl font-bold text-[#CAAB5B]">
            {(((Number(assetData.totalFractionalTokens) - Number(assetData.remainingFractionalTokens)) / Number(assetData.totalFractionalTokens)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0D0E11] border-b border-[#2C2C2C]">
            <tr>
              <th className="text-left text-xs text-[#6D6041] font-bold p-3">Rank</th>
              <th className="text-left text-xs text-[#6D6041] font-bold p-3">Investor</th>
              <th className="text-right text-xs text-[#6D6041] font-bold p-3">Tokens</th>
              <th className="text-right text-xs text-[#6D6041] font-bold p-3">Ownership</th>
              <th className="text-right text-xs text-[#6D6041] font-bold p-3">Investment</th>
            </tr>
          </thead>
          <tbody>
            {fractionalBuyers
              .sort((a, b) => Number(b.numTokens) - Number(a.numTokens))
              .map((buyer, i) => (
                <tr key={i} className={i < fractionalBuyers.length - 1 ? 'border-b border-[#2C2C2C]' : ''}>
                  <td className="text-[#E1E2E2] font-bold p-3">#{i + 1}</td>
                  <td className="text-[#E1E2E2] font-mono text-sm p-3">
                    {buyer.buyer.slice(0, 6)}...{buyer.buyer.slice(-4)}
                  </td>
                  <td className="text-[#E1E2E2] text-right font-bold p-3">
                    {buyer.numTokens.toString()}
                  </td>
                  <td className="text-[#4CAF50] text-right font-bold p-3">
                    {(Number(buyer.percentage) / 100).toFixed(2)}%
                  </td>
                  <td className="text-[#CAAB5B] text-right font-bold p-3">
                    ${formatPrice(BigInt(buyer.numTokens) * assetData.pricePerFractionalToken)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-[#CAAB5B]/10 border border-[#CAAB5B] rounded-lg">
        <p className="text-xs text-[#CAAB5B]">
          ℹ️ Investor rankings are based on number of tokens held. All data is public on the blockchain.
        </p>
      </div>
    </div>
  );
}