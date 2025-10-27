import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatUnits } from 'viem';

export function PropertyCard({ asset }) {
  const navigate = useNavigate();
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metadataError, setMetadataError] = useState(false);

  // Fetch metadata to get thumbnail image
  useEffect(() => {
    if (!asset?.tokenURI) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMetadataError(false);

    fetch(asset.tokenURI)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch metadata');
        return res.json();
      })
      .then(data => {
        // Get first image from metadata
        if (data?.media?.images?.[0]?.url) {
          setThumbnail(data.media.images[0].url);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching metadata:', error);
        setMetadataError(true);
        setLoading(false);
      });
  }, [asset?.tokenURI]);

  // Navigate to asset details page
  const handleClick = () => {
    navigate(`/property/${asset.tokenId}`);
  };

  // Don't render if asset is invalid
  if (!asset) return null;

  return (
    <div
      onClick={handleClick}
      style={{
        backgroundColor: '#111216',
        border: '1px solid #2C2C2C',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
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
      {/* Thumbnail Image Section */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '200px',
        backgroundColor: '#121317',
        overflow: 'hidden',
      }}>
        {loading ? (
          // Loading state
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6D6041',
            fontSize: '14px',
          }}>
            Loading...
          </div>
        ) : metadataError || !thumbnail ? (
          // Error or no image state
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px',
            color: '#6D6041',
          }}>
            <div style={{ fontSize: '48px' }}>🏠</div>
            <div style={{ fontSize: '12px' }}>No image available</div>
          </div>
        ) : (
          // Image loaded successfully
          <img 
            src={thumbnail} 
            alt={`Property #${asset.tokenId}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              // If image fails to load, show placeholder
              e.currentTarget.style.display = 'none';
              setMetadataError(true);
            }}
          />
        )}

        {/* Verification Badge (Overlay) */}
        {asset.verified && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            ✓ Verified
          </div>
        )}

        {/* Fractional Badge (Overlay) */}
        {asset.isFractionalized && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            🔹 Fractional
          </div>
        )}
      </div>

      {/* Card Content Section */}
      <div style={{ padding: '20px' }}>
        {/* Token ID Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <div style={{
            backgroundColor: '#CAAB5B',
            color: '#121317',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            #{asset.tokenId.toString()}
          </div>

          {/* Property Type (if not fractionalized, already shown as overlay) */}
          {!asset.isFractionalized && (
            <div style={{
              backgroundColor: '#2C2C2C',
              color: '#CAAB5B',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
            }}>
              🏠 Whole
            </div>
          )}
        </div>

        {/* Price Section */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            color: '#6D6041',
            fontSize: '11px',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {asset.isFractionalized ? 'From' : 'Price'}
          </div>
          <div style={{
            color: '#CAAB5B',
            fontSize: '24px',
            fontWeight: 'bold',
            lineHeight: '1.2',
          }}>
            {asset.isFractionalized 
              ? formatUnits(asset.pricePerFractionalToken, 6)
              : formatUnits(asset.price, 6)} USDC
          </div>
        </div>

        {/* Fractional Info Section */}
        {asset.isFractionalized && (
          <div style={{
            backgroundColor: '#121317',
            border: '1px solid #2C2C2C',
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '16px',
          }}>
            {/* Token Availability */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#E1E2E2',
              marginBottom: '8px',
            }}>
              <span style={{ color: '#6D6041' }}>Available:</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {asset.remainingFractionalTokens?.toString()} / {asset.totalFractionalTokens?.toString()}
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{
              backgroundColor: '#2C2C2C',
              height: '4px',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                backgroundColor: '#4CAF50',
                height: '100%',
                width: `${((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens)) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Percentage Text */}
            <div style={{
              color: '#6D6041',
              fontSize: '10px',
              marginTop: '6px',
              textAlign: 'right',
            }}>
              {((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens) * 100).toFixed(1)}% sold
            </div>
          </div>
        )}

        {/* Seller Info (Optional) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid #2C2C2C',
          marginBottom: '16px',
        }}>
          <div style={{ color: '#6D6041', fontSize: '11px' }}>
            Seller
          </div>
          <div style={{
            color: '#E1E2E2',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}>
            {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
          </div>
        </div>

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
            handleClick();
          }}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          View Details
          <span style={{ fontSize: '16px' }}>→</span>
        </button>
      </div>
    </div>
  );
}