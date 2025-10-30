// import { useReadContract } from 'wagmi';
// import { REAL_ESTATE_DAPP_ADDRESS, REAL_ESTATE_DAPP } from '../config/contract.config';
// import { formatUnits } from 'viem';
// //TODO: check with assets page and see if it works right.
// export function AssetList() {
//   const { data, isLoading, isError } = useReadContract({
//     address: REAL_ESTATE_DAPP_ADDRESS,
//     abi: REAL_ESTATE_DAPP,
//     functionName: 'fetchAllListedAssets',
//   });
// if (isLoading) {
//     return (
//       <div style={{ 
//         padding: '40px', 
//         textAlign: 'center',
//         color: '#E1E2E2',
//         backgroundColor: '#121317'
//       }}>
//         Loading assets...
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div style={{ 
//         padding: '40px', 
//         textAlign: 'center',
//         color: '#E1E2E2',
//         backgroundColor: '#121317'
//       }}>
//         Error loading assets
//       </div>
//     );
//   }

//   return (
//     <div style={{ 
//       backgroundColor: '#121317', 
//       minHeight: '100vh',
//       padding: '40px 20px'
//     }}>
//       <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
//         <h1 style={{ 
//           color: '#CAAB5B',
//           fontSize: '32px',
//           fontWeight: 'bold',
//           marginBottom: '40px',
//           textAlign: 'center'
//         }}>
//           All Listed Assets
//         </h1>

//         <div style={{ 
//           display: 'grid',
//           gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
//           gap: '24px'
//         }}>
//           {data && data.map((asset) => (
//             <div 
//               key={asset.tokenId.toString()}
//               style={{
//                 backgroundColor: '#111216',
//                 border: '1px solid #2C2C2C',
//                 borderRadius: '12px',
//                 padding: '24px',
//                 transition: 'transform 0.2s, border-color 0.2s',
//               }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.borderColor = '#CAAB5B';
//                 e.currentTarget.style.transform = 'translateY(-4px)';
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.borderColor = '#2C2C2C';
//                 e.currentTarget.style.transform = 'translateY(0)';
//               }}
//             >
//               {/* Header */}
//               <div style={{
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//                 marginBottom: '20px',
//                 paddingBottom: '16px',
//                 borderBottom: '1px solid #2C2C2C'
//               }}>
//                 <div style={{
//                   backgroundColor: '#CAAB5B',
//                   color: '#121317',
//                   padding: '6px 12px',
//                   borderRadius: '6px',
//                   fontSize: '14px',
//                   fontWeight: 'bold'
//                 }}>
//                   #{asset.tokenId.toString()}
//                 </div>
//                 <div style={{
//                   backgroundColor: asset.verified ? '#4CAF50' : '#2C2C2C',
//                   color: asset.verified ? '#fff' : '#6D6041',
//                   padding: '6px 12px',
//                   borderRadius: '6px',
//                   fontSize: '12px',
//                   fontWeight: '500'
//                 }}>
//                   {asset.verified ? '✓ Verified' : 'Pending'}
//                 </div>
//               </div>

//               {/* Price */}
//               <div style={{ marginBottom: '20px' }}>
//                 <div style={{ 
//                   color: '#6D6041',
//                   fontSize: '12px',
//                   marginBottom: '4px',
//                   textTransform: 'uppercase',
//                   letterSpacing: '0.5px'
//                 }}>
//                   Price
//                 </div>
//                 <div style={{ 
//                   color: '#CAAB5B',
//                   fontSize: '28px',
//                   fontWeight: 'bold'
//                 }}>
//                   {formatUnits(asset.price, 1)} USDC
//                 </div>
//               </div>

//               {/* Seller */}
//               <div style={{ marginBottom: '20px' }}>
//                 <div style={{ 
//                   color: '#6D6041',
//                   fontSize: '12px',
//                   marginBottom: '4px',
//                   textTransform: 'uppercase',
//                   letterSpacing: '0.5px'
//                 }}>
//                   Seller
//                 </div>
//                 <div style={{ 
//                   color: '#E1E2E2',
//                   fontSize: '14px',
//                   fontFamily: 'monospace',
//                   backgroundColor: '#121317',
//                   padding: '8px 12px',
//                   borderRadius: '6px',
//                   overflow: 'hidden',
//                   textOverflow: 'ellipsis'
//                 }}>
//                   {asset.seller}
//                 </div>
//               </div>

//               {/* Status */}
//               <div style={{
//                 display: 'flex',
//                 gap: '12px',
//                 paddingTop: '16px',
//                 borderTop: '1px solid #2C2C2C'
//               }}>
//                 <div style={{ flex: 1 }}>
//                   <div style={{ 
//                     color: '#6D6041',
//                     fontSize: '11px',
//                     marginBottom: '4px'
//                   }}>
//                     Status
//                   </div>
//                   <div style={{ 
//                     color: '#E1E2E2',
//                     fontSize: '14px',
//                     fontWeight: '500'
//                   }}>
//                     {asset.sold ? 'Sold' : 'Available'}
//                   </div>
//                 </div>
//               </div>

//               {/* Action Button */}
//               <button
//                 style={{
//                   width: '100%',
//                   marginTop: '20px',
//                   padding: '12px',
//                   backgroundColor: asset.sold ? '#2C2C2C' : '#CAAB5B',
//                   color: asset.sold ? '#6D6041' : '#121317',
//                   border: 'none',
//                   borderRadius: '8px',
//                   fontSize: '14px',
//                   fontWeight: 'bold',
//                   cursor: asset.sold ? 'not-allowed' : 'pointer',
//                   transition: 'opacity 0.2s'
//                 }}
//                 disabled={asset.sold}
//                 onMouseEnter={(e) => {
//                   if (!asset.sold) e.currentTarget.style.opacity = '0.9';
//                 }}
//                 onMouseLeave={(e) => {
//                   if (!asset.sold) e.currentTarget.style.opacity = '1';
//                 }}
//               >
//                 {asset.sold ? 'Sold Out' : 'View Details'}
//               </button>
//             </div>
//           ))}
//         </div>

//         {data && data.length === 0 && (
//           <div style={{
//             textAlign: 'center',
//             padding: '60px 20px',
//             color: '#6D6041'
//           }}>
//             <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
//             <div style={{ fontSize: '18px' }}>No assets listed yet</div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
