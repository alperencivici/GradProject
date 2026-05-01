const SUPABASE_URL = 'https://wwcnvydqyaccwfsceqxu.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// We need the service_role key for admin user creation.
// For now, we'll use the supabase-js admin client.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  console.log('🌱 Starting seed...\n');

  // 1. Create Admin user
  console.log('Creating Admin...');
  const { data: admin, error: adminErr } = await supabase.auth.admin.createUser({
    email: 'admin@kirsof.com',
    password: 'Admin123!',
    email_confirm: true,
  });
  if (adminErr) console.error('  Admin error:', adminErr.message);
  else console.log('  ✓ Admin created:', admin.user.id);

  // 2. Create Farmer user
  console.log('Creating Farmer...');
  const { data: farmer, error: farmerErr } = await supabase.auth.admin.createUser({
    email: 'farmer@kirsof.com',
    password: 'Farmer123!',
    email_confirm: true,
  });
  if (farmerErr) console.error('  Farmer error:', farmerErr.message);
  else console.log('  ✓ Farmer created:', farmer.user.id);

  // 3. Create Consumer user
  console.log('Creating Consumer...');
  const { data: consumer, error: consumerErr } = await supabase.auth.admin.createUser({
    email: 'user@kirsof.com',
    password: 'User123!',
    email_confirm: true,
  });
  if (consumerErr) console.error('  Consumer error:', consumerErr.message);
  else console.log('  ✓ Consumer created:', consumer.user.id);

  if (!admin?.user || !farmer?.user || !consumer?.user) {
    console.error('\n❌ Could not create all users. Aborting.');
    process.exit(1);
  }

  // 4. Create profiles
  console.log('\nCreating profiles...');
  const { error: profErr } = await supabase.from('profiles').upsert([
    {
      id: admin.user.id,
      full_name: 'Kırsof Admin',
      role: 'admin',
      phone: '+90 312 000 0000',
      address: 'Ankara, Turkey',
      location_lat: 39.9334,
      location_lng: 32.8597,
    },
    {
      id: farmer.user.id,
      full_name: 'Ahmet Çiftçi',
      role: 'farmer',
      phone: '+90 555 123 4567',
      address: 'Polatlı, Ankara',
      location_lat: 39.5842,
      location_lng: 32.1472,
    },
    {
      id: consumer.user.id,
      full_name: 'Ayşe Tüketici',
      role: 'consumer',
      phone: '+90 555 987 6543',
      address: 'Çankaya, Ankara',
      location_lat: 39.9208,
      location_lng: 32.8541,
    },
  ]);
  if (profErr) console.error('  Profiles error:', profErr.message);
  else console.log('  ✓ 3 profiles created');

  // 5. Seed products
  console.log('\nCreating products...');
  const products = [
    { farmer_id: farmer.user.id, name: 'Organic Tomatoes', description: 'Vine-ripened, hand-picked organic tomatoes from our Polatlı greenhouses. No pesticides, no chemicals — just pure sun-grown flavor.', price: 35.00, stock_quantity: 120, category: 'vegetables', image_url: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?auto=format&fit=crop&q=80&w=600' },
    { farmer_id: farmer.user.id, name: 'Fresh Cucumbers', description: 'Crisp, refreshing cucumbers harvested every morning. Perfect for Turkish mezes and summer salads.', price: 25.00, stock_quantity: 80, category: 'vegetables', image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&q=80&w=600' },
    { farmer_id: farmer.user.id, name: 'Mountain Honey', description: 'Pure wildflower honey collected from Taurus Mountain hives at 2000m altitude. Rich, aromatic, and unprocessed.', price: 180.00, stock_quantity: 30, category: 'honey', image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600' },
    { farmer_id: farmer.user.id, name: 'Free-Range Eggs', description: 'Farm-fresh eggs from our free-range chickens. Fed with organic grains only. Pack of 30.', price: 90.00, stock_quantity: 50, category: 'eggs', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&q=80&w=600' },
    { farmer_id: farmer.user.id, name: 'Cold-Pressed Olive Oil', description: 'Premium extra virgin olive oil from century-old Aegean olive trees. First cold press, unfiltered.', price: 250.00, stock_quantity: 25, category: 'oils', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600' },
    { farmer_id: farmer.user.id, name: 'Organic Apples', description: 'Sweet and crunchy Amasya apples, grown without any chemical treatment. Harvested at peak ripeness.', price: 40.00, stock_quantity: 200, category: 'fruits', image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=600' },
    { farmer_id: farmer.user.id, name: 'Village Butter', description: 'Traditional hand-churned butter made from free-range cow milk. Rich, creamy, and all-natural.', price: 150.00, stock_quantity: 15, category: 'dairy', image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=600' },
    { farmer_id: farmer.user.id, name: 'Bulgur Wheat', description: 'Stone-ground durum wheat bulgur from Polatlı fields. A staple of Turkish cuisine — use in pilavs, kısır, and köfte.', price: 45.00, stock_quantity: 100, category: 'grains', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600' },
  ];

  const { data: insertedProducts, error: prodErr } = await supabase.from('products').insert(products).select();
  if (prodErr) console.error('  Products error:', prodErr.message);
  else console.log(`  ✓ ${insertedProducts.length} products created`);

  // 6. Seed reviews
  console.log('\nCreating reviews...');
  if (insertedProducts && insertedProducts.length > 0) {
    const reviewData = [
      { reviewer_id: consumer.user.id, product_id: insertedProducts[0].id, farmer_id: farmer.user.id, rating: 5, comment: 'Absolutely amazing quality! Fresh and delivered on time. Will order again!' },
      { reviewer_id: consumer.user.id, product_id: insertedProducts[2].id, farmer_id: farmer.user.id, rating: 4, comment: 'Great honey! Very rich flavor. Packaging could be a bit better though.' },
      { reviewer_id: consumer.user.id, product_id: insertedProducts[4].id, farmer_id: farmer.user.id, rating: 5, comment: 'Best olive oil I have ever tried. You can really taste the difference from supermarket brands.' },
    ];
    const { error: revErr } = await supabase.from('reviews').insert(reviewData);
    if (revErr) console.error('  Reviews error:', revErr.message);
    else console.log('  ✓ 3 reviews created');
  }

  console.log('\n✅ Seed complete!\n');
  console.log('=== TEST ACCOUNTS ===');
  console.log('Admin:    admin@kirsof.com  / Admin123!');
  console.log('Farmer:   farmer@kirsof.com / Farmer123!');
  console.log('Consumer: user@kirsof.com   / User123!');
  console.log('=====================');
}

seed().catch(console.error);
