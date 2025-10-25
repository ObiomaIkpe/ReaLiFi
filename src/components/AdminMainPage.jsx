// src/components/AdminDashboard.tsx
import { useState } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS, USDC_ABI, USDC_TOKEN_ADDRESS } from '../config/contract.config';
import { formatUnits, parseUnits } from 'viem';

export function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const [actionType, setActionType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedTab, setSelectedTab] = useState('verification');

  // Admin management states
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [removeAdminAddress, setRemoveAdminAddress] = useState('');
  
  // Withdrawal states
  const [withdrawRecipient, setWithdrawRecipient] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Check if current user is admin
  const { data: isAdmin, refetch: refetchAdminStatus } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'isAdmin',
    args: address ? [address] : undefined,
  });

  // Get contract owner
  const { data: contractOwner } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'owner',
    args: [],
  });

  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();

  // Get all assets
  const { data: allAssets, refetch: refetchAssets } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAllAssetsWithDisplayInfo',
    args: [],
  });

  // Get contract USDC balance
  const { data: contractBalance } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [REAL_ESTATE_DAPP_ADDRESS],
  });

  // Transaction handling
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Filter assets
  const unverifiedAssets = allAssets?.filter(asset => !asset.verified && !asset.sold) || [];
  const verifiedAssets = allAssets?.filter(asset => asset.verified) || [];

  // Handle verify asset
  const handleVerifyAsset = async () => {
    if (!selectedAsset) return;
    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'verifyAsset',
        args: [selectedAsset.tokenId],
      });
    } catch (err) {
      console.error('Error verifying asset:', err);
    }
  };

  // Handle add admin
  const handleAddAdmin = async () => {
    if (!newAdminAddress) return;
    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'addAdmin',
        args: [newAdminAddress as `0x${string}`],
      });
    } catch (err) {
      console.error('Error adding admin:', err);
    }
  };

  // Handle remove admin
  const handleRemoveAdmin = async () => {
    if (!removeAdminAddress) return;
    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'removeAdmin',
        args: [removeAdminAddress as `0x${string}`],
      });
    } catch (err) {
      console.error('Error removing admin:', err);
    }
  };

  // Handle withdraw USDC
  const handleWithdrawUSDC = async () => {
    if (!withdrawRecipient || !withdrawAmount) return;
    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'withdrawUSDC',
        args: [withdrawRecipient as `0x${string}`, parseUnits(withdrawAmount, 6)],
      });
    } catch (err) {
      console.error('Error withdrawing USDC:', err);
    }
  };

  // Reset state on success
  if (isSuccess) {
    setTimeout(() => {
      setShowModal(false);
      setSelectedAsset(null);
      setActionType(null);
      setNewAdminAddress('');
      setRemoveAdminAddress('');
      setWithdrawRecipient('');
      setWithdrawAmount('');
      refetchAssets();
      refetchAdminStatus();
    }, 2000);
  }

  if (!isConnected) {
    return (
      <div style={{
        backgroundColor: '#121317',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{
          backgroundColor: '#111216',
          border: '1px solid #2C2C2C',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <div style={{ color: '#E1E2E2', fontSize: '18px', marginBottom: '8px' }}>
            Connect Your Wallet
          </div>
          <div style={{ color: '#6D6041', fontSize: '14px' }}>
            Please connect your wallet to access the admin dashboard
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isOwner) {
    return (
      <div style={{
        backgroundColor: '#121317',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{
          backgroundColor: '#111216',
          border: '1px solid #f44336',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <div style={{ color: '#E1E2E2', fontSize: '18px', marginBottom: '8px' }}>
            Access Denied
          </div>
          <div style={{ color: '#6D6041', fontSize: '14px' }}>
            You do not have admin privileges to access this dashboard
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#121317',
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              color: '#f44336',
              fontSize: '32px',
              fontWeight: 'bold',
              margin: 0,
              marginBottom: '8px'
            }}>
              Admin Dashboard
            </h1>
            <p style={{
              color: '#6D6041',
              fontSize: '14px',
              margin: 0
            }}>
              Manage platform operations and asset verification
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isOwner && (
              <div style={{
                backgroundColor: '#111216',
                border: '1px solid #ff9800',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#ff9800',
                fontSize: '14px',
                fontWeight: 'bold',
              }}>
                👑 Owner
              </div>
            )}
            <div style={{
              backgroundColor: '#111216',
              border: '1px solid #f44336',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#f44336',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              🛡️ Admin
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              TOTAL ASSETS
            </div>
            <div style={{ color: '#E1E2E2', fontSize: '28px', fontWeight: 'bold' }}>
              {allAssets?.length || 0}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              PENDING VERIFICATION
            </div>
            <div style={{ color: '#ff9800', fontSize: '28px', fontWeight: 'bold' }}>
              {unverifiedAssets.length}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              VERIFIED
            </div>
            <div style={{ color: '#4CAF50', fontSize: '28px', fontWeight: 'bold' }}>
              {verifiedAssets.length}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              CONTRACT BALANCE
            </div>
            <div style={{ color: '#CAAB5B', fontSize: '28px', fontWeight: 'bold' }}>
              {contractBalance ? formatUnits(contractBalance, 6) : '0'} USDC
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {hash && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
          }}>
            {isConfirming && (
              <div style={{ color: '#ff9800', marginBottom: '8px', fontWeight: 'bold' }}>
                ⏳ Transaction confirming...
              </div>
            )}
            {isSuccess && (
              <div style={{ color: '#4CAF50', marginBottom: '8px', fontWeight: 'bold' }}>
                ✓ Action completed successfully!
              </div>
            )}
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
              Transaction Hash:
            </div>
            <div style={{
              color: '#E1E2E2',
              fontSize: '12px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}>
              {hash}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f44336',
            borderRadius: '12px',
            color: '#fff',
          }}>
            Error: {error.message}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '1px solid #2C2C2C',
          paddingBottom: '0'
        }}>
          <button
            onClick={() => setSelectedTab('verification')}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedTab === 'verification' ? '#111216' : 'transparent',
              color: selectedTab === 'verification' ? '#f44336' : '#6D6041',
              border: 'none',
              borderBottom: selectedTab === 'verification' ? '2px solid #f44336' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Asset Verification
          </button>
          {isOwner && (
            <button
              onClick={() => setSelectedTab('admins')}
              style={{
                padding: '12px 24px',
                backgroundColor: selectedTab === 'admins' ? '#111216' : 'transparent',
                color: selectedTab === 'admins' ? '#f44336' : '#6D6041',
                border: 'none',
                borderBottom: selectedTab === 'admins' ? '2px solid #f44336' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Admin Management
            </button>
          )}
          <button
            onClick={() => setSelectedTab('finance')}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedTab === 'finance' ? '#111216' : 'transparent',
              color: selectedTab === 'finance' ? '#f44336' : '#6D6041',
              border: 'none',
              borderBottom: selectedTab === 'finance' ? '2px solid #f44336' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Financial Operations
          </button>
        </div>

        {/* Asset Verification Tab */}
        {selectedTab === 'verification' && (
          <>
            {unverifiedAssets.length > 0 ? (
              <>
                <h2 style={{
                  color: '#ff9800',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⏳</span> Pending Verification ({unverifiedAssets.length})
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '24px',
                  marginBottom: '48px'
                }}>
                  {unverifiedAssets.map((asset) => (
                    <AssetVerificationCard
                      key={asset.tokenId.toString()}
                      asset={asset}
                      onVerify={() => {
                        setSelectedAsset(asset);
                        setActionType('verify');
                        setShowModal(true);
                      }}
                      isPending={isPending}
                      isConfirming={isConfirming}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: '#111216',
                border: '1px solid #2C2C2C',
                borderRadius: '12px',
                color: '#6D6041'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>All Caught Up!</div>
                <div style={{ fontSize: '14px' }}>
                  No assets pending verification at the moment
                </div>
              </div>
            )}

            {verifiedAssets.length > 0 && (
              <>
                <h2 style={{
                  color: '#4CAF50',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>✓</span> Verified Assets ({verifiedAssets.length})
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '24px'
                }}>
                  {verifiedAssets.slice(0, 6).map((asset) => (
                    <AssetVerificationCard
                      key={asset.tokenId.toString()}
                      asset={asset}
                      onVerify={() => {}}
                      isPending={false}
                      isConfirming={false}
                      isVerified
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Admin Management Tab */}
        {selectedTab === 'admins' && isOwner && (
          <div style={{ maxWidth: '800px' }}>
            <h2 style={{
              color: '#f44336',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px',
            }}>
              Admin Management
            </h2>

            {/* Add Admin */}
            <div style={{
              backgroundColor: '#111216',
              border: '1px solid #2C2C2C',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{
                color: '#E1E2E2',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '16px'
              }}>
                Add New Admin
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  color: '#6D6041',
                  fontSize: '14px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Admin Wallet Address
                </label>
                <input
                  type="text"
                  value={newAdminAddress}
                  onChange={(e) => setNewAdminAddress(e.target.value)}
                  placeholder="0x..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#121317',
                    border: '1px solid #2C2C2C',
                    borderRadius: '8px',
                    color: '#E1E2E2',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <button
                onClick={handleAddAdmin}
                disabled={!newAdminAddress || isPending || isConfirming}
                style={{
                  padding: '12px 24px',
                  backgroundColor: !newAdminAddress || isPending || isConfirming ? '#2C2C2C' : '#4CAF50',
                  color: !newAdminAddress || isPending || isConfirming ? '#6D6041' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: !newAdminAddress || isPending || isConfirming ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Confirm in wallet...' : isConfirming ? 'Adding...' : 'Add Admin'}
              </button>
            </div>

            {/* Remove Admin */}
            <div style={{
              backgroundColor: '#111216',
              border: '1px solid #2C2C2C',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{
                color: '#E1E2E2',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '16px'
              }}>
                Remove Admin
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  color: '#6D6041',
                  fontSize: '14px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Admin Wallet Address
                </label>
                <input
                  type="text"
                  value={removeAdminAddress}
                  onChange={(e) => setRemoveAdminAddress(e.target.value)}
                  placeholder="0x..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#121317',
                    border: '1px solid #2C2C2C',
                    borderRadius: '8px',
                    color: '#E1E2E2',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <button
                onClick={handleRemoveAdmin}
                disabled={!removeAdminAddress || isPending || isConfirming}
                style={{
                  padding: '12px 24px',
                  backgroundColor: !removeAdminAddress || isPending || isConfirming ? '#2C2C2C' : '#f44336',
                  color: !removeAdminAddress || isPending || isConfirming ? '#6D6041' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: !removeAdminAddress || isPending || isConfirming ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Confirm in wallet...' : isConfirming ? 'Removing...' : 'Remove Admin'}
              </button>
            </div>
          </div>
        )}

        {/* Financial Operations Tab */}
        {selectedTab === 'finance' && (
          <div style={{ maxWidth: '800px' }}>
            <h2 style={{
              color: '#f44336',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px',
            }}>
              Financial Operations
            </h2>

            {/* Contract Balance Display */}
            <div style={{
              backgroundColor: '#111216',
              border: '1px solid #CAAB5B',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{
                color: '#6D6041',
                fontSize: '12px',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Available Contract Balance
              </div>
              <div style={{
                color: '#CAAB5B',
                fontSize: '36px',
                fontWeight: 'bold'
              }}>
                {contractBalance ? formatUnits(contractBalance, 6) : '0'} USDC
              </div>
              <div style={{
                color: '#6D6041',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                Platform fees and accumulated payments
              </div>
            </div>

            {/* Withdraw USDC */}
            <div style={{
              backgroundColor: '#111216',
              border: '1px solid #2C2C2C',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{
                color: '#E1E2E2',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '16px'
              }}>
                Withdraw USDC
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  color: '#6D6041',
                  fontSize: '14px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={withdrawRecipient}
                  onChange={(e) => setWithdrawRecipient(e.target.value)}
                  placeholder="0x..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#121317',
                    border: '1px solid #2C2C2C',
                    borderRadius: '8px',
                    color: '#E1E2E2',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    marginBottom: '16px'
                  }}
                />
                <label style={{
                  color: '#6D6041',
                  fontSize: '14px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#121317',
                    border: '1px solid #2C2C2C',
                    borderRadius: '8px',
                    color: '#E1E2E2',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={handleWithdrawUSDC}
                disabled={!withdrawRecipient || !withdrawAmount || isPending || isConfirming}
                style={{
                  padding: '12px 24px',
                  backgroundColor: !withdrawRecipient || !withdrawAmount || isPending || isConfirming ? '#2C2C2C' : '#CAAB5B',
                  color: !withdrawRecipient || !withdrawAmount || isPending || isConfirming ? '#6D6041' : '#121317',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: !withdrawRecipient || !withdrawAmount || isPending || isConfirming ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Confirm in wallet...' : isConfirming ? 'Withdrawing...' : 'Withdraw USDC'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Confirmation Modal */}
      {showModal && selectedAsset && actionType === 'verify' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                color: '#4CAF50',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0
              }}>
                Verify Asset
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAsset(null);
                  setActionType(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6D6041',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              backgroundColor: '#121317',
              border: '1px solid #2C2C2C',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#6D6041', fontSize: '14px' }}>Token ID</span>
                <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
                  #{selectedAsset.tokenId.toString()}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#6D6041', fontSize: '14px' }}>Price</span>
                <span style={{ color: '#CAAB5B', fontSize: '18px', fontWeight: 'bold' }}>
                  {formatUnits(selectedAsset.price, 6)} USDC
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#6D6041', fontSize: '14px' }}>Seller</span>
                <span style={{
                  color: '#E1E2E2',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {selectedAsset.seller.slice(0, 6)}...{selectedAsset.seller.slice(-4)}
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#4CAF5020',
              border: '1px solid #4CAF50',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '14px',
              color: '#E1E2E2'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4CAF50' }}>
                ✓ Verify Asset
              </div>
              By verifying this asset, you confirm that it meets all platform requirements and is 
              legitimate. Once verified, buyers will be able to purchase this asset.
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAsset(null);
                  setActionType(null);
                }}
                disabled={isPending || isConfirming}
                style={{
                  padding: '14px',
                  backgroundColor: '#2C2C2C',
                  color: '#E1E2E2',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyAsset}
                disabled={isPending || isConfirming}
                style={{
                  padding: '14px',
                  backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#4CAF50',
                  color: isPending || isConfirming ? '#6D6041' : '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Confirm in wallet...' : isConfirming ? 'Verifying...' : 'Verify Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Asset Verification Card Component
function AssetVerificationCard({ 
  asset, 
  onVerify, 
  isPending, 
  isConfirming,
  isVerified = false 
}) {
  return (
    <div
      style={{
        backgroundColor: '#111216',
        border: `1px solid ${isVerified ? '#4CAF50' : '#ff9800'}`,
        borderRadius: '12px',
        padding: '24px',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isVerified) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 152, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isVerified) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #2C2C2C'
      }}>
        <div style={{
          backgroundColor: '#CAAB5B',
          color: '#121317',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          #{asset.tokenId.toString()}
        </div>
        <div style={{
          backgroundColor: isVerified ? '#4CAF50' : '#ff9800',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {isVerified ? '✓ Verified' : '⏳ Pending'}
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          color: '#6D6041',
          fontSize: '12px',
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Price
        </div>
        <div style={{
          color: '#CAAB5B',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          {formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      {/* Seller Info */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          color: '#6D6041',
          fontSize: '12px',
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Seller
        </div>
        <div style={{
          color: '#E1E2E2',
          fontSize: '14px',
          fontFamily: 'monospace',
          backgroundColor: '#121317',
          padding: '8px 12px',
          borderRadius: '6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {asset.seller.slice(0, 10)}...{asset.seller.slice(-8)}
        </div>
      </div>

      {/* Additional Info */}
      <div style={{
        display: 'flex',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid #2C2C2C',
        marginBottom: '20px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#6D6041',
            fontSize: '11px',
            marginBottom: '4px'
          }}>
            Status
          </div>
          <div style={{
            color: '#E1E2E2',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {asset.sold ? 'Sold' : 'Listed'}
          </div>
        </div>
        {asset.isFractionalized && (
          <div style={{ flex: 1 }}>
            <div style={{
              color: '#6D6041',
              fontSize: '11px',
              marginBottom: '4px'
            }}>
              Type
            </div>
            <div style={{
              color: '#E1E2E2',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Fractional
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      {!isVerified ? (
        <button
          onClick={onVerify}
          disabled={isPending || isConfirming}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#4CAF50',
            color: isPending || isConfirming ? '#6D6041' : '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isPending && !isConfirming) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPending && !isConfirming) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          ✓ Verify Asset
        </button>
      ) : (
        <div style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#2C2C2C',
          color: '#4CAF50',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          ✓ Verified
        </div>
      )}
    </div>
  );
}