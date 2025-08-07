import { CategoryId } from '@/type';
export const mockCategories = [
  {
    id: "haircut",
    name: "Hair & Beauty",
    description: "Cuts, styling & treatments",
    icon: "✂️",
    image:"/images/barber.jpg",
    services: 0, 
    gradient: "from-pink-500 to-rose-500",
    avgWait: "12 min", // 👈 ADD THIS
    popular: true,    // 👈 ADD THIS
  },
  {
     id: 'spa-wellness',
    name: 'Spa & Wellness',
    description: "Massage & relaxation",
    icon: "🧘‍♀️",
    image:"/images/spa.jpg",
    services: 0,
    gradient: "from-teal-400 to-cyan-500",
    avgWait: "25 min", // 👈 ADD THIS
    trending: true,   // 👈 ADD THIS
  },
  {
     id: 'health',
    name: 'Health',
    description: "Medical appointments",
    icon: "🏥",
    image: "/images/health.jpg",
    services: 0,
    gradient: "from-blue-500 to-indigo-500",
    avgWait: "18 min", // 👈 ADD THIS
  },
  {
   id: 'fitness',
    name: 'Fitness',
    description: "Training & classes",
    icon: "💪",
    image:"/images/fintnees.jpeg",
    services: 0,
    gradient: "from-orange-500 to-amber-500",
    avgWait: "8 min",  // 👈 ADD THIS
  },
  {
    id: "automotive",
    name: "Auto Services",
    description: "Car care & repair",
    icon: "🚗",
    image:"/images/auto.png",
    services: 0,
    gradient: "from-slate-600 to-gray-700",
    avgWait: "35 min", // 👈 ADD THIS
  },
  {
    id: "food",
    name: "Restaurants",
    description: "Dining & takeout",
    icon: "🍽️",
    image:"/images/food.jpg",
    services: 0,
    gradient: "from-red-500 to-red-600",
    avgWait: "15 min", // 👈 ADD THIS
  },
   {
    id: 'pet-services',
    name: 'Pet Services',
    description: "Grooming & care",
    icon: "🐶",
    image:"/images/pet.jpg",
    services: 0,
    gradient: "from-lime-500 to-green-500",
    avgWait: "15 min", // 👈 ADD THIS
  },
];

// ... rest of your firebase-utils.ts file ...