"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [farmer, setFarmer] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const supabase = createClient();
  const { addItem } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data: prod } = await supabase
      .from("products")
      .select("*, profiles!products_farmer_id_fkey(*)")
      .eq("id", id)
      .single();

    if (prod) {
      setProduct(prod);
      setFarmer(prod.profiles);

      const { data: revs } = await supabase
        .from("reviews")
        .select("*, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)")
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      setReviews(revs || []);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image_url: product.image_url || "",
      farmer_id: product.farmer_id,
      farmer_name: farmer?.full_name || "Farmer",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-heading font-bold text-stone-700 mb-2">Product not found</h2>
        <Link href="/explore" className="text-emerald-600 font-medium hover:underline">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 w-full">
      <Link href="/explore" className="text-emerald-600 font-medium hover:underline mb-6 inline-block">
        &larr; Back to Market
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="relative rounded-3xl overflow-hidden bg-stone-100 aspect-square shadow-xl">
          {product.image_url ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${product.image_url})` }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🥬</div>
          )}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {product.category && (
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-2">
              {product.category}
            </span>
          )}
          <h1 className="text-4xl font-heading font-extrabold text-stone-900 mb-4">{product.name}</h1>

          {avgRating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-lg ${star <= Math.round(Number(avgRating)) ? "text-amber-400" : "text-stone-300"}`}>★</span>
                ))}
              </div>
              <span className="text-stone-600 font-medium">{avgRating}</span>
              <span className="text-stone-400">({reviews.length} reviews)</span>
            </div>
          )}

          <p className="text-stone-600 text-lg leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-end gap-2 mb-6">
            <span className="text-5xl font-extrabold text-emerald-600">₺{product.price}</span>
            <span className="text-stone-400 text-lg mb-1">/ kg</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className={`w-3 h-3 rounded-full ${product.stock_quantity > 0 ? "bg-emerald-500" : "bg-red-500"}`}></span>
            <span className="text-stone-600 font-medium">
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
            </span>
          </div>

          {/* Farmer Info */}
          {farmer && (
            <Link href={`/farmers/${farmer.id}`} className="glass rounded-2xl p-4 flex items-center gap-4 mb-8 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                {farmer.full_name?.charAt(0)}
              </div>
              <div>
                <p className="font-heading font-bold text-stone-800">{farmer.full_name}</p>
                <p className="text-sm text-stone-500">{farmer.address || "Local Producer"}</p>
              </div>
              <span className="ml-auto text-emerald-600 font-medium text-sm">View Store →</span>
            </Link>
          )}

          {/* Add to Cart */}
          {product.stock_quantity > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-stone-600 hover:bg-stone-50 transition-colors font-bold text-lg cursor-pointer"
                >
                  −
                </button>
                <span className="px-5 py-3 font-semibold text-stone-800 min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-4 py-3 text-stone-600 hover:bg-stone-50 transition-colors font-bold text-lg cursor-pointer"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all cursor-pointer ${
                  added
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                }`}
              >
                {added ? "✓ Added to Cart!" : "Add to Cart"}
              </button>
            </div>
          )}

          {/* Tax Info */}
          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800">
            <strong>ℹ Tax Info:</strong> A 4% withholding tax (stopaj) will be automatically calculated and recorded at checkout for tax compliance.
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-heading font-bold text-stone-900 mb-8">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-stone-500">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-600">
                      {review.profiles?.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">{review.profiles?.full_name || "User"}</p>
                      <p className="text-xs text-stone-400">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`${star <= review.rating ? "text-amber-400" : "text-stone-300"}`}>★</span>
                    ))}
                  </div>
                </div>
                <p className="text-stone-600">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
