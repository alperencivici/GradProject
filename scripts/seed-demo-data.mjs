import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { id: "00000000-0000-0000-0000-000000000001", email: "admin@kirsof.com", password: "Password123!", role: "admin", full_name: "Kirsof Admin", phone: "+905001234567", address: "Ankara, Cankaya, Kizilay, Mesrutiyet, Street: Ataturk Bulvari, Building No: 18, Apartment/Door No: 2", lat: 39.9208, lng: 32.8541 },
  { id: "00000000-0000-0000-0000-000000000002", email: "farmer@kirsof.com", password: "Password123!", role: "farmer", full_name: "Ali Ciftci", phone: "+905301111111", address: "Izmir, Kemalpasa, Merkez, Ataturk, Street: Zeytin Sokak, Building No: 7, Apartment/Door No: 1", lat: 38.4262, lng: 27.4173 },
  { id: "00000000-0000-0000-0000-000000000004", email: "ayse.farm@kirsof.com", password: "Password123!", role: "farmer", full_name: "Ayse Yilmaz", phone: "+905302222222", address: "Istanbul, Kadikoy, Moda, Caferaga, Street: Bahariye Cd., Building No: 42, Apartment/Door No: 5", lat: 40.9869, lng: 29.0272 },
  { id: "00000000-0000-0000-0000-000000000005", email: "mehmet.farm@kirsof.com", password: "Password123!", role: "farmer", full_name: "Mehmet Kaya", phone: "+905303333333", address: "Ankara, Cankaya, Bahcelievler, Emek, Street: 8. Cadde, Building No: 21, Apartment/Door No: 1", lat: 39.9215, lng: 32.8088 },
  { id: "00000000-0000-0000-0000-000000000006", email: "zeynep.farm@kirsof.com", password: "Password123!", role: "farmer", full_name: "Zeynep Demir", phone: "+905304444444", address: "Antalya, Muratpasa, Lara, Guzeloba, Street: Portakal Cicegi, Building No: 10, Apartment/Door No: 1", lat: 36.8555, lng: 30.7816 },
  { id: "00000000-0000-0000-0000-000000000007", email: "hasan.farm@kirsof.com", password: "Password123!", role: "farmer", full_name: "Hasan Aydin", phone: "+905305555555", address: "Bursa, Nilufer, Gorukle, Dumlupinar, Street: Hasat Yolu, Building No: 3, Apartment/Door No: 1", lat: 40.2264, lng: 28.8406 },
  { id: "00000000-0000-0000-0000-000000000003", email: "consumer@kirsof.com", password: "Password123!", role: "consumer", full_name: "Ayse Tuketici", phone: "+905009876543", address: "Istanbul, Kadikoy, Moda, Caferaga, Street: Moda Cd., Building No: 15, Apartment/Door No: 8", lat: 40.9877, lng: 29.0253 },
  { id: "00000000-0000-0000-0000-000000000008", email: "mert.consumer@kirsof.com", password: "Password123!", role: "consumer", full_name: "Mert Arslan", phone: "+905006661212", address: "Ankara, Cankaya, Kizilay, Mesrutiyet, Street: Mesrutiyet Cd., Building No: 22, Apartment/Door No: 12", lat: 39.9206, lng: 32.8573 },
  { id: "00000000-0000-0000-0000-000000000009", email: "elif.consumer@kirsof.com", password: "Password123!", role: "consumer", full_name: "Elif Sahin", phone: "+905007771313", address: "Izmir, Konak, Alsancak, Kultur, Street: Kibris Sehitleri, Building No: 61, Apartment/Door No: 4", lat: 38.4381, lng: 27.1441 },
];

const farmers = users.filter(user => user.role === "farmer");
const consumers = users.filter(user => user.role === "consumer");

const productTemplates = [
  ["Organic Tomatoes", "Vine-ripened tomatoes harvested early this morning.", 38, 140, "vegetables", "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?auto=format&fit=crop&q=80&w=900"],
  ["Crisp Cucumbers", "Crunchy greenhouse cucumbers for salads and pickles.", 24, 110, "vegetables", "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&q=80&w=900"],
  ["Village Eggs", "Free-range eggs from hens fed with local grains.", 92, 75, "eggs", "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&q=80&w=900"],
  ["Raw Flower Honey", "Unheated honey with a bright wildflower aroma.", 210, 38, "honey", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=900"],
  ["Cold-Pressed Olive Oil", "Extra virgin olive oil pressed within hours of harvest.", 285, 42, "oils", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=900"],
  ["Amasya Apples", "Sweet, crisp apples from pesticide-free orchards.", 46, 180, "fruits", "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=900"],
  ["Village Butter", "Small-batch butter churned from fresh cow milk.", 155, 30, "dairy", "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=900"],
  ["Stone-Ground Bulgur", "Durum wheat bulgur for pilav, kisir, and kofte.", 52, 130, "grains", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=900"],
  ["Fresh Strawberries", "Sweet strawberries picked at peak ripeness.", 68, 95, "fruits", "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=900"],
  ["Goat Cheese", "Creamy village goat cheese aged in brine.", 175, 26, "dairy", "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&q=80&w=900"],
];

function assertOk(error, label) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

console.log("Clearing public demo data...");
for (const table of ["reviews", "order_items", "orders", "products", "profiles"]) {
  const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  assertOk(error, `clear ${table}`);
}

console.log("Recreating demo users...");
for (const user of users) {
  await supabase.auth.admin.deleteUser(user.id).catch(() => {});
  const { error } = await supabase.auth.admin.createUser({
    id: user.id,
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      location_lat: String(user.lat),
      location_lng: String(user.lng),
    },
  });
  assertOk(error, `create ${user.email}`);
}

const { error: profileError } = await supabase.from("profiles").upsert(users.map(user => ({
  id: user.id,
  full_name: user.full_name,
  role: user.role,
  phone: user.phone,
  address: user.address,
  location_lat: user.lat,
  location_lng: user.lng,
})));
assertOk(profileError, "profiles");

console.log("Creating products...");
const products = farmers.flatMap((farmer, farmerIndex) =>
  productTemplates.slice(farmerIndex, farmerIndex + 6).map((product, productIndex) => ({
    farmer_id: farmer.id,
    name: product[0],
    description: product[1],
    price: product[2] + farmerIndex * 3,
    stock_quantity: product[3] - productIndex * 4,
    category: product[4],
    image_url: product[5],
  }))
);

const { data: insertedProducts, error: productsError } = await supabase.from("products").insert(products).select();
assertOk(productsError, "products");

console.log("Creating orders and reviews...");
const ordersToInsert = [
  { buyer_id: consumers[0].id, status: "completed", delivery_method: "courier", shipping_fee: 25 },
  { buyer_id: consumers[0].id, status: "shipped", delivery_method: "cargo", shipping_fee: 32 },
  { buyer_id: consumers[1].id, status: "paid", delivery_method: "pickup", shipping_fee: 0 },
  { buyer_id: consumers[2].id, status: "return_requested", delivery_method: "courier", shipping_fee: 25, return_reason: "quality: cucumbers arrived softer than expected" },
];

for (let orderIndex = 0; orderIndex < ordersToInsert.length; orderIndex += 1) {
  const orderProducts = insertedProducts.slice(orderIndex * 3, orderIndex * 3 + 3);
  const subtotal = orderProducts.reduce((sum, product, index) => sum + Number(product.price) * (index + 1), 0);
  const orderPayload = ordersToInsert[orderIndex];
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    ...orderPayload,
    total_amount: subtotal + orderPayload.shipping_fee,
    withholding_tax: subtotal * 0.04,
  }).select().single();
  assertOk(orderError, "order");

  const { error: itemError } = await supabase.from("order_items").insert(orderProducts.map((product, index) => ({
    order_id: order.id,
    product_id: product.id,
    farmer_id: product.farmer_id,
    quantity: index + 1,
    unit_price: product.price,
  })));
  assertOk(itemError, "order items");
}

const reviews = insertedProducts.slice(0, 14).map((product, index) => ({
  reviewer_id: consumers[index % consumers.length].id,
  product_id: product.id,
  farmer_id: product.farmer_id,
  rating: [5, 5, 4, 5, 4, 5, 3][index % 7],
  comment: [
    "Very fresh and packed carefully.",
    "Great taste, I will order again.",
    "Good quality and fair price.",
    "Arrived quickly and looked beautiful.",
    "Exactly like the product description.",
    "The farmer answered my questions fast.",
    "Nice product, packaging could improve a little.",
  ][index % 7],
}));

const { error: reviewError } = await supabase.from("reviews").insert(reviews);
assertOk(reviewError, "reviews");

console.log(`Seeded ${users.length} users, ${insertedProducts.length} products, ${ordersToInsert.length} orders, and ${reviews.length} reviews.`);
