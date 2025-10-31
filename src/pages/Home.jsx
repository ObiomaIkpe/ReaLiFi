import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS } from '@/config/contract.config';
import { PropertyCard } from '@/components/shared/PropertyCard';
import { DollarSign, MapPin, TrendingUp } from 'lucide-react';

export function Home() {
  // State for filters
  const [filterType, setFilterType] = useState('all'); // 'all', 'whole', 'fractional'
  const [filterVerified, setFilterVerified] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-low', 'price-high'
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all assets from blockchain
  const { data: allAssets, isLoading, error } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAllAssetsWithDisplayInfo',
  });

  // Filter and sort assets
  const filteredAndSortedAssets = (() => {
    if (!allAssets) return [];

    let filtered = allAssets.filter(asset => {
      // Filter by type
      if (filterType === 'whole' && asset.isFractionalized) return false;
      if (filterType === 'fractional' && !asset.isFractionalized) return false;
      
      // Filter by verification
      if (filterVerified && !asset.verified) return false;
      
      // Only show available assets (not sold or fully sold fractional)
      if (asset.sold && !asset.isFractionalized) return false;
      if (asset.isFractionalized && Number(asset.remainingFractionalTokens) === 0) return false;
      
      return true;
    });

    // Sort assets
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return Number(b.tokenId) - Number(a.tokenId);
      } else if (sortBy === 'price-low') {
        const priceA = a.isFractionalized ? a.pricePerFractionalToken : a.price;
        const priceB = b.isFractionalized ? b.pricePerFractionalToken : b.price;
        return Number(priceA) - Number(priceB);
      } else if (sortBy === 'price-high') {
        const priceA = a.isFractionalized ? a.pricePerFractionalToken : a.price;
        const priceB = b.isFractionalized ? b.pricePerFractionalToken : b.price;
        return Number(priceB) - Number(priceA);
      }
      return 0;
    });

    return filtered;
  })();

  const totalProperties = allAssets?.length || 0;
  const availableProperties = filteredAndSortedAssets.length;
  const verifiedCount = allAssets?.filter(a => a.verified).length || 0;
  const fractionalCount = allAssets?.filter(a => a.isFractionalized).length || 0;

  return (
    <div className="bg-[#121317] min-h-screen p-5">
      <div className="min-h-screen bg-[#121317]">
        <section className="px-6 py-20 md:py-20 max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-[#E1E2E2] leading-tight">
              Invest in Real Estate Through Blockchain Technology
            </h1>
            
            <p className="text-xl md:text-2xl text-[#6D6041] leading-relaxed">
              Real estate has long been one of the most reliable wealth-building assets. Now, blockchain technology makes it accessible to everyone through tokenization—allowing you to own fractional shares of premium properties without the traditional barriers.
            </p>
  
            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-[#CAAB5B]/10 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-[#CAAB5B]" />
                </div>
                <h3 className="text-xl font-semibold text-[#E1E2E2]">Passive Income</h3>
                <p className="text-[#6D6041]">Earn monthly rental income automatically distributed to your wallet</p>
              </div>
  
              <div className="space-y-3">
                <div className="w-12 h-12 bg-[#CAAB5B]/10 rounded-lg flex items-center justify-center mx-auto">
                  <DollarSign className="w-6 h-6 text-[#CAAB5B]" />
                </div>
                <h3 className="text-xl font-semibold text-[#E1E2E2]">Fractional Ownership</h3>
                <p className="text-[#6D6041]">Start investing with any amount—no need for large capital</p>
              </div>
  
              <div className="space-y-3">
                <div className="w-12 h-12 bg-[#CAAB5B]/10 rounded-lg flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6 text-[#CAAB5B]" />
                </div>
                <h3 className="text-xl font-semibold text-[#E1E2E2]">Global Access</h3>
                <p className="text-[#6D6041]">Invest in properties anywhere in the world, instantly</p>
              </div>
            </div>
          </div>
        </section>
  
        <section className="px-6 py-14 bg-[#111216] border-t border-[#2C2C2C]">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-[#E1E2E2] mb-4">
                Available <span className="text-[#CAAB5B]">Properties</span>
              </h2>
              <p className="text-xl text-[#6D6041] max-w-2xl mx-auto">
                Browse tokenized real estate opportunities and start building your portfolio
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
          <StatCard
            icon="🏠"
            label="Total Properties"
            value={totalProperties}
            color="#E1E2E2"
          />
          <StatCard
            icon="✓"
            label="Verified"
            value={verifiedCount}
            color="#4CAF50"
          />
          <StatCard
            icon="🔹"
            label="Fractional"
            value={fractionalCount}
            color="#CAAB5B"
          />
          <StatCard
            icon="📊"
            label="Available Now"
            value={availableProperties}
            color="#4CAF50"
          />
        </div>

        <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6 mb-10">
          <div className="flex flex-wrap gap-5 items-center">
            <div className="text-[#CAAB5B] text-sm font-bold uppercase tracking-wider">
              Filters:
            </div>

            <div className="flex-none">
              <label className="text-[#6D6041] text-xs block mb-1.5">
                Property Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="py-2.5 px-4 bg-[#121317] border border-[#2C2C2C] rounded-lg text-[#E1E2E2] text-sm cursor-pointer min-w-[150px]"
              >
                <option value="all">All Properties</option>
                <option value="whole">Whole Only</option>
                <option value="fractional">Fractional Only</option>
              </select>
            </div>

            <div className="flex-none">
              <label className="text-[#6D6041] text-xs block mb-1.5">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2.5 px-4 bg-[#121317] border border-[#2C2C2C] rounded-lg text-[#E1E2E2] text-sm cursor-pointer min-w-[150px]"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <div className="flex-none">
              <label className="flex items-center gap-2 text-[#E1E2E2] text-sm cursor-pointer mt-5">
                <input
                  type="checkbox"
                  checked={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.checked)}
                  className="cursor-pointer w-[18px] h-[18px] accent-[#4CAF50]"
                />
                <span>Verified Only</span>
              </label>
            </div>

            <div className="ml-auto text-[#6D6041] text-sm font-bold">
              {availableProperties} {availableProperties === 1 ? 'property' : 'properties'} found
            </div>
          </div>

          {(filterType !== 'all' || filterVerified) && (
            <div className="mt-4 pt-4 border-t border-[#2C2C2C] flex gap-2 flex-wrap items-center">
              <span className="text-[#6D6041] text-xs">Active filters:</span>
              
              {filterType !== 'all' && (
                <span className="bg-[#CAAB5B20] border border-[#CAAB5B] text-[#CAAB5B] py-1 px-2.5 rounded-md text-xs flex items-center gap-1.5">
                  {filterType === 'whole' ? 'Whole Properties' : 'Fractional Properties'}
                  <button
                    onClick={() => setFilterType('all')}
                    className="bg-transparent border-0 text-[#CAAB5B] cursor-pointer p-0 text-sm"
                  >
                    ×
                  </button>
                </span>
              )}

              {filterVerified && (
                <span className="bg-[#4CAF5020] border border-[#4CAF50] text-[#4CAF50] py-1 px-2.5 rounded-md text-xs flex items-center gap-1.5">
                  Verified Only
                  <button
                    onClick={() => setFilterVerified(false)}
                    className="bg-transparent border-0 text-[#4CAF50] cursor-pointer p-0 text-sm"
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterVerified(false);
                }}
                className="bg-transparent border border-[#6D6041] text-[#6D6041] py-1 px-2.5 rounded-md text-xs cursor-pointer ml-2"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="text-center py-20 px-5 text-[#CAAB5B] text-lg">
            <div className="text-5xl mb-4">🔄</div>
            Loading properties...
          </div>
        )}

        {error && (
          <div className="bg-[#f4433620] border border-[#f44336] rounded-xl p-6 text-center text-[#f44336]">
            <div className="text-5xl mb-4">⚠️</div>
            <div className="text-lg mb-2">
              Error Loading Properties
            </div>
            <div className="text-sm text-[#E1E2E2]">
              {error.message}
            </div>
          </div>
        )}

        {!isLoading && !error && filteredAndSortedAssets.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
            {filteredAndSortedAssets.map(asset => (
              <PropertyCard 
                key={asset.tokenId.toString()} 
                asset={asset} 
              />
            ))}
          </div>
        )}

        {!isLoading && !error && filteredAndSortedAssets.length === 0 && (
          <div className="text-center py-20 px-5 bg-[#111216] border border-[#2C2C2C] rounded-xl text-[#6D6041]">
            <div className="text-6xl mb-4">🏠</div>
            <div className="text-2xl mb-2 text-[#E1E2E2]">
              No Properties Found
            </div>
            <div className="text-base mb-6">
              {allAssets && allAssets.length > 0 
                ? 'Try adjusting your filters to see more properties'
                : 'Be the first to list a property on the marketplace'}
            </div>
            {(filterType !== 'all' || filterVerified) && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterVerified(false);
                }}
                className="py-3 px-6 bg-[#CAAB5B] text-[#121317] border-0 rounded-lg text-sm font-bold cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-5 flex items-center gap-4">
      <div className="text-[32px] leading-none">
        {icon}
      </div>
      <div>
        <div className="text-[#6D6041] text-xs mb-1 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-2xl font-bold leading-none" style={{ color }}>
          {value}
        </div>
      </div>
    </div>
  );
}