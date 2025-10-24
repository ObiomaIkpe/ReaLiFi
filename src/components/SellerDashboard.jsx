import { useState, useEffect } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REAL_ESTATE_DAPP_ADDRESS, REAL_ESTATE_DAPP } from '../config/contract.config';
import { formatUnits } from 'viem';

export function SellerDashboard() {
  const { address, isConnected } = useAccount();
  const [actionTokenId, setActionTokenId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Check if user is a registered seller
  const { data: isSeller, isLoading: checkingSellerStatus, refetch: refetchSellerStatus } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'sellers',
    args: address ? [address] : undefined,
  });

  // Fetch seller's assets
  const { data: assets, isLoading, isError, refetch } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getSellerAssets',
    args: address ? [address] : undefined,
    enabled: !!address && !!isSeller,
  });

  // Get seller metrics
  const { data: sellerMetrics } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getSellerMetrics',
    args: address ? [address] : undefined,
    enabled: !!address && !!isSeller,
  });

  // Transaction handling
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRegisterSeller = async () => {
    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'registerSeller',
        args: [],
      });
    } catch (err) {
      console.error('Error registering seller:', err);
    }
  };

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
      setActionTokenId(null);
    }
  };

  // Reset state and refetch when transaction succeeds
  useEffect(() => {
    if (isSuccess && actionTokenId) {
      const timer = setTimeout(() => {
        setActionTokenId(null);
        setActionType(null);
        setShowConfirmModal(false);
        setSelectedAsset(null);
        refetch();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, actionTokenId, refetch]);

  // Refetch seller status after successful registration
  useEffect(() => {
    if (isSuccess && !isSeller) {
      refetchSellerStatus();
    }
  }, [isSuccess, isSeller, refetchSellerStatus]);

  // Wallet not connected state
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
            Please connect your wallet to access the seller dashboard
          </div>
        </div>
      </div>
    );
  }

  // Checking seller status
  if (checkingSellerStatus) {
    return (
      <div style={{
        backgroundColor: '#121317',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ color: '#E1E2E2', fontSize: '18px' }}>
          Checking seller status...
        </div>
      </div>
    );
  }

  // Not a registered seller - show registration
  if (!isSeller) {
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
          border: '1px solid #CAAB5B',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏠</div>
          <div style={{ color: '#CAAB5B', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
            Seller Registration Required
          </div>
          <div style={{ color: '#E1E2E2', fontSize: '16px', marginBottom: '8px' }}>
            Not a Registered Seller
          </div>
          <div style={{ color: '#6D6041', fontSize: '14px', marginBottom: '32px', lineHeight: '1.6' }}>
            You need to register as a seller before you can create and list assets on the platform. 
            This is a one-time registration process.
          </div>

          {/* Transaction Status */}
          {hash && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#121317',
              border: '1px solid #2C2C2C',
              borderRadius: '12px',
              textAlign: 'left',
            }}>
              {isPending && (
                <div style={{ color: '#CAAB5B', marginBottom: '8px', fontWeight: 'bold' }}>
                  ⏳ Waiting for confirmation...
                </div>
              )}
              {isConfirming && (
                <div style={{ color: '#CAAB5B', marginBottom: '8px', fontWeight: 'bold' }}>
                  ⏳ Registering...
                </div>
              )}
              {isSuccess && (
                <div style={{ color: '#4CAF50', marginBottom: '8px', fontWeight: 'bold' }}>
                  ✓ Successfully registered as seller!
                </div>
              )}
              <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
                Transaction Hash:
              </div>
              <div style={{
                color: '#E1E2E2',
                fontSize: '11px',
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
              fontSize: '14px',
            }}>
              Error: {error.message}
            </div>
          )}

          <button
            onClick={handleRegisterSeller}
            disabled={isPending || isConfirming}
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#CAAB5B',
              color: isPending || isConfirming ? '#6D6041' : '#121317',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isPending && !isConfirming) e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              if (!isPending && !isConfirming) e.currentTarget.style.opacity = '1';
            }}
          >
            {isPending ? 'Waiting for confirmation...' : 
             isConfirming ? 'Registering...' : 
             'Register as Seller'}
          </button>
          
          {(isPending || isConfirming) && (
            <div style={{ color: '#6D6041', fontSize: '12px', marginTop: '12px' }}>
              Please confirm the transaction in your wallet
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading assets
  if (isLoading) {
    return (
      <div style={{
        backgroundColor: '#121317',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ color: '#E1E2E2', fontSize: '18px' }}>
          Loading your assets...
        </div>
      </div>
    );
  }

  // Error loading assets
  if (isError) {
    return (
      <div style={{
        backgroundColor: '#121317',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ color: '#E1E2E2', fontSize: '18px' }}>
          Error loading your assets
        </div>
      </div>
    );
  }

  const availableAssets = assets?.filter(
    asset => !asset.sold && !asset.isCanceled
  ) || [];

  const pendingPaymentAssets = assets?.filter(
    asset => asset.currentBuyer !== '0x0000000000000000000000000000000000000000' && !asset.isPaidFor
  ) || [];

  const soldAssets = assets?.filter(asset => asset.sold) || [];

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
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{
              color: '#CAAB5B',
              fontSize: '32px',
              fontWeight: 'bold',
              margin: 0,
              marginBottom: '8px'
            }}>
              Seller Dashboard
            </h1>
            <p style={{
              color: '#6D6041',
              fontSize: '14px',
              margin: 0
            }}>
              Manage your real estate listings
            </p>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #CAAB5B',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#CAAB5B',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            🏷️ Seller
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
              TOTAL LISTINGS
            </div>
            <div style={{ color: '#E1E2E2', fontSize: '28px', fontWeight: 'bold' }}>
              {assets?.length || 0}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              AVAILABLE
            </div>
            <div style={{ color: '#CAAB5B', fontSize: '28px', fontWeight: 'bold' }}>
              {availableAssets.length}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              PENDING PAYMENT
            </div>
            <div style={{ color: '#ff9800', fontSize: '28px', fontWeight: 'bold' }}>
              {pendingPaymentAssets.length}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              SOLD
            </div>
            <div style={{ color: '#4CAF50', fontSize: '28px', fontWeight: 'bold' }}>
              {soldAssets.length}
            </div>
          </div>
        </div>

        {/* Seller Metrics */}
        {sellerMetrics && (
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '40px'
          }}>
            <h3 style={{
              color: '#E1E2E2',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              Performance Metrics
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
                  Confirmed Sales
                </div>
                <div style={{ color: '#4CAF50', fontSize: '24px', fontWeight: 'bold' }}>
                  {sellerMetrics[0]?.toString() || '0'}
                </div>
              </div>
              <div>
                <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
                  Canceled Sales
                </div>
                <div style={{ color: '#f44336', fontSize: '24px', fontWeight: 'bold' }}>
                  {sellerMetrics[1]?.toString() || '0'}
                </div>
              </div>
              <div>
                <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
                  Success Rate
                </div>
                <div style={{ color: '#CAAB5B', fontSize: '24px', fontWeight: 'bold' }}>
                  {sellerMetrics[0] && sellerMetrics[1]
                    ? `${Math.round((Number(sellerMetrics[0]) / (Number(sellerMetrics[0]) + Number(sellerMetrics[1]))) * 100)}%`
                    : '0%'}
                </div>
              </div>
            </div>
          </div>
        )}

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
              <div style={{ color: '#CAAB5B', marginBottom: '8px', fontWeight: 'bold' }}>
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

        {/* Pending Payment Section */}
        {pendingPaymentAssets.length > 0 && (
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
              <span>⏳</span> Pending Payment Confirmation ({pendingPaymentAssets.length})
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {pendingPaymentAssets.map((asset) => (
                <SellerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onDelist={handleDelistClick}
                  onConfirmPayment={handleConfirmPaymentClick}
                  isProcessing={actionTokenId === asset.tokenId}
                  isPending={isPending}
                  isConfirming={isConfirming}
                  showConfirmPayment
                />
              ))}
            </div>
          </>
        )}

        {/* Available Assets Section */}
        {availableAssets.length > 0 && (
          <>
            <h2 style={{
              color: '#CAAB5B',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🏠</span> Available Listings ({availableAssets.length})
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {availableAssets.map((asset) => (
                <SellerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onDelist={handleDelistClick}
                  onConfirmPayment={handleConfirmPaymentClick}
                  isProcessing={actionTokenId === asset.tokenId}
                  isPending={isPending}
                  isConfirming={isConfirming}
                />
              ))}
            </div>
          </>
        )}

        {/* Sold Assets Section */}
        {soldAssets.length > 0 && (
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
              <span>✓</span> Sold Assets ({soldAssets.length})
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {soldAssets.map((asset) => (
                <SellerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onDelist={handleDelistClick}
                  onConfirmPayment={handleConfirmPaymentClick}
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
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6D6041'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>No assets listed yet</div>
            <div style={{ fontSize: '14px' }}>
              Create your first asset to get started
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedAsset && (
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
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                color: actionType === 'delist' ? '#f44336' : '#4CAF50',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0
              }}>
                {actionType === 'delist' ? 'Delist Asset' : 'Confirm Payment'}
              </h2>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
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

            {/* Asset Details */}
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
              {actionType === 'confirm' && selectedAsset.currentBuyer && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#6D6041', fontSize: '14px' }}>Buyer</span>
                  <span style={{
                    color: '#E1E2E2',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}>
                    {selectedAsset.currentBuyer.slice(0, 6)}...{selectedAsset.currentBuyer.slice(-4)}
                  </span>
                </div>
              )}
            </div>

            {/* Warning Message */}
            <div style={{
              backgroundColor: actionType === 'delist' ? '#f4433620' : '#4CAF5020',
              border: `1px solid ${actionType === 'delist' ? '#f44336' : '#4CAF50'}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '14px',
              color: '#E1E2E2'
            }}>
              {actionType === 'delist' ? (
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#f44336' }}>
                    ⚠️ Warning
                  </div>
                  This will remove the asset from the marketplace. This action cannot be undone.
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4CAF50' }}>
                    ✓ Confirm Payment
                  </div>
                  By confirming, you acknowledge that you have received the payment from the buyer. 
                  The asset ownership will be transferred to the buyer.
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
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
                onClick={actionType === 'delist' ? handleDelistAsset : handleConfirmPayment}
                disabled={isPending || isConfirming}
                style={{
                  padding: '14px',
                  backgroundColor: isPending || isConfirming 
                    ? '#2C2C2C' 
                    : actionType === 'delist' ? '#f44336' : '#4CAF50',
                  color: isPending || isConfirming ? '#6D6041' : '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s'
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
                {!isPending && !isConfirming && (actionType === 'delist' ? 'Delist' : 'Confirm Payment')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Seller Asset Card Component
function SellerAssetCard({
  asset,
  onDelist,
  onConfirmPayment,
  isProcessing,
  isPending,
  isConfirming,
  showConfirmPayment = false,
  isSold = false
}) {
  return (
    <div
      style={{
        backgroundColor: '#111216',
        border: `1px solid ${isSold ? '#4CAF50' : showConfirmPayment ? '#ff9800' : '#2C2C2C'}`,
        borderRadius: '12px',
        padding: '24px',
        transition: 'transform 0.2s, box-shadow 0.2s',
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
          backgroundColor: isSold ? '#4CAF50' : asset.verified ? '#4CAF50' : '#ff9800',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {isSold ? '✓ Sold' : asset.verified ? '✓ Verified' : '⏳ Pending'}
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

      {/* Buyer Info (if applicable) */}
      {showConfirmPayment && asset.currentBuyer && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            color: '#6D6041',
            fontSize: '12px',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Buyer
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
            {asset.currentBuyer.slice(0, 10)}...{asset.currentBuyer.slice(-8)}
          </div>
        </div>
      )}

      {/* Status */}
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
            {isSold ? 'Sold' : showConfirmPayment ? 'Awaiting Confirmation' : 'Listed'}
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

      {/* Action Buttons */}
      {!isSold && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: showConfirmPayment ? '1fr 1fr' : '1fr',
          gap: '12px'
        }}>
          {showConfirmPayment && (
            <button
              onClick={() => onConfirmPayment(asset)}
              disabled={isPending || isConfirming || isProcessing}
              style={{
                padding: '12px',
                backgroundColor: isPending || isConfirming || isProcessing ? '#2C2C2C' : '#4CAF50',
                color: isPending || isConfirming || isProcessing ? '#6D6041' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isPending || isConfirming || isProcessing ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
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
          <button
            onClick={() => onDelist(asset)}
            disabled={isPending || isConfirming || isProcessing}
            style={{
              padding: '12px',
              backgroundColor: isPending || isConfirming || isProcessing ? '#2C2C2C' : '#f44336',
              color: isPending || isConfirming || isProcessing ? '#6D6041' : '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isPending || isConfirming || isProcessing ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
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
          ✓ Sale Completed
        </div>
      )}
    </div>
  );
}