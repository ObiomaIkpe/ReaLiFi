import { useReadContract } from 'wagmi';
import { REAL_ESTATE_DAPP, REAL_ESTATE_DAPP_ADDRESS } from '@/config/contract.config';
import { PropertyCard } from '@/components/shared/PropertyCard';

export function PropertyCardTest() {
  const { data: allAssets, isLoading } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'fetchAllAssetsWithDisplayInfo',
  });

  if (isLoading) {
    return (
      <div style={{
        backgroundColor: '#121317',
        minHeight: '100vh',
        padding: '40px',
        color: '#CAAB5B',
        textAlign: 'center',
      }}>
        Loading properties...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#121317',
      minHeight: '100vh',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{
          color: '#CAAB5B',
          fontSize: '32px',
          marginBottom: '40px',
        }}>
          PropertyCard Component Test
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {allAssets?.map(asset => (
            <PropertyCard 
              key={asset.tokenId.toString()} 
              asset={asset} 
            />
          ))}
        </div>

        {(!allAssets || allAssets.length === 0) && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: '#6D6041',
            fontSize: '18px',
          }}>
            No properties found
          </div>
        )}
      </div>
    </div>
  );
}