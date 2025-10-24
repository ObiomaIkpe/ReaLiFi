import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, TrendingUp } from 'lucide-react';

const BACKEND_URL = 'http://localhost:3000';

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/assets`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121317]">
      <section className="px-6 py-20 md:py-32 max-w-7xl mx-auto">
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

          <div className="pt-8">
            <a href="/seller-dashboard">
              <button className="px-10 py-4 bg-[#CAAB5B] text-[#121317] rounded-lg font-semibold text-lg hover:bg-[#b89a4f] transition-colors">
                Become a Seller
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Bottom Half - Property Listings */}
      <section className="px-6 py-20 bg-[#111216] border-t border-[#2C2C2C]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#E1E2E2] mb-4">
              Available <span className="text-[#CAAB5B]">Properties</span>
            </h2>
            <p className="text-xl text-[#6D6041]">
              Browse tokenized real estate opportunities and start building your portfolio
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-[#2C2C2C] border-t-[#CAAB5B] rounded-full animate-spin"></div>
              <p className="mt-4 text-[#6D6041]">Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-[#6D6041]">No properties available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PropertyCard({ property }) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetadata();
  }, [property.ipfsMetadataUrl]);

  const fetchMetadata = async () => {
    try {
      const response = await fetch(property.ipfsMetadataUrl);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      
      const data = await response.json();
      setMetadata(data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121317] border border-[#2C2C2C] rounded-xl p-6 h-80 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2C2C2C] border-t-[#CAAB5B] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="bg-[#121317] border border-[#2C2C2C] rounded-xl p-6 h-80 flex items-center justify-center">
        <p className="text-[#6D6041]">Unable to load property</p>
      </div>
    );
  }

  const firstImage = metadata.media?.images?.[0]?.url;

  return (
    <div className="bg-[#121317] border border-[#2C2C2C] rounded-xl overflow-hidden hover:border-[#CAAB5B] transition-colors">
      {/* Property Image */}
      <div className="h-48 bg-[#111216] relative overflow-hidden">
        {firstImage ? (
          <img 
            src={firstImage} 
            alt={metadata.propertyDetails?.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-[#2C2C2C]" />
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-[#E1E2E2] mb-2">
            {metadata.propertyDetails?.title || 'Untitled Property'}
          </h3>
          <p className="text-[#6D6041] flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {metadata.propertyDetails?.location || 'Location not specified'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#2C2C2C]">
          <div>
            <p className="text-sm text-[#6D6041]">Tokenization Value</p>
            <p className="text-lg font-semibold text-[#CAAB5B]">
              ${metadata.financialDetails?.tokenizationValue ? Number(metadata.financialDetails.tokenizationValue).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#6D6041]">Monthly Revenue</p>
            <p className="text-lg font-semibold text-[#E1E2E2]">
              ${metadata.financialDetails?.monthlyRevenue ? Number(metadata.financialDetails.monthlyRevenue).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        <a href={`/asset/${property.id}`}>
          <button className="w-full py-3 bg-[#CAAB5B] text-[#121317] rounded-lg font-semibold hover:bg-[#b89a4f] transition-colors">
            View Property
          </button>
        </a>
      </div>
    </div>
  );
}