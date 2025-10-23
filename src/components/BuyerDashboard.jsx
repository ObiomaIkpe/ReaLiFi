// src/components/BuyerDashboard.tsx
import { useState } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REAL_ESTATE_DAPP_ADDRESS, REAL_ESTATE_DAPP } from '../config/contract.config';
import { formatUnits } from 'viem';

export function BuyerDashboard() {
  const { address, isConnected } = useAccount();
  const [cancelingTokenId, setCancelingTokenId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Fetch all assets to filter buyer's purchases
  const { data: allAssets, isLoading, isError, refetch } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAllAssetsWithDisplayInfo',
  });

  // Get buyer's fractional portfolio
  const { data: buyerPortfolio } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getBuyerPortfolio',
    args: address ? [address] : undefined,
  });

  // Transaction handling
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCancelClick = (asset) => {
    setSelectedAsset(asset);
    setShowCancelModal(true);
  };

  const handleCancelPurchase = async () => {
    if (!selectedAsset) return;

    try {
      setCancelingTokenId(selectedAsset.tokenId);
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'cancelAssetPurchase',
        args: [selectedAsset.tokenId],
      });
    } catch (err) {
      console.error('Error canceling purchase:', err);
      setCancelingTokenId(null);
    }
  };

  // Reset state and refetch when transaction succeeds
  if (isSuccess && cancelingTokenId) {
    setTimeout(() => {
      setCancelingTokenId(null);
      setShowCancelModal(false);
      setSelectedAsset(null);
      refetch();
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
            Please connect your wallet to access your dashboard
          </div>
        </div>
      </div>
    );
  }

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
          Loading your portfolio...
        </div>
      </div>
    );
  }

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
          Error loading your portfolio
        </div>
      </div>
    );
  }

  // Filter assets where current user is the buyer
  const pendingPurchases = allAssets?.filter(
    asset => asset.currentBuyer.toLowerCase() === address?.toLowerCase() && 
    !asset.isPaidFor && 
    !asset.isCanceled
  ) || [];

  const completedPurchases = allAssets?.filter(
    asset => asset.currentBuyer.toLowerCase() === address?.toLowerCase() && 
    asset.isPaidFor
  ) || [];

  const canceledPurchases = allAssets?.filter(
    asset => asset.currentBuyer.toLowerCase() === address?.toLowerCase() && 
    asset.isCanceled
  ) || [];

  // Calculate total investment
  const totalInvestment = completedPurchases.reduce(
    (sum, asset) => sum + BigInt(asset.price.toString()),
    BigInt(0)
  );

  const pendingAmount = pendingPurchases.reduce(
    (sum, asset) => sum + BigInt(asset.price.toString()),
    BigInt(0)
  );

  // Calculate fractional investments
  const fractionalInvestment = buyerPortfolio?.reduce(
    (sum, item) => sum + BigInt(item.investmentValue.toString()),
    BigInt(0)
  ) || BigInt(0);

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
              Buyer Dashboard
            </h1>
            <p style={{
              color: '#6D6041',
              fontSize: '14px',
              margin: 0
            }}>
              Manage your investments and purchases
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
            💼 Investor
          </div>
        </div>

        {/* Portfolio Overview */}
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
              TOTAL PURCHASES
            </div>
            <div style={{ color: '#E1E2E2', fontSize: '28px', fontWeight: 'bold' }}>
              {completedPurchases.length}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              PENDING
            </div>
            <div style={{ color: '#ff9800', fontSize: '28px', fontWeight: 'bold' }}>
              {pendingPurchases.length}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              FRACTIONAL ASSETS
            </div>
            <div style={{ color: '#CAAB5B', fontSize: '28px', fontWeight: 'bold' }}>
              {buyerPortfolio?.length || 0}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              TOTAL INVESTED
            </div>
            <div style={{ color: '#4CAF50', fontSize: '24px', fontWeight: 'bold' }}>
              {formatUnits(totalInvestment + fractionalInvestment, 6)} USDC
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
              <div style={{ color: '#CAAB5B', marginBottom: '8px', fontWeight: 'bold' }}>
                ⏳ Transaction confirming...
              </div>
            )}
            {isSuccess && (
              <div style={{ color: '#4CAF50', marginBottom: '8px', fontWeight: 'bold' }}>
                ✓ Purchase canceled successfully! Refund processed.
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

        {/* Pending Purchases Section */}
        {pendingPurchases.length > 0 && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                color: '#ff9800',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⏳</span> Pending Purchases ({pendingPurchases.length})
              </h2>
              <div style={{
                backgroundColor: '#111216',
                border: '1px solid #ff9800',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#ff9800',
                fontSize: '14px',
                fontWeight: 'bold',
              }}>
                Pending: {formatUnits(pendingAmount, 6)} USDC
              </div>
            </div>

            <div style={{
              backgroundColor: '#111216',
              border: '1px solid #ff9800',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '14px',
              color: '#E1E2E2'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff9800' }}>
                ⚠️ Awaiting Seller Confirmation
              </div>
              These purchases are waiting for the seller to confirm payment. You can cancel any pending 
              purchase before the seller confirms it. A cancellation penalty may apply.
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {pendingPurchases.map((asset) => (
                <BuyerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onCancel={handleCancelClick}
                  isCanceling={cancelingTokenId === asset.tokenId}
                  isPending={isPending}
                  isConfirming={isConfirming}
                  status="pending"
                />
              ))}
            </div>
          </>
        )}

        {/* Completed Purchases Section */}
        {completedPurchases.length > 0 && (
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
              <span>✓</span> Completed Purchases ({completedPurchases.length})
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {completedPurchases.map((asset) => (
                <BuyerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onCancel={handleCancelClick}
                  isCanceling={false}
                  isPending={false}
                  isConfirming={false}
                  status="completed"
                />
              ))}
            </div>
          </>
        )}

        {/* Fractional Portfolio Section */}
        {buyerPortfolio && buyerPortfolio.length > 0 && (
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
              <span>🔹</span> Fractional Investments ({buyerPortfolio.length})
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {buyerPortfolio.map((item) => (
                <FractionalAssetCard
                  key={item.tokenId.toString()}
                  portfolioItem={item}
                />
              ))}
            </div>
          </>
        )}

        {/* Canceled Purchases Section */}
        {canceledPurchases.length > 0 && (
          <>
            <h2 style={{
              color: '#6D6041',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✕</span> Canceled Purchases ({canceledPurchases.length})
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {canceledPurchases.map((asset) => (
                <BuyerAssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onCancel={handleCancelClick}
                  isCanceling={false}
                  isPending={false}
                  isConfirming={false}
                  status="canceled"
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {pendingPurchases.length === 0 && 
         completedPurchases.length === 0 && 
         (!buyerPortfolio || buyerPortfolio.length === 0) && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6D6041'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>No purchases yet</div>
            <div style={{ fontSize: '14px', marginBottom: '24px' }}>
              Visit the marketplace to start investing in real estate
            </div>
            <button
              onClick={() => window.location.href = '/marketplace'}
              style={{
                padding: '12px 24px',
                backgroundColor: '#CAAB5B',
                color: '#121317',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Browse Marketplace
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAsset && (
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
                color: '#f44336',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0
              }}>
                Cancel Purchase
              </h2>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedAsset(null);
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

            {/* Warning Message */}
            <div style={{
              backgroundColor: '#f4433620',
              border: '1px solid #f44336',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '14px',
              color: '#E1E2E2'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#f44336' }}>
                ⚠️ Cancellation Policy
              </div>
              By canceling this purchase, a cancellation penalty may be deducted from your refund. 
              The remaining amount will be returned to your wallet.
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedAsset(null);
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
                Go Back
              </button>
              <button
                onClick={handleCancelPurchase}
                disabled={isPending || isConfirming}
                style={{
                  padding: '14px',
                  backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#f44336',
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
                {isConfirming && 'Canceling...'}
                {!isPending && !isConfirming && 'Cancel Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Buyer Asset Card Component
function BuyerAssetCard({
  asset,
  onCancel,
  isCanceling,
  isPending,
  isConfirming,
  status
}) {
  const statusConfig = {
    pending: {
      borderColor: '#ff9800',
      badgeColor: '#ff9800',
      badgeText: '⏳ Pending',
      showCancel: true
    },
    completed: {
      borderColor: '#4CAF50',
      badgeColor: '#4CAF50',
      badgeText: '✓ Completed',
      showCancel: false
    },
    canceled: {
      borderColor: '#6D6041',
      badgeColor: '#6D6041',
      badgeText: '✕ Canceled',
      showCancel: false
    }
  };

  const config = statusConfig[status];

  return (
    <div
      style={{
        backgroundColor: '#111216',
        border: `1px solid ${config.borderColor}`,
        borderRadius: '12px',
        padding: '24px',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(202, 171, 91, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
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
          backgroundColor: config.badgeColor,
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {config.badgeText}
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
          Purchase Price
        </div>
        <div style={{
          color: '#CAAB5B',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          {formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      {/* Seller */}
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

      {/* Status Details */}
      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid #2C2C2C',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#6D6041', fontSize: '12px' }}>Verified</span>
          <span style={{ color: asset.verified ? '#4CAF50' : '#6D6041', fontSize: '12px' }}>
            {asset.verified ? '✓ Yes' : 'No'}
          </span>
        </div>
        {status === 'pending' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#6D6041', fontSize: '12px' }}>Payment Confirmed</span>
            <span style={{ color: '#ff9800', fontSize: '12px' }}>
              Awaiting Seller
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      {config.showCancel ? (
        <button
          onClick={() => onCancel(asset)}
          disabled={isPending || isConfirming || isCanceling}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isPending || isConfirming || isCanceling ? '#2C2C2C' : '#f44336',
            color: isPending || isConfirming || isCanceling ? '#6D6041' : '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: isPending || isConfirming || isCanceling ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isPending && !isConfirming && !isCanceling) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPending && !isConfirming && !isCanceling) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isCanceling && isPending && 'Confirm in wallet...'}
          {isCanceling && isConfirming && 'Canceling...'}
          {!isCanceling && '✕ Cancel Purchase'}
        </button>
      ) : (
        <div style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#2C2C2C',
          color: config.badgeColor,
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          {status ==='completed' ? '✓ Purchase Complete' : '✕ Purchase Canceled'}
        </div>
      )}
    </div>
  );
}

// Fractional Asset Card Component
function FractionalAssetCard({ portfolioItem }) {
  return (
    <div
      style={{
        backgroundColor: '#111216',
        border: '1px solid #CAAB5B',
        borderRadius: '12px',
        padding: '24px',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(202, 171, 91, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
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
          #{portfolioItem.tokenId.toString()}
        </div>
        <div style={{
          backgroundColor: '#CAAB5B',
          color: '#121317',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          🔹 Fractional
        </div>
      </div>

      {/* Ownership Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{
            color: '#6D6041',
            fontSize: '12px',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Tokens Owned
          </div>
          <div style={{
            color: '#E1E2E2',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {portfolioItem.fractionalTokensOwned.toString()}
          </div>
        </div>
        <div>
          <div style={{
            color: '#6D6041',
            fontSize: '12px',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Ownership
          </div>
          <div style={{
            color: '#CAAB5B',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {(Number(portfolioItem.ownershipPercentage) / 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Investment Value */}
      <div style={{
        backgroundColor: '#121317',
        border: '1px solid #2C2C2C',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          color: '#6D6041',
          fontSize: '12px',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Investment Value
        </div>
        <div style={{
          color: '#4CAF50',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          {formatUnits(portfolioItem.investmentValue, 6)} USDC
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        backgroundColor: '#121317',
        border: '1px solid #2C2C2C',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center',
        color: '#6D6041',
        fontSize: '12px'
      }}>
        💡 You own fractional shares of this asset
      </div>
    </div>
  );
}