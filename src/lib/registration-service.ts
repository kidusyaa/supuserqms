// import { 
//   createCompany, 
//   createService, 
//   createProviderForService, 
//   getCategories 
// } from './firebase-utils';
// import type { Company, Service, Provider } from '../type';

// export interface CompanyRegistrationData {
//   companyName: string;
//   phoneNumber: string;
//   email: string;
//   ownerName: string;
//   password: string;
//   locationname: string;
//   locationlink: string;
//   description: string;
//   workingHours: {
//     start: string;
//     end: string;
//     days: string;
//   };
//   socials: {
//     facebook: string;
//     instagram: string;
//     twitter: string;
//     website: string;
//   };
//   logo?: File | null;
//   license?: File | null;
// }

// export interface ServiceRegistrationData {
//   serviceName: string;
//   categoryId: string; // Changed from serviceType to categoryId
//   description: string;
//   cost: string;
//   offers: string;
//   estimatedTime: string;
//   serviceProviders: Array<{ name: string; specialization: string }>;
//   photos: File[];
// }

// export class RegistrationService {
//   static async registerCompany(data: CompanyRegistrationData, ownerUid: string): Promise<string> {
//     try {
//       // Format working hours
//       const workingHours = `${data.workingHours.start} - ${data.workingHours.end}, ${data.workingHours.days}`;
      
//       // Filter out empty social media links
//       const socials = Object.fromEntries(
//         Object.entries(data.socials).filter(([_, value]) => value.trim() !== '')
//       );
      
//       // Create company data
//       const companyData: Omit<Company, 'id'> = {
//         name: data.companyName,
//         phone: data.phoneNumber,
//         email: data.email,
//         address: data.description,
//         workingHours: workingHours,
//         location: data.locationname,
//         ownerUid: ownerUid,
//         password: data.password, // Store password for authentication
//         socials: socials
//       };

//       // Create company in Firebase
//       const companyId = await createCompany(companyData);
      
//       console.log('✅ Company registered successfully:', companyId);
//       return companyId;
//     } catch (error) {
//       console.error('❌ Error registering company:', error);
//       throw new Error('Failed to register company');
//     }
//   }

//   static async registerService(
//     companyId: string, 
//     data: ServiceRegistrationData
//   ): Promise<{ serviceId: string; providerIds: string[] }> {
//     try {
//       console.log('🚀 Starting service registration for company:', companyId);
//       console.log('📋 Service data:', data);
      
//       // Generate service code
//       const serviceCode = this.generateServiceCode(data.serviceName);
//       console.log('🔢 Generated service code:', serviceCode);
      
//       // Create service data
//       const serviceData: Omit<Service, 'id' | 'companyId'> = {
//         name: data.serviceName,
//         categoryId: data.categoryId,
//         description: data.description,
//         estimatedWaitTime: parseInt(data.estimatedTime) || 30,
//         status: 'active',
//         code: serviceCode,
//         price: data.cost,
//         featureEnabled: true,
//         providers: [], // Will be populated after creating providers
//         createdAt: new Date()
//       };

//       console.log('📝 Service data to create:', serviceData);

//       // Create service in Firebase
//       console.log('🔥 Creating service in Firebase...');
//       const serviceId = await createService(companyId, serviceData);
//       console.log('✅ Service created with ID:', serviceId);
      
//       // Create providers for this service
//       const providerIds: string[] = [];
//       console.log('👥 Creating providers...');
//       for (const providerData of data.serviceProviders) {
//         const provider: Omit<Provider, 'id'> = {
//           name: providerData.name,
//           serviceId: serviceId, // Associate provider with the service
//           specialization: providerData.specialization,
//           isActive: true,
//           createdAt: new Date(),
//           rating: 0,
//           completedServices: 0,
//           averageServiceTime: parseInt(data.estimatedTime) || 30
//         };
        
//         console.log('👤 Creating provider:', provider);
//         const providerId = await createProviderForService(companyId, serviceId, provider);
//         providerIds.push(providerId);
//         console.log('✅ Provider created with ID:', providerId);
//       }

//       console.log('✅ Service registration completed successfully:', { serviceId, providerIds });
//       return { serviceId, providerIds };
//     } catch (error) {
//       console.error('❌ Error registering service:', error);
//       console.error('❌ Error details:', {
//         message: error instanceof Error ? error.message : 'Unknown error',
//         stack: error instanceof Error ? error.stack : undefined
//       });
//       throw new Error('Failed to register service');
//     }
//   }

//   static async getCategoriesForRegistration(): Promise<any[]> {
//     try {
//       const categories = await getCategories();
//       return categories;
//     } catch (error) {
//       console.error('❌ Error fetching categories:', error);
//       return [];
//     }
//   }

//   private static generateServiceCode(serviceName: string): string {
//     // Generate a unique service code based on service name
//     const prefix = serviceName.substring(0, 3).toUpperCase();
//     const timestamp = Date.now().toString().slice(-4);
//     return `${prefix}${timestamp}`;
//   }

//   static async uploadFile(file: File, path: string): Promise<string> {
//     // This would integrate with Firebase Storage
//     // For now, return a placeholder URL
//     return `https://example.com/uploads/${path}/${file.name}`;
//   }
// } 