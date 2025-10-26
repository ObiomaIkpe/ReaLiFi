// src/components/BuyerDashboard.tsx
import { useState } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS, MOCK_USDC, MOCK_USDC_ADDRESS } from '../config/contract.config';
import { formatUnits, parseUnits } from 'viem';

export function BuyerDashboard() {
  const { address, isConnected } = useAccount();
  const [selectedTab, setSelectedTab] = useState('browse'); // browse, portfolio, pending
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState(null); // 'whole' or 'fractional'
  const [fractionalAmount, setFractionalAmount] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);

  // Get available assets (verified, not sold, not canceled)
  const { data: availableAssets, refetch: refetchAssets } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAvailableAssets',
    args: [],
  });

  // Get fractionalized assets
  const { data: fractionalAssets } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchFractionalizedAssets',
    args: [],
  });

  // Get buyer portfolio
  const { data: portfolio, refetch: refetchPortfolio } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getBuyerPortfolio',
    args: address ? [address] : undefined,
  });

  // Get USDC balance
  const { data: usdcBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Get USDC allowance
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC,
    functionName: 'allowance',
    args: address ? [address, REAL_ESTATE_DAPP_ADDRESS] : undefined,
  });

  // Get cancellation penalty percentage
  const { data: cancellationPenalty } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'CANCELLATION_PENALTY_PERCENTAGE',
    args: [],
  });

  // Transaction handling
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Filter assets
  const wholeAssets = availableAssets?.filter(asset => !asset.isFractionalized) || [];
  const fractionalizedAssets = fractionalAssets || [];

  // Get pending purchases (assets where user is current buyer)
  const pendingPurchases = availableAssets?.filter(
    asset => asset.currentBuyer && 
    asset.currentBuyer.toLowerCase() === address?.toLowerCase() && 
    !asset.isPaidFor
  ) || [];

  // Handle approve USDC
  const handleApproveUSDC = async (amount) => {
    try {
      writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC,
        functionName: 'approve',
        args: [REAL_ESTATE_DAPP_ADDRESS, amount],
      });
    } catch (err) {
      console.error('Error approving USDC:', err);
    }
  };

  // Handle buy whole asset
  const handleBuyWholeAsset = async () => {
    if (!selectedAsset) return;

    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'buyAsset',
        args: [selectedAsset.tokenId],
      });
    } catch (err) {
      console.error('Error buying asset:', err);
    }
  };

  // Handle buy fractional asset
  const handleBuyFractionalAsset = async () => {
    if (!selectedAsset || !fractionalAmount) return;

    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'buyFractionalAsset',
        args: [selectedAsset.tokenId, BigInt(fractionalAmount)],
      });
    } catch (err) {
      console.error('Error buying fractional asset:', err);
    }
  };

  // Handle cancel purchase
  const handleCancelPurchase = async (tokenId) => {
    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'cancelAssetPurchase',
        args: [tokenId],
      });
    } catch (err) {
      console.error('Error canceling purchase:', err);
    }
  };

  // Handle mint USDC (for testing)
  const handleMintUSDC = async () => {
    try {
      writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC,
        functionName: 'mint',
        args: [address, parseUnits('10000', 6)], // Mint 10,000 USDC
      });
    } catch (err) {
      console.error('Error minting USDC:', err);
    }
  };

  // Open purchase modal
  const openPurchaseModal = (asset, type) => {
    setSelectedAsset(asset);
    setPurchaseType(type);
    
    // Check if approval is needed
    const requiredAmount = type === 'whole' 
      ? asset.price 
      : BigInt(fractionalAmount || 0) * asset.pricePerFractionalToken;
    
    const hasEnoughAllowance = usdcAllowance && usdcAllowance >= requiredAmount;
    setNeedsApproval(!hasEnoughAllowance);
    setShowPurchaseModal(true);
  };

  // Reset on success
  if (isSuccess) {
    setTimeout(() => {
      setShowPurchaseModal(false);
      setSelectedAsset(null);
      setPurchaseType(null);
      setFractionalAmount('');
      setNeedsApproval(false);
      refetchAssets();
      refetchPortfolio();
      refetchAllowance();
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
            Please connect your wallet to browse and purchase properties
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
              Browse and purchase real estate assets
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
            🛒 Buyer
          </div>
        </div>

        {/* USDC Balance & Actions */}
        <div style={{
          backgroundColor: '#111216',
          border: '1px solid #2C2C2C',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{
                color: '#6D6041',
                fontSize: '12px',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Your USDC Balance
              </div>
              <div style={{
                color: '#CAAB5B',
                fontSize: '36px',
                fontWeight: 'bold'
              }}>
                {usdcBalance ? formatUnits(usdcBalance, 6) : '0'} USDC
              </div>
            </div>
            <button
              onClick={handleMintUSDC}
              disabled={isPending || isConfirming}
              style={{
                padding: '12px 24px',
                backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#4CAF50',
                color: isPending || isConfirming ? '#6D6041' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
              }}
            >
              💰 Mint Test USDC
            </button>
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
              AVAILABLE PROPERTIES
            </div>
            <div style={{ color: '#E1E2E2', fontSize: '28px', fontWeight: 'bold' }}>
              {wholeAssets.length}
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
              {fractionalizedAssets.length}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              MY INVESTMENTS
            </div>
            <div style={{ color: '#4CAF50', fontSize: '28px', fontWeight: 'bold' }}>
              {portfolio?.length || 0}
            </div>
          </div>
          <div style={{
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
              PENDING PURCHASES
            </div>
            <div style={{ color: '#ff9800', fontSize: '28px', fontWeight: 'bold' }}>
              {pendingPurchases.length}
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
                ✓ Transaction completed successfully!
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
            onClick={() => setSelectedTab('browse')}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedTab === 'browse' ? '#111216' : 'transparent',
              color: selectedTab === 'browse' ? '#CAAB5B' : '#6D6041',
              border: 'none',
              borderBottom: selectedTab === 'browse' ? '2px solid #CAAB5B' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Browse Properties
          </button>
          <button
            onClick={() => setSelectedTab('fractional')}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedTab === 'fractional' ? '#111216' : 'transparent',
              color: selectedTab === 'fractional' ? '#CAAB5B' : '#6D6041',
              border: 'none',
              borderBottom: selectedTab === 'fractional' ? '2px solid #CAAB5B' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Fractional Investments
          </button>
          <button
            onClick={() => setSelectedTab('portfolio')}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedTab === 'portfolio' ? '#111216' : 'transparent',
              color: selectedTab === 'portfolio' ? '#CAAB5B' : '#6D6041',
              border: 'none',
              borderBottom: selectedTab === 'portfolio' ? '2px solid #CAAB5B' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            My Portfolio
          </button>
          {pendingPurchases.length > 0 && (
            <button
              onClick={() => setSelectedTab('pending')}
              style={{
                padding: '12px 24px',
                backgroundColor: selectedTab === 'pending' ? '#111216' : 'transparent',
                color: selectedTab === 'pending' ? '#ff9800' : '#6D6041',
                border: 'none',
                borderBottom: selectedTab === 'pending' ? '2px solid #ff9800' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              Pending
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: '#ff9800',
                color: '#121317',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {pendingPurchases.length}
              </span>
            </button>
          )}
        </div>

        {/* Browse Properties Tab */}
        {selectedTab === 'browse' && (
          <>
            {wholeAssets.length > 0 ? (
              <>
                <h2 style={{
                  color: '#CAAB5B',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                }}>
                  Available Properties ({wholeAssets.length})
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '24px'
                }}>
                  {wholeAssets.map((asset) => (
                    <AssetCard
                      key={asset.tokenId.toString()}
                      asset={asset}
                      onPurchase={() => openPurchaseModal(asset, 'whole')}
                      isPending={isPending}
                      isConfirming={isConfirming}
                      type="whole"
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
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>No Properties Available</div>
                <div style={{ fontSize: '14px' }}>
                  Check back later for new listings
                </div>
              </div>
            )}
          </>
        )}

        {/* Fractional Investments Tab */}
        {selectedTab === 'fractional' && (
          <>
            {fractionalizedAssets.length > 0 ? (
              <>
                <h2 style={{
                  color: '#CAAB5B',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                }}>
                  Fractional Investments ({fractionalizedAssets.length})
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '24px'
                }}>
                  {fractionalizedAssets.map((asset) => (
                    <AssetCard
                      key={asset.tokenId.toString()}
                      asset={asset}
                      onPurchase={() => openPurchaseModal(asset, 'fractional')}
                      isPending={isPending}
                      isConfirming={isConfirming}
                      type="fractional"
                      fractionalAmount={fractionalAmount}
                      setFractionalAmount={setFractionalAmount}
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
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔹</div>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>No Fractional Assets Available</div>
                <div style={{ fontSize: '14px' }}>
                  Check back later for fractional investment opportunities
                </div>
              </div>
            )}
          </>
        )}

        {/* Portfolio Tab */}
        {selectedTab === 'portfolio' && (
          <>
            {portfolio && portfolio.length > 0 ? (
              <>
                <h2 style={{
                  color: '#4CAF50',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                }}>
                  My Portfolio ({portfolio.length})
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '24px'
                }}>
                  {portfolio.map((item) => (
                    <PortfolioCard
                      key={item.tokenId.toString()}
                      item={item}
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
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>No Investments Yet</div>
                <div style={{ fontSize: '14px' }}>
                  Start investing in fractional properties to build your portfolio
                </div>
              </div>
            )}
          </>
        )}

        {/* Pending Purchases Tab */}
        {selectedTab === 'pending' && (
          <>
            {pendingPurchases.length > 0 ? (
              <>
                <h2 style={{
                  color: '#ff9800',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                }}>
                  Pending Purchases ({pendingPurchases.length})
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '24px'
                }}>
                  {pendingPurchases.map((asset) => (
                    <PendingPurchaseCard
                      key={asset.tokenId.toString()}
                      asset={asset}
                      onCancel={() => handleCancelPurchase(asset.tokenId)}
                      isPending={isPending}
                      isConfirming={isConfirming}
                      cancellationPenalty={cancellationPenalty}
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
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>No Pending Purchases</div>
                <div style={{ fontSize: '14px' }}>
                  All your purchases have been confirmed
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedAsset && (
        <PurchaseModal
          asset={selectedAsset}
          purchaseType={purchaseType}
          fractionalAmount={fractionalAmount}
          setFractionalAmount={setFractionalAmount}
          needsApproval={needsApproval}
          usdcBalance={usdcBalance}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedAsset(null);
            setPurchaseType(null);
            setFractionalAmount('');
          }}
          onApprove={handleApproveUSDC}
          onPurchase={purchaseType === 'whole' ? handleBuyWholeAsset : handleBuyFractionalAsset}
          isPending={isPending}
          isConfirming={isConfirming}
        />
      )}
    </div>
  );
}

// Asset Card Component
function AssetCard({ asset, onPurchase, isPending, isConfirming, type, fractionalAmount, setFractionalAmount }) {
  const [localAmount, setLocalAmount] = useState('1');

  return (
    <div
      style={{
        backgroundColor: '#111216',
        border: '1px solid #2C2C2C',
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
          backgroundColor: type === 'fractional' ? '#4CAF50' : '#CAAB5B',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {type === 'fractional' ? '🔹 Fractional' : '🏠 Whole'}
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
          {type === 'fractional' ? 'Price Per Token' : 'Total Price'}
        </div>
        <div style={{
          color: '#CAAB5B',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          {type === 'fractional' 
            ? formatUnits(asset.pricePerFractionalToken, 6)
            : formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      {/* Fractional Info */}
      {type === 'fractional' && (
        <div style={{
          backgroundColor: '#121317',
          border: '1px solid #2C2C2C',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div>
              <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
                Total Tokens
              </div>
              <div style={{ color: '#E1E2E2', fontSize: '16px', fontWeight: 'bold' }}>
                {asset.totalFractionalTokens?.toString() || '0'}
              </div>
            </div>
            <div>
              <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
                Available
              </div>
              <div style={{ color: '#4CAF50', fontSize: '16px', fontWeight: 'bold' }}>
                {asset.remainingFractionalTokens?.toString() || '0'}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label style={{
              color: '#6D6041',
              fontSize: '11px',
              display: 'block',
              marginBottom: '4px'
            }}>
              Tokens to Buy
            </label>
            <input
              type="number"
              value={localAmount}
              onChange={(e) => setLocalAmount(e.target.value)}
              min="1"
              max={asset.remainingFractionalTokens?.toString() || '0'}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#111216',
                border: '1px solid #2C2C2C',
                borderRadius: '6px',
                color: '#E1E2E2',
                fontSize: '14px'
              }}
            />
            <div style={{ color: '#6D6041', fontSize: '11px', marginTop: '4px' }}>
              Total: {localAmount && asset.pricePerFractionalToken 
                ? formatUnits(BigInt(localAmount) * asset.pricePerFractionalToken, 6)
                : '0'} USDC
            </div>
          </div>
        </div>
      )}

      {/* Seller */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid #2C2C2C',
        marginBottom: '20px'
      }}>
        <div style={{ color: '#6D6041', fontSize: '12px' }}>Seller</div>
        <div style={{
          color: '#E1E2E2',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={() => {
          if (type === 'fractional') {
            setFractionalAmount(localAmount);
          }
          onPurchase();
        }}
        disabled={isPending || isConfirming || (type === 'fractional' && (!localAmount || Number(localAmount) <= 0))}
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
        {type === 'fractional' ? '🔹 Buy Tokens' : '🏠 Buy Property'}
      </button>
    </div>
  );
}

// Portfolio Card Component
function PortfolioCard({ item }) {
  return (
    <div style={{
      backgroundColor: '#111216',
      border: '1px solid #4CAF50',
      borderRadius: '12px',
      padding: '24px',
    }}>
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
          #{item.tokenId.toString()}
        </div>
        <div style={{
          backgroundColor: '#4CAF50',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          ✓ Invested
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
            Tokens Owned
          </div>
          <div style={{ color: '#E1E2E2', fontSize: '20px', fontWeight: 'bold' }}>
            {item.fractionalTokensOwned.toString()}
          </div>
        </div>
        <div>
          <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
            Ownership %
          </div>
          <div style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold' }}>
            {item.ownershipPercentage.toString()}%
          </div>
        </div>
      </div>

      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid #2C2C2C'
      }}>
        <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
          Investment Value
        </div>
        <div style={{ color: '#CAAB5B', fontSize: '24px', fontWeight: 'bold' }}>
          {formatUnits(item.investmentValue, 6)} USDC
        </div>
      </div>
    </div>
  );
}

// Pending Purchase Card Component
function PendingPurchaseCard({ asset, onCancel, isPending, isConfirming, cancellationPenalty }) {
  const penaltyAmount = cancellationPenalty 
    ? (asset.price * cancellationPenalty) / BigInt(100)
    : BigInt(0);

  return (
    <div style={{
      backgroundColor: '#111216',
      border: '1px solid #ff9800',
      borderRadius: '12px',
      padding: '24px',
    }}>
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
          backgroundColor: '#ff9800',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          ⏳ Pending
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
          Purchase Price
        </div>
        <div style={{ color: '#CAAB5B', fontSize: '28px', fontWeight: 'bold' }}>
          {formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      <div style={{
        backgroundColor: '#ff980020',
        border: '1px solid #ff9800',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '12px',
        color: '#E1E2E2'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff9800' }}>
          ⏳ Awaiting Seller Confirmation
        </div>
        The seller needs to confirm receipt of payment. You can cancel this purchase, but a{' '}
        {cancellationPenalty?.toString()}% penalty ({formatUnits(penaltyAmount, 6)} USDC) will apply.
      </div>

      <button
        onClick={onCancel}
        disabled={isPending || isConfirming}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#f44336',
          color: isPending || isConfirming ? '#6D6041' : '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
        }}
      >
        Cancel Purchase (with penalty)
      </button>
    </div>
  );
}

// Purchase Modal Component
function PurchaseModal({
  asset,
  purchaseType,
  fractionalAmount,
  setFractionalAmount,
  needsApproval,
  usdcBalance,
  onClose,
  onApprove,
  onPurchase,
  isPending,
  isConfirming
}) {
  const totalPrice = purchaseType === 'whole'
    ? asset.price
    : BigInt(fractionalAmount || 0) * asset.pricePerFractionalToken;

  const hasEnoughBalance = usdcBalance && usdcBalance >= totalPrice;

  return (
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
            {purchaseType === 'whole' ? 'Purchase Property' : 'Buy Fractional Tokens'}
          </h2>
          <button
            onClick={onClose}
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
              #{asset.tokenId.toString()}
            </span>
          </div>
          {purchaseType === 'fractional' && (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#6D6041', fontSize: '14px' }}>Tokens to Buy</span>
                <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
                  {fractionalAmount}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#6D6041', fontSize: '14px' }}>Price per Token</span>
                <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
                  {formatUnits(asset.pricePerFractionalToken, 6)} USDC
                </span>
              </div>
            </>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #2C2C2C'
          }}>
            <span style={{ color: '#6D6041', fontSize: '14px' }}>Total Price</span>
            <span style={{ color: '#CAAB5B', fontSize: '18px', fontWeight: 'bold' }}>
              {formatUnits(totalPrice, 6)} USDC
            </span>
          </div>
        </div>

        {/* Balance Check */}
        <div style={{
          backgroundColor: hasEnoughBalance ? '#4CAF5020' : '#f4433620',
          border: `1px solid ${hasEnoughBalance ? '#4CAF50' : '#f44336'}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#E1E2E2'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#6D6041' }}>Your Balance:</span>
            <span style={{ fontWeight: 'bold' }}>
              {usdcBalance ? formatUnits(usdcBalance, 6) : '0'} USDC
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#6D6041' }}>Required:</span>
            <span style={{ fontWeight: 'bold' }}>
              {formatUnits(totalPrice, 6)} USDC
            </span>
          </div>
          {!hasEnoughBalance && (
            <div style={{
              marginTop: '12px',
              color: '#f44336',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              ⚠️ Insufficient USDC balance. Please mint more USDC.
            </div>
          )}
        </div>

        {/* Approval Status */}
        {needsApproval && (
          <div style={{
            backgroundColor: '#ff980020',
            border: '1px solid #ff9800',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#E1E2E2'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff9800' }}>
              ⚠️ Approval Required
            </div>
            You need to approve the marketplace contract to spend your USDC before purchasing.
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: needsApproval ? '1fr' : '1fr 1fr',
          gap: '12px'
        }}>
          {!needsApproval && (
            <button
              onClick={onClose}
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
          )}
          {needsApproval ? (
            <button
              onClick={() => onApprove(totalPrice)}
              disabled={isPending || isConfirming || !hasEnoughBalance}
              style={{
                padding: '14px',
                backgroundColor: isPending || isConfirming || !hasEnoughBalance ? '#2C2C2C' : '#ff9800',
                color: isPending || isConfirming || !hasEnoughBalance ? '#6D6041' : '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isPending || isConfirming || !hasEnoughBalance ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Approving...' : '✓ Approve USDC'}
            </button>
          ) : (
            <button
              onClick={onPurchase}
              disabled={isPending || isConfirming || !hasEnoughBalance}
              style={{
                padding: '14px',
                backgroundColor: isPending || isConfirming || !hasEnoughBalance ? '#2C2C2C' : '#4CAF50',
                color: isPending || isConfirming || !hasEnoughBalance ? '#6D6041' : '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isPending || isConfirming || !hasEnoughBalance ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Processing...' : '🛒 Purchase'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}