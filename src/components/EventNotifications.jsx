import { useWatchContractEvent, useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { formatEther } from 'viem';
import { REAL_ESTATE_DAPP_ADDRESS, REAL_ESTATE_DAPP } from '../config/contract.config';

function EventNotifications() {
  const { address } = useAccount();

  // 1. AssetCreated Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'AssetCreated',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { tokenId, price, seller, verified } = log.args;
        const isMyAsset = seller?.toLowerCase() === address?.toLowerCase();
        
        if (isMyAsset) {
          const priceInHBAR = formatEther(price);
          toast.success(
            `🎉 Asset Created! Token ID: #${tokenId.toString()} | Price: ${Number(priceInHBAR).toFixed(2)} HBAR`,
            { duration: 8000 }
          );
          console.log('✅ AssetCreated Event:', {
            tokenId: tokenId.toString(),
            price: priceInHBAR,
            seller,
            verified,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 2. AssetPurchased Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'AssetPurchased',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { tokenId, buyer, price } = log.args;
        const isMyPurchase = buyer?.toLowerCase() === address?.toLowerCase();
        
        if (isMyPurchase) {
          const priceInHBAR = formatEther(price);
          toast.success(
            `✅ Asset Purchased! Token ID: #${tokenId.toString()} | Amount: ${Number(priceInHBAR).toFixed(2)} HBAR`,
            { duration: 8000 }
          );
          console.log('✅ AssetPurchased Event:', {
            tokenId: tokenId.toString(),
            buyer,
            price: priceInHBAR,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 3. AssetCanceled Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'AssetCanceled',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { tokenId, buyer } = log.args;
        const isMyCancellation = buyer?.toLowerCase() === address?.toLowerCase();
        
        if (isMyCancellation) {
          toast.error(
            `❌ Purchase Canceled - Token ID: #${tokenId.toString()}`,
            { duration: 8000 }
          );
          console.log('❌ AssetCanceled Event:', {
            tokenId: tokenId.toString(),
            buyer,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 4. AssetDelisted Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'AssetDelisted',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { tokenId, seller } = log.args;
        const isMyAsset = seller?.toLowerCase() === address?.toLowerCase();
        
        if (isMyAsset) {
          toast.info(
            `📤 Asset Delisted - Token ID: #${tokenId.toString()}`,
            { duration: 8000 }
          );
          console.log('📤 AssetDelisted Event:', {
            tokenId: tokenId.toString(),
            seller,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 5. AssetPaymentConfirmed Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'AssetPaymentConfirmed',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { tokenId, buyer } = log.args;
        const isMyPayment = buyer?.toLowerCase() === address?.toLowerCase();
        
        if (isMyPayment) {
          toast.success(
            `💰 Payment Confirmed! Token ID: #${tokenId.toString()}`,
            { duration: 8000 }
          );
          console.log('💰 AssetPaymentConfirmed Event:', {
            tokenId: tokenId.toString(),
            buyer,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 6. AssetVerified Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'AssetVerified',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { tokenId, seller } = log.args;
        const isMyAsset = seller?.toLowerCase() === address?.toLowerCase();
        
        if (isMyAsset) {
          toast.success(
            `✓ Asset Verified! Token ID: #${tokenId.toString()}`,
            { duration: 8000 }
          );
          console.log('✓ AssetVerified Event:', {
            tokenId: tokenId.toString(),
            seller,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 7. FractionalAssetCreated Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'FractionalAssetCreated',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { tokenId, totalTokens, pricePerToken, seller } = log.args;
        const isMyAsset = seller?.toLowerCase() === address?.toLowerCase();
        
        if (isMyAsset) {
          const priceInHBAR = formatEther(pricePerToken);
          toast.success(
            `🪙 Fractional Asset Created! Token ID: #${tokenId.toString()} | ${totalTokens.toString()} tokens @ ${Number(priceInHBAR).toFixed(2)} HBAR each`,
            { duration: 10000 }
          );
          console.log('🪙 FractionalAssetCreated Event:', {
            tokenId: tokenId.toString(),
            totalTokens: totalTokens.toString(),
            pricePerToken: priceInHBAR,
            seller,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 8. FractionalAssetPurchased Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'FractionalAssetPurchased',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { tokenId, buyer, numTokens, totalPrice } = log.args;
        const isMyPurchase = buyer?.toLowerCase() === address?.toLowerCase();
        
        if (isMyPurchase) {
          const priceInHBAR = formatEther(totalPrice);
          toast.success(
            `🎯 Fractional Purchase! ${numTokens.toString()} tokens of #${tokenId.toString()} | Total: ${Number(priceInHBAR).toFixed(2)} HBAR`,
            { duration: 10000 }
          );
          console.log('🎯 FractionalAssetPurchased Event:', {
            tokenId: tokenId.toString(),
            buyer,
            numTokens: numTokens.toString(),
            totalPrice: priceInHBAR,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 9. FractionalDividendsDistributed Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'FractionalDividendsDistributed',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { tokenId, totalAmount, buyers, amounts } = log.args;
        
        // Check if current user received dividends
        const buyerIndex = buyers?.findIndex(
          (buyer) => buyer?.toLowerCase() === address?.toLowerCase()
        );
        
        if (buyerIndex !== -1 && amounts && amounts[buyerIndex]) {
          const myDividend = formatEther(amounts[buyerIndex]);
          const totalInHBAR = formatEther(totalAmount);
          
          toast.success(
            `💵 Dividends Received! ${Number(myDividend).toFixed(2)} HBAR from Token #${tokenId.toString()}`,
            { duration: 10000 }
          );
          console.log('💵 FractionalDividendsDistributed Event:', {
            tokenId: tokenId.toString(),
            totalAmount: totalInHBAR,
            myDividend,
            buyers,
            amounts: amounts.map((amt) => formatEther(amt)),
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 10. SellerRegistered Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'SellerRegistered',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { sellerAddress } = log.args;
        const isMe = sellerAddress?.toLowerCase() === address?.toLowerCase();
        
        if (isMe) {
          toast.success(
            `🏠 Successfully Registered as Seller!`,
            { duration: 8000 }
          );
          console.log('🏠 SellerRegistered Event:', {
            sellerAddress,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // 11. USDCWithdrawn Event
  useWatchContractEvent({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    eventName: 'USDCWithdrawn',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { recipient, amount } = log.args;
        const isMyWithdrawal = recipient?.toLowerCase() === address?.toLowerCase();
        
        if (isMyWithdrawal) {
          // USDC has 6 decimals, not 18
          const amountInUSDC = Number(amount) / 1e6;
          
          toast.success(
            `💸 USDC Withdrawn! ${amountInUSDC.toFixed(2)} USDC`,
            { duration: 8000 }
          );
          console.log('💸 USDCWithdrawn Event:', {
            recipient,
            amount: amountInUSDC,
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