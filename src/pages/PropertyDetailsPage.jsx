// import React, { useState, useEffect } from 'react';
// import { MapPin, DollarSign, TrendingUp, ArrowLeft, FileText, Image as ImageIcon, User, Mail, Phone } from 'lucide-react';
// import { useParams } from 'react-router-dom';

// const BACKEND_URL = 'http://localhost:3000';

// export default function PropertyDetailsPage() {
// const { propertyId } = useParams();
//   const [property, setProperty] = useState(null);
//   const [metadata, setMetadata] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedImage, setSelectedImage] = useState(0);

//   useEffect(() => {
//     fetchPropertyDetails();
//   }, [propertyId]);

//   const fetchPropertyDetails = async () => {
//     try {
//       const response = await fetch(`${BACKEND_URL}/assets/${propertyId}`);
//       if (!response.ok) throw new Error('Failed to fetch property');
      
//       const propertyData = await response.json();
//       setProperty(propertyData);

//       const metadataResponse = await fetch(propertyData.ipfsMetadataUrl);
//       if (!metadataResponse.ok) throw new Error('Failed to fetch metadata');
      
//       const metadataData = await metadataResponse.json();
//       setMetadata(metadataData);
//     } catch (error) {
//       console.error('Error fetching property details:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#121317] flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block w-12 h-12 border-4 border-[#2C2C2C] border-t-[#CAAB5B] rounded-full animate-spin"></div>
//           <p className="mt-4 text-[#6D6041]">Loading property details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!property || !metadata) {
//     return (
//       <div className="min-h-screen bg-[#121317] flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-xl text-[#6D6041]">Property not found</p>
//           <a href="/" className="mt-4 inline-block text-[#CAAB5B] hover:underline">
//             Back to Home
//           </a>
//         </div>
//       </div>
//     );
//   }

//   const images = metadata.media?.images || [];
//   const documents = metadata.media?.documents || [];

//   return (
//     <div className="min-h-screen bg-[#121317]">
//       {/* Header */}
//       <div className="bg-[#111216] border-b border-[#2C2C2C] px-6 py-4">
//         <div className="max-w-7xl mx-auto">
//           <a href="/" className="inline-flex items-center gap-2 text-[#6D6041] hover:text-[#CAAB5B] transition-colors">
//             <ArrowLeft className="w-5 h-5" />
//             Back to Properties
//           </a>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-12">
//         <div className="grid lg:grid-cols-2 gap-12">
//           {/* Left Column - Images */}
//           <div className="space-y-4">
//             {/* Main Image */}
//             <div className="bg-[#111216] rounded-xl overflow-hidden border border-[#2C2C2C] h-96">
//               {images.length > 0 ? (
//                 <img
//                   src={images[selectedImage]?.url}
//                   alt={`Property image ${selectedImage + 1}`}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-full flex items-center justify-center">
//                   <ImageIcon className="w-20 h-20 text-[#2C2C2C]" />
//                 </div>
//               )}
//             </div>

//             {/* Thumbnail Gallery */}
//             {images.length > 1 && (
//               <div className="grid grid-cols-4 gap-4">
//                 {images.map((image, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setSelectedImage(index)}
//                     className={`bg-[#111216] rounded-lg overflow-hidden border-2 transition-all ${
//                       selectedImage === index ? 'border-[#CAAB5B]' : 'border-[#2C2C2C] hover:border-[#6D6041]'
//                     }`}
//                   >
//                     <img
//                       src={image.url}
//                       alt={`Thumbnail ${index + 1}`}
//                       className="w-full h-20 object-cover"
//                     />
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Right Column - Details */}
//           <div className="space-y-8">
//             {/* Property Header */}
//             <div>
//               <h1 className="text-4xl font-bold text-[#E1E2E2] mb-4">
//                 {metadata.propertyDetails?.title || 'Untitled Property'}
//               </h1>
//               <div className="flex items-center gap-2 text-[#6D6041] text-lg">
//                 <MapPin className="w-5 h-5" />
//                 {metadata.propertyDetails?.location || 'Location not specified'}
//               </div>
//             </div>

//             {/* Property Type */}
//             <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6">
//               <p className="text-sm text-[#6D6041] mb-2">Property Type</p>
//               <p className="text-xl font-semibold text-[#E1E2E2]">
//                 {metadata.propertyDetails?.type || 'N/A'}
//               </p>
//             </div>

//             {/* Financial Details */}
//             <div className="bg-[#111216] border border-[#2C2C2C] rounded-xl p-6 space-y-4">
//               <h3 className="text-xl font-semibold text-[#E1E2E2] mb-4">Financial Details</h3>
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-[#6D6041] mb-1">Purchase Price</p>
//                   <p className="text-lg font-semibold text-[#E1E2E2]">
//                     ${metadata.financialDetails?.purchasePrice ? Number(metadata.financialDetails.purchasePrice).toLocaleString() : 'N/A'}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-[#6D6041] mb-1">Tokenization Value</p>
//                   <p className="text-lg font-semibold text-[#CAAB5B]">
//                     ${metadata.financialDetails?.tokenizationValue ? Number(metadata.financialDetails.tokenizationValue).toLocaleString() : 'N/A'}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-[#6D6041] mb-1">Monthly Revenue</p>
//                   <p className="text-lg font-semibold text-[#E1E2E2]">
//                     ${metadata.financialDetails?.monthlyRevenue ? Number(metadata.financialDetails.monthlyRevenue).toLocaleString() : 'N/A'}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-[#6D6041] mb-1">Monthly Expenses</p>
//                   <p className="text-lg font-semibold text-[#E1E2E2]">
//                     ${metadata.financialDetails?.monthlyExpenses ? Number(metadata.financialDetails.monthlyExpenses).toLocaleString() : 'N/A'}
//                   </p>
//                 </div>
//               </div>

//               {metadata.financialDetails?.monthlyRevenue && metadata.financialDetails?.monthlyExpenses && (
//                 <div className="pt-4 border-t border-[#2C2C2C]">
//                   <p className="text-sm text-[#6D6041] mb-1">Net Monthly Income</p>
//                   <p className="text-2xl font-bold text-[#CAAB5B]">
//                     ${(Number(metadata.financialDetails.monthlyRevenue) - Number(metadata.financialDetails.monthlyExpenses)).toLocaleString()}
//                   </p>
//                 </div>
//               )}
//             </div>

//             {/* Invest Button */}
//             <button className="w-full py-4 bg-[#CAAB5B] text-[#121317] rounded-lg font-semibold text-lg hover:bg-[#b89a4f] transition-colors">
//               Invest in This Property
//             </button>
//           </div>
//         </div>

//         {/* Description Section */}
//         <div className="mt-12 bg-[#111216] border border-[#2C2C2C] rounded-xl p-8">
//           <h2 className="text-2xl font-bold text-[#E1E2E2] mb-4">Description</h2>
//           <p className="text-[#6D6041] leading-relaxed text-lg">
//             {metadata.propertyDetails?.description || 'No description available.'}
//           </p>
//         </div>

//         {/* Owner Information */}
//         <div className="mt-12 bg-[#111216] border border-[#2C2C2C] rounded-xl p-8">
//           <h2 className="text-2xl font-bold text-[#E1E2E2] mb-6">Owner Information</h2>
//           <div className="grid md:grid-cols-3 gap-6">
//             <div className="flex items-start gap-3">
//               <div className="w-10 h-10 bg-[#CAAB5B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
//                 <User className="w-5 h-5 text-[#CAAB5B]" />
//               </div>
//               <div>
//                 <p className="text-sm text-[#6D6041] mb-1">Full Name</p>
//                 <p className="text-[#E1E2E2] font-medium">
//                   {metadata.ownerInformation?.fullName || 'N/A'}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-start gap-3">
//               <div className="w-10 h-10 bg-[#CAAB5B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
//                 <Mail className="w-5 h-5 text-[#CAAB5B]" />
//               </div>
//               <div>
//                 <p className="text-sm text-[#6D6041] mb-1">Email</p>
//                 <p className="text-[#E1E2E2] font-medium">
//                   {metadata.ownerInformation?.email || 'N/A'}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-start gap-3">
//               <div className="w-10 h-10 bg-[#CAAB5B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
//                 <Phone className="w-5 h-5 text-[#CAAB5B]" />
//               </div>
//               <div>
//                 <p className="text-sm text-[#6D6041] mb-1">Phone</p>
//                 <p className="text-[#E1E2E2] font-medium">
//                   {metadata.ownerInformation?.phone || 'N/A'}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Documents Section */}
//         {documents.length > 0 && (
//           <div className="mt-12 bg-[#111216] border border-[#2C2C2C] rounded-xl p-8">
//             <h2 className="text-2xl font-bold text-[#E1E2E2] mb-6">Property Documents</h2>
//             <div className="grid md:grid-cols-2 gap-4">
//               {documents.map((doc, index) => (
//                 <a
//                   key={index}
//                   href={doc.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center gap-4 bg-[#121317] border border-[#2C2C2C] rounded-lg p-4 hover:border-[#CAAB5B] transition-colors group"
//                 >
//                   <div className="w-12 h-12 bg-[#CAAB5B]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#CAAB5B]/20 transition-colors">
//                     <FileText className="w-6 h-6 text-[#CAAB5B]" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-[#E1E2E2] font-medium truncate">
//                       {doc.name}
//                     </p>
//                     <p className="text-sm text-[#6D6041]">Click to view</p>
//                   </div>
//                 </a>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Additional Images Gallery */}
//         {images.length > 0 && (
//           <div className="mt-12 bg-[#111216] border border-[#2C2C2C] rounded-xl p-8">
//             <h2 className="text-2xl font-bold text-[#E1E2E2] mb-6">All Images</h2>
//             <div className="grid md:grid-cols-3 gap-4">
//               {images.map((image, index) => (
//                 <a
//                   key={index}
//                   href={image.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="group relative aspect-video bg-[#121317] rounded-lg overflow-hidden border border-[#2C2C2C] hover:border-[#CAAB5B] transition-colors"
//                 >
//                   <img
//                     src={image.url}
//                     alt={image.name}
//                     className="w-full h-full object-cover"
//                   />
//                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
//                     <p className="text-[#E1E2E2] font-medium">View Full Size</p>
//                   </div>
//                 </a>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Metadata Info */}
//         <div className="mt-12 bg-[#111216] border border-[#2C2C2C] rounded-xl p-8">
//           <h2 className="text-2xl font-bold text-[#E1E2E2] mb-6">Blockchain Information</h2>
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-[#6D6041] mb-2">IPFS Metadata URL</p>
//               <a
//                 href={property.ipfsMetadataUrl}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-[#CAAB5B] hover:underline break-all font-mono text-sm"
//               >
//                 {property.ipfsMetadataUrl}
//               </a>
//             </div>
//             {metadata.timestamp && (
//               <div>
//                 <p className="text-sm text-[#6D6041] mb-2">Uploaded On</p>
//                 <p className="text-[#E1E2E2]">
//                   {new Date(metadata.timestamp).toLocaleDateString('en-US', {
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit'
//                   })}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }