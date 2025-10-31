export function CancelFractionalModal({
  asset,
  cancelAmount,
  setCancelAmount,
  onClose,
  onCancel,
  isPending,
  isConfirming,
  portfolio
}) {
  const portfolioItem = portfolio?.find(
    item => item.tokenId.toString() === asset.tokenId.toString()
  );

  const maxTokens = portfolioItem?.fractionalTokensOwned || BigInt(0);

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[1000] p-5">
      <div className="bg-[#111216] border border-[#2C2C2C] rounded-2xl p-8 max-w-[500px] w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-red-500 text-2xl font-bold m-0">
            Cancel Fractional Investment
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-[#6D6041] text-2xl cursor-pointer p-0 w-8 h-8 hover:text-red-500 transition-colors"
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
          <div className="flex justify-between">
            <span className="text-[#6D6041] text-sm">Tokens Owned</span>
            <span className="text-emerald-500 text-sm font-bold">
              {maxTokens.toString()}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-[#6D6041] text-sm block mb-2">
            Number of Tokens to Cancel
          </label>
          <input
            type="number"
            value={cancelAmount}
            onChange={(e) => setCancelAmount(e.target.value)}
            min="1"
            max={maxTokens.toString()}
            placeholder="Enter amount"
            className="w-full p-3 bg-[#121317] border border-[#2C2C2C] rounded-lg text-[#E1E2E2] text-sm placeholder:text-[#6D6041] focus:outline-none focus:border-[#CAAB5B] transition-colors"
          />
          <div className="text-[#6D6041] text-xs mt-2">
            Maximum: {maxTokens.toString()} tokens
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-6 text-sm text-[#E1E2E2]">
          <div className="font-bold mb-2 text-red-500">
            ⚠️ Warning
          </div>
          Canceling will burn your tokens and refund your investment. A penalty may apply.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={isPending || isConfirming}
            className="py-3.5 px-4 bg-[#2C2C2C] text-[#E1E2E2] border-0 rounded-xl text-sm font-bold cursor-pointer hover:bg-[#3C3C3C] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={onCancel}
            disabled={isPending || isConfirming || !cancelAmount || Number(cancelAmount) <= 0 || BigInt(cancelAmount) > maxTokens}
            className="py-3.5 px-4 bg-red-500 text-white border-0 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-600 transition-colors disabled:bg-[#2C2C2C] disabled:text-[#6D6041] disabled:cursor-not-allowed"
          >
            {isPending ? 'Confirm in wallet...' : isConfirming ? 'Canceling...' : 'Cancel Investment'}
          </button>
        </div>
      </div>
    </div>
  );
}