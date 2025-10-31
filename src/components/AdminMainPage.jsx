import React, { useState, useEffect } from 'react';
import { Shield, Users, CheckCircle, DollarSign, UserPlus, UserMinus, Key, RefreshCw, AlertCircle, Wallet, Settings, ExternalLink, Home } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MOCK_USDC, MOCK_USDC_ADDRESS, REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS } from '@/config/contract.config';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('assets');
  const [notification, setNotification] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate()

  // Form states
  const [tokenIdToVerify, setTokenIdToVerify] = useState('');
  const [tokenIdForWithdraw, setTokenIdForWithdraw] = useState('');
  const [canWithdraw, setCanWithdraw] = useState(true);
  const [withdrawRecipient, setWithdrawRecipient] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [usdcMintAmount, setUsdcMintAmount] = useState('');
  const [adminToAdd, setAdminToAdd] = useState('');
  const [adminToRemove, setAdminToRemove] = useState('');
  const [adminToCheck, setAdminToCheck] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [adminCheckResult, setAdminCheckResult] = useState(null);

  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Read contract data - fetching all assets from blockchain
  const { data: allAssets, refetch: refetchAssets } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAllAssetsWithDisplayInfo',
  });

  // Get contract owner address
  const { data: ownerAddress } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'owner',
  });

  // Check if current user is admin
  const { data: isAdmin } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'isAdmin',
    args: address ? [address] : undefined,
  });

  // Check admin status for a specific address
  const { data: adminCheckData } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'isAdmin',
    args: adminToCheck && adminToCheck.startsWith('0x') && adminToCheck.length === 42 ? [adminToCheck] : undefined,
  });

  // Derived state
  const isOwner = address && ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase();
  const assets = allAssets || [];
  const loading = isPending || isConfirming;

  // Update admin check result when data changes
  useEffect(() => {
    if (adminCheckData !== undefined) {
      setAdminCheckResult(adminCheckData);
    } else {
      setAdminCheckResult(null);
    }
  }, [adminCheckData]);

  // Refetch assets after transaction completes
  useEffect(() => {
    if (!isPending && !isConfirming && hash) {
      refetchAssets();
    }
  }, [isPending, isConfirming, hash, refetchAssets]);

  useEffect(() => {
  if (isConnected && isAdmin === false && !isOwner) {
    navigate('/');
  }
}, [isAdmin, isOwner, isConnected, navigate]);

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

  const filteredAssets = React.useMemo(() => {
    switch (filterStatus) {
      case 'verified':
        return assets.filter(asset => asset.verified && !asset.sold);
      case 'unverified':
        return assets.filter(asset => !asset.verified && !asset.sold);
      case 'sold':
        return assets.filter(asset => asset.sold);
      default:
        return assets;
    }
  }, [assets, filterStatus]);

  const handleAssetClick = (tokenId) => {
    showNotification(`Navigating to asset #${tokenId}...`, 'success');
    navigate(`/admin/asset/${tokenId}`);
  };

  // Verify an asset on the blockchain
  const verifyAsset = async () => {
    if (!tokenIdToVerify) {
      showNotification('Please enter a token ID', 'error');
      return;
    }
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'verifyAsset',
        args: [BigInt(tokenIdToVerify)],
      });
      showNotification(`Asset #${tokenIdToVerify} verification submitted!`, 'success');
      setTokenIdToVerify('');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  // Set buyer withdrawal permission for a specific token
  const setBuyerWithdrawPermission = async () => {
    if (!tokenIdForWithdraw) {
      showNotification('Please enter a token ID', 'error');
      return;
    }
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'setBuyerCanWithdraw',
        args: [BigInt(tokenIdForWithdraw), canWithdraw],
      });
      showNotification(`Withdrawal permission updated for token #${tokenIdForWithdraw}`, 'success');
      setTokenIdForWithdraw('');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  // Withdraw USDC from the contract to a recipient
  const withdrawUSDC = async () => {
    if (!withdrawRecipient || !withdrawAmount) {
      showNotification('Please enter recipient and amount', 'error');
      return;
    }
    try {
      // Convert decimal USDC to 6-decimal format (e.g., 100.50 USDC -> 100500000)
      const amount = BigInt(Math.floor(parseFloat(withdrawAmount) * 1000000));
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'withdrawUSDC',
        args: [withdrawRecipient, amount],
      });
      showNotification(`${withdrawAmount} USDC withdrawal submitted!`, 'success');
      setWithdrawRecipient('');
      setWithdrawAmount('');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  // Mint USDC directly to the contract
  const mintUSDC = async () => {
    if (!usdcMintAmount) {
      showNotification('Please enter an amount to mint', 'error');
      return;
    }
    try {
      // Convert decimal USDC to 6-decimal format
      const amount = BigInt(Math.floor(parseFloat(usdcMintAmount) * 1000000));
      await writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC,
        functionName: 'mint',
        args: [REAL_ESTATE_DAPP_ADDRESS, amount],
      });
      showNotification(`${usdcMintAmount} USDC minting submitted!`, 'success');
      setUsdcMintAmount('');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  // Add a new admin to the contract
  const addAdmin = async () => {
    if (!adminToAdd) {
      showNotification('Please enter an admin address', 'error');
      return;
    }
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'addAdmin',
        args: [adminToAdd],
      });
      showNotification(`Admin addition submitted: ${adminToAdd.slice(0, 10)}...`, 'success');
      setAdminToAdd('');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  // Remove an admin from the contract
  const removeAdmin = async () => {
    if (!adminToRemove) {
      showNotification('Please enter an admin address', 'error');
      return;
    }
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'removeAdmin',
        args: [adminToRemove],
      });
      showNotification(`Admin removal submitted: ${adminToRemove.slice(0, 10)}...`, 'success');
      setAdminToRemove('');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  // Transfer contract ownership to a new address
  const transferOwnership = async () => {
    if (!newOwner) {
      showNotification('Please enter a new owner address', 'error');
      return;
    }
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'transferOwnership',
        args: [newOwner],
      });
      showNotification(`Ownership transfer submitted to ${newOwner.slice(0, 10)}...`, 'success');
      setNewOwner('');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  // Renounce contract ownership (permanent action)
  const renounceOwnership = async () => {
    if (!window.confirm('Are you sure you want to renounce ownership? This action cannot be undone!')) {
      return;
    }
    try {
      await writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'renounceOwnership',
      });
      showNotification('Ownership renunciation submitted', 'success');
    } catch (error) {
      showNotification(error.message || 'Transaction failed', 'error');
    }
  };

  const tabs = [
    { id: 'assets', label: 'Asset Management', icon: Home, adminOnly: true },
    { id: 'verify', label: 'Quick Verify', icon: CheckCircle, adminOnly: true },
    { id: 'withdraw', label: 'Withdraw Settings', icon: Settings, adminOnly: true },
    { id: 'usdc', label: 'USDC Management', icon: DollarSign, adminOnly: true },
    { id: 'admins', label: 'Manage Admins', icon: Users, adminOnly: false },
    { id: 'ownership', label: 'Ownership', icon: Key, adminOnly: false },
  ];

  // Show loading while checking permissions
if (isConnected && (isAdmin === undefined || ownerAddress === undefined)) {
  return (
    <div className="min-h-screen bg-[#121317] flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 text-[#CAAB5B] animate-spin mx-auto mb-4" />
        <p className="text-[#E1E2E2] text-lg">Verifying permissions...</p>
      </div>
    </div>
  );
}

  return (
    
    <div className="min-h-screen bg-[#121317]">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-[#CAAB5B]/20 border border-[#CAAB5B]' : 'bg-red-500/20 border border-red-500'
        } max-w-md`}>
          <AlertCircle className={`w-5 h-5 ${notification.type === 'success' ? 'text-[#CAAB5B]' : 'text-red-500'}`} />
          <span className="text-[#E1E2E2]">{notification.message}</span>
        </div>
      )}

      

      {/* Header */}
      <div className="bg-[#111216] border-b border-[#2C2C2C] shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#CAAB5B]" />
              <div>
                <h1 className="text-2xl font-bold text-[#E1E2E2]">ReaLiFi Admin Dashboard</h1>
                <p className="text-sm text-[#6D6041]">Manage your real estate marketplace</p>
              </div>
            </div>
            
            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-[#E1E2E2]">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                  <div className="flex gap-2 text-xs">
                    {isOwner && <span className="text-[#CAAB5B] font-semibold">Owner</span>}
                    {isAdmin && <span className="text-[#CAAB5B]/70 font-semibold">Admin</span>}
                  </div>
                </div>
                <div className="w-3 h-3 bg-[#CAAB5B] rounded-full animate-pulse"></div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#6D6041]">
                <Wallet className="w-5 h-5" />
                <span className="text-sm">Not Connected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#111216] rounded-xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-[#2C2C2C]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6D6041] mb-1">Role</p>
                <p className="text-2xl font-bold text-[#E1E2E2]">
                  {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'User'}
                </p>
              </div>
              <Shield className="w-12 h-12 text-[#CAAB5B] opacity-20" />
            </div>
          </div>
          
          <div className="bg-[#111216] rounded-xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-[#2C2C2C]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6D6041] mb-1">Total Assets</p>
                <p className="text-2xl font-bold text-[#E1E2E2]">
                  {assets.length}
                </p>
              </div>
              <Home className="w-12 h-12 text-[#CAAB5B] opacity-20" />
            </div>
          </div>
          
          <div className="bg-[#111216] rounded-xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-[#2C2C2C]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6D6041] mb-1">Verified</p>
                <p className="text-2xl font-bold text-[#E1E2E2]">
                  {assets.filter(a => a.verified).length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-[#CAAB5B] opacity-20" />
            </div>
          </div>
          
          <div className="bg-[#111216] rounded-xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-[#2C2C2C]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6D6041] mb-1">Pending</p>
                <p className="text-2xl font-bold text-[#E1E2E2]">
                  {assets.filter(a => !a.verified && !a.sold).length}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-[#CAAB5B] opacity-20" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#111216] rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-[#2C2C2C] overflow-hidden">
          <div className="border-b border-[#2C2C2C]">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const canAccess = tab.adminOnly ? (isOwner || isAdmin) : isOwner;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => canAccess && setActiveTab(tab.id)}
                    disabled={!canAccess}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-[#CAAB5B] border-b-2 border-[#CAAB5B]'
                        : canAccess
                        ? 'text-[#6D6041] hover:text-[#E1E2E2]'
                        : 'text-[#6D6041]/40 cursor-not-allowed'
                    }`}
                  >
                    <TabIcon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8">
            {/* Asset Management Tab */}
            {activeTab === 'assets' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Asset Management</h2>
                    <p className="text-[#6D6041]">Review and manage all real estate assets</p>
                  </div>
                  <button
                    onClick={() => {
                      refetchAssets();
                      showNotification('Assets refreshed', 'success');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#CAAB5B]/10 text-[#CAAB5B] rounded-lg hover:bg-[#CAAB5B]/20 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                  {['all', 'verified', 'unverified', 'sold'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterStatus(filter)}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        filterStatus === filter
                          ? 'bg-[#CAAB5B] text-[#121317]'
                          : 'bg-[#111216] border border-[#2C2C2C] text-[#6D6041] hover:text-[#E1E2E2]'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      {filter === 'all' && ` (${assets.length})`}
                      {filter === 'verified' && ` (${assets.filter(a => a.verified && !a.sold).length})`}
                      {filter === 'unverified' && ` (${assets.filter(a => !a.verified && !a.sold).length})`}
                      {filter === 'sold' && ` (${assets.filter(a => a.sold).length})`}
                    </button>
                  ))}
                </div>

                {/* Asset Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.tokenId.toString()}
                      onClick={() => handleAssetClick(asset.tokenId.toString())}
                      className="bg-[#111216] border border-[#2C2C2C] rounded-xl overflow-hidden hover:border-[#CAAB5B] transition-all cursor-pointer group shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-lg"
                    >
                      <div className="h-48 bg-gradient-to-br from-[#CAAB5B]/10 to-[#CAAB5B]/5 flex items-center justify-center relative">
                        <Home className="w-16 h-16 text-[#CAAB5B]/30" />
                        <div className="absolute top-3 right-3">
                          {asset.verified ? (
                            <span className="px-3 py-1 bg-[#CAAB5B] text-[#121317] text-xs font-semibold rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-500/20 border border-red-500 text-red-500 text-xs font-semibold rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>
                        {asset.sold && (
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 bg-[#6D6041]/20 border border-[#6D6041] text-[#6D6041] text-xs font-semibold rounded-full">
                              SOLD
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-[#E1E2E2] mb-1">
                              Property #{asset.tokenId.toString()}
                            </h3>
                            <p className="text-2xl font-bold text-[#CAAB5B]">
                              ${formatPrice(asset.price)} USDC
                            </p>
                          </div>
                          <ExternalLink className="w-5 h-5 text-[#CAAB5B] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="mb-3 pb-3 border-b border-[#2C2C2C]">
                          <p className="text-xs text-[#6D6041] mb-1">Seller</p>
                          <p className="text-sm font-mono text-[#E1E2E2]">
                            {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-[#121317]/50 rounded-lg p-2">
                            <p className="text-xs text-[#6D6041] mb-0.5">Payment</p>
                            <p className={`text-xs font-semibold ${asset.isPaidFor ? 'text-[#CAAB5B]' : 'text-[#6D6041]'}`}>
                              {asset.isPaidFor ? 'Paid' : 'Unpaid'}
                            </p>
                          </div>
                          <div className="bg-[#121317]/50 rounded-lg p-2">
                            <p className="text-xs text-[#6D6041] mb-0.5">Status</p>
                            <p className={`text-xs font-semibold ${asset.isCanceled ? 'text-red-500' : 'text-[#CAAB5B]'}`}>
                              {asset.isCanceled ? 'Canceled' : 'Active'}
                            </p>
                          </div>
                        </div>

                        {asset.isFractionalized && (
                          <div className="bg-[#CAAB5B]/10 border border-[#CAAB5B]/30 rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-[#CAAB5B] mb-2">Fractionalized Asset</p>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-[#6D6041]">Total Tokens:</span>
                                <span className="text-[#E1E2E2] font-medium">
                                  {asset.totalFractionalTokens.toString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#6D6041]">Remaining:</span>
                                <span className="text-[#E1E2E2] font-medium">
                                  {asset.remainingFractionalTokens.toString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#6D6041]">Price/Token:</span>
                                <span className="text-[#CAAB5B] font-medium">
                                  ${formatPrice(asset.pricePerFractionalToken)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {asset.currentBuyer && asset.currentBuyer !== '0x0000000000000000000000000000000000000000' && (
                          <div className="mb-3">
                            <p className="text-xs text-[#6D6041] mb-1">Current Buyer</p>
                            <p className="text-sm font-mono text-[#E1E2E2]">
                              {asset.currentBuyer.slice(0, 6)}...{asset.currentBuyer.slice(-4)}
                            </p>
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssetClick(asset.tokenId.toString());
                          }}
                          className="w-full mt-3 py-2 bg-[#CAAB5B]/10 text-[#CAAB5B] rounded-lg hover:bg-[#CAAB5B] hover:text-[#121317] transition-colors font-medium text-sm"
                        >
                          View Details & Verify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Verify Tab */}
            {activeTab === 'verify' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Quick Verify Assets</h2>
                <p className="text-[#6D6041] mb-6">Approve real estate listings to make them available for purchase</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#E1E2E2] mb-2">Token ID</label>
                    <input
                      type="number"
                      value={tokenIdToVerify}
                      onChange={(e) => setTokenIdToVerify(e.target.value)}
                      placeholder="Enter token ID to verify"
                      className="w-full px-4 py-3 bg-[#111216] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent placeholder-[#6D6041]"
                    />
                  </div>
                  
                  <button
                    onClick={verifyAsset}
                    disabled={loading || !tokenIdToVerify}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {loading ? 'Verifying...' : 'Verify Asset'}
                  </button>
                </div>
              </div>
            )}

            {/* Withdraw Settings Tab */}
            {activeTab === 'withdraw' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-[#E12E2] mb-2">Buyer Withdrawal Settings</h2>
                <p className="text-[#6D6041] mb-6">Control whether buyers can withdraw funds for specific tokens</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#E1E2E2] mb-2">Token ID</label>
                    <input
                      type="number"
                      value={tokenIdForWithdraw}
                      onChange={(e) => setTokenIdForWithdraw(e.target.value)}
                      placeholder="Enter token ID"
                      className="w-full px-4 py-3 bg-[#111216] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent placeholder-[#6D6041]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#E1E2E2] mb-2">Permission</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setCanWithdraw(true)}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors font-medium ${
                          canWithdraw
                            ? 'border-[#CAAB5B] bg-[#CAAB5B]/10 text-[#CAAB5B]'
                            : 'border-[#2C2C2C] bg-[#111216] text-[#6D6041] hover:border-[#CAAB5B]/50'
                        }`}
                      >
                        Allow Withdrawal
                      </button>
                      <button
                        onClick={() => setCanWithdraw(false)}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors font-medium ${
                          !canWithdraw
                            ? 'border-red-500 bg-red-500/10 text-red-500'
                            : 'border-[#2C2C2C] bg-[#111216] text-[#6D6041] hover:border-red-500/50'
                        }`}
                      >
                        Block Withdrawal
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={setBuyerWithdrawPermission}
                    disabled={loading || !tokenIdForWithdraw}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5" />}
                    {loading ? 'Updating...' : 'Update Permission'}
                  </button>
                </div>
              </div>
            )}

            {/* USDC Management Tab */}
            {activeTab === 'usdc' && (
              <div className="max-w-2xl space-y-8">
                {/* Mint USDC Section */}
                <div>
                  <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Mint USDC to Contract</h2>
                  <p className="text-[#6D6041] mb-6">Mint USDC tokens directly to the smart contract</p>
                  
                  <div className="bg-[#CAAB5B]/10 border border-[#CAAB5B]/30 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-[#CAAB5B] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#E1E2E2]">Contract Address</p>
                        <p className="text-xs font-mono text-[#6D6041] mt-1 break-all">
                          {REAL_ESTATE_DAPP_ADDRESS}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#E1E2E2] mb-2">Amount (USDC)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={usdcMintAmount}
                        onChange={(e) => setUsdcMintAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-[#111216] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent placeholder-[#6D6041]"
                      />
                    </div>
                    
                    <button
                      onClick={mintUSDC}
                      disabled={loading || !usdcMintAmount}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                      {loading ? 'Minting...' : 'Mint USDC'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-[#2C2C2C]"></div>

                {/* Withdraw USDC Section */}
                <div>
                  <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Withdraw USDC</h2>
                  <p className="text-[#6D6041] mb-6">Transfer USDC from the contract to a recipient address</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#E1E2E2] mb-2">Recipient Address</label>
                      <input
                        type="text"
                        value={withdrawRecipient}
                        onChange={(e) => setWithdrawRecipient(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-[#111216] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent font-mono text-sm placeholder-[#6D6041]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#E1E2E2] mb-2">Amount (USDC)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-[#111216] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent placeholder-[#6D6041]"
                      />
                    </div>
                    
                    <button
                      onClick={withdrawUSDC}
                      disabled={loading || !withdrawRecipient || !withdrawAmount}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                      {loading ? 'Processing...' : 'Withdraw USDC'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Manage Admins Tab */}
            {activeTab === 'admins' && (
              <div className="max-w-2xl space-y-8">
                {/* Add Admin */}
                <div>
                  <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Add Admin</h2>
                  <p className="text-[#6D6041] mb-6">Grant admin privileges to a new address</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#E1E2E2] mb-2">Admin Address</label>
                      <input
                        type="text"
                        value={adminToAdd}
                        onChange={(e) => setAdminToAdd(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-[#111216] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent font-mono text-sm placeholder-[#6D6041]"
                      />
                    </div>
                    
                    <button
                      onClick={addAdmin}
                      disabled={loading || !adminToAdd}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                      {loading ? 'Adding...' : 'Add Admin'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-[#2C2C2C]"></div>

                {/* Remove Admin */}
                <div>
                  <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Remove Admin</h2>
                  <p className="text-[#6D6041] mb-6">Revoke admin privileges from an address</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#E1E2E2] mb-2">Admin Address</label>
                      <input
                        type="text"
                        value={adminToRemove}
                        onChange={(e) => setAdminToRemove(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-[#111216] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent font-mono text-sm placeholder-[#6D6041]"
                      />
                    </div>
                    
                    <button
                      onClick={removeAdmin}
                      disabled={loading || !adminToRemove}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UserMinus className="w-5 h-5" />}
                      {loading ? 'Removing...' : 'Remove Admin'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-[#2C2C2C]"></div>

                {/* Check Admin Status */}
                <div>
                  <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Check Admin Status</h2>
                  <p className="text-[#6D6041] mb-6">Verify if an address has admin privileges</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#E1E2E2] mb-2">Address to Check</label>
                      <input
                        type="text"
                        value={adminToCheck}
                        onChange={(e) => setAdminToCheck(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-[#111216] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent font-mono text-sm placeholder-[#6D6041]"
                      />
                    </div>

                    {adminCheckResult !== null && adminToCheck && (
                      <div className={`p-4 rounded-xl ${adminCheckResult ? 'bg-[#CAAB5B]/10 border border-[#CAAB5B]/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                        <p className={`font-medium ${adminCheckResult ? 'text-[#CAAB5B]' : 'text-red-500'}`}>
                          {adminCheckResult ? '✓ This address is an admin' : '✗ This address is not an admin'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Ownership Tab */}
            {activeTab === 'ownership' && (
              <div className="max-w-2xl space-y-8">
                {/* Transfer Ownership */}
                <div>
                  <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Transfer Ownership</h2>
                  <p className="text-[#6D6041] mb-6">Transfer contract ownership to a new address</p>
                  
                  <div className="bg-[#CAAB5B]/10 border border-[#CAAB5B]/30 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-[#CAAB5B] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#E1E2E2]">Warning</p>
                        <p className="text-sm text-[#6D6041] mt-1">
                          Transferring ownership will revoke all your owner privileges. This action is irreversible.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#E1E2E2] mb-2">New Owner Address</label>
                      <input
                        type="text"
                        value={newOwner}
                        onChange={(e) => setNewOwner(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-[#111216] border border-[#2C2C2C] text-[#E1E2E2] rounded-lg focus:ring-2 focus:ring-[#CAAB5B] focus:border-transparent font-mono text-sm placeholder-[#6D6041]"
                      />
                    </div>
                    
                    <button
                      onClick={transferOwnership}
                      disabled={loading || !newOwner}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#CAAB5B] text-[#121317] rounded-lg hover:bg-[#CAAB5B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                      {loading ? 'Transferring...' : 'Transfer Ownership'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-[#2C2C2C]"></div>

                {/* Renounce Ownership */}
                <div>
                  <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Renounce Ownership</h2>
                  <p className="text-[#6D6041] mb-6">Permanently give up contract ownership</p>
                  
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-500">Danger Zone</p>
                        <p className="text-sm text-[#6D6041] mt-1">
                          Renouncing ownership will leave the contract without an owner. This action is permanent and cannot be undone. No one will be able to perform owner-only functions.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={renounceOwnership}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
                    {loading ? 'Processing...' : 'Renounce Ownership'}
                  </button>
                </div>

                <div className="border-t border-[#2C2C2C]"></div>

                {/* Current Ownership Info */}
                <div>
                  <h2 className="text-xl font-semibold text-[#E1E2E2] mb-2">Current Ownership</h2>
                  <p className="text-[#6D6041] mb-6">View current contract ownership details</p>
                  
                  <div className="bg-[#111216] rounded-xl p-6 space-y-4 border border-[#2C2C2C]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6D6041]">Contract Owner</span>
                      <span className="text-sm font-mono text-[#E1E2E2]">
                        {ownerAddress ? `${ownerAddress.slice(0, 10)}...${ownerAddress.slice(-8)}` : 'Loading...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6D6041]">Your Status</span>
                      <span className={`text-sm font-semibold ${isOwner ? 'text-[#CAAB5B]' : 'text-[#6D6041]'}`}>
                        {isOwner ? 'You are the owner' : 'Not the owner'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6D6041]">Contract Address</span>
                      <span className="text-sm font-mono text-[#E1E2E2]">
                        {REAL_ESTATE_DAPP_ADDRESS.slice(0, 10)}...{REAL_ESTATE_DAPP_ADDRESS.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 py-8 mt-12">
        <div className="text-center text-sm text-[#6D6041]">
          <p>ReaLiFi Admin Dashboard v1.0</p>
          <p className="mt-1">Powered by Hedera Testnet</p>
        </div>
      </div>
    </div>
  );
};

