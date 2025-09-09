import { generateSlug } from '@/lib/utils';
// ... inside your form submission handler
import {supabase} from './supabaseClient'; // Adjust the path as necessary
const companyName = "My New Awesome Company";
const companySlug = generateSlug(companyName);

const { data, error } = await supabase
  .from('companies')
  .insert([
    { 
      name: companyName, 
      slug: companySlug, // <-- Save the generated slug
      // ... other company data
    }
  ]);