import { useWatchContractEvent, useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { formatEther } from 'viem';
import { REAL_ESTATE_DAPP_ADDRESS, REAL_ESTATE_DAPP } from '../config/contract.config';

function EventNotifications() {
  const { address } = useAccount();

  // This hook listens for the AssetCreated event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,  // Your contract address
    abi: REAL_ESTATE_DAPP,      // Your contract ABI
    eventName: 'AssetCreated',           // The exact event name from your contract
    onLogs: (logs) => {                  // This function runs when the event is emitted
      logs.forEach((log) => {
        // Extract the event data
        // log.args contains: tokenId, price, seller, verified
        const tokenId = log.args.tokenId;
        const price = log.args.price;
        const seller = log.args.seller;
        const verified = log.args.verified;
        
        // Check if the current user created this asset
        const isMyAsset = seller?.toLowerCase() === address?.toLowerCase();
        
        // Only show notification if it's the current user's asset
        if (isMyAsset) {
          // Convert price from wei to HBAR for display
          const priceInHBAR = formatEther(price);
          
          // Show success toast notification
          toast.success(
            `🎉 Asset Created! Token ID: #${tokenId.toString()} | Price: ${Number(priceInHBAR).toFixed(2)} HBAR`,
            {
              duration: 8000,
            }
          );

          // Log to console for debugging
          console.log('✅ AssetCreated Event Received:', {
            tokenId: tokenId.toString(),
            price: priceInHBAR,
            seller: seller,
            verified: verified,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // This component doesn't render anything visible
  return null;
}

export default EventNotifications;