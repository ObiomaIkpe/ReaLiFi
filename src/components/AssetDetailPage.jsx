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

  // Fetch USDC balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Fetch USDC allowance
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC,
    functionName: 'allowance',
    args: address ? [address, REAL_ESTATE_DAPP_ADDRESS] : undefined,
  });

  // Fetch fractional buyers if applicable
  const { data: fractionalBuyers } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchFractionalAssetBuyers',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    enabled: !!tokenId && asset?.isFractionalized
  });

  // Transaction handling
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
            src={images[selectedImage]