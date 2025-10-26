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
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            color: '#f44336',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0
          }}>
            Cancel Fractional Investment
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#6D6041', fontSize: '14px' }}>Tokens Owned</span>
            <span style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 'bold' }}>
              {maxTokens.toString()}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            color: '#6D6041',
            fontSize: '14px',
            display: 'block',
            marginBottom: '8px'
          }}>
            Number of Tokens to Cancel
          </label>
          <input
            type="number"
            value={cancelAmount}
            onChange={(e) => setCancelAmount(e.target.value)}
            min="1"
            max={maxTokens.toString()}
            placeholder="Enter amount"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#121317',
              border: '1px solid #2C2C2C',
              borderRadius: '8px',
              color: '#E1E2E2',
              fontSize: '14px',
            }}
          />
          <div style={{
            color: '#6D6041',
            fontSize: '12px',
            marginTop: '8px'
          }}>
            Maximum: {maxTokens.toString()} tokens
          </div>
        </div>

        <div style={{
          backgroundColor: '#f4433620',
          border: '1px solid #f44336',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#E1E2E2'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#f44336' }}>
            ⚠️ Warning
          </div>
          Canceling will burn your tokens and refund your investment. A penalty may apply.
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
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
            Go Back
          </button>
          <button
            onClick={onCancel}
            disabled={isPending || isConfirming || !cancelAmount || Number(cancelAmount) <= 0 || BigInt(cancelAmount) > maxTokens}
            style={{
              padding: '14px',
              backgroundColor: isPending || isConfirming || !cancelAmount || Number(cancelAmount) <= 0 || BigInt(cancelAmount) > maxTokens ? '#2C2C2C' : '#f44336',
              color: isPending || isConfirming || !cancelAmount || Number(cancelAmount) <= 0 || BigInt(cancelAmount) > maxTokens ? '#6D6041' : '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isPending || isConfirming || !cancelAmount || Number(cancelAmount) <= 0 || BigInt(cancelAmount) > maxTokens ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Confirm in wallet...' : isConfirming ? 'Canceling...' : 'Cancel Investment'}
          </button>
        </div>
      </div>
    </div>
  );
}