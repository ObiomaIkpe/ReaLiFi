// src/components/marketplace/MarketplacePage.jsx
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
    <div style={{
      backgroundColor: '#121317',
      minHeight: '100vh',
      padding: '20px 20px'
    }}>

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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
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

        <div style={{
          backgroundColor: '#111216',
          border: '1px solid #2C2C2C',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'center'
          }}>
            <div style={{
              color: '#CAAB5B',
              fontSize: '14px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Filters:
            </div>

            <div style={{ flex: '0 0 auto' }}>
              <label style={{
                color: '#6D6041',
                fontSize: '12px',
                display: 'block',
                marginBottom: '6px'
              }}>
                Property Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#121317',
                  border: '1px solid #2C2C2C',
                  borderRadius: '8px',
                  color: '#E1E2E2',
                  fontSize: '14px',
                  cursor: 'pointer',
                  minWidth: '150px'
                }}
              >
                <option value="all">All Properties</option>
                <option value="whole">Whole Only</option>
                <option value="fractional">Fractional Only</option>
              </select>
            </div>

            <div style={{ flex: '0 0 auto' }}>
              <label style={{
                color: '#6D6041',
                fontSize: '12px',
                display: 'block',
                marginBottom: '6px'
              }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#121317',
                  border: '1px solid #2C2C2C',
                  borderRadius: '8px',
                  color: '#E1E2E2',
                  fontSize: '14px',
                  cursor: 'pointer',
                  minWidth: '150px'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <div style={{ flex: '0 0 auto' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#E1E2E2',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '20px'
              }}>
                <input
                  type="checkbox"
                  checked={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.checked)}
                  style={{
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    accentColor: '#4CAF50'
                  }}
                />
                <span>Verified Only</span>
              </label>
            </div>

            <div style={{
              marginLeft: 'auto',
              color: '#6D6041',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {availableProperties} {availableProperties === 1 ? 'property' : 'properties'} found
            </div>
          </div>

          {(filterType !== 'all' || filterVerified) && (
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #2C2C2C',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <span style={{ color: '#6D6041', fontSize: '12px' }}>Active filters:</span>
              
              {filterType !== 'all' && (
                <span style={{
                  backgroundColor: '#CAAB5B20',
                  border: '1px solid #CAAB5B',
                  color: '#CAAB5B',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {filterType === 'whole' ? 'Whole Properties' : 'Fractional Properties'}
                  <button
                    onClick={() => setFilterType('all')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#CAAB5B',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '14px'
                    }}
                  >
                    ×
                  </button>
                </span>
              )}

              {filterVerified && (
                <span style={{
                  backgroundColor: '#4CAF5020',
                  border: '1px solid #4CAF50',
                  color: '#4CAF50',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Verified Only
                  <button
                    onClick={() => setFilterVerified(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4CAF50',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '14px'
                    }}
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
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #6D6041',
                  color: '#6D6041',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginLeft: '8px'
                }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#CAAB5B',
            fontSize: '18px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
            Loading properties...
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#f4433620',
            border: '1px solid #f44336',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: '#f44336'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>
              Error Loading Properties
            </div>
            <div style={{ fontSize: '14px', color: '#E1E2E2' }}>
              {error.message}
            </div>
          </div>
        )}

        {!isLoading && !error && filteredAndSortedAssets.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {filteredAndSortedAssets.map(asset => (
              <PropertyCard 
                key={asset.tokenId.toString()} 
                asset={asset} 
              />
            ))}
          </div>
        )}

        {!isLoading && !error && filteredAndSortedAssets.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#111216',
            border: '1px solid #2C2C2C',
            borderRadius: '12px',
            color: '#6D6041'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏠</div>
            <div style={{ fontSize: '24px', marginBottom: '8px', color: '#E1E2E2' }}>
              No Properties Found
            </div>
            <div style={{ fontSize: '16px', marginBottom: '24px' }}>
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
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#CAAB5B',
                  color: '#121317',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
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
    <div style={{
      backgroundColor: '#111216',
      border: '1px solid #2C2C2C',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        fontSize: '32px',
        lineHeight: '1'
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          color: '#6D6041',
          fontSize: '12px',
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </div>
        <div style={{
          color: color,
          fontSize: '24px',
          fontWeight: 'bold',
          lineHeight: '1'
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}