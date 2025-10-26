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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#111216',
        border: '1px solid #2C2C2C',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            color: '#4CAF50',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0
          }}>
            {purchaseType === 'whole' ? 'Purchase Property' : 'Buy Fractional Tokens'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6D6041',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          backgroundColor: '#121317',
          border: '1px solid #2C2C2C',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ color: '#6D6041', fontSize: '14px' }}>Token ID</span>
            <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
              #{asset.tokenId.toString()}
            </span>
          </div>
          {purchaseType === 'fractional' && (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#6D6041', fontSize: '14px' }}>Tokens to Buy</span>
                <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
                  {fractionalAmount}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ color: '#6D6041', fontSize: '14px' }}>Price per Token</span>
                <span style={{ color: '#E1E2E2', fontSize: '14px', fontWeight: 'bold' }}>
                  {formatUnits(asset.pricePerFractionalToken, 6)} USDC
                </span>
              </div>
            </>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #2C2C2C'
          }}>
            <span style={{ color: '#6D6041', fontSize: '14px' }}>Total Price</span>
            <span style={{ color: '#CAAB5B', fontSize: '18px', fontWeight: 'bold' }}>
              {formatUnits(totalPrice, 6)} USDC
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: hasEnoughBalance ? '#4CAF5020' : '#f4433620',
          border: `1px solid ${hasEnoughBalance ? '#4CAF50' : '#f44336'}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#E1E2E2'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#6D6041' }}>Your Balance:</span>
            <span style={{ fontWeight: 'bold' }}>
              {usdcBalance ? formatUnits(usdcBalance, 6) : '0'} USDC
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#6D6041' }}>Required:</span>
            <span style={{ fontWeight: 'bold' }}>
              {formatUnits(totalPrice, 6)} USDC
            </span>
          </div>
          {!hasEnoughBalance && (
            <div style={{
              marginTop: '12px',
              color: '#f44336',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              ⚠️ Insufficient USDC balance. Please mint more USDC.
            </div>
          )}
        </div>

        {needsApproval && hasEnoughBalance && (
          <div style={{
            backgroundColor: '#ff980020',
            border: '1px solid #ff9800',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#E1E2E2'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff9800' }}>
              ⚠️ Approval Required
            </div>
            You need to approve the marketplace contract to spend your USDC before purchasing.
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: needsApproval && hasEnoughBalance ? '1fr' : '1fr 1fr',
          gap: '12px'
        }}>
          {(!needsApproval || !hasEnoughBalance) && (
            <button
              onClick={onClose}
              disabled={isPending || isConfirming}
              style={{
                padding: '14px',
                backgroundColor: '#2C2C2C',
                color: '#E1E2E2',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          )}
          {needsApproval && hasEnoughBalance ? (
            <button
              onClick={() => onApprove(totalPrice)}
              disabled={isPending || isConfirming}
              style={{
                padding: '14px',
                backgroundColor: isPending || isConfirming ? '#2C2C2C' : '#ff9800',
                color: isPending || isConfirming ? '#6D6041' : '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Approving...' : '1. Approve USDC'}
            </button>
          ) : (
            <button
              onClick={onPurchase}
              disabled={isPending || isConfirming || !hasEnoughBalance}
              style={{
                padding: '14px',
                backgroundColor: isPending || isConfirming || !hasEnoughBalance ? '#2C2C2C' : '#4CAF50',
                color: isPending || isConfirming || !hasEnoughBalance ? '#6D6041' : '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isPending || isConfirming || !hasEnoughBalance ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Processing...' : needsApproval ? 'Approve First' : '2. Purchase'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}