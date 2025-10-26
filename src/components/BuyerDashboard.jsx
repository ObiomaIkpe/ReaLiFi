// import { useState, useEffect } from 'react';
// import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
// import { formatUnits, parseUnits } from 'viem';
// import { MOCK_USDC, MOCK_USDC_ADDRESS, REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS } from '@/config/contract.config';

// export function BuyerDashboard() {
//   const { address, isConnected } = useAccount();
//   const [selectedTab, setSelectedTab] = useState('browse');
//   const [selectedAsset, setSelectedAsset] = useState(null);
//   const [showPurchaseModal, setShowPurchaseModal] = useState(false);
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [purchaseType, setPurchaseType] = useState(null);
//   const [fractionalAmount, setFractionalAmount] = useState('');
//   const [cancelAmount, setCancelAmount] = useState('');
//   const [needsApproval, setNeedsApproval] = useState(false);
//   const [recentPurchases, setRecentPurchases] = useState([]);

//   const { data: usdcAddress } = useReadContract({
//     address: REAL_ESTATE_DAPP_ADDRESS,
//     abi: REAL_ESTATE_DAPP,
//     functionName: 'usdcToken',
//   });

//   const { data: allAssets, refetch: refetchAssets } = useReadContract({
//     address: REAL_ESTATE_DAPP_ADDRESS,
//     abi: REAL_ESTATE_DAPP,
//     functionName: 'fetchAllAssetsWithDisplayInfo',
//   });

//   const { data: availableAssets } = useReadContract({
//     address: REAL_ESTATE_DAPP_ADDRESS,
//     abi: REAL_ESTATE_DAPP,
//     functionName: 'fetchAvailableAssets',
//   });

//   const { data: fractionalAssets } = useReadContract({
//     address: REAL_ESTATE_DAPP_ADDRESS,
//     abi: REAL_ESTATE_DAPP,
//     functionName: 'fetchFractionalizedAssets',
//   });

//   const { data: portfolio, refetch: refetchPortfolio } = useReadContract({
//     address: REAL_ESTATE_DAPP_ADDRESS,
//     abi: REAL_ESTATE_DAPP,
//     functionName: 'getBuyerPortfolio',
//     args: address ? [address] : undefined,
//   });

//   const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
//     address: MOCK_USDC_ADDRESS,
//     abi: MOCK_USDC,
//     functionName: 'balanceOf',
//     args: address ? [address] : undefined,
//   });

//   const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
//     address: MOCK_USDC_ADDRESS,
//     abi: MOCK_USDC,
//     functionName: 'allowance',
//     args: address ? [address, REAL_ESTATE_DAPP_ADDRESS] : undefined,
//   });

//   const { data: cancellationPenalty } = useReadContract({
//     address: REAL_ESTATE_DAPP_ADDRESS,
//     abi: REAL_ESTATE_DAPP,
//     functionName: 'CANCELLATION_PENALTY_PERCENTAGE',
//   });

//   const { data: hash, writeContract, isPending, error } = useWriteContract();
//   const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

//   const wholeAssets = availableAssets?.filter(asset => !asset.isFractionalized) || [];
//   const fractionalizedAssets = fractionalAssets || [];

//   const pendingFullPurchases = allAssets?.filter(
//     asset => asset.currentBuyer && 
//     asset.currentBuyer.toLowerCase() === address?.toLowerCase() && 
//     !asset.isPaidFor &&
//     !asset.isCanceled &&
//     !asset.isFractionalized
//   ) || [];

//   const completedFullPurchases = allAssets?.filter(
//     asset => asset.currentBuyer &&
//     asset.currentBuyer.toLowerCase() === address?.toLowerCase() &&
//     asset.isPaidFor &&
//     !asset.isFractionalized
//   ) || [];

//   const canceledPurchases = allAssets?.filter(
//     asset => asset.currentBuyer &&
//     asset.currentBuyer.toLowerCase() === address?.toLowerCase() &&
//     asset.isCanceled
//   ) || [];

//   const totalInvestment = completedFullPurchases.reduce(
//     (sum, asset) => sum + BigInt(asset.price.toString()),
//     BigInt(0)
//   ) + (portfolio?.reduce(
//     (sum, item) => sum + BigInt(item.investmentValue.toString()),
//     BigInt(0)
//   ) || BigInt(0));

//   const handleApproveUSDC = async (amount) => {
//     if (!usdcAddress) return;
//     try {
//       writeContract({
//         address: MOCK_USDC_ADDRESS,
//         abi: MOCK_USDC,
//         functionName: 'approve',
//         args: [REAL_ESTATE_DAPP_ADDRESS, amount],
//       });
//     } catch (err) {
//       console.error('Error approving USDC:', err);
//     }
//   };

//   const handleBuyWholeAsset = async () => {
//     if (!selectedAsset) return;
//     try {
//       writeContract({
//         address: REAL_ESTATE_DAPP_ADDRESS,
//         abi: REAL_ESTATE_DAPP,
//         functionName: 'buyAsset',
//         args: [selectedAsset.tokenId],
//       });
//     } catch (err) {
//       console.error('Error buying asset:', err);
//     }
//   };

//   const handleBuyFractionalAsset = async () => {
//     if (!selectedAsset || !fractionalAmount) return;
//     try {
//       writeContract({
//         address: REAL_ESTATE_DAPP_ADDRESS,
//         abi: REAL_ESTATE_DAPP,
//         functionName: 'buyFractionalAsset',
//         args: [selectedAsset.tokenId, BigInt(fractionalAmount)],
//       });
//     } catch (err) {
//       console.error('Error buying fractional asset:', err);
//     }
//   };

//   const handleCancelFullPurchase = async (tokenId) => {
//     try {
//       writeContract({
//         address: REAL_ESTATE_DAPP_ADDRESS,
//         abi: REAL_ESTATE_DAPP,
//         functionName: 'cancelAssetPurchase',
//         args: [tokenId],
//       });
//     } catch (err) {
//       console.error('Error canceling purchase:', err);
//     }
//   };

//   const handleCancelFractionalPurchase = async () => {
//     if (!selectedAsset || !cancelAmount) return;
//     try {
//       writeContract({
//         address: REAL_ESTATE_DAPP_ADDRESS,
//         abi: REAL_ESTATE_DAPP,
//         functionName: 'cancelFractionalAssetPurchase',
//         args: [selectedAsset.tokenId, BigInt(cancelAmount)],
//       });
//     } catch (err) {
//       console.error('Error canceling fractional purchase:', err);
//     }
//   };

//   const handleMintUSDC = async () => {
//     if (!usdcAddress || !address) return;
//     try {
//       writeContract({
//         address: MOCK_USDC_ADDRESS,
//         abi: MOCK_USDC,
//         functionName: 'mint',
//         args: [address, parseUnits('10000', 6)],
//       });
//     } catch (err) {
//       console.error('Error minting USDC:', err);
//     }
//   };

//   const openPurchaseModal = (asset, type, amount = '') => {
//     setSelectedAsset(asset);
//     setPurchaseType(type);
//     setFractionalAmount(amount);
    
//     const requiredAmount = type === 'whole' 
//       ? asset.price 
//       : BigInt(amount || '1') * asset.pricePerFractionalToken;
    
//     const hasEnoughAllowance = usdcAllowance && BigInt(usdcAllowance.toString()) >= requiredAmount;
//     setNeedsApproval(!hasEnoughAllowance);
//     setShowPurchaseModal(true);
//   };

//   const openCancelFractionalModal = (asset) => {
//     setSelectedAsset(asset);
//     setCancelAmount('');
//     setShowCancelModal(true);
//   };

//   useEffect(() => {
//     if (isSuccess) {
//       if (purchaseType === 'fractional' && selectedAsset && fractionalAmount) {
//         setRecentPurchases(prev => [
//           ...prev,
//           {
//             tokenId: selectedAsset.tokenId,
//             amount: fractionalAmount,
//             timestamp: Date.now()
//           }
//         ]);
//       }
      
//       refetchBalance();
//       refetchAllowance();
//       refetchPortfolio();
      
//       setTimeout(() => {
//         setShowPurchaseModal(false);
//         setShowCancelModal(false);
//         setSelectedAsset(null);
//         setPurchaseType(null);
//         setFractionalAmount('');
//         setCancelAmount('');
//         // setNeedsApproval(false);
//         refetchAssets();
//       }, 2000);
//     }
//   }, [isSuccess, purchaseType, selectedAsset, fractionalAmount, refetchBalance, refetchAllowance, refetchPortfolio, refetchAssets]);

//   useEffect(() => {
//     if (recentPurchases.length > 0) {
//       const interval = setInterval(() => {
//         refetchPortfolio();
//         refetchBalance();
//       }, 3000);

//       const timeout = setTimeout(() => {
//         clearInterval(interval);
//         setRecentPurchases([]);
//       }, 30000);

//       return () => {
//         clearInterval(interval);
//         clearTimeout(timeout);
//       };
//     }
//   }, [recentPurchases, refetchPortfolio, refetchBalance]);

//   if (!isConnected) {
//     return (
//       <div style={{
//         backgroundColor: '#121317',
//         minHeight: '100vh',
//         padding: '40px 20px',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//       }}>
//         <div style={{
//           backgroundColor: '#111216',
//           border: '1px solid #2C2C2C',
//           borderRadius: '12px',
//           padding: '40px',
//           textAlign: 'center',
//           maxWidth: '400px',
//         }}>
//           <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
//           <div style={{ color: '#E1E2E2', fontSize: '18px', marginBottom: '8px' }}>
//             Connect Your Wallet
//           </div>
//           <div style={{ color: '#6D6041', fontSize: '14px' }}>
//             Please connect your wallet to browse and purchase properties
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div style={{
//       backgroundColor: '#121317',
//       minHeight: '100vh',
//       padding: '40px 20px'
//     }}>
//       <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
//         <div style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           marginBottom: '40px',
//           flexWrap: 'wrap',
//           gap: '16px'
//         }}>
//           <div>
//             <h1 style={{
//               color: '#CAAB5B',
//               fontSize: '32px',
//               fontWeight: 'bold',
//               margin: 0,
//               marginBottom: '8px'
//             }}>
//               Buyer Dashboard
//             </h1>
//             <p style={{
//               color: '#6D6041',
//               fontSize: '14px',
//               margin: 0
//             }}>
//               Browse and purchase real estate assets
//             </p>
//           </div>
//           <div style={{
//             backgroundColor: '#111216',
//             border: '1px solid #CAAB5B',
//             borderRadius: '8px',
//             padding: '8px 16px',
//             color: '#CAAB5B',
//             fontSize: '14px',
//             fontWeight: 'bold',
//           }}>
//             🛒 Buyer
//           </div>
//         </div>

//         <div style={{
//           backgroundColor: '#111216',
//           border: '1px solid #2C2C2C',
//           borderRadius: '12px',
//           padding: '24px',
//           marginBottom: '40px'
//         }}>
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             flexWrap: 'wrap',
//             gap: '16px'
//           }}>
//             <div>
//               <div style={{
//                 color: '#6D6041',
//                 fontSize: '12px',
//                 marginBottom: '8px',
//                 textTransform: 'uppercase',
//                 letterSpacing: '0.5px'
//               }}>
//                 Your USDC Balance
//               </div>
//               <div style={{
//                 color: '#CAAB5B',
//                 fontSize: '36px',
//                 fontWeight: 'bold'
//               }}>
//                 {usdcBalance ? formatUnits(usdcBalance, 6) : '0'} USDC
//               </div>
//             </div>
//             <button
//               onClick={handleMintUSDC}
//               disabled={isPending || isConfirming}
//               style={{
//                 padding: '12px 24px',
//                 backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#4CAF50',
//                 color: isPending || isConfirming ? '#6D6041' : '#fff',
//                 border: 'none',
//                 borderRadius: '8px',
//                 fontSize: '14px',
//                 fontWeight: 'bold',
//                 cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
//               }}
//             >
//               💰 Mint Test USDC
//             </button>
//           </div>
//         </div>

//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//           gap: '16px',
//           marginBottom: '40px'
//         }}>
//           <div style={{
//             backgroundColor: '#111216',
//             border: '1px solid #2C2C2C',
//             borderRadius: '12px',
//             padding: '20px',
//           }}>
//             <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
//               AVAILABLE PROPERTIES
//             </div>
//             <div style={{ color: '#E1E2E2', fontSize: '28px', fontWeight: 'bold' }}>
//               {wholeAssets.length}
//             </div>
//           </div>
//           <div style={{
//             backgroundColor: '#111216',
//             border: '1px solid #2C2C2C',
//             borderRadius: '12px',
//             padding: '20px',
//           }}>
//             <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
//               FRACTIONAL ASSETS
//             </div>
//             <div style={{ color: '#CAAB5B', fontSize: '28px', fontWeight: 'bold' }}>
//               {fractionalizedAssets.length}
//             </div>
//           </div>
//           <div style={{
//             backgroundColor: '#111216',
//             border: '1px solid #2C2C2C',
//             borderRadius: '12px',
//             padding: '20px',
//           }}>
//             <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
//               MY PROPERTIES
//             </div>
//             <div style={{ color: '#4CAF50', fontSize: '28px', fontWeight: 'bold' }}>
//               {completedFullPurchases.length}
//             </div>
//           </div>
//           <div style={{
//             backgroundColor: '#111216',
//             border: '1px solid #2C2C2C',
//             borderRadius: '12px',
//             padding: '20px',
//           }}>
//             <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '8px' }}>
//               TOTAL INVESTED
//             </div>
//             <div style={{ color: '#4CAF50', fontSize: '24px', fontWeight: 'bold' }}>
//               {formatUnits(totalInvestment, 6)} USDC
//             </div>
//           </div>
//         </div>

//         {hash && (
//           <div style={{
//             marginBottom: '24px',
//             padding: '16px',
//             backgroundColor: '#111216',
//             border: '1px solid #2C2C2C',
//             borderRadius: '12px',
//           }}>
//             {isConfirming && (
//               <div style={{ color: '#ff9800', marginBottom: '8px', fontWeight: 'bold' }}>
//                 ⏳ Transaction confirming...
//               </div>
//             )}
//             {isSuccess && (
//               <div style={{ color: '#4CAF50', marginBottom: '8px', fontWeight: 'bold' }}>
//                 ✓ Transaction completed successfully!
//               </div>
//             )}
//             <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
//               Transaction Hash:
//             </div>
//             <div style={{
//               color: '#E1E2E2',
//               fontSize: '12px',
//               fontFamily: 'monospace',
//               wordBreak: 'break-all',
//             }}>
//               {hash}
//             </div>
//           </div>
//         )}

//         {error && (
//           <div style={{
//             marginBottom: '24px',
//             padding: '16px',
//             backgroundColor: '#f44336',
//             borderRadius: '12px',
//             color: '#fff',
//           }}>
//             Error: {error.message}
//           </div>
//         )}

//         <div style={{
//           display: 'flex',
//           gap: '8px',
//           marginBottom: '32px',
//           borderBottom: '1px solid #2C2C2C',
//           paddingBottom: '0',
//           flexWrap: 'wrap'
//         }}>
//           <TabButton
//             label="Browse Properties"
//             isActive={selectedTab === 'browse'}
//             onClick={() => setSelectedTab('browse')}
//           />
//           <TabButton
//             label="Fractional Investments"
//             isActive={selectedTab === 'fractional'}
//             onClick={() => setSelectedTab('fractional')}
//           />
//           <TabButton
//             label="My Portfolio"
//             isActive={selectedTab === 'portfolio'}
//             onClick={() => setSelectedTab('portfolio')}
//             badge={portfolio?.length || 0}
//           />
//           <TabButton
//             label="My Properties"
//             isActive={selectedTab === 'properties'}
//             onClick={() => setSelectedTab('properties')}
//             badge={completedFullPurchases.length}
//           />
//           {pendingFullPurchases.length > 0 && (
//             <TabButton
//               label="Pending"
//               isActive={selectedTab === 'pending'}
//               onClick={() => setSelectedTab('pending')}
//               badge={pendingFullPurchases.length}
//               color="#ff9800"
//             />
//           )}
//           {canceledPurchases.length > 0 && (
//             <TabButton
//               label="History"
//               isActive={selectedTab === 'history'}
//               onClick={() => setSelectedTab('history')}
//               badge={canceledPurchases.length}
//               color="#6D6041"
//             />
//           )}
//         </div>

//         {selectedTab === 'browse' && (
//           <TabContent
//             title="Available Properties"
//             count={wholeAssets.length}
//             emptyIcon="🏠"
//             emptyMessage="No Properties Available"
//             emptySubtext="Check back later for new listings"
//           >
//             {wholeAssets.map((asset) => (
//               <AssetCard
//                 key={asset.tokenId.toString()}
//                 asset={asset}
//                 onPurchase={(amount) => openPurchaseModal(asset, 'whole', amount)}
//                 isPending={isPending}
//                 isConfirming={isConfirming}
//                 type="whole"
//               />
//             ))}
//           </TabContent>
//         )}

//         {selectedTab === 'fractional' && (
//           <TabContent
//             title="Fractional Investments"
//             count={fractionalizedAssets.length}
//             emptyIcon="🔹"
//             emptyMessage="No Fractional Assets Available"
//             emptySubtext="Check back later for fractional investment opportunities"
//           >
//             {fractionalizedAssets.map((asset) => (
//               <AssetCard
//                 key={asset.tokenId.toString()}
//                 asset={asset}
//                 onPurchase={(amount) => openPurchaseModal(asset, 'fractional', amount)}
//                 isPending={isPending}
//                 isConfirming={isConfirming}
//                 type="fractional"
//               />
//             ))}
//           </TabContent>
//         )}

//         {selectedTab === 'portfolio' && (
//           <TabContent
//             title="My Fractional Portfolio"
//             count={portfolio?.length || 0}
//             emptyIcon="📊"
//             emptyMessage="No Fractional Investments Yet"
//             emptySubtext="Start investing in fractional properties to build your portfolio"
//           >
//             {portfolio?.map((item) => (
//               <PortfolioCard
//                 key={item.tokenId.toString()}
//                 item={item}
//                 onCancel={openCancelFractionalModal}
//               />
//             ))}
//           </TabContent>
//         )}

//         {selectedTab === 'properties' && (
//           <TabContent
//             title="My Properties"
//             count={completedFullPurchases.length}
//             emptyIcon="🏡"
//             emptyMessage="No Properties Owned Yet"
//             emptySubtext="Purchase full properties to see them here"
//           >
//             {completedFullPurchases.map((asset) => (
//               <OwnedPropertyCard
//                 key={asset.tokenId.toString()}
//                 asset={asset}
//               />
//             ))}
//           </TabContent>
//         )}

//         {selectedTab === 'pending' && (
//           <TabContent
//             title="Pending Purchases"
//             count={pendingFullPurchases.length}
//             emptyIcon="✓"
//             emptyMessage="No Pending Purchases"
//             emptySubtext="All your purchases have been confirmed"
//           >
//             {pendingFullPurchases.map((asset) => (
//               <PendingPurchaseCard
//                 key={asset.tokenId.toString()}
//                 asset={asset}
//                 onCancel={() => handleCancelFullPurchase(asset.tokenId)}
//                 isPending={isPending}
//                 isConfirming={isConfirming}
//                 cancellationPenalty={cancellationPenalty}
//               />
//             ))}
//           </TabContent>
//         )}

//         {selectedTab === 'history' && (
//           <TabContent
//             title="Purchase History"
//             count={canceledPurchases.length}
//             emptyIcon="📜"
//             emptyMessage="No Purchase History"
//             emptySubtext="Your canceled purchases will appear here"
//           >
//             {canceledPurchases.map((asset) => (
//               <CanceledPurchaseCard
//                 key={asset.tokenId.toString()}
//                 asset={asset}
//               />
//             ))}
//           </TabContent>
//         )}
//       </div>

//       {showPurchaseModal && selectedAsset && (
//         <PurchaseModal
//           asset={selectedAsset}
//           purchaseType={purchaseType}
//           fractionalAmount={fractionalAmount}
//           setFractionalAmount={setFractionalAmount}
//           needsApproval={needsApproval}
//           usdcBalance={usdcBalance}
//           onClose={() => {
//             setShowPurchaseModal(false);
//             setSelectedAsset(null);
//             setPurchaseType(null);
//             setFractionalAmount('');
//           }}
//           onApprove={handleApproveUSDC}
//           onPurchase={purchaseType === 'whole' ? handleBuyWholeAsset : handleBuyFractionalAsset}
//           isPending={isPending}
//           isConfirming={isConfirming}
//         />
//       )}

//       {showCancelModal && selectedAsset && (
//         <CancelFractionalModal
//           asset={selectedAsset}
//           cancelAmount={cancelAmount}
//           setCancelAmount={setCancelAmount}
//           onClose={() => {
//             setShowCancelModal(false);
//             setSelectedAsset(null);
//             setCancelAmount('');
//           }}
//           onCancel={handleCancelFractionalPurchase}
//           isPending={isPending}
//           isConfirming={isConfirming}
//           portfolio={portfolio}
//         />
//       )}
//     </div>
//   );
// }

// function TabButton({ label, isActive, onClick, badge, color = '#CAAB5B' }) {
//   return (
//     <button
//       onClick={onClick}
//       style={{
//         padding: '12px 24px',
//         backgroundColor: isActive ? '#111216' : 'transparent',
//         color: isActive ? color : '#6D6041',
//         border: 'none',
//         borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
//         fontSize: '14px',
//         fontWeight: 'bold',
//         cursor: 'pointer',
//         transition: 'all 0.2s',
//         position: 'relative'
//       }}
//     >
//       {label}
//       {badge !== undefined && badge > 0 && (
//         <span style={{
//           position: 'absolute',
//           top: '8px',
//           right: '8px',
//           backgroundColor: color,
//           color: color === '#6D6041' ? '#E1E2E2' : '#121317',
//           borderRadius: '50%',
//           minWidth: '20px',
//           height: '20px',
//           fontSize: '11px',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           fontWeight: 'bold',
//           padding: '0 6px'
//         }}>
//           {badge}
//         </span>
//       )}
//     </button>
//   );
// }

// function TabContent({ title, count, emptyIcon, emptyMessage, emptySubtext, children }) {
//   const hasContent = Array.isArray(children) ? children.length > 0 : children;

//   return (
//     <>
//       {hasContent ? (
//         <>
//           <h2 style={{
//             color: '#CAAB5B',
//             fontSize: '24px',
//             fontWeight: 'bold',
//             marginBottom: '24px',
//           }}>
//             {title} ({count})
//           </h2>
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
//             gap: '24px'
//           }}>
//             {children}
//           </div>
//         </>
//       ) : (
//         <div style={{
//           textAlign: 'center',
//           padding: '60px 20px',
//           backgroundColor: '#111216',
//           border: '1px solid #2C2C2C',
//           borderRadius: '12px',
//           color: '#6D6041'
//         }}>
//           <div style={{ fontSize: '48px', marginBottom: '16px' }}>{emptyIcon}</div>
//           <div style={{ fontSize: '18px', marginBottom: '8px' }}>{emptyMessage}</div>
//           <div style={{ fontSize: '14px' }}>{emptySubtext}</div>
//         </div>
//       )}
//     </>
//   );
// }

// function AssetCard({ asset, onPurchase, isPending, isConfirming, type }) {
//   const [localAmount, setLocalAmount] = useState('1');

//   const handlePurchaseClick = () => {
//     if (type === 'fractional') {
//       onPurchase(localAmount);
//     } else {
//       onPurchase('');
//     }
//   };

//   return (
//     <div
//       style={{
//         backgroundColor: '#111216',
//         border: '1px solid #2C2C2C',
//         borderRadius: '12px',
//         padding: '24px',
//         transition: 'transform 0.2s, box-shadow 0.2s',
//       }}
//       onMouseEnter={(e) => {
//         e.currentTarget.style.transform = 'translateY(-4px)';
//         e.currentTarget.style.boxShadow = '0 8px 16px rgba(202, 171, 91, 0.2)';
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.transform = 'translateY(0)';
//         e.currentTarget.style.boxShadow = 'none';
//       }}
//     >
//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: '20px',
//         paddingBottom: '16px',
//         borderBottom: '1px solid #2C2C2C'
//       }}>
//         <div style={{
//           backgroundColor: '#CAAB5B',
//           color: '#121317',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '14px',
//           fontWeight: 'bold'
//         }}>
//           #{asset.tokenId.toString()}
//         </div>
//         <div style={{
//           backgroundColor: type === 'fractional' ? '#4CAF50' : '#CAAB5B',
//           color: type === 'fractional' ? '#fff' : '#121317',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '12px',
//           fontWeight: '500'
//         }}>
//           {type === 'fractional' ? '🔹 Fractional' : '🏠 Whole'}
//         </div>
//       </div>

//       <div style={{ marginBottom: '20px' }}>
//         <div style={{
//           color: '#6D6041',
//           fontSize: '12px',
//           marginBottom: '4px',
//           textTransform: 'uppercase',
//           letterSpacing: '0.5px'
//         }}>
//           {type === 'fractional' ? 'Price Per Token' : 'Total Price'}
//         </div>
//         <div style={{
//           color: '#CAAB5B',
//           fontSize: '28px',
//           fontWeight: 'bold'
//         }}>
//           {type === 'fractional' 
//             ? formatUnits(asset.pricePerFractionalToken, 6)
//             : formatUnits(asset.price, 6)} USDC
//         </div>
//       </div>

//       {type === 'fractional' && (
//         <div style={{
//           backgroundColor: '#121317',
//           border: '1px solid #2C2C2C',
//           borderRadius: '8px',
//           padding: '12px',
//           marginBottom: '20px'
//         }}>
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: '1fr 1fr',
//             gap: '12px',
//             marginBottom: '12px'
//           }}>
//             <div>
//               <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
//                 Total Tokens
//               </div>
//               <div style={{ color: '#E1E2E2', fontSize: '16px', fontWeight: 'bold' }}>
//                 {asset.totalFractionalTokens?.toString() || '0'}
//               </div>
//             </div>
//             <div>
//               <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
//                 Available
//               </div>
//               <div style={{ color: '#4CAF50', fontSize: '16px', fontWeight: 'bold' }}>
//                 {asset.remainingFractionalTokens?.toString() || '0'}
//               </div>
//             </div>
//           </div>

//           <div>
//             <label style={{
//               color: '#6D6041',
//               fontSize: '11px',
//               display: 'block',
//               marginBottom: '4px'
//             }}>
//               Tokens to Buy
//             </label>
//             <input
//               type="number"
//               value={localAmount}
//               onChange={(e) => setLocalAmount(e.target.value)}
//               min="1"
//               max={asset.remainingFractionalTokens?.toString() || '0'}
//               style={{
//                 width: '100%',
//                 padding: '8px',
//                 backgroundColor: '#111216',
//                 border: '1px solid #2C2C2C',
//                 borderRadius: '6px',
//                 color: '#E1E2E2',
//                 fontSize: '14px'
//               }}
//             />
//             <div style={{ color: '#6D6041', fontSize: '11px', marginTop: '4px' }}>
//               Total: {localAmount && asset.pricePerFractionalToken 
//                 ? formatUnits(BigInt(localAmount) * asset.pricePerFractionalToken, 6)
//                 : '0'} USDC
//             </div>
//           </div>
//         </div>
//       )}

//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         paddingTop: '16px',
//         borderTop: '1px solid #2C2C2C',
//         marginBottom: '20px'
//       }}>
//         <div style={{ color: '#6D6041', fontSize: '12px' }}>Seller</div>
//         <div style={{
//           color: '#E1E2E2',
//           fontSize: '12px',
//           fontFamily: 'monospace'
//         }}>
//           {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
//         </div>
//       </div>

//       <button
//         onClick={handlePurchaseClick}
//         disabled={isPending || isConfirming || (type === 'fractional' && (!localAmount || Number(localAmount) <= 0))}
//         style={{
//           width: '100%',
//           padding: '12px',
//           backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#4CAF50',
//           color: isPending || isConfirming ? '#6D6041' : '#fff',
//           border: 'none',
//           borderRadius: '8px',
//           fontSize: '14px',
//           fontWeight: 'bold',
//           cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
//           transition: 'opacity 0.2s',
//         }}
//         onMouseEnter={(e) => {
//           if (!isPending && !isConfirming) {
//             e.currentTarget.style.opacity = '0.9';
//           }
//         }}
//         onMouseLeave={(e) => {
//           if (!isPending && !isConfirming) {
//             e.currentTarget.style.opacity = '1';
//           }
//         }}
//       >
//         {type === 'fractional' ? '🔹 Buy Tokens' : '🏠 Buy Property'}
//       </button>
//     </div>
//   );
// }

// function PortfolioCard({ item, onCancel }) {
//   return (
//     <div style={{
//       backgroundColor: '#111216',
//       border: '1px solid #4CAF50',
//       borderRadius: '12px',
//       padding: '24px',
//     }}>
//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: '20px',
//         paddingBottom: '16px',
//         borderBottom: '1px solid #2C2C2C'
//       }}>
//         <div style={{
//           backgroundColor: '#CAAB5B',
//           color: '#121317',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '14px',
//           fontWeight: 'bold'
//         }}>
//           #{item.tokenId.toString()}
//         </div>
//         <div style={{
//           backgroundColor: '#4CAF50',
//           color: '#fff',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '12px',
//           fontWeight: '500'
//         }}>
//           ✓ Invested
//         </div>
//       </div>

//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: '1fr 1fr',
//         gap: '16px',
//         marginBottom: '16px'
//       }}>
//         <div>
//           <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
//             Tokens Owned
//           </div>
//           <div style={{ color: '#E1E2E2', fontSize: '20px', fontWeight: 'bold' }}>
//             {item.fractionalTokensOwned.toString()}
//           </div>
//         </div>
//         <div>
//           <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
//             Ownership %
//           </div>
//           <div style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold' }}>
//             {(Number(item.ownershipPercentage) / 100).toFixed(2)}%
//           </div>
//         </div>
//       </div>

//       <div style={{
//         paddingTop: '16px',
//         borderTop: '1px solid #2C2C2C',
//         marginBottom: '16px'
//       }}>
//         <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
//           Investment Value
//         </div>
//         <div style={{ color: '#CAAB5B', fontSize: '24px', fontWeight: 'bold' }}>
//           {formatUnits(item.investmentValue, 6)} USDC
//         </div>
//       </div>

//       <button
//         onClick={() => onCancel(item)}
//         style={{
//           width: '100%',
//           padding: '12px',
//           backgroundColor: '#f44336',
//           color: '#fff',
//           border: 'none',
//           borderRadius: '8px',
//           fontSize: '14px',
//           fontWeight: 'bold',
//           cursor: 'pointer',
//           transition: 'opacity 0.2s',
//         }}
//         onMouseEnter={(e) => {
//           e.currentTarget.style.opacity = '0.9';
//         }}
//         onMouseLeave={(e) => {
//           e.currentTarget.style.opacity = '1';
//         }}
//       >
//         Cancel Fractional Investment
//       </button>
//     </div>
//   );
// }

// function OwnedPropertyCard({ asset }) {
//   return (
//     <div style={{
//       backgroundColor: '#111216',
//       border: '1px solid #4CAF50',
//       borderRadius: '12px',
//       padding: '24px',
//     }}>
//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: '20px',
//         paddingBottom: '16px',
//         borderBottom: '1px solid #2C2C2C'
//       }}>
//         <div style={{
//           backgroundColor: '#CAAB5B',
//           color: '#121317',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '14px',
//           fontWeight: 'bold'
//         }}>
//           #{asset.tokenId.toString()}
//         </div>
//         <div style={{
//           backgroundColor: '#4CAF50',
//           color: '#fff',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '12px',
//           fontWeight: '500'
//         }}>
//           ✓ Owned
//         </div>
//       </div>

//       <div style={{ marginBottom: '20px' }}>
//         <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
//           Purchase Price
//         </div>
//         <div style={{ color: '#CAAB5B', fontSize: '28px', fontWeight: 'bold' }}>
//           {formatUnits(asset.price, 6)} USDC
//         </div>
//       </div>

//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         paddingTop: '16px',
//         borderTop: '1px solid #2C2C2C',
//         marginBottom: '16px'
//       }}>
//         <div style={{ color: '#6D6041', fontSize: '12px' }}>Seller</div>
//         <div style={{
//           color: '#E1E2E2',
//           fontSize: '12px',
//           fontFamily: 'monospace'
//         }}>
//           {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
//         </div>
//       </div>

//       <div style={{
//         backgroundColor: '#4CAF5020',
//         border: '1px solid #4CAF50',
//         borderRadius: '8px',
//         padding: '12px',
//         textAlign: 'center',
//         color: '#4CAF50',
//         fontSize: '14px',
//         fontWeight: 'bold'
//       }}>
//         🏡 You own this property
//       </div>
//     </div>
//   );
// }

// function PendingPurchaseCard({ asset, onCancel, isPending, isConfirming, cancellationPenalty }) {
//   const penaltyAmount = cancellationPenalty 
//     ? (BigInt(asset.price.toString()) * BigInt(cancellationPenalty.toString())) / BigInt(100)
//     : BigInt(0);

//   const refundAmount = BigInt(asset.price.toString()) - penaltyAmount;

//   return (
//     <div style={{
//       backgroundColor: '#111216',
//       border: '1px solid #ff9800',
//       borderRadius: '12px',
//       padding: '24px',
//     }}>
//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: '20px',
//         paddingBottom: '16px',
//         borderBottom: '1px solid #2C2C2C'
//       }}>
//         <div style={{
//           backgroundColor: '#CAAB5B',
//           color: '#121317',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '14px',
//           fontWeight: 'bold'
//         }}>
//           #{asset.tokenId.toString()}
//         </div>
//         <div style={{
//           backgroundColor: '#ff9800',
//           color: '#fff',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '12px',
//           fontWeight: '500'
//         }}>
//           ⏳ Pending
//         </div>
//       </div>

//       <div style={{ marginBottom: '20px' }}>
//         <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
//           Purchase Price
//         </div>
//         <div style={{ color: '#CAAB5B', fontSize: '28px', fontWeight: 'bold' }}>
//           {formatUnits(asset.price, 6)} USDC
//         </div>
//       </div>

//       <div style={{
//         backgroundColor: '#ff980020',
//         border: '1px solid #ff9800',
//         borderRadius: '8px',
//         padding: '12px',
//         marginBottom: '20px',
//         fontSize: '12px',
//         color: '#E1E2E2'
//       }}>
//         <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff9800' }}>
//           ⏳ Awaiting Seller Confirmation
//         </div>
//         <div style={{ marginBottom: '8px' }}>
//           The seller needs to confirm receipt of payment. You can cancel this purchase, but a penalty will apply:
//         </div>
//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: '1fr 1fr',
//           gap: '8px',
//           marginTop: '12px',
//           paddingTop: '12px',
//           borderTop: '1px solid #ff9800'
//         }}>
//           <div>
//             <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
//               Penalty ({cancellationPenalty?.toString()}%)
//             </div>
//             <div style={{ color: '#f44336', fontSize: '14px', fontWeight: 'bold' }}>
//               -{formatUnits(penaltyAmount, 6)} USDC
//             </div>
//           </div>
//           <div>
//             <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
//               You'll Receive
//             </div>
//             <div style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 'bold' }}>
//               {formatUnits(refundAmount, 6)} USDC
//             </div>
//           </div>
//         </div>
//       </div>

//       <button
//         onClick={onCancel}
//         disabled={isPending || isConfirming}
//         style={{
//           width: '100%',
//           padding: '12px',
//           backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#f44336',
//           color: isPending || isConfirming ? '#6D6041' : '#fff',
//           border: 'none',
//           borderRadius: '8px',
//           fontSize: '14px',
//           fontWeight: 'bold',
//           cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
//         }}
//       >
//         {isPending ? 'Confirm in wallet...' : isConfirming ? 'Canceling...' : 'Cancel Purchase'}
//       </button>
//     </div>
//   );
// }

// function CanceledPurchaseCard({ asset }) {
//   return (
//     <div style={{
//       backgroundColor: '#111216',
//       border: '1px solid #6D6041',
//       borderRadius: '12px',
//       padding: '24px',
//       opacity: 0.7
//     }}>
//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: '20px',
//         paddingBottom: '16px',
//         borderBottom: '1px solid #2C2C2C'
//       }}>
//         <div style={{
//           backgroundColor: '#6D6041',
//           color: '#E1E2E2',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '14px',
//           fontWeight: 'bold'
//         }}>
//           #{asset.tokenId.toString()}
//         </div>
//         <div style={{
//           backgroundColor: '#6D6041',
//           color: '#E1E2E2',
//           padding: '6px 12px',
//           borderRadius: '6px',
//           fontSize: '12px',
//           fontWeight: '500'
//         }}>
//           ✕ Canceled
//         </div>
//       </div>

//       <div style={{ marginBottom: '20px' }}>
//         <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
//           Purchase Price
//         </div>
//         <div style={{ color: '#6D6041', fontSize: '28px', fontWeight: 'bold' }}>
//           {formatUnits(asset.price, 6)} USDC
//         </div>
//       </div>

//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         paddingTop: '16px',
//         borderTop: '1px solid #2C2C2C'
//       }}>
//         <div style={{ color: '#6D6041', fontSize: '12px' }}>Status</div>
//         <div style={{
//           color: '#6D6041',
//           fontSize: '12px',
//           fontWeight: 'bold'
//         }}>
//           Purchase was canceled
//         </div>
//       </div>
//     </div>
//   );
// }

// function PurchaseModal({
//   asset,
//   purchaseType,
//   fractionalAmount,
//   setFractionalAmount,
//   needsApproval,
//   usdcBalance,
//   onClose,
//   onApprove,
//   onPurchase,
//   isPending,
//   isConfirming
// }) {
//   const totalPrice = purchaseType === 'whole'
//     ? asset.price
//     : BigInt(fractionalAmount || '0') * asset.pricePerFractionalToken;

//   const hasEnoughBalance = usdcBalance && BigInt(usdcBalance.toString()) >= totalPrice;

//   return (
//     <div style={{
//       position: 'fixed',
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       backgroundColor: 'rgba(0, 0, 0, 0.8)',
//       display: 'flex',
//       justifyContent: 'center',
//       alignItems: 'center',
//       zIndex: 1000,
//       padding: '20px'
//     }}>
//       <div style={{
//         backgroundColor: '#111216',
//         border: '1px solid #2C2C2C',
//         borderRadius: '16px',
//         padding: '32px',
//         maxWidth: '500px',
//         width: '100%',
//         maxHeight: '90vh',
//         overflowY: 'auto'
//       }}>
//         <div style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           marginBottom: '24px'
//         }}>
//           <h2 style={{
//             color: '#4CAF50',
//             fontSize: '24px',
//             fontWeight: 'bold',
//             margin: 0
//           }}>
//             {purchaseType === 'whole' ? 'Purchase Property' : 'Buy Fractional Tokens'}
//           </h2>
//           <button
//             onClick={onClose}
//             style={{
//               background: 'none',
//               border: 'none',
//               color: '#6D6041',
//               fontSize: '24px',
//               cursor: 'pointer',
//               padding: '0',
//               width: '32px',
//               height: '32px'
//             }}
//           >
//             ×
//           </button>
//         </div>

//         <div style={{
//           backgroundColor: '#121317',
//           border: '1px solid #2C2C2C',
//           borderRadius: '12px',
//           padding: '20px',
//           marginBottom: '24px'
//         }}>
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             marginBottom: '12px'
//           }}>
//             <span style={{ color: '#6D6041', fontSize: '14px' }}>Token ID</span>
//             <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
//               #{asset.tokenId.toString()}
//             </span>
//           </div>
//           {purchaseType === 'fractional' && (
//             <>
//               <div style={{
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 marginBottom: '12px'
//               }}>
//                 <span style={{ color: '#6D6041', fontSize: '14px' }}>Tokens to Buy</span>
//                 <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
//                   {fractionalAmount}
//                 </span>
//               </div>
//               <div style={{
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 marginBottom: '12px'
//               }}>
//                 <span style={{ color: '#6D6041', fontSize: '14px' }}>Price per Token</span>
//                 <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
//                   {formatUnits(asset.pricePerFractionalToken, 6)} USDC
//                 </span>
//               </div>
//             </>
//           )}
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             paddingTop: '12px',
//             borderTop: '1px solid #2C2C2C'
//           }}>
//             <span style={{ color: '#6D6041', fontSize: '14px' }}>Total Price</span>
//             <span style={{ color: '#CAAB5B', fontSize: '18px', fontWeight: 'bold' }}>
//               {formatUnits(totalPrice, 6)} USDC
//             </span>
//           </div>
//         </div>

//         <div style={{
//           backgroundColor: hasEnoughBalance ? '#4CAF5020' : '#f4433620',
//           border: `1px solid ${hasEnoughBalance ? '#4CAF50' : '#f44336'}`,
//           borderRadius: '12px',
//           padding: '16px',
//           marginBottom: '24px',
//           fontSize: '14px',
//           color: '#E1E2E2'
//         }}>
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             marginBottom: '8px'
//           }}>
//             <span style={{ color: '#6D6041' }}>Your Balance:</span>
//             <span style={{ fontWeight: 'bold' }}>
//               {usdcBalance ? formatUnits(usdcBalance, 6) : '0'} USDC
//             </span>
//           </div>
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between'
//           }}>
//             <span style={{ color: '#6D6041' }}>Required:</span>
//             <span style={{ fontWeight: 'bold' }}>
//               {formatUnits(totalPrice, 6)} USDC
//             </span>
//           </div>
//           {!hasEnoughBalance && (
//             <div style={{
//               marginTop: '12px',
//               color: '#f44336',
//               fontWeight: 'bold',
//               fontSize: '12px'
//             }}>
//               ⚠️ Insufficient USDC balance. Please mint more USDC.
//             </div>
//           )}
//         </div>

//         {needsApproval && hasEnoughBalance && (
//           <div style={{
//             backgroundColor: '#ff980020',
//             border: '1px solid #ff9800',
//             borderRadius: '12px',
//             padding: '16px',
//             marginBottom: '24px',
//             fontSize: '14px',
//             color: '#E1E2E2'
//           }}>
//             <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff9800' }}>
//               ⚠️ Approval Required
//             </div>
//             You need to approve the marketplace contract to spend your USDC before purchasing.
//           </div>
//         )}

//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: needsApproval && hasEnoughBalance ? '1fr' : '1fr 1fr',
//           gap: '12px'
//         }}>
//           {(!needsApproval || !hasEnoughBalance) && (
//             <button
//               onClick={onClose}
//               disabled={isPending || isConfirming}
//               style={{
//                 padding: '14px',
//                 backgroundColor: '#2C2C2C',
//                 color: '#E1E2E2',
//                 border: 'none',
//                 borderRadius: '12px',
//                 fontSize: '14px',
//                 fontWeight: 'bold',
//                 cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
//               }}
//             >
//               Cancel
//             </button>
//           )}
//           {needsApproval && hasEnoughBalance ? (
//             <button
//               onClick={() => onApprove(totalPrice)}
//               disabled={isPending || isConfirming}
//               style={{
//                 padding: '14px',
//                 backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#ff9800',
//                 color: isPending || isConfirming ? '#6D6041' : '#fff',
//                 border: 'none',
//                 borderRadius: '12px',
//                 fontSize: '14px',
//                 fontWeight: 'bold',
//                 cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
//               }}
//             >
//               {isPending ? 'Confirm in wallet...' : isConfirming ? 'Approving...' : '1. Approve USDC'}
//             </button>
//           ) : (
//             <button
//               onClick={onPurchase}
//               disabled={isPending || isConfirming || !hasEnoughBalance}
//               style={{
//                 padding: '14px',
//                 backgroundColor: isPending || isConfirming || !hasEnoughBalance ? '#2C2C2C' : '#4CAF50',
//                 color: isPending || isConfirming || !hasEnoughBalance ? '#6D6041' : '#fff',
//                 border: 'none',
//                 borderRadius: '12px',
//                 fontSize: '14px',
//                 fontWeight: 'bold',
//                 cursor: isPending || isConfirming || !hasEnoughBalance ? 'not-allowed' : 'pointer',
//               }}
//             >
//               {isPending ? 'Confirm in wallet...' : isConfirming ? 'Processing...' : needsApproval ? 'Approve First' : '2. Purchase'}
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function CancelFractionalModal({
//   asset,
//   cancelAmount,
//   setCancelAmount,
//   onClose,
//   onCancel,
//   isPending,
//   isConfirming,
//   portfolio
// }) {
//   const portfolioItem = portfolio?.find(
//     item => item.tokenId.toString() === asset.tokenId.toString()
//   );

//   const maxTokens = portfolioItem?.fractionalTokensOwned || BigInt(0);

//   return (
//     <div style={{
//       position: 'fixed',
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       backgroundColor: 'rgba(0, 0, 0, 0.8)',
//       display: 'flex',
//       justifyContent: 'center',
//       alignItems: 'center',
//       zIndex: 1000,
//       padding: '20px'
//     }}>
//       <div style={{
//         backgroundColor: '#111216',
//         border: '1px solid #2C2C2C',
//         borderRadius: '16px',
//         padding: '32px',
//         maxWidth: '500px',
//         width: '100%'
//       }}>
//         <div style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           marginBottom: '24px'
//         }}>
//           <h2 style={{
//             color: '#f44336',
//             fontSize: '24px',
//             fontWeight: 'bold',
//             margin: 0
//           }}>
//             Cancel Fractional Investment
//           </h2>
//           <button
//             onClick={onClose}
//             style={{
//               background: 'none',
//               border: 'none',
//               color: '#6D6041',
//               fontSize: '24px',
//               cursor: 'pointer',
//               padding: '0',
//               width: '32px',
//               height: '32px'
//             }}
//           >
//             ×
//           </button>
//         </div>

//         <div style={{
//           backgroundColor: '#121317',
//           border: '1px solid #2C2C2C',
//           borderRadius: '12px',
//           padding: '20px',
//           marginBottom: '24px'
//         }}>
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             marginBottom: '12px'
//           }}>
//             <span style={{ color: '#6D6041', fontSize: '14px' }}>Token ID</span>
//             <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
//               #{asset.tokenId.toString()}
//             </span>
//           </div>
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//           }}>
//             <span style={{ color: '#6D6041', fontSize: '14px' }}>Tokens Owned</span>
//             <span style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 'bold' }}>
//               {maxTokens.toString()}
//             </span>
//           </div>
//         </div>

//         <div style={{ marginBottom: '24px' }}>
//           <label style={{
//             color: '#6D6041',
//             fontSize: '14px',
//             display: 'block',
//             marginBottom: '8px'
//           }}>
//             Number of Tokens to Cancel
//           </label>
//           <input
//             type="number"
//             value={cancelAmount}
//             onChange={(e) => setCancelAmount(e.target.value)}
//             min="1"
//             max={maxTokens.toString()}
//             placeholder="Enter amount"
//             style={{
//               width: '100%',
//               padding: '12px',
//               backgroundColor: '#121317',
//               border: '1px solid #2C2C2C',
//               borderRadius: '8px',
//               color: '#E1E2E2',
//               fontSize: '14px',
//             }}
//           />
//           <div style={{
//             color: '#6D6041',
//             fontSize: '12px',
//             marginTop: '8px'
//           }}>
//             Maximum: {maxTokens.toString()} tokens
//           </div>
//         </div>

//         <div style={{
//           backgroundColor: '#f4433620',
//           border: '1px solid #f44336',
//           borderRadius: '12px',
//           padding: '16px',
//           marginBottom: '24px',
//           fontSize: '14px',
//           color: '#E1E2E2'
//         }}>
//           <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#f44336' }}>
//             ⚠️ Warning
//           </div>
//           Canceling will burn your tokens and refund your investment. A penalty may apply.
//         </div>

//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: '1fr 1fr',
//           gap: '12px'
//         }}>
//           <button
//             onClick={onClose}
//             disabled={isPending || isConfirming}
//             style={{
//               padding: '14px',
//               backgroundColor: '#2C2C2C',
//               color: '#E1E2E2',
//               border: 'none',
//               borderRadius: '12px',
//               fontSize: '14px',
//               fontWeight: 'bold',
//               cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
//             }}
//           >
//             Go Back
//           </button>
//           <button
//             onClick={onCancel}
//             disabled={isPending || isConfirming || !cancelAmount || Number(cancelAmount) <= 0 || BigInt(cancelAmount) > maxTokens}
//             style={{
//               padding: '14px',
//               backgroundColor: isPending || isConfirming || !cancelAmount || Number(cancelAmount) <= 0 || BigInt(cancelAmount) > maxTokens ? '#2C2C2C' : '#f44336',
//               color: isPending || isConfirming || !cancelAmount || Number(cancelAmount) <= 0 || BigInt(cancelAmount) > maxTokens ? '#6D6041' : '#fff',
//               border: 'none',
//               borderRadius: '12px',
//               fontSize: '14px',
//               fontWeight: 'bold',
//               cursor: isPending || isConfirming || !cancelAmount || Number(cancelAmount) <= 0 || BigInt(cancelAmount) > maxTokens ? 'not-allowed' : 'pointer',
//             }}
//           >
//             {isPending ? 'Confirm in wallet...' : isConfirming ? 'Canceling...' : 'Cancel Investment'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { MOCK_USDC, MOCK_USDC_ADDRESS, REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS } from '@/config/contract.config';
import { PurchaseModal } from './shared/PurchaseModal';
import { CancelFractionalModal } from './shared/CancelFractionalModal';

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
  ) || [];

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

  const handleCancelFullPurchase = async (tokenId) => {
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

  const handleCancelFractionalPurchase = async () => {
    if (!selectedAsset || !cancelAmount) return;
    try {
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'cancelFractionalAssetPurchase',
        args: [selectedAsset.tokenId, BigInt(cancelAmount)],
      });
    } catch (err) {
      console.error('Error canceling fractional purchase:', err);
    }
  };

  const handleMintUSDC = async () => {
    if (!usdcAddress || !address) return;
    try {
      writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC,
        functionName: 'mint',
        args: [address, parseUnits('10000', 6)],
      });
    } catch (err) {
      console.error('Error minting USDC:', err);
    }
  };

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
        refetchAssets();
      }, 2000);
    }
  }, [isSuccess, purchaseType, selectedAsset, fractionalAmount, refetchBalance, refetchAllowance, refetchPortfolio, refetchAssets]);

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
              MY PROPERTIES
            </div>
            <div style={{ color: '#4CAF50', fontSize: '28px', fontWeight: 'bold' }}>
              {completedFullPurchases.length}
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
              {formatUnits(totalInvestment, 6)} USDC
            </div>
          </div>
        </div>

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

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '1px solid #2C2C2C',
          paddingBottom: '0',
          flexWrap: 'wrap'
        }}>
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
            {wholeAssets.map((asset) => (
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
      style={{
        padding: '12px 24px',
        backgroundColor: isActive ? '#111216' : 'transparent',
        color: isActive ? color : '#6D6041',
        border: 'none',
        borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
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
          backgroundColor: color,
          color: color === '#6D6041' ? '#E1E2E2' : '#121317',
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

function TabContent({ title, count, emptyIcon, emptyMessage, emptySubtext, children }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : children;

  return (
    <>
      {hasContent ? (
        <>
          <h2 style={{
            color: '#CAAB5B',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '24px',
          }}>
            {title} ({count})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {children}
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{emptyIcon}</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>{emptyMessage}</div>
          <div style={{ fontSize: '14px' }}>{emptySubtext}</div>
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
          color: type === 'fractional' ? '#fff' : '#121317',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {type === 'fractional' ? '🔹 Fractional' : '🏠 Whole'}
        </div>
      </div>

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

      <button
        onClick={handlePurchaseClick}
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

function PortfolioCard({ item, onCancel }) {
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
            {(Number(item.ownershipPercentage) / 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid #2C2C2C',
        marginBottom: '16px'
      }}>
        <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
          Investment Value
        </div>
        <div style={{ color: '#CAAB5B', fontSize: '24px', fontWeight: 'bold' }}>
          {formatUnits(item.investmentValue, 6)} USDC
        </div>
      </div>

      <button
        onClick={() => onCancel(item)}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#f44336',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        Cancel Fractional Investment
      </button>
    </div>
  );
}

function OwnedPropertyCard({ asset }) {
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
          #{asset.tokenId.toString()}
        </div>
        <div style={{
          backgroundColor: '#4CAF50',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          ✓ Owned
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
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid #2C2C2C',
        marginBottom: '16px'
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

      <div style={{
        backgroundColor: '#4CAF5020',
        border: '1px solid #4CAF50',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center',
        color: '#4CAF50',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
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
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff9800' }}>
          ⏳ Awaiting Seller Confirmation
        </div>
        <div style={{ marginBottom: '8px' }}>
          The seller needs to confirm receipt of payment. You can cancel this purchase, but a penalty will apply:
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #ff9800'
        }}>
          <div>
            <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
              Penalty ({cancellationPenalty?.toString()}%)
            </div>
            <div style={{ color: '#f44336', fontSize: '14px', fontWeight: 'bold' }}>
              -{formatUnits(penaltyAmount, 6)} USDC
            </div>
          </div>
          <div>
            <div style={{ color: '#6D6041', fontSize: '11px', marginBottom: '4px' }}>
              You'll Receive
            </div>
            <div style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 'bold' }}>
              {formatUnits(refundAmount, 6)} USDC
            </div>
          </div>
        </div>
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
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Canceling...' : 'Cancel Purchase'}
      </button>
    </div>
  );
}

function CanceledPurchaseCard({ asset }) {
  return (
    <div style={{
      backgroundColor: '#111216',
      border: '1px solid #6D6041',
      borderRadius: '12px',
      padding: '24px',
      opacity: 0.7
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
          backgroundColor: '#6D6041',
          color: '#E1E2E2',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          #{asset.tokenId.toString()}
        </div>
        <div style={{
          backgroundColor: '#6D6041',
          color: '#E1E2E2',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          ✕ Canceled
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#6D6041', fontSize: '12px', marginBottom: '4px' }}>
          Purchase Price
        </div>
        <div style={{ color: '#6D6041', fontSize: '28px', fontWeight: 'bold' }}>
          {formatUnits(asset.price, 6)} USDC
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid #2C2C2C'
      }}>
        <div style={{ color: '#6D6041', fontSize: '12px' }}>Status</div>
        <div style={{
          color: '#6D6041',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          Purchase was canceled
        </div>
      </div>
    </div>
  );
}