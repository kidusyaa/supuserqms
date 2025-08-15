// // components/booking/ServiceDetailView.tsx
// "use client";

// import { Service, Company } from "@/type";
// import { Button } from "@/components/ui/button";
// import { Clock, DollarSign, Building, Tag, Globe, Instagram, Facebook } from 'lucide-react';
// import Image from 'next/image';

// interface ServiceDetailViewProps {
//   service: Service;
//   company?: Company;
//   onJoinQueue: () => void;
// }

// // A small component for social links to keep the main component cleaner
// const SocialLink = ({ href, icon }: { href?: string; icon: React.ReactNode }) => {
//   if (!href) return null;
//   return (
//     <a href={href} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-800 transition-colors">
//       {icon}
//     </a>
//   );
// };

// export default function ServiceDetailView({ service, company, onJoinQueue }: ServiceDetailViewProps) {
//   return (
//     <div className="flex flex-col">
//       {/* --- HEADER SECTION with Hero Image and Logo --- */}
//       <div className="relative">
//         {/* Hero Image */}
//         <div className="relative w-full h-40 bg-slate-200">
//           {company?.logo && (
//             <Image
//               src={company.logo}
//               alt={company.name}
//               layout="fill"
//               objectFit="cover"
//             />
//           )}
//           <div className="absolute inset-0 bg-black/20"></div> {/* Dark overlay */}
//         </div>

//         {/* Company Logo (Overlaid) */}
//         {company?.logo && (
//           <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
//             <Image
//               src={company.logo}
//               alt={`${company.name} logo`}
//               layout="fill"
//               objectFit="contain"
//             />
//           </div>
//         )}
//       </div>

//       {/* --- CONTENT SECTION --- */}
//       <div className="p-6 pt-14"> {/* pt-14 gives space for the overlaid logo */}
//         <div className="flex justify-between items-start">
//             {/* Service & Company Name */}
//             <div>
//                 <h3 className="text-2xl font-bold text-slate-900">{service.name}</h3>
//                 {company && (
//                     <p className="text-slate-500 font-medium">{company.name}</p>
//                 )}
//             </div>
//             {/* Social Icons */}
//             {company?.socials && (
//                 <div className="flex items-center gap-3 mt-1">
//                     <SocialLink href={company.socials.website} icon={<Globe size={20}/>} />
//                     <SocialLink href={company.socials.instagram} icon={<Instagram size={20}/>} />
//                     <SocialLink href={company.socials.facebook} icon={<Facebook size={20}/>} />
//                 </div>
//             )}
//         </div>
        
//         {/* Service Description */}
//         <p className="mt-4 text-slate-600">{service.description}</p>
        
//         {/* Key Details Box */}
//         <div className="mt-6 grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-md border">
//             <div className="flex items-center gap-2">
//                 <Clock className="w-5 h-5 text-indigo-500" />
//                 <div>
//                     <div className="text-slate-500">Avg. Wait</div>
//                     <div className="font-semibold">{service.estimatedWaitTime} min</div>
//                 </div>
//             </div>
//             <div className="flex items-center gap-2">
//                 <DollarSign className="w-5 h-5 text-green-500" />
//                 <div>
//                     <div className="text-slate-500">Price</div>
//                     <div className="font-semibold">{service.price}</div>
//                 </div>
//             </div>
//         </div>
//       </div>
      
//       {/* Action Button */}
//       <div className="px-6 pb-6 mt-2">
//         <Button onClick={onJoinQueue} className="w-full text-lg py-6">
//           Join Queue
//         </Button>
//       </div>
//     </div>
//   );
// }