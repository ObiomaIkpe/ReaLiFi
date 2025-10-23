import { useState } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS } from '@/config/contract.config';
import { MOCK_USDC } from '@/config/contract.config'; 
import { formatUnits } from 'viem';
import { MOCK_USDC_ADDRESS } from '@/config/contract.config';

export function Marketplace() {
  const { address, isConnected } = useAccount();
  const [buyingTokenId, setBuyingTokenId] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Fetch available assets
  const { data: assets, isLoading, isError, refetch } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAvailableAssets',
  });

  // Buy asset transaction
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get USDC token address from contract
  const { data: usdcAddress } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC,
    functionName: 'usdcToken',
  });

  // Check USDC balance using MOCK_USDC_ABI
  const { data: usdcBalance } = useReadContract({
    address: usdcAddress,
    abi: MOCK_USDC, // 👈 Using your mock USDC ABI
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Check USDC allowance using MOCK_USDC_ABI
  const { data: usdcAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ADDRESS, // 👈 Using your mock USDC ABI
    functionName: 'allowance',
    args: address ? [address, REAL_ESTATE_DAPP_ADDRESS] : undefined,
  });

  const handleBuyClick = (asset) => {
    setSelectedAsset(asset);
    setShowBuyModal(true);
  };

  const handleApproveUSDC = async () => {
    if (!selectedAsset || !usdcAddress) return;

    try {
      writeContract({
        address: usdcAddress,
        abi: MOCK_USDC, // 👈 Using your mock USDC ABI
        functionName: 'approve',
        args: [REAL_ESTATE_DAPP_ADDRESS, selectedAsset.price],
      });
    } catch (err) {
      console.error('Error approving USDC:', err);
    }
  };

  const handleBuyAsset = async () => {
    if (!selectedAsset) return;

    try {
      setBuyingTokenId(selectedAsset.tokenId);
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'buyAsset',
        args: [selectedAsset.tokenId],
      });
    } catch (err) {
      console.error('Error buying asset:', err);
      setBuyingTokenId(null);
    }
  };

  // Reset state and refetch when transaction succeeds
  if (isSuccess && buyingTokenId) {
    setTimeout(() => {
      setBuyingTokenId(null);
      setShowBuyModal(false);
      setSelectedAsset(null);
      refetch();
    }, 2000);
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
          Loading marketplace...
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
          Error loading marketplace
        </div>
      </div>
    );
  }

  const needsApproval = selectedAsset && usdcAllowance !== undefined && 
    BigInt(usdcAllowance.toString()) < BigInt(selectedAsset.price.toString());

  const insufficientBalance = selectedAsset && usdcBalance !== undefined &&
    BigInt(usdcBalance.toString()) < BigInt(selectedAsset.price.toString());

  return (
    <div style={{
      backgroundColor: '#121317',
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{
            color: '#CAAB5B',
            fontSize: '40px',
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>
            Real Estate Marketplace
          </h1>
          <p style={{
            color: '#6D6041',
            fontSize: '16px',
          }}>
            Browse and purchase verified real estate assets
          </p>
        </div>

        {/* Stats */}
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
            textAlign: 'center'
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              AVAILABLE ASSETS
            </div>
            <div style={{ color: '#CAAB5B', fontSize: '28px', fontWeight: 'bold' }}>
              {assets?.length || 0}
            </div>
          </div>
          {isConnected && usdcBalance !== undefined && (
            <div style={{
              backgroundColor: '#111216',
              border: '1px solid #2C2C2C',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
                YOUR USDC BALANCE
              </div>
              <div style={{ color: '#E1E2E2', fontSize: '28px', fontWeight: 'bold' }}>
                {formatUnits(usdcBalance, 6)}
              </div>
            </div>
          )}
        </div>

        {/* Asset Grid */}
        {assets && assets.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {assets.map((asset) => (
              <AssetCard
                key={asset.tokenId.toString()}
                asset={asset}
                onBuy={handleBuyClick}
                isConnected={isConnected}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6D6041'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <div style={{ fontSize: '18px' }}>No assets available at the moment</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              Check back later for new listings
            </div>
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {showBuyModal && selectedAsset && (
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
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                color: '#CAAB5B',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0
              }}>
                Purchase Asset
              </h2>
              <button
                onClick={() => {
                  setShowBuyModal(false);
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
                <span style={{ color: '#6D6041', fontSize: '14px' }}>Status</span>
                <span style={{
                  color: '#4CAF50',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  ✓ Verified
                </span>
              </div>
            </div>

            {/* Balance Check */}
            {isConnected && usdcBalance !== undefined && (
              <div style={{
                backgroundColor: insufficientBalance ? '#f4433620' : '#121317',
                border: `1px solid ${insufficientBalance ? '#f44336' : '#2C2C2C'}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#6D6041', fontSize: '14px' }}>Your Balance</span>
                  <span style={{
                    color: insufficientBalance ? '#f44336' : '#E1E2E2',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {formatUnits(usdcBalance, 6)} USDC
                  </span>
                </div>
                {insufficientBalance && (
                  <div style={{
                    color: '#f44336',
                    fontSize: '12px',
                    marginTop: '8px'
                  }}>
                    ⚠️ Insufficient balance to purchase this asset
                  </div>
                )}
              </div>
            )}

            {/* Transaction Status */}
            {hash && (
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#121317',
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
                    ✓ Purchase successful!
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
                fontSize: '14px'
              }}>
                Error: {error.message}
              </div>
            )}

            {/* Action Buttons */}
            {!isConnected ? (
              <div style={{
                padding: '16px',
                backgroundColor: '#121317',
                border: '1px solid #2C2C2C',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#6D6041'
              }}>
                Please connect your wallet to purchase
              </div>
            ) : insufficientBalance ? (
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#2C2C2C',
                  color: '#6D6041',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'not-allowed'
                }}
              >
                Insufficient Balance
              </button>
            ) : needsApproval ? (
              <button
                onClick={handleApproveUSDC}
                disabled={isPending || isConfirming}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#CAAB5B',
                  color: isPending || isConfirming ? '#6D6041' : '#121317',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
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
                {isConfirming && 'Approving...'}
                {!isPending && !isConfirming && '1. Approve USDC'}
              </button>
            ) : (
              <button
                onClick={handleBuyAsset}
                disabled={isPending || isConfirming}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#4CAF50',
                  color: isPending || isConfirming ? '#6D6041' : '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
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
                {isConfirming && 'Purchasing...'}
                {!isPending && !isConfirming && '2. Purchase Asset'}
              </button>
            )}

            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#121317',
              border: '1px solid #2C2C2C',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#6D6041',
              textAlign: 'center'
            }}>
              💡 You need to approve USDC spending first, then purchase the asset
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// AssetCard component remains the same...
function AssetCard({
  asset,
  onBuy,
  isConnected
}) {
  return (
    <div
      style={{
        backgroundColor: '#111216',
        border: '1px solid #2C2C2C',
        borderRadius: '12px',
        padding: '24px',
        transition: 'transform 0.2s, border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#CAAB5B';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2C2C2C';
        e.currentTarget.style.transform = 'translateY(0)';
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
        {asset.verified && (
          <div style={{
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            ✓ Verified
          </div>
        )}
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
          fontSize: '32px',
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
          fontSize: '13px',
          fontFamily: 'monospace',
          backgroundColor: '#121317',
          padding: '8px 12px',
          borderRadius: '6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={() => onBuy(asset)}
        disabled={!isConnected}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: !isConnected ? '#2C2C2C' : '#CAAB5B',
          color: !isConnected ? '#6D6041' : '#121317',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: !isConnected ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => {
          if (isConnected) e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          if (isConnected) e.currentTarget.style.opacity = '1';
        }}
      >
        {!isConnected ? 'Connect Wallet' : 'Buy Now'}
      </button>

      {asset.isFractionalized && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#121317',
          border: '1px solid #2C2C2C',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#CAAB5B',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          🔹 Also available as fractions
        </div>
      )}
    </div>
  );
}