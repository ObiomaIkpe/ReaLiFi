import { formatUnits } from 'viem';

export function PurchaseModal({
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
    : BigInt(fractionalAmount || '0') * asset.pricePerFractionalToken;

  const hasEnoughBalance = usdcBalance && BigInt(usdcBalance.toString()) >= totalPrice;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[1000] p-5">
      <div className="bg-[#111216] border border-[#2C2C2C] rounded-2xl p-8 max-w-[500px] w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-emerald-500 text-2xl font-bold m-0">
            {purchaseType === 'whole' ? 'Purchase Property' : 'Buy Fractional Tokens'}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-[#6D6041] text-2xl cursor-pointer p-0 w-8 h-8 hover:text-emerald-500 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="bg-[#121317] border border-[#2C2C2C] rounded-xl p-5 mb-6">
          <div className="flex justify-between mb-3">
            <span className="text-[#6D6041] text-sm">Token ID</span>
            <span className="text-[#E1E2E2] text-sm font-bold">
              #{asset.tokenId.toString()}
            </span>
          </div>
          {purchaseType === 'fractional' && (
            <>
              <div className="flex justify-between mb-3">
                <span className="text-[#6D6041] text-sm">Tokens to Buy</span>
                <span className="text-[#E1E2E2] text-sm font-bold">
                  {fractionalAmount}
                </span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-[#6D6041] text-sm">Price per Token</span>
                <span className="text-[#E1E2E2] text-sm font-bold">
                  {formatUnits(asset.pricePerFractionalToken, 6)} USDC
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between pt-3 border-t border-[#2C2C2C]">
            <span className="text-[#6D6041] text-sm">Total Price</span>
            <span className="text-[#CAAB5B] text-lg font-bold">
              {formatUnits(totalPrice, 6)} USDC
            </span>
          </div>
        </div>

        <div className={`${hasEnoughBalance ? 'bg-emerald-500/10 border-emerald-500' : 'bg-red-500/10 border-red-500'} border rounded-xl p-4 mb-6 text-sm text-[#E1E2E2]`}>
          <div className="flex justify-between mb-2">
            <span className="text-[#6D6041]">Your Balance:</span>
            <span className="font-bold">
              {usdcBalance ? formatUnits(usdcBalance, 6) : '0'} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6D6041]">Required:</span>
            <span className="font-bold">
              {formatUnits(totalPrice, 6)} USDC
            </span>
          </div>
          {!hasEnoughBalance && (
            <div className="mt-3 text-red-500 font-bold text-xs">
              ⚠️ Insufficient USDC balance. Please mint more USDC.
            </div>
          )}
        </div>

        {needsApproval && hasEnoughBalance && (
          <div className="bg-orange-500/10 border border-orange-500 rounded-xl p-4 mb-6 text-sm text-[#E1E2E2]">
            <div className="font-bold mb-2 text-orange-500">
              ⚠️ Approval Required
            </div>
            You need to approve the marketplace contract to spend your USDC before purchasing.
          </div>
        )}

        <div className={`grid gap-3 ${needsApproval && hasEnoughBalance ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {(!needsApproval || !hasEnoughBalance) && (
            <button
              onClick={onClose}
              disabled={isPending || isConfirming}
              className="py-3.5 px-4 bg-[#2C2C2C] text-[#E1E2E2] border-0 rounded-xl text-sm font-bold cursor-pointer hover:bg-[#3C3C3C] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          {needsApproval && hasEnoughBalance ? (
            <button
              onClick={() => onApprove(totalPrice)}
              disabled={isPending || isConfirming}
              className="py-3.5 px-4 bg-orange-500 text-white border-0 rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-600 transition-colors disabled:bg-[#2C2C2C] disabled:text-[#6D6041] disabled:cursor-not-allowed"
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Approving...' : '1. Approve USDC'}
            </button>
          ) : (
            <button
              onClick={onPurchase}
              disabled={isPending || isConfirming || !hasEnoughBalance}
              className="py-3.5 px-4 bg-emerald-500 text-white border-0 rounded-xl text-sm font-bold cursor-pointer hover:bg-emerald-600 transition-colors disabled:bg-[#2C2C2C] disabled:text-[#6D6041] disabled:cursor-not-allowed"
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Processing...' : needsApproval ? 'Approve First' : '2. Purchase'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}