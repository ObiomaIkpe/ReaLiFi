// src/components/AdminAssetPanel.tsx
import { useState, useEffect } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REAL_ESTATE_DAPP_ADDRESS, REAL_ESTATE_DAPP } from '../config/contract.config';
import { formatUnits } from 'viem';

export function AdminAssetPanel() {
  const { address } = useAccount();
  const [verifyingTokenId, setVerifyingTokenId] = useState(null);

  // Fetch all assets
  const { data: assets, isLoading, isError, refetch } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAllListedAssets',
  });

  // Check if current user is admin - ADD enabled and isLoading
  const { 
    data: isAdmin, 
    isLoading: isCheckingAdmin,
    error: adminError 
  } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'isAdmin',
    args: [address],
    enabled: !!address, // Only run when address exists
  });

  // Debug log
  useEffect(() => {
    console.log('Admin Check:', {
      address,
      isAdmin,
      isCheckingAdmin,
      adminError
    });
  }, [address, isAdmin, isCheckingAdmin, adminError]);

  // Verify asset transaction
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleVerify = async (tokenId) => {
    try {
      setVerifyingTokenId(tokenId);
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'verifyAsset',
        args: [tokenId],
      });
    } catch (err) {
      console.error('Error verifying asset:', err);
      setVerifyingTokenId(null);
    }
  };

  useEffect(() => {
    if (isSuccess && verifyingTokenId) {
      setTimeout(() => {
        setVerifyingTokenId(null);
        refetch();
      }, 2000);
    }
  }, [isSuccess, verifyingTokenId, refetch]);

  // Loading state for wallet connection
  if (!address) {
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
            Please connect your wallet to access the admin panel
          </div>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Show loading while checking admin status
  if (isCheckingAdmin) {
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
          <div style={{ 
            width: '48px',
            height: '48px',
            border: '3px solid #2C2C2C',
            borderTop: '3px solid #CAAB5B',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ color: '#E1E2E2', fontSize: '18px', marginBottom: '8px' }}>
            Checking Admin Status...
          </div>
          <div style={{ color: '#6D6041', fontSize: '14px' }}>
            Verifying your permissions
          </div>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Check for explicit false, not just falsy
  if (isAdmin === false) {
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⛔</div>
          <div style={{ color: '#E1E2E2', fontSize: '18px', marginBottom: '8px' }}>
            Access Denied
          </div>
          <div style={{ color: '#6D6041', fontSize: '14px', marginBottom: '16px' }}>
            You do not have admin privileges to access this panel
          </div>
          <div style={{ 
            color: '#6D6041', 
            fontSize: '12px', 
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}>
            {address}
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
          Loading assets...
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
          Error loading assets
        </div>
      </div>
    );
  }

  const unverifiedAssets = assets?.filter(asset => !asset.verified) || [];
  const verifiedAssets = assets?.filter(asset => asset.verified) || [];

  return (
    <div style={{
      backgroundColor: '#121317',
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      {/* Add keyframes for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            color: '#CAAB5B',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: 0
          }}>
            Admin Asset Management
          </h1>
          <div style={{
            backgroundColor: '#111216',
            border: '2px solid #CAAB5B',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#CAAB5B',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            ⭐ Admin: {address?.slice(0, 6)}...{address?.slice(-4)}
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
              PENDING VERIFICATION
            </div>
            <div style={{ color: '#CAAB5B', fontSize: '28px', fontWeight: 'bold' }}>
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
                ✓ Asset verified successfully!
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

        {/* Pending Verification Section */}
        {unverifiedAssets.length > 0 && (
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
              <span>⚠️</span> Pending Verification ({unverifiedAssets.length})
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {unverifiedAssets.map((asset) => (
                <AssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onVerify={handleVerify}
                  isVerifying={verifyingTokenId === asset.tokenId}
                  isPending={isPending}
                  isConfirming={isConfirming}
                />
              ))}
            </div>
          </>
        )}

        {/* Verified Assets Section */}
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
              {verifiedAssets.map((asset) => (
                <AssetCard
                  key={asset.tokenId.toString()}
                  asset={asset}
                  onVerify={handleVerify}
                  isVerifying={false}
                  isPending={false}
                  isConfirming={false}
                  isVerified
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
            <div style={{ fontSize: '18px' }}>No assets found</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Asset Card Component (unchanged)
function AssetCard({
  asset,
  onVerify,
  isVerifying,
  isPending,
  isConfirming,
  isVerified = false
}) {
  return (
    <div
      style={{
        backgroundColor: '#111216',
        border: `1px solid ${isVerified ? '#4CAF50' : '#CAAB5B'}`,
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
          backgroundColor: asset.verified ? '#4CAF50' : '#ff9800',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {asset.verified ? '✓ Verified' : '⏳ Pending'}
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
          {asset.seller}
        </div>
      </div>

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
            {asset.sold ? 'Sold' : 'Available'}
          </div>
        </div>
      </div>

      {/* Action Button */}
      {!isVerified && (
        <button
          onClick={() => onVerify(asset.tokenId)}
          disabled={isPending || isConfirming || isVerifying}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: (isPending || isConfirming || isVerifying) ? '#2C2C2C' : '#4CAF50',
            color: (isPending || isConfirming || isVerifying) ? '#6D6041' : '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: (isPending || isConfirming || isVerifying) ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isPending && !isConfirming && !isVerifying) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPending && !isConfirming && !isVerifying) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isVerifying && isPending && 'Confirm in wallet...'}
          {isVerifying && isConfirming && 'Verifying on chain...'}
          {!isVerifying && '✓ Verify Asset'}
        </button>
      )}

      {isVerified && (
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
          ✓ Already Verified
        </div>
      )}
    </div>
  );
}