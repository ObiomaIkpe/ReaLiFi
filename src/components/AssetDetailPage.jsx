// src/components/property/AssetDetailsPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS, MOCK_USDC, MOCK_USDC_ADDRESS } from '@/config/contract.config';
import { PurchaseModal } from '@/components/shared/PurchaseModal';

export function AssetDetailsPage() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState(null);
  const [fractionalAmount, setFractionalAmount] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState(null);

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

  if (assetLoading || metadataLoading) {
    return (
      <div className="bg-[#121317] min-h-screen py-10 px-5 flex justify-center items-center">
        <div className="text-center text-[#CAAB5B]">
          <div className="text-5xl mb-4">🔄</div>
          <div className="text-lg">Loading property details...</div>
        </div>
      </div>
    );
  }

  if (assetError || !asset) {
    return (
      <div className="bg-[#121317] min-h-screen py-10 px-5 flex justify-center items-center">
        <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-10 text-center max-w-[400px]">
          <div className="text-5xl mb-4">❌</div>
          <div className="text-[#E1E2E2] text-lg mb-2">Property Not Found</div>
          <div className="text-[#6D6041] text-sm mb-6">
            Token ID #{tokenId} does not exist or failed to load
          </div>
          <button
            onClick={() => navigate('/marketplace')}
            className="py-3 px-6 bg-[#CAAB5B] text-[#121317] border-0 rounded-lg text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  const netMonthlyIncome = metadata?.financialDetails 
    ? parseFloat(metadata.financialDetails.monthlyRevenue || 0) - parseFloat(metadata.financialDetails.monthlyExpenses || 0)
    : 0;

  const annualROI = metadata?.financialDetails?.purchasePrice
    ? ((netMonthlyIncome * 12) / parseFloat(metadata.financialDetails.purchasePrice)) * 100
    : 0;

  return (
    <div className="bg-[#121317] min-h-screen py-10 px-5">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Breadcrumb */}
        <div className="text-[#6D6041] text-sm mb-6 flex gap-2 items-center">
          <Link to="/" className="text-[#6D6041] no-underline hover:text-[#CAAB5B] transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link to="/marketplace" className="text-[#6D6041] no-underline hover:text-[#CAAB5B] transition-colors">
            Marketplace
          </Link>
          <span>›</span>
          <span className="text-[#CAAB5B]">Property #{tokenId}</span>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr_400px] grid-cols-1 gap-8 items-start">
          
          {/* LEFT COLUMN */}
          <div>
            <ImageGallery 
              images={metadata?.media?.images} 
              verified={asset.verified}
              isFractionalized={asset.isFractionalized}
            />

            <PropertyHeader
              metadata={metadata}
              asset={asset}
              tokenId={tokenId}
            />

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

          {/* RIGHT COLUMN */}
          <div className="sticky top-5">
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
    <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6 mb-6">
      {/* Main Image */}
      <div className="relative w-full h-[400px] bg-[#121317] rounded-lg overflow-hidden mb-4">
        {images && images.length > 0 ? (
          <img 
            src={images[selectedImage]?.url}
            alt={`Property image ${selectedImage + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => window.open(images[selectedImage]?.url, '_blank')}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#6D6041] gap-3">
            <div className="text-6xl">🏠</div>
            <div className="text-sm">No images available</div>
          </div>
        )}

        {/* Overlays */}
        {verified && (
          <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            ✓ Verified
          </div>
        )}

        {isFractionalized && (
          <div className="absolute top-4 left-4 bg-[#CAAB5B] text-[#121317] px-3 py-2 rounded-lg text-xs font-bold shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            🔹 Fractional
          </div>
        )}

        {/* Image Counter */}
        {images && images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-md text-xs">
            {selectedImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={`Thumbnail ${i + 1}`}
              onClick={() => setSelectedImage(i)}
              className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 transition-all ${
                selectedImage === i 
                  ? 'border-[#CAAB5B] opacity-100' 
                  : 'border-[#2C2C2C] opacity-60 hover:opacity-80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyHeader({ metadata, asset, tokenId }) {
  return (
    <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6 mb-6">
      <h1 className="text-[#E1E2E2] text-3xl font-bold m-0 mb-3">
        {metadata?.propertyDetails?.title || `Property #${tokenId}`}
      </h1>
      
      <div className="flex gap-3 flex-wrap mb-4">
        {metadata?.propertyDetails?.location && (
          <div className="text-[#CAAB5B] text-sm flex items-center gap-1">
            📍 {metadata.propertyDetails.location}
          </div>
        )}
        
        {metadata?.propertyDetails?.type && (
          <span className="bg-[#2C2C2C] text-[#E1E2E2] px-3 py-1 rounded text-xs">
            {metadata.propertyDetails.type}
          </span>
        )}
        
        {asset.verified && (
          <span className="bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold">
            ✓ Admin Verified
          </span>
        )}

        <span className="bg-[#2C2C2C] text-[#6D6041] px-3 py-1 rounded text-xs">
          Token #{tokenId}
        </span>
      </div>

      {/* Seller Info */}
      <div className="pt-4 border-t border-[#2C2C2C] flex justify-between items-center">
        <div className="text-[#6D6041] text-xs">Listed by</div>
        <div className="text-[#E1E2E2] text-xs font-mono">
          {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
        </div>
      </div>

      {metadata?.timestamp && (
        <div className="flex justify-between items-center mt-2">
          <div className="text-[#6D6041] text-xs">Listed on</div>
          <div className="text-[#E1E2E2] text-xs">
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
    <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl overflow-hidden">
      {/* Tab Navigation */}
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
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab metadata={metadata} />}
        {activeTab === 'financials' && (
          <FinancialsTab 
            metadata={metadata}
            netMonthlyIncome={netMonthlyIncome}
            annualROI={annualROI}
          />
        )}
        {activeTab === 'documents' && <DocumentsTab metadata={metadata} />}
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
      className={`flex-1 min-w-fit px-6 py-4 border-0 border-b-2 text-sm font-bold cursor-pointer transition-all relative ${
        isActive 
          ? 'bg-[#121317] text-[#CAAB5B] border-b-[#CAAB5B]' 
          : 'bg-transparent text-[#6D6041] border-b-transparent hover:text-[#CAAB5B]'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 bg-[#CAAB5B] text-[#121317] rounded-full min-w-[20px] h-5 text-[11px] flex items-center justify-center font-bold px-1.5">
          {badge}
        </span>
      )}
    </button>
  );
}

function OverviewTab({ metadata }) {
  return (
    <div>
      <h3 className="text-[#CAAB5B] mb-4 text-lg">Property Description</h3>
      <p className="text-[#E1E2E2] leading-relaxed text-[15px] mb-6">
        {metadata?.propertyDetails?.description || 'No description available'}
      </p>

      {metadata?.ownerInformation && (
        <>
          <h3 className="text-[#CAAB5B] mb-4 text-lg mt-8">Owner Information</h3>
          <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
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
            <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500 rounded-md text-orange-500 text-xs">
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
      <div className="text-[#6D6041] text-center py-10">
        No financial information available
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[#CAAB5B] mb-4 text-lg">Financial Details</h3>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
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
          color="text-emerald-500"
        />
      </div>

      <h3 className="text-[#CAAB5B] mb-4 text-lg mt-8">Monthly Cash Flow</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
        <StatCard 
          label="Monthly Revenue" 
          value={`$${parseFloat(financials.monthlyRevenue || 0).toLocaleString()}`}
          color="text-emerald-500"
        />
        <StatCard 
          label="Monthly Expenses" 
          value={`$${parseFloat(financials.monthlyExpenses || 0).toLocaleString()}`}
          color="text-red-500"
        />
        <StatCard 
          label="Net Monthly Income" 
          value={`$${netMonthlyIncome.toLocaleString()}`}
          color={netMonthlyIncome >= 0 ? 'text-emerald-500' : 'text-red-500'}
        />
        <StatCard 
          label="Annual ROI" 
          value={`${annualROI.toFixed(2)}%`}
          color={annualROI >= 0 ? 'text-emerald-500' : 'text-red-500'}
        />
      </div>

      {netMonthlyIncome < 0 && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mt-4">
          <div className="text-red-500 font-bold mb-2">⚠️ Negative Cash Flow</div>
          <div className="text-[#E1E2E2] text-sm">
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
      <div className="text-center py-10 text-[#6D6041]">
        <div className="text-5xl mb-4">📄</div>
        <div className="text-base">No documents available</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[#CAAB5B] mb-4 text-lg">Legal Documents</h3>
      
      <div className="flex flex-col gap-3">
        {documents.map((doc, i) => (
          <div
            key={i}
            className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">📄</div>
              <div>
                <div className="text-[#E1E2E2] font-bold mb-1 text-sm">{doc.name}</div>
                <div className="text-[#6D6041] text-xs">Stored on IPFS</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(doc.url, '_blank')}
                className="py-2 px-4 bg-[#CAAB5B] text-[#121317] border-0 rounded-md text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
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
                className="py-2 px-4 bg-[#2C2C2C] text-[#E1E2E2] border-0 rounded-md text-xs font-bold cursor-pointer hover:bg-[#3C3C3C] transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500 rounded-lg text-emerald-500 text-xs">
        🔒 All documents are securely stored on IPFS and verified by platform administrators.
      </div>
    </div>
  );
}

function InvestorsTab({ fractionalBuyers, asset }) {
  if (!fractionalBuyers || fractionalBuyers.length === 0) {
    return (
      <div className="text-center py-10 text-[#6D6041]">
        <div className="text-5xl mb-4">👥</div>
        <div className="text-base mb-2">No investors yet</div>
        <div className="text-sm">Be the first to invest in this property!</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[#CAAB5B] mb-4 text-lg">
        Current Investors ({fractionalBuyers.length})
      </h3>

      <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4 mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <div>
          <div className="text-[#6D6041] text-[11px] mb-1">Total Investors</div>
          <div className="text-[#E1E2E2] text-xl font-bold">{fractionalBuyers.length}</div>
        </div>
        <div>
          <div className="text-[#6D6041] text-[11px] mb-1">Tokens Sold</div>
          <div className="text-emerald-500 text-xl font-bold">
            {Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)} / {Number(asset.totalFractionalTokens)}
          </div>
        </div>
        <div>
          <div className="text-[#6D6041] text-[11px] mb-1">% Sold</div>
          <div className="text-[#CAAB5B] text-xl font-bold">
            {(((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0D0E11] border-b border-[#2C2C2C]">
              <th className="text-[#6D6041] text-xs text-left py-3 px-4 font-bold">Rank</th>
              <th className="text-[#6D6041] text-xs text-left py-3 px-4 font-bold">Investor</th>
              <th className="text-[#6D6041] text-xs text-right py-3 px-4 font-bold">Tokens</th>
              <th className="text-[#6D6041] text-xs text-right py-3 px-4 font-bold">Ownership</th>
            </tr>
          </thead>
          <tbody>
            {fractionalBuyers
              .sort((a, b) => Number(b.numTokens) - Number(a.numTokens))
              .map((buyer, i) => (
                <tr 
                  key={i} 
                  className={i < fractionalBuyers.length - 1 ? 'border-b border-[#2C2C2C]' : ''}
                >
                  <td className="text-[#E1E2E2] py-3 px-4 text-sm font-bold">#{i + 1}</td>
                  <td className="text-[#E1E2E2] py-3 px-4 font-mono text-[13px]">
                    {buyer.buyer.slice(0, 6)}...{buyer.buyer.slice(-4)}
                  </td>
                  <td className="text-[#E1E2E2] text-right py-3 px-4 text-sm font-bold">
                    {buyer.numTokens.toString()}
                  </td>
                  <td className="text-emerald-500 text-right py-3 px-4 font-bold text-sm">
                    {(Number(buyer.percentage) / 1e16).toFixed(2)}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-[#CAAB5B]/10 border border-[#CAAB5B] rounded-lg text-[#CAAB5B] text-xs">
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
  const isAvailable = (() => {
    if (!asset.verified) return false;
    if (asset.sold && !asset.isFractionalized) return false;
    if (asset.isFractionalized && Number(asset.remainingFractionalTokens) === 0) return false;
    return true;
  })();

  return (
    <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6">
      {/* Token ID Badge */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#2C2C2C]">
        <div className="bg-[#CAAB5B] text-[#121317] px-3 py-1.5 rounded-md text-sm font-bold">
          #{tokenId}
        </div>
        {asset.verified && (
          <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-md text-xs font-bold">
            ✓ Verified
          </div>
        )}
      </div>

      {/* Price Display */}
      <div className="mb-5">
        <div className="text-[#6D6041] text-xs mb-2 uppercase tracking-wider">
          {asset.isFractionalized ? 'Price Per Token' : 'Total Price'}
        </div>
        <div className="text-[#CAAB5B] text-[32px] font-bold">
          {asset.isFractionalized 
            ? formatUnits(asset.pricePerFractionalToken, 6)
            : formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      {/* Fractional Info */}
      {asset.isFractionalized && (
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4 mb-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-[#6D6041] text-[11px] mb-1">Total Tokens</div>
              <div className="text-[#E1E2E2] text-lg font-bold">
                {asset.totalFractionalTokens?.toString() || '0'}
              </div>
            </div>
            <div>
              <div className="text-[#6D6041] text-[11px] mb-1">Available</div>
              <div className="text-emerald-500 text-lg font-bold">
                {asset.remainingFractionalTokens?.toString() || '0'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-[#2C2C2C] h-2 rounded overflow-hidden mb-2">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens)) * 100}%`
              }}
            />
          </div>
          <div className="text-[#6D6041] text-[11px] text-center">
            {((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens) * 100).toFixed(1)}% Sold
          </div>

          {/* Token Input */}
          {isAvailable && (
            <div className="mt-4">
              <label className="text-[#6D6041] text-xs block mb-2 font-bold">
                Tokens to Purchase
              </label>
              <input
                type="number"
                value={fractionalAmount}
                onChange={(e) => setFractionalAmount(e.target.value)}
                min="1"
                max={asset.remainingFractionalTokens?.toString() || '0'}
                placeholder="Enter amount"
                className="w-full p-3 bg-[#111216] border border-[#2C2C2C] rounded-lg text-[#E1E2E2] text-sm placeholder:text-[#6D6041] focus:outline-none focus:border-[#CAAB5B] transition-colors"
              />
              {fractionalAmount && Number(fractionalAmount) > 0 && (
                <div className="mt-3 p-3 bg-[#CAAB5B]/10 rounded-md">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[#6D6041] text-xs">Your Investment:</span>
                    <span className="text-[#CAAB5B] text-sm font-bold">
                      {formatUnits(BigInt(fractionalAmount || '0') * asset.pricePerFractionalToken, 6)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D6041] text-xs">Ownership:</span>
                    <span className="text-emerald-500 text-sm font-bold">
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
      <div className="flex justify-between pt-4 pb-4 border-t border-[#2C2C2C] border-b mb-5">
        <div className="text-[#6D6041] text-xs">Seller</div>
        <div className="text-[#E1E2E2] text-xs font-mono">
          {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
        </div>
      </div>

      {/* Status-based Actions */}
      {!isConnected ? (
        <div className="bg-orange-500/10 border border-orange-500 rounded-lg p-4 text-center text-orange-500 text-sm">
          🔒 Connect your wallet to purchase
        </div>
      ) : asset.sold && !asset.isFractionalized ? (
        <div className="bg-[#6D6041]/10 border border-[#6D6041] rounded-lg p-4 text-center text-[#6D6041] text-sm font-bold">
          ✓ Property Sold
        </div>
      ) : !asset.verified ? (
        <div className="bg-orange-500/10 border border-orange-500 rounded-lg p-4 text-center text-orange-500 text-sm">
          ⏳ Pending Admin Verification
        </div>
      ) : asset.isFractionalized && Number(asset.remainingFractionalTokens) === 0 ? (
        <div className="bg-[#6D6041]/10 border border-[#6D6041] rounded-lg p-4 text-center text-[#6D6041] text-sm font-bold">
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
            className="w-full py-4 bg-emerald-500 text-white border-0 rounded-lg text-base font-bold cursor-pointer transition-opacity mb-3 disabled:bg-[#2C2C2C] disabled:text-[#6D6041] disabled:cursor-not-allowed hover:opacity-90"
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
            className="w-full py-3 bg-transparent text-[#CAAB5B] border border-[#CAAB5B] rounded-lg text-sm font-bold cursor-pointer transition-all hover:bg-[#CAAB5B]/10"
          >
            🔗 Share Property
          </button>
        </>
      )}

      {/* Transaction Status */}
      {hash && (
        <div className="mt-5 p-3 bg-[#121317] border border-[#2C2C2C] rounded-lg text-xs">
          {isConfirming && (
            <div className="text-orange-500 mb-2 font-bold">
              ⏳ Transaction confirming...
            </div>
          )}
          {isSuccess && (
            <div className="text-emerald-500 mb-2 font-bold">
              ✓ Transaction completed successfully!
            </div>
          )}
          <div className="text-[#6D6041] mb-1">Transaction Hash:</div>
          <div className="text-[#E1E2E2] font-mono break-all text-[10px]">
            {hash}
          </div>
        </div>
      )}

      {/* Error Display */}
      {transactionError && (
        <div className="mt-5 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-xs">
          <div className="font-bold mb-1">⚠️ Transaction Error</div>
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
      <div className="text-[#6D6041] text-[11px] mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-[#E1E2E2] text-sm">{value}</div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-[#E1E2E2]' }) {
  return (
    <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-4">
      <div className="text-[#6D6041] text-[11px] mb-2 uppercase tracking-wider">
        {label}
      </div>
      <div className={`${color} text-xl font-bold`}>
        {value}
      </div>
    </div>
  );
}