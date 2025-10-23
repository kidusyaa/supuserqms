// scripts/generate-slugs.js
const { createClient } = require('@supabase/supabase-js');

// Add your Supabase URL and anon key (or service_role key for server-side operations)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function generateSlug(name) {
    // ... (copy the same function from Step 1 here) ...
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return name.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(p, c => b.charAt(a.indexOf(c)))
        .replace(/&/g, '-and-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}


async function updateCompanySlugs() {
  console.log('Fetching companies without a slug...');
  // Select all companies where the slug is null
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name')
    .is('slug', null);

  if (error) {
    console.error('Error fetching companies:', error);
    return;
  }

  if (!companies || companies.length === 0) {
    console.log('All companies already have slugs. Nothing to do.');
    return;
  }

  console.log(`Found ${companies.length} companies to update.`);

  for (const company of companies) {
    const slug = generateSlug(company.name);
    console.log(`Updating company "${company.name}" (ID: ${company.id}) with slug: "${slug}"`);
    
    // To handle potential duplicate slugs, you could add a check here, but the UNIQUE constraint will also prevent it.
    // For simplicity, we rely on the DB constraint. In a real-world scenario, you might append a random string if a slug exists.

    const { error: updateError } = await supabase
      .from('companies')
      .update({ slug: slug })
      .eq('id', company.id);

    if (updateError) {
      console.error(`Failed to update slug for company ${company.id}:`, updateError.message);
    }
  }

  console.log('Finished updating slugs.');
}

updateCompanySlugs();