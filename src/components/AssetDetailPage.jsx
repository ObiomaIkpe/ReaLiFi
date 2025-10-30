// src/components/property/AssetDetailsPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS, MOCK_USDC, MOCK_USDC_ADDRESS } from '@/config/contract.config';
import { PurchaseModal } from '@/components/shared/PurchaseModal';

export function AssetDetailsPage() {
  const { tokenId } = useParams(); // Get tokenId from URL
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for purchase modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState(null);
  const [fractionalAmount, setFractionalAmount] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  
  // Metadata state
  const [metadata, setMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState(null);

  // Fetch asset data from blockchain
  const { data: asset, isLoading: assetLoading, error: assetError, refetch: refetchAsset } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getAssetDisplayInfo',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    enabled: !!tokenId
  });

  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC,
    functionName: 'allowance',
    args: address ? [address, REAL_ESTATE_DAPP_ADDRESS] : undefined,
  });

  const { data: fractionalBuyers } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchFractionalAssetBuyers',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    enabled: !!tokenId && asset?.isFractionalized
  });

  const { data: hash, writeContract, isPending, error: transactionError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Fetch metadata from IPFS
  useEffect(() => {
    if (!asset?.tokenURI) return;
    
    setMetadataLoading(true);
    setMetadataError(null);

    fetch(asset.tokenURI)
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
        setMetadataError(err.message);
        setMetadataLoading(false);
      });
  }, [asset?.tokenURI]);

  // Purchase handlers
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

  const handleBuyWholeAsset = async () => {
    if (!asset) return;
    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'buyAsset',
        args: [asset.tokenId],
      });
    } catch (err) {
      console.error('Error buying asset:', err);
    }
  };

  const handleBuyFractionalAsset = async () => {
    if (!asset || !fractionalAmount) return;
    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'buyFractionalAsset',
        args: [asset.tokenId, BigInt(fractionalAmount)],
      });
    } catch (err) {
      console.error('Error buying fractional asset:', err);
    }
  };

  const openPurchaseModal = (type, amount = '') => {
    setPurchaseType(type);
    setFractionalAmount(amount);
    
    const requiredAmount = type === 'whole' 
      ? asset.price 
      : BigInt(amount || '1') * asset.pricePerFractionalToken;
    
    const hasEnoughAllowance = usdcAllowance && BigInt(usdcAllowance.toString()) >= requiredAmount;
    setNeedsApproval(!hasEnoughAllowance);
    setShowPurchaseModal(true);
  };

  // Handle successful purchase
  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
      refetchAllowance();
      refetchAsset();
      
      setTimeout(() => {
        setShowPurchaseModal(false);
        setPurchaseType(null);
        setFractionalAmount('');
      }, 2000);
    }
  }, [isSuccess, refetchBalance, refetchAllowance, refetchAsset]);

  // Loading state
  if (assetLoading || metadataLoading) {
    return (
      <div style={{
        backgroundColor: '#121317',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#CAAB5B'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <div style={{ fontSize: '18px' }}>Loading property details...</div>
        </div>
      </div>
    );
  }

  // Error state (asset doesn't exist)
  if (assetError || !asset) {
    return (
      <div style={{
        backgroundColor: '#121317',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          backgroundColor: '#111216',
          border: '1px solid #2C2C2C',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div style={{ color: '#E1E2E2', fontSize: '18px', marginBottom: '8px' }}>
            Property Not Found
          </div>
          <div style={{ color: '#6D6041', fontSize: '14px', marginBottom: '24px' }}>
            Token ID #{tokenId} does not exist or failed to load
          </div>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#CAAB5B',
              color: '#121317',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  // Calculate financial metrics
  const netMonthlyIncome = metadata?.financialDetails 
    ? parseFloat(metadata.financialDetails.monthlyRevenue || 0) - parseFloat(metadata.financialDetails.monthlyExpenses || 0)
    : 0;

  const annualROI = metadata?.financialDetails?.purchasePrice
    ? ((netMonthlyIncome * 12) / parseFloat(metadata.financialDetails.purchasePrice)) * 100
    : 0;

  return (
    <div style={{
      backgroundColor: '#121317',
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Breadcrumb */}
        <div style={{
          color: '#6D6041',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <Link to="/" style={{ color: '#6D6041', textDecoration: 'none' }}>
            Home
          </Link>
          <span>›</span>
          <Link to="/marketplace" style={{ color: '#6D6041', textDecoration: 'none' }}>
            Marketplace
          </Link>
          <span>›</span>
          <span style={{ color: '#CAAB5B' }}>Property #{tokenId}</span>
        </div>

        {/* Two-column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '32px',
          alignItems: 'start',
          '@media (max-width: 1024px)': {
            gridTemplateColumns: '1fr'
          }
        }}>
          
          {/* LEFT COLUMN: Details */}
          <div>
            {/* Image Gallery */}
            <ImageGallery 
              images={metadata?.media?.images} 
              verified={asset.verified}
              isFractionalized={asset.isFractionalized}
            />

            {/* Property Header */}
            <PropertyHeader
              metadata={metadata}
              asset={asset}
              tokenId={tokenId}
            />

            {/* Tabbed Content */}
            <TabbedContent
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              metadata={metadata}
              asset={asset}
              fractionalBuyers={fractionalBuyers}
              netMonthlyIncome={netMonthlyIncome}
              annualROI={annualROI}
            />
          </div>

          {/* RIGHT COLUMN: Purchase Widget (Sticky) */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <PurchaseWidget
              asset={asset}
              tokenId={tokenId}
              fractionalAmount={fractionalAmount}
              setFractionalAmount={setFractionalAmount}
              onPurchase={openPurchaseModal}
              isConnected={isConnected}
              isPending={isPending}
              isConfirming={isConfirming}
              hash={hash}
              isSuccess={isSuccess}
              transactionError={transactionError}
            />
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && asset && (
        <PurchaseModal
          asset={asset}
          purchaseType={purchaseType}
          fractionalAmount={fractionalAmount}
          setFractionalAmount={setFractionalAmount}
          needsApproval={needsApproval}
          usdcBalance={usdcBalance}
          onClose={() => {
            setShowPurchaseModal(false);
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

// ========== SUB-COMPONENTS ==========

function ImageGallery({ images, verified, isFractionalized }) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div style={{
      backgroundColor: '#111216',
      border: '1px solid #2C2C2C',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      {/* Main Image */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        backgroundColor: '#121317',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        {images && images.length > 0 ? (
          <img 
            src={images[selectedImage]?.url}
            alt={`Property image ${selectedImage + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer'
            }}
            onClick={() => {
              // TODO: Open lightbox/fullscreen view
              window.open(images[selectedImage]?.url, '_blank');
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6D6041',
            gap: '12px'
          }}>
            <div style={{ fontSize: '64px' }}>🏠</div>
            <div style={{ fontSize: '14px' }}>No images available</div>
          </div>
        )}

        {/* Overlays */}
        {verified && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            ✓ Verified
          </div>
        )}

        {isFractionalized && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            backgroundColor: '#CAAB5B',
            color: '#121317',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            🔹 Fractional
          </div>
        )}

        {/* Image Counter */}
        {images && images.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            {selectedImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images && images.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={`Thumbnail ${i + 1}`}
              onClick={() => setSelectedImage(i)}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '6px',
                cursor: 'pointer',
                border: selectedImage === i ? '2px solid #CAAB5B' : '2px solid #2C2C2C',
                opacity: selectedImage === i ? 1 : 0.6,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedImage !== i) {
                  e.currentTarget.style.opacity = '0.8';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedImage !== i) {
                  e.currentTarget.style.opacity = '0.6';
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyHeader({ metadata, asset, tokenId }) {
  return (
    <div style={{
      backgroundColor: '#111216',
      border: '1px solid #2C2C2C',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <h1 style={{
        color: '#E1E2E2',
        fontSize: '28px',
        fontWeight: 'bold',
        margin: 0,
        marginBottom: '12px'
      }}>
        {metadata?.propertyDetails?.title || `Property #${tokenId}`}
      </h1>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '16px'
      }}>
        {metadata?.propertyDetails?.location && (
          <div style={{
            color: '#CAAB5B',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            📍 {metadata.propertyDetails.location}
          </div>
        )}
        
        {metadata?.propertyDetails?.type && (
          <span style={{
            backgroundColor: '#2C2C2C',
            color: '#E1E2E2',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {metadata.propertyDetails.type}
          </span>
        )}
        
        {asset.verified && (
          <span style={{
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            ✓ Admin Verified
          </span>
        )}

        <span style={{
          backgroundColor: '#2C2C2C',
          color: '#6D6041',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Token #{tokenId}
        </span>
      </div>

      {/* Seller Info */}
      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid #2C2C2C',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ color: '#6D6041', fontSize: '12px' }}>
          Listed by
        </div>
        <div style={{
          color: '#E1E2E2',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
        </div>
      </div>

      {metadata?.timestamp && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px'
        }}>
          <div style={{ color: '#6D6041', fontSize: '12px' }}>
            Listed on
          </div>
          <div style={{ color: '#E1E2E2', fontSize: '12px' }}>
            {new Date(metadata.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TabbedContent({ activeTab, setActiveTab, metadata, asset, fractionalBuyers, netMonthlyIncome, annualROI }) {
  return (
    <div style={{
      backgroundColor: '#111216',
      border: '1px solid #2C2C2C',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #2C2C2C',
        overflowX: 'auto'
      }}>
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
        {asset.isFractionalized && (
          <TabButton 
            label="Investors" 
            isActive={activeTab === 'investors'}
            onClick={() => setActiveTab('investors')}
            badge={fractionalBuyers?.length}
          />
        )}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '24px' }}>
        {activeTab === 'overview' && (
          <OverviewTab metadata={metadata} />
        )}

        {activeTab === 'financials' && (
          <FinancialsTab 
            metadata={metadata}
            netMonthlyIncome={netMonthlyIncome}
            annualROI={annualROI}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab metadata={metadata} />
        )}

        {activeTab === 'investors' && asset.isFractionalized && (
          <InvestorsTab 
            fractionalBuyers={fractionalBuyers}
            asset={asset}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({ label, isActive, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 'fit-content',
        padding: '16px 24px',
        backgroundColor: isActive ? '#121317' : 'transparent',
        color: isActive ? '#CAAB5B' : '#6D6041',
        border: 'none',
        borderBottom: isActive ? '2px solid #CAAB5B' : '2px solid transparent',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative'
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: '#CAAB5B',
          color: '#121317',
          borderRadius: '50%',
          minWidth: '20px',
          height: '20px',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          padding: '0 6px'
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

function OverviewTab({ metadata }) {
  return (
    <div>
      <h3 style={{ color: '#CAAB5B', marginBottom: '16px', fontSize: '18px' }}>
        Property Description
      </h3>
      <p style={{ 
        color: '#E1E2E2', 
        lineHeight: '1.8',
        fontSize: '15px',
        marginBottom: '24px'
      }}>
        {metadata?.propertyDetails?.description || 'No description available'}
      </p>

      {/* Owner Information */}
      {metadata?.ownerInformation && (
        <>
          <h3 style={{ color: '#CAAB5B', marginBottom: '16px', fontSize: '18px', marginTop: '32px' }}>
            Owner Information
          </h3>
          <div style={{
            backgroundColor: '#121317',
            border: '1px solid #2C2C2C',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              {metadata.ownerInformation.fullName && (
                <InfoItem label="Full Name" value={metadata.ownerInformation.fullName} />
              )}
              {metadata.ownerInformation.email && (
                <InfoItem label="Email" value={metadata.ownerInformation.email} />
              )}
              {metadata.ownerInformation.phone && (
                <InfoItem label="Phone" value={metadata.ownerInformation.phone} />
              )}
            </div>
            <div style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#ff980020',
              border: '1px solid #ff9800',
              borderRadius: '6px',
              color: '#ff9800',
              fontSize: '12px'
            }}>
              ℹ️ Contact information is provided by the seller. Verify independently before transacting.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FinancialsTab({ metadata, netMonthlyIncome, annualROI }) {
  const financials = metadata?.financialDetails;

  if (!financials) {
    return (
      <div style={{ color: '#6D6041', textAlign: 'center', padding: '40px' }}>
        No financial information available
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ color: '#CAAB5B', marginBottom: '16px', fontSize: '18px' }}>
        Financial Details
      </h3>

      {/* Investment Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard 
          label="Purchase Price" 
          value={`$${parseFloat(financials.purchasePrice || 0).toLocaleString()}`}
        />
        <StatCard 
          label="Tokenization Value" 
          value={`$${parseFloat(financials.tokenizationValue || 0).toLocaleString()}`}
        />
        <StatCard 
          label="Potential Gain" 
          value={`${(((parseFloat(financials.tokenizationValue) - parseFloat(financials.purchasePrice)) / parseFloat(financials.purchasePrice)) * 100).toFixed(1)}%`}
          color="#4CAF50"
        />
      </div>

      {/* Monthly Cash Flow */}
      <h3 style={{ color: '#CAAB5B', marginBottom: '16px', fontSize: '18px', marginTop: '32px' }}>
        Monthly Cash Flow
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard 
          label="Monthly Revenue" 
          value={`$${parseFloat(financials.monthlyRevenue || 0).toLocaleString()}`}
          color="#4CAF50"
        />
        <StatCard 
          label="Monthly Expenses" 
          value={`$${parseFloat(financials.monthlyExpenses || 0).toLocaleString()}`}
          color="#f44336"
        />
        <StatCard 
          label="Net Monthly Income" 
          value={`$${netMonthlyIncome.toLocaleString()}`}
          color={netMonthlyIncome >= 0 ? '#4CAF50' : '#f44336'}
        />
        <StatCard 
          label="Annual ROI" 
          value={`${annualROI.toFixed(2)}%`}
          color={annualROI >= 0 ? '#4CAF50' : '#f44336'}
        />
      </div>

      {/* Warning if negative cash flow */}
      {netMonthlyIncome < 0 && (
        <div style={{
          backgroundColor: '#f4433620',
          border: '1px solid #f44336',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <div style={{ color: '#f44336', fontWeight: 'bold', marginBottom: '8px' }}>
            ⚠️ Negative Cash Flow
          </div>
          <div style={{ color: '#E1E2E2', fontSize: '14px' }}>
            This property currently operates at a monthly loss of ${Math.abs(netMonthlyIncome).toLocaleString()}. 
            Ensure you understand the investment risks before proceeding.
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ metadata }) {
  const documents = metadata?.media?.documents;

  if (!documents || documents.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#6D6041'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <div style={{ fontSize: '16px' }}>No documents available</div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ color: '#CAAB5B', marginBottom: '16px', fontSize: '18px' }}>
        Legal Documents
      </h3>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {documents.map((doc, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#121317',
              border: '1px solid #2C2C2C',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>📄</div>
              <div>
                <div style={{ 
                  color: '#E1E2E2', 
                  fontWeight: 'bold', 
                  marginBottom: '4px',
                  fontSize: '14px'
                }}>
                  {doc.name}
                </div>
                <div style={{ color: '#6D6041', fontSize: '12px' }}>
                  Stored on IPFS
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => window.open(doc.url, '_blank')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#CAAB5B',
                  color: '#121317',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
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
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2C2C2C',
                  color: '#E1E2E2',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#4CAF5020',
        border: '1px solid #4CAF50',
        borderRadius: '8px',
        color: '#4CAF50',
        fontSize: '12px'
      }}>
        🔒 All documents are securely stored on IPFS and verified by platform administrators.
      </div>
    </div>
  );
}

function InvestorsTab({ fractionalBuyers, asset }) {
  if (!fractionalBuyers || fractionalBuyers.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#6D6041'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>No investors yet</div>
        <div style={{ fontSize: '14px' }}>Be the first to invest in this property!</div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ color: '#CAAB5B', marginBottom: '16px', fontSize: '18px' }}>
        Current Investors ({fractionalBuyers.length})
      </h3>

      {/* Investment Summary */}
      <div style={{
        backgroundColor: '#121317',
        border: '1px solid #2C2C2C',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        <div>
          <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
            Total Investors
          </div>
          <div style={{ color: '#E1E2E2', fontSize: '20px', fontWeight: 'bold' }}>
            {fractionalBuyers.length}
          </div>
        </div>
        <div>
          <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
            Tokens Sold
          </div>
          <div style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold' }}>
            {Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)} / {Number(asset.totalFractionalTokens)}
          </div>
        </div>
        <div>
          <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
            % Sold
          </div>
          <div style={{ color: '#CAAB5B', fontSize: '20px', fontWeight: 'bold' }}>
            {(((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Investors Table */}
      <div style={{
        backgroundColor: '#121317',
        border: '1px solid #2C2C2C',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#0D0E11', borderBottom: '1px solid #2C2C2C' }}>
              <th style={{ 
                color: '#6D6041', 
                fontSize: '12px', 
                textAlign: 'left', 
                padding: '12px 16px',
                fontWeight: 'bold'
              }}>
                Rank
              </th>
              <th style={{ 
                color: '#6D6041', 
                fontSize: '12px', 
                textAlign: 'left', 
                padding: '12px 16px',
                fontWeight: 'bold'
              }}>
                Investor
              </th>
              <th style={{ 
                color: '#6D6041', 
                fontSize: '12px', 
                textAlign: 'right', 
                padding: '12px 16px',
                fontWeight: 'bold'
              }}>
                Tokens
              </th>
              <th style={{ 
                color: '#6D6041', 
                fontSize: '12px', 
                textAlign: 'right', 
                padding: '12px 16px',
                fontWeight: 'bold'
              }}>
                Ownership
              </th>
            </tr>
          </thead>
          <tbody>
            {fractionalBuyers
              .sort((a, b) => Number(b.numTokens) - Number(a.numTokens))
              .map((buyer, i) => (
                <tr 
                  key={i} 
                  style={{ 
                    borderBottom: i < fractionalBuyers.length - 1 ? '1px solid #2C2C2C' : 'none'
                  }}
                >
                  <td style={{ 
                    color: '#E1E2E2', 
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    #{i + 1}
                  </td>
                  <td style={{ 
                    color: '#E1E2E2', 
                    padding: '12px 16px', 
                    fontFamily: 'monospace', 
                    fontSize: '13px'
                  }}>
                    {buyer.buyer.slice(0, 6)}...{buyer.buyer.slice(-4)}
                  </td>
                  <td style={{ 
                    color: '#E1E2E2', 
                    textAlign: 'right', 
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {buyer.numTokens.toString()}
                  </td>
                  <td style={{ 
                    color: '#4CAF50', 
                    textAlign: 'right', 
                    padding: '12px 16px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    
                    {(Number(buyer.percentage) / 1e16).toFixed(2)}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#CAAB5B20',
        border: '1px solid #CAAB5B',
        borderRadius: '8px',
        color: '#CAAB5B',
        fontSize: '12px'
      }}>
        ℹ️ Investor rankings are based on number of tokens held. All data is public on the blockchain.
      </div>
    </div>
  );
}

function PurchaseWidget({ 
  asset, 
  tokenId, 
  fractionalAmount, 
  setFractionalAmount, 
  onPurchase, 
  isConnected,
  isPending,
  isConfirming,
  hash,
  isSuccess,
  transactionError
}) {
  // Check if asset is available for purchase
  const isAvailable = (() => {
    if (!asset.verified) return false;
    if (asset.sold && !asset.isFractionalized) return false;
    if (asset.isFractionalized && Number(asset.remainingFractionalTokens) === 0) return false;
    return true;
  })();

  return (
    <div style={{
      backgroundColor: '#111216',
      border: '1px solid #2C2C2C',
      borderRadius: '12px',
      padding: '24px'
    }}>
      {/* Token ID Badge */}
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
          #{tokenId}
        </div>
        {asset.verified && (
          <div style={{
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            ✓ Verified
          </div>
        )}
      </div>

      {/* Price Display */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          color: '#6D6041',
          fontSize: '12px',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {asset.isFractionalized ? 'Price Per Token' : 'Total Price'}
        </div>
        <div style={{
          color: '#CAAB5B',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          {asset.isFractionalized 
            ? formatUnits(asset.pricePerFractionalToken, 6)
            : formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      {/* Fractional Info */}
      {asset.isFractionalized && (
        <div style={{
          backgroundColor: '#121317',
          border: '1px solid #2C2C2C',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
                Total Tokens
              </div>
              <div style={{ color: '#E1E2E2', fontSize: '18px', fontWeight: 'bold' }}>
                {asset.totalFractionalTokens?.toString() || '0'}
              </div>
            </div>
            <div>
              <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
                Available
              </div>
              <div style={{ color: '#4CAF50', fontSize: '18px', fontWeight: 'bold' }}>
                {asset.remainingFractionalTokens?.toString() || '0'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            backgroundColor: '#2C2C2C',
            height: '8px',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              backgroundColor: '#4CAF50',
              height: '100%',
              width: `${((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens)) * 100}%`,
              transition: 'width 0.3s'
            }} />
          </div>
          <div style={{color: '#6D6041',
            fontSize: '11px',
            textAlign: 'center'
          }}>
            {((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens) * 100).toFixed(1)}% Sold
          </div>

          {/* Token Input */}
          {isAvailable && (
            <div style={{ marginTop: '16px' }}>
              <label style={{
                color: '#6D6041',
                fontSize: '12px',
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>
                Tokens to Purchase
              </label>
              <input
                type="number"
                value={fractionalAmount}
                onChange={(e) => setFractionalAmount(e.target.value)}
                min="1"
                max={asset.remainingFractionalTokens?.toString() || '0'}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#111216',
                  border: '1px solid #2C2C2C',
                  borderRadius: '8px',
                  color: '#E1E2E2',
                  fontSize: '14px'
                }}
              />
              {fractionalAmount && Number(fractionalAmount) > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#CAAB5B20',
                  borderRadius: '6px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <span style={{ color: '#6D6041', fontSize: '12px' }}>
                      Your Investment:
                    </span>
                    <span style={{ color: '#CAAB5B', fontSize: '14px', fontWeight: 'bold' }}>
                      {formatUnits(BigInt(fractionalAmount || '0') * asset.pricePerFractionalToken, 6)} USDC
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#6D6041', fontSize: '12px' }}>
                      Ownership:
                    </span>
                    <span style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 'bold' }}>
                      {((Number(fractionalAmount) / Number(asset.totalFractionalTokens)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Seller Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '16px',
        paddingBottom: '16px',
        borderTop: '1px solid #2C2C2C',
        borderBottom: '1px solid #2C2C2C',
        marginBottom: '20px'
      }}>
        <div style={{ color: '#6D6041', fontSize: '12px' }}>
          Seller
        </div>
        <div style={{
          color: '#E1E2E2',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
        </div>
      </div>

      {/* Status-based Actions */}
      {!isConnected ? (
        <div style={{
          backgroundColor: '#ff980020',
          border: '1px solid #ff9800',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          color: '#ff9800',
          fontSize: '14px'
        }}>
          🔒 Connect your wallet to purchase
        </div>
      ) : asset.sold && !asset.isFractionalized ? (
        <div style={{
          backgroundColor: '#6D604120',
          border: '1px solid #6D6041',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          color: '#6D6041',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ✓ Property Sold
        </div>
      ) : !asset.verified ? (
        <div style={{
          backgroundColor: '#ff980020',
          border: '1px solid #ff9800',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          color: '#ff9800',
          fontSize: '14px'
        }}>
          ⏳ Pending Admin Verification
        </div>
      ) : asset.isFractionalized && Number(asset.remainingFractionalTokens) === 0 ? (
        <div style={{
          backgroundColor: '#6D604120',
          border: '1px solid #6D6041',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          color: '#6D6041',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ✓ All Tokens Sold
        </div>
      ) : (
        <>
          {/* Buy Now Button */}
          <button
            onClick={() => onPurchase(
              asset.isFractionalized ? 'fractional' : 'whole',
              asset.isFractionalized ? fractionalAmount : ''
            )}
            disabled={
              isPending || 
              isConfirming || 
              (asset.isFractionalized && (!fractionalAmount || Number(fractionalAmount) <= 0 || Number(fractionalAmount) > Number(asset.remainingFractionalTokens)))
            }
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#4CAF50',
              color: isPending || isConfirming ? '#6D6041' : '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isPending || isConfirming || (asset.isFractionalized && (!fractionalAmount || Number(fractionalAmount) <= 0)) ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              marginBottom: '12px'
            }}
            onMouseEnter={(e) => {
              if (!isPending && !isConfirming && (asset.isFractionalized ? fractionalAmount && Number(fractionalAmount) > 0 : true)) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isPending && !isConfirming) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {isPending 
              ? 'Confirm in wallet...' 
              : isConfirming 
                ? 'Processing...' 
                : asset.isFractionalized 
                  ? '🔹 Invest Now' 
                  : '🏠 Buy Property'}
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Property link copied to clipboard!');
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#CAAB5B',
              border: '1px solid #CAAB5B',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#CAAB5B20';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            🔗 Share Property
          </button>
        </>
      )}

      {/* Transaction Status */}
      {hash && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#121317',
          border: '1px solid #2C2C2C',
          borderRadius: '8px',
          fontSize: '12px'
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
          <div style={{ color: '#6D6041', marginBottom: '4px' }}>
            Transaction Hash:
          </div>
          <div style={{
            color: '#E1E2E2',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            fontSize: '10px'
          }}>
            {hash}
          </div>
        </div>
      )}

      {/* Error Display */}
      {transactionError && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f4433620',
          border: '1px solid #f44336',
          borderRadius: '8px',
          color: '#f44336',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            ⚠️ Transaction Error
          </div>
          {transactionError.message}
        </div>
      )}
    </div>
  );
}

// Helper components
function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ 
        color: '#6D6041', 
        fontSize: '11px', 
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
      <div style={{ color: '#E1E2E2', fontSize: '14px' }}>
        {value}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = '#E1E2E2' }) {
  return (
    <div style={{
      backgroundColor: '#121317',
      border: '1px solid #2C2C2C',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div style={{
        color: '#6D6041',
        fontSize: '11px',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
      <div style={{
        color: color,
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        {value}
      </div>
    </div>
  );
}