import { useState, useEffect } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { MOCK_USDC, MOCK_USDC_ADDRESS, REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS } from '@/config/contract.config';
import { PurchaseModal } from './shared/PurchaseModal';
import { CancelFractionalModal } from './shared/CancelFractionalModal';

//dashboard for buyers to see the assets they own.
export function BuyerDashboard() {
  const { address, isConnected } = useAccount();
  const [selectedTab, setSelectedTab] = useState('browse');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState(null);
  const [fractionalAmount, setFractionalAmount] = useState('');
  const [cancelAmount, setCancelAmount] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [currentAction, setCurrentAction] = useState(null);

  const { data: usdcAddress } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'usdcToken',
  });

  const { data: allAssets, refetch: refetchAssets } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAllAssetsWithDisplayInfo',
  });

  const { data: availableAssets } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAvailableAssets',
  });

  const { data: fractionalAssets } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchFractionalizedAssets',
  });

  const { data: portfolio, refetch: refetchPortfolio } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'getBuyerPortfolio',
    args: address ? [address] : undefined,
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

  const { data: cancellationPenalty } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'CANCELLATION_PENALTY_PERCENTAGE',
  });

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const wholeAssets = availableAssets?.filter(asset => !asset.isFractionalized) || [];
  const fractionalizedAssets = fractionalAssets || [];

  const pendingFullPurchases = allAssets?.filter(
    asset => asset.currentBuyer && 
    asset.currentBuyer.toLowerCase() === address?.toLowerCase() && 
    !asset.isPaidFor &&
    !asset.isCanceled &&
    !asset.isFractionalized
  ) || [];

  const completedFullPurchases = allAssets?.filter(
    asset => asset.currentBuyer &&
    asset.currentBuyer.toLowerCase() === address?.toLowerCase() &&
    asset.isPaidFor &&
    !asset.isFractionalized
  ) || [];

  const canceledPurchases = allAssets?.filter(
    asset => asset.currentBuyer &&
    asset.currentBuyer.toLowerCase() === address?.toLowerCase() &&
    asset.isCanceled
  ).slice(3) || [];

  const totalInvestment = completedFullPurchases.reduce(
    (sum, asset) => sum + BigInt(asset.price.toString()),
    BigInt(0)
  ) + (portfolio?.reduce(
    (sum, item) => sum + BigInt(item.investmentValue.toString()),
    BigInt(0)
  ) || BigInt(0));

  const handleApproveUSDC = async (amount) => {
    if (!usdcAddress) return;
    try {
        setCurrentAction('approve');
      writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC,
        functionName: 'approve',
        args: [REAL_ESTATE_DAPP_ADDRESS, amount],
      });
    } catch (err) {
      console.error('Error approving USDC:', err);
      setCurrentAction(null);
    }
  };

  const handleBuyWholeAsset = async () => {
    if (!selectedAsset) return;
    try {
      setCurrentAction('buy-whole');
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'buyAsset',
        args: [selectedAsset.tokenId],
      });
    } catch (err) {
      console.error('Error buying asset:', err);
          setCurrentAction();
    }
  };

  const handleBuyFractionalAsset = async () => {
  if (!selectedAsset || !fractionalAmount) return;
  try {
    setCurrentAction('buy-fractional');
    writeContract({
      address: REAL_ESTATE_DAPP_ADDRESS,
      abi: REAL_ESTATE_DAPP,
      functionName: 'buyFractionalAsset',
      args: [selectedAsset.tokenId, BigInt(fractionalAmount)],
    });
  } catch (err) {
    console.error('Error buying fractional asset:', err);
    setCurrentAction(null);
  }
}

  const handleCancelFullPurchase = async (tokenId) => {
  try {
    setCurrentAction('cancel-full');
    writeContract({
      address: REAL_ESTATE_DAPP_ADDRESS,
      abi: REAL_ESTATE_DAPP,
      functionName: 'cancelAssetPurchase',
      args: [tokenId],
    });
  } catch (err) {
    console.error('Error canceling purchase:', err);
    setCurrentAction(null);
  }
}

  const handleCancelFractionalPurchase = async () => {
  if (!selectedAsset || !cancelAmount) return;
  try {
    setCurrentAction('cancel-fractional');
    writeContract({
      address: REAL_ESTATE_DAPP_ADDRESS,
      abi: REAL_ESTATE_DAPP,
      functionName: 'cancelFractionalAssetPurchase',
      args: [selectedAsset.tokenId, BigInt(cancelAmount)],
    });
  } catch (err) {
    console.error('Error canceling fractional purchase:', err);
    setCurrentAction(null);
  }
};

  const handleMintUSDC = async () => {
  if (!usdcAddress || !address) return;
  try {
    setCurrentAction('mint');
    writeContract({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC,
      functionName: 'mint',
      args: [address, parseUnits('10000', 6)],
    });
  } catch (err) {
    console.error('Error minting USDC:', err);
    setCurrentAction(null);
  }
}

  const openPurchaseModal = (asset, type, amount = '') => {
    setSelectedAsset(asset);
    setPurchaseType(type);
    setFractionalAmount(amount);
    
    const requiredAmount = type === 'whole' 
      ? asset.price 
      : BigInt(amount || '1') * asset.pricePerFractionalToken;
    
    const hasEnoughAllowance = usdcAllowance && BigInt(usdcAllowance.toString()) >= requiredAmount;
    setNeedsApproval(!hasEnoughAllowance);
    setShowPurchaseModal(true);
  };

  const openCancelFractionalModal = (asset) => {
    setSelectedAsset(asset);
    setCancelAmount('');
    setShowCancelModal(true);
  };

  useEffect(() => {
  if (isSuccess) {
    const shouldCleanup = ['buy-whole', 'buy-fractional', 'cancel-full', 'cancel-fractional'].includes(currentAction);
    
    if (shouldCleanup) {
      if (purchaseType === 'fractional' && selectedAsset && fractionalAmount) {
        setRecentPurchases(prev => [
          ...prev,
          {
            tokenId: selectedAsset.tokenId,
            amount: fractionalAmount,
            timestamp: Date.now()
          }
        ]);
      }
      
      refetchBalance();
      refetchAllowance();
      refetchPortfolio();
      
      setTimeout(() => {
        setShowPurchaseModal(false);
        setShowCancelModal(false);
        setSelectedAsset(null);
        setPurchaseType(null);
        setFractionalAmount('');
        setCancelAmount('');
        setCurrentAction(null);
        refetchAssets();
      }, 2000);
    } else if (currentAction === 'approve') {
      refetchAllowance();
      setCurrentAction(null);
      setNeedsApproval(false);
    } else if (currentAction === 'mint') {
      refetchBalance();
      setCurrentAction(null);
    }
  }
}, [isSuccess, currentAction, purchaseType, selectedAsset, fractionalAmount, refetchBalance, refetchAllowance, refetchPortfolio, refetchAssets]);

  useEffect(() => {
    if (recentPurchases.length > 0) {
      const interval = setInterval(() => {
        refetchPortfolio();
        refetchBalance();
      }, 3000);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setRecentPurchases([]);
      }, 30000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [recentPurchases, refetchPortfolio, refetchBalance]);

  if (!isConnected) {
    return (
      <div className="bg-[#121317] min-h-screen py-10 px-5 flex justify-center items-center">
        <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-10 text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <div className="text-[#E1E2E2] text-lg mb-2">
            Connect Your Wallet
          </div>
          <div className="text-[#6D6041] text-sm">
            Please connect your wallet to browse and purchase properties
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121317] min-h-screen py-10 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-[#CAAB5B] text-3xl font-bold mb-2">
              Buyer Dashboard
            </h1>
            <p className="text-[#6D6041] text-sm">
              Browse and purchase real estate assets
            </p>
          </div>
          <div className="bg-[#111216] border border-[#CAAB5B] rounded-lg px-4 py-2 text-[#CAAB5B] text-sm font-bold">
            🛒 Buyer
          </div>
        </div>

        <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6 mb-10">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="text-[#6D6041] text-xs mb-2 uppercase tracking-wide">
                Your USDC Balance
              </div>
              <div className="text-[#CAAB5B] text-4xl font-bold">
                {usdcBalance ? formatUnits(usdcBalance, 6) : '0'} USDC
              </div>
            </div>
            <button
              onClick={handleMintUSDC}
              disabled={isPending || isConfirming}
              className={`px-6 py-3 rounded-lg text-sm font-bold ${
                isPending || isConfirming
                  ? 'bg-[#2C2C2C] text-[#6D6041] cursor-not-allowed'
                  : 'bg-[#4CAF50] text-white cursor-pointer'
              }`}
            >
              💰 Mint Test USDC
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-5">
            <div className="text-[#6D6041] text-xs mb-2">
              AVAILABLE PROPERTIES
            </div>
            <div className="text-[#E1E2E2] text-3xl font-bold">
              {wholeAssets.length}
            </div>
          </div>
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-5">
            <div className="text-[#6D6041] text-xs mb-2">
              FRACTIONAL ASSETS
            </div>
            <div className="text-[#CAAB5B] text-3xl font-bold">
              {fractionalizedAssets.length}
            </div>
          </div>
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-5">
            <div className="text-[#6D6041] text-xs mb-2">
              MY PROPERTIES
            </div>
            <div className="text-[#4CAF50] text-3xl font-bold">
              {completedFullPurchases.length}
            </div>
          </div>
          <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-5">
            <div className="text-[#6D6041] text-xs mb-2">
              TOTAL INVESTED
            </div>
            <div className="text-[#4CAF50] text-2xl font-bold">
              {formatUnits(totalInvestment, 6)} USDC
            </div>
          </div>
        </div>

        {hash && (
          <div className="mb-6 p-4 bg-[#111216] border border-[#2C2C2C] rounded-xl">
            {isConfirming && (
              <div className="text-[#ff9800] mb-2 font-bold">
                ⏳ Transaction confirming...
              </div>
            )}
            {isSuccess && (
              <div className="text-[#4CAF50] mb-2 font-bold">
                ✓ Transaction completed successfully!
              </div>
            )}
            <div className="text-[#6D6041] text-xs mb-1">
              Transaction Hash:
            </div>
            <div className="text-[#E1E2E2] text-xs font-mono break-all">
              {hash}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-[#f44336] rounded-xl text-white">
            Error: {error.message}
          </div>
        )}

        <div className="flex gap-2 mb-8 border-b border-[#2C2C2C] flex-wrap">
          <TabButton
            label="Browse Properties"
            isActive={selectedTab === 'browse'}
            onClick={() => setSelectedTab('browse')}
          />
          <TabButton
            label="Fractional Investments"
            isActive={selectedTab === 'fractional'}
            onClick={() => setSelectedTab('fractional')}
          />
          <TabButton
            label="My Portfolio"
            isActive={selectedTab === 'portfolio'}
            onClick={() => setSelectedTab('portfolio')}
            badge={portfolio?.length || 0}
          />
          <TabButton
            label="My Properties"
            isActive={selectedTab === 'properties'}
            onClick={() => setSelectedTab('properties')}
            badge={completedFullPurchases.length}
          />
          {pendingFullPurchases.length > 0 && (
            <TabButton
              label="Pending"
              isActive={selectedTab === 'pending'}
              onClick={() => setSelectedTab('pending')}
              badge={pendingFullPurchases.length}
              color="#ff9800"
            />
          )}
          {canceledPurchases.length > 0 && (
            <TabButton
              label="History"
              isActive={selectedTab === 'history'}
              onClick={() => setSelectedTab('history')}
              badge={canceledPurchases.length}
              color="#6D6041"
            />
          )}
        </div>

        {selectedTab === 'browse' && (
          <TabContent
            title="Available Properties"
            count={wholeAssets.length}
            emptyIcon="🏠"
            emptyMessage="No Properties Available"
            emptySubtext="Check back later for new listings"
          >
            {wholeAssets.slice(3).map((asset) => (
              <AssetCard
                key={asset.tokenId.toString()}
                asset={asset}
                onPurchase={(amount) => openPurchaseModal(asset, 'whole', amount)}
                isPending={isPending}
                isConfirming={isConfirming}
                type="whole"
              />
            ))}
          </TabContent>
        )}

        {selectedTab === 'fractional' && (
          <TabContent
            title="Fractional Investments"
            count={fractionalizedAssets.length}
            emptyIcon="🔹"
            emptyMessage="No Fractional Assets Available"
            emptySubtext="Check back later for fractional investment opportunities"
          >
            {fractionalizedAssets.map((asset) => (
              <AssetCard
                key={asset.tokenId.toString()}
                asset={asset}
                onPurchase={(amount) => openPurchaseModal(asset, 'fractional', amount)}
                isPending={isPending}
                isConfirming={isConfirming}
                type="fractional"
              />
            ))}
          </TabContent>
        )}

        {selectedTab === 'portfolio' && (
          <TabContent
            title="My Fractional Portfolio"
            count={portfolio?.length || 0}
            emptyIcon="📊"
            emptyMessage="No Fractional Investments Yet"
            emptySubtext="Start investing in fractional properties to build your portfolio"
          >
            {portfolio?.map((item) => (
              <PortfolioCard
                key={item.tokenId.toString()}
                item={item}
                onCancel={openCancelFractionalModal}
              />
            ))}
          </TabContent>
        )}

        {selectedTab === 'properties' && (
          <TabContent
            title="My Properties"
            count={completedFullPurchases.length}
            emptyIcon="🏡"
            emptyMessage="No Properties Owned Yet"
            emptySubtext="Purchase full properties to see them here"
          >
            {completedFullPurchases.map((asset) => (
              <OwnedPropertyCard
                key={asset.tokenId.toString()}
                asset={asset}
              />
            ))}
          </TabContent>
        )}

        {selectedTab === 'pending' && (
          <TabContent
            title="Pending Purchases"
            count={pendingFullPurchases.length}
            emptyIcon="✓"
            emptyMessage="No Pending Purchases"
            emptySubtext="All your purchases have been confirmed"
          >
            {pendingFullPurchases.map((asset) => (
              <PendingPurchaseCard
                key={asset.tokenId.toString()}
                asset={asset}
                onCancel={() => handleCancelFullPurchase(asset.tokenId)}
                isPending={isPending}
                isConfirming={isConfirming}
                cancellationPenalty={cancellationPenalty}
              />
            ))}
          </TabContent>
        )}

        {selectedTab === 'history' && (
          <TabContent
            title="Purchase History"
            count={canceledPurchases.length}
            emptyIcon="📜"
            emptyMessage="No Purchase History"
            emptySubtext="Your canceled purchases will appear here"
          >
            {canceledPurchases.map((asset) => (
              <CanceledPurchaseCard
                key={asset.tokenId.toString()}
                asset={asset}
              />
            ))}
          </TabContent>
        )}
      </div>

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

      {showCancelModal && selectedAsset && (
        <CancelFractionalModal
          asset={selectedAsset}
          cancelAmount={cancelAmount}
          setCancelAmount={setCancelAmount}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedAsset(null);
            setCancelAmount('');
          }}
          onCancel={handleCancelFractionalPurchase}
          isPending={isPending}
          isConfirming={isConfirming}
          portfolio={portfolio}
        />
      )}
    </div>
  );
}

function TabButton({ label, isActive, onClick, badge, color = '#CAAB5B' }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-bold border-b-2 transition-all relative ${
        isActive
          ? 'bg-[#111216] border-b-2'
          : 'bg-transparent text-[#6D6041] border-transparent'
      }`}
      style={{
        color: isActive ? color : undefined,
        borderBottomColor: isActive ? color : undefined
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className="absolute top-2 right-2 rounded-full min-w-[20px] h-5 text-xs flex items-center justify-center font-bold px-1.5"
          style={{
            backgroundColor: color,
            color: color === '#6D6041' ? '#E1E2E2' : '#121317'
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function TabContent({ title, count, emptyIcon, emptyMessage, emptySubtext, children }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : children;

  return (
    <>
      {hasContent ? (
        <>
          <h2 className="text-[#CAAB5B] text-2xl font-bold mb-6">
            {title} ({count})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children}
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-[#111216] border border-[#2C2C2C] rounded-xl text-[#6D6041]">
          <div className="text-5xl mb-4">{emptyIcon}</div>
          <div className="text-lg mb-2">{emptyMessage}</div>
          <div className="text-sm">{emptySubtext}</div>
        </div>
      )}
    </>
  );
}

function AssetCard({ asset, onPurchase, isPending, isConfirming, type }) {
  const [localAmount, setLocalAmount] = useState('1');

  const handlePurchaseClick = () => {
    if (type === 'fractional') {
      onPurchase(localAmount);
    } else {
      onPurchase('');
    }
  };

  return (
    <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[#CAAB5B]/20">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#2C2C2C]">
        <div className="bg-[#CAAB5B] text-[#121317] px-3 py-1.5 rounded-md text-sm font-bold">
          #{asset.tokenId.toString()}
        </div>
        <div className={`px-3 py-1.5 rounded-md text-xs font-medium ${
          type === 'fractional' ? 'bg-[#4CAF50] text-white' : 'bg-[#CAAB5B] text-[#121317]'
        }`}>
          {type === 'fractional' ? '🔹 Fractional' : '🏠 Whole'}
        </div>
      </div>

      <div className="mb-5">
        <div className="text-[#6D6041] text-xs mb-1 uppercase tracking-wide">
          {type === 'fractional' ? 'Price Per Token' : 'Total Price'}
        </div>
        <div className="text-[#CAAB5B] text-3xl font-bold">
          {type === 'fractional' 
            ? formatUnits(asset.pricePerFractionalToken, 6)
            : formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      {type === 'fractional' && (
        <div className="bg-[#121317] border border-[#2C2C2C] rounded-lg p-3 mb-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-[#6D6041] text-xs mb-1">
                Total Tokens
              </div>
              <div className="text-[#E1E2E2] text-base font-bold">
                {asset.totalFractionalTokens?.toString() || '0'}
              </div>
            </div>
            <div>
              <div className="text-[#6D6041] text-xs mb-1">
                Available
              </div>
              <div className="text-[#4CAF50] text-base font-bold">
                {asset.remainingFractionalTokens?.toString() || '0'}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[#6D6041] text-xs block mb-1">
              Tokens to Buy
            </label>
            <input
              type="number"
              value={localAmount}
              onChange={(e) => setLocalAmount(e.target.value)}
              min="1"
              max={asset.remainingFractionalTokens?.toString() || '0'}
              className="w-full p-2 bg-[#111216] border border-[#2C2C2C] rounded-md text-[#E1E2E2] text-sm"
            />
            <div className="text-[#6D6041] text-xs mt-1">
              Total: {localAmount && asset.pricePerFractionalToken 
                ? formatUnits(BigInt(localAmount) * asset.pricePerFractionalToken, 6)
                : '0'} USDC
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-[#2C2C2C] mb-5">
        <div className="text-[#6D6041] text-xs">Seller</div>
        <div className="text-[#E1E2E2] text-xs font-mono">
          {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
        </div>
      </div>

      <button
        onClick={handlePurchaseClick}
        disabled={isPending || isConfirming || (type === 'fractional' && (!localAmount || Number(localAmount) <= 0))}
        className={`w-full py-3 rounded-lg text-sm font-bold transition-opacity ${
          isPending || isConfirming
            ? 'bg-[#2C2C2C] text-[#6D6041] cursor-not-allowed'
            : 'bg-[#4CAF50] text-white cursor-pointer hover:opacity-90'
        }`}
      >
        {type === 'fractional' ? '🔹 Buy Tokens' : '🏠 Buy Property'}
      </button>
    </div>
  );
}

function PortfolioCard({ item, onCancel }) {
  return (
    <div className="bg-[#111216] border border-[#4CAF50] rounded-xl p-6">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#2C2C2C]">
        <div className="bg-[#CAAB5B] text-[#121317] px-3 py-1.5 rounded-md text-sm font-bold">
          #{item.tokenId.toString()}
        </div>
        <div className="bg-[#4CAF50] text-white px-3 py-1.5 rounded-md text-xs font-medium">
          ✓ Invested
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-[#6D6041] text-xs mb-1">
            Tokens Owned
          </div>
          <div className="text-[#E1E2E2] text-xl font-bold">
            {item.fractionalTokensOwned.toString()}
          </div>
        </div>
        <div>
          <div className="text-[#6D6041] text-xs mb-1">
            Ownership %
          </div>
          <div className="text-[#4CAF50] text-xl font-bold">
            {(Number(item.ownershipPercentage) / 1e17).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#2C2C2C] mb-4">
        <div className="text-[#6D6041] text-xs mb-1">
          Investment Value
        </div>
        <div className="text-[#CAAB5B] text-2xl font-bold">
          {formatUnits(item.investmentValue, 6)} USDC
        </div>
      </div>

      <button
        onClick={() => onCancel(item)}
        className="w-full py-3 bg-[#f44336] text-white border-none rounded-lg text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
      >
        Cancel Fractional Investment
      </button>
    </div>
  );
}

function OwnedPropertyCard({ asset }) {
  return (
    <div className="bg-[#111216] border border-[#4CAF50] rounded-xl p-6">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#2C2C2C]">
        <div className="bg-[#CAAB5B] text-[#121317] px-3 py-1.5 rounded-md text-sm font-bold">
          #{asset.tokenId.toString()}
        </div>
        <div className="bg-[#4CAF50] text-white px-3 py-1.5 rounded-md text-xs font-medium">
          ✓ Owned
        </div>
      </div>

      <div className="mb-5">
        <div className="text-[#6D6041] text-xs mb-1">
          Purchase Price
        </div>
        <div className="text-[#CAAB5B] text-[28px] font-bold">
          {formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-[#2C2C2C] mb-4">
        <div className="text-[#6D6041] text-xs">Seller</div>
        <div className="text-[#E1E2E2] text-xs font-mono">
          {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
        </div>
      </div>

      <div className="bg-[#4CAF5020] border border-[#4CAF50] rounded-lg p-3 text-center text-[#4CAF50] text-sm font-bold">
        🏡 You own this property
      </div>
    </div>
  );
}

function PendingPurchaseCard({ asset, onCancel, isPending, isConfirming, cancellationPenalty }) {
  const penaltyAmount = cancellationPenalty 
    ? (BigInt(asset.price.toString()) * BigInt(cancellationPenalty.toString())) / BigInt(100)
    : BigInt(0);

  const refundAmount = BigInt(asset.price.toString()) - penaltyAmount;

  return (
    <div className="bg-[#111216] border border-[#ff9800] rounded-xl p-6">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#2C2C2C]">
        <div className="bg-[#CAAB5B] text-[#121317] px-3 py-1.5 rounded-md text-sm font-bold">
          #{asset.tokenId.toString()}
        </div>
        <div className="bg-[#ff9800] text-white px-3 py-1.5 rounded-md text-xs font-medium">
          ⏳ Pending
        </div>
      </div>

      <div className="mb-5">
        <div className="text-[#6D6041] text-xs mb-1">
          Purchase Price
        </div>
        <div className="text-[#CAAB5B] text-[28px] font-bold">
          {formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      <div className="bg-[#ff980020] border border-[#ff9800] rounded-lg p-3 mb-5 text-xs text-[#E1E2E2]">
        <div className="font-bold mb-2 text-[#ff9800]">
          ⏳ Awaiting Seller Confirmation
        </div>
        <div className="mb-2">
          The seller needs to confirm receipt of payment. You can cancel this purchase, but a penalty will apply:
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#ff9800]">
          <div>
            <div className="text-[#6D6041] text-[11px] mb-1">
              Penalty ({cancellationPenalty?.toString()}%)
            </div>
            <div className="text-[#f44336] text-sm font-bold">
              -{formatUnits(penaltyAmount, 6)} USDC
            </div>
          </div>
          <div>
            <div className="text-[#6D6041] text-[11px] mb-1">
              You'll Receive
            </div>
            <div className="text-[#4CAF50] text-sm font-bold">
              {formatUnits(refundAmount, 6)} USDC
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onCancel}
        disabled={isPending || isConfirming}
        className="w-full py-3 border-none rounded-lg text-sm font-bold disabled:bg-[#2C2C2C] disabled:text-[#6D6041] disabled:cursor-not-allowed bg-[#f44336] text-white cursor-pointer"
      >
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Canceling...' : 'Cancel Purchase'}
      </button>
    </div>
  );
}

function CanceledPurchaseCard({ asset }) {
  return (
    <div className="bg-[#111216] border border-[#6D6041] rounded-xl p-6 opacity-70">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#2C2C2C]">
        <div className="bg-[#6D6041] text-[#E1E2E2] px-3 py-1.5 rounded-md text-sm font-bold">
          #{asset.tokenId.toString()}
        </div>
        <div className="bg-[#6D6041] text-[#E1E2E2] px-3 py-1.5 rounded-md text-xs font-medium">
          ✕ Canceled
        </div>
      </div>

      <div className="mb-5">
        <div className="text-[#6D6041] text-xs mb-1">
          Purchase Price
        </div>
        <div className="text-[#6D6041] text-[28px] font-bold">
          {formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-[#2C2C2C]">
        <div className="text-[#6D6041] text-xs">Status</div>
        <div className="text-[#6D6041] text-xs font-bold">
          Purchase was canceled
        </div>
      </div>
    </div>
  );
}