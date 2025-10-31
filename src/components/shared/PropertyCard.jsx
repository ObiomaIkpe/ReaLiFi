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
      className="bg-[#111216] border border-[#2C2C2C] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ease-in-out flex flex-col hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(202,171,91,0.2)]"
    >
      {/* Thumbnail Image Section */}
      <div className="relative w-full h-[200px] bg-[#121317] overflow-hidden">
        {loading ? (
          // Loading state
          <div className="w-full h-full flex items-center justify-center text-[#6D6041] text-sm">
            Loading...
          </div>
        ) : metadataError || !thumbnail ? (
          // Error or no image state
          <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-[#6D6041]">
            <div className="text-5xl">🏠</div>
            <div className="text-xs">No image available</div>
          </div>
        ) : (
          // Image loaded successfully
          <img 
            src={thumbnail} 
            alt={`Property #${asset.tokenId}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, show placeholder
              e.currentTarget.style.display = 'none';
              setMetadataError(true);
            }}
          />
        )}

        {/* Verification Badge (Overlay) */}
        {asset.verified && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1.5 rounded-md text-[11px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex items-center gap-1">
            ✓ Verified
          </div>
        )}

        {/* Fractional Badge (Overlay) */}
        {asset.isFractionalized && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2.5 py-1.5 rounded-md text-[11px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex items-center gap-1">
            🔹 Fractional
          </div>
        )}
      </div>

      {/* Card Content Section */}
      <div className="p-5">
        {/* Token ID Badge */}
        <div className="flex justify-between items-center mb-4">
          <div className="bg-[#CAAB5B] text-[#121317] px-2.5 py-1 rounded text-xs font-bold">
            #{asset.tokenId.toString()}
          </div>

          {/* Property Type (if not fractionalized, already shown as overlay) */}
          {!asset.isFractionalized && (
            <div className="bg-[#2C2C2C] text-[#CAAB5B] px-2.5 py-1 rounded text-[11px] font-medium">
              🏠 Whole
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="mb-4">
          <div className="text-[#6D6041] text-[11px] mb-1 uppercase tracking-wide">
            {asset.isFractionalized ? 'From' : 'Price'}
          </div>
          <div className="text-[#CAAB5B] text-2xl font-bold leading-tight">
            {asset.isFractionalized 
              ? formatUnits(asset.pricePerFractionalToken, 6)
              : formatUnits(asset.price, 6)} USDC
          </div>
        </div>

        {/* Fractional Info Section */}
        {asset.isFractionalized && (
          <div className="bg-[#121317] border border-[#2C2C2C] rounded-md p-2.5 mb-4">
            {/* Token Availability */}
            <div className="flex justify-between text-[11px] text-[#E1E2E2] mb-2">
              <span className="text-[#6D6041]">Available:</span>
              <span className="font-bold text-emerald-500">
                {asset.remainingFractionalTokens?.toString()} / {asset.totalFractionalTokens?.toString()}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="bg-[#2C2C2C] h-1 rounded-sm overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300 ease-in-out"
                style={{
                  width: `${((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens)) * 100}%`
                }}
              />
            </div>

            {/* Percentage Text */}
            <div className="text-[#6D6041] text-[10px] mt-1.5 text-right">
              {((Number(asset.totalFractionalTokens) - Number(asset.remainingFractionalTokens)) / Number(asset.totalFractionalTokens) * 100).toFixed(1)}% sold
            </div>
          </div>
        )}

        {/* Seller Info (Optional) */}
        <div className="flex justify-between items-center pt-3 border-t border-[#2C2C2C] mb-4">
          <div className="text-[#6D6041] text-[11px]">
            Seller
          </div>
          <div className="text-[#E1E2E2] text-[11px] font-mono">
            {asset.seller.slice(0, 6)}...{asset.seller.slice(-4)}
          </div>
        </div>

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
            handleClick();
          }}
          className="w-full py-3 bg-emerald-500 text-white border-0 rounded-lg text-sm font-bold cursor-pointer transition-opacity duration-200 flex items-center justify-center gap-2 hover:opacity-90"
        >
          View Details
          <span className="text-base">→</span>
        </button>
      </div>
    </div>
  );
}