import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  variants: {
    weight: string;
    type: string;
    packaging: string;
    price: number;
    finalPrice: number;
    discount: number;
    stock: number;
    images: string[];
  }[];
  images: string[];
  deliveryTime: string;
  shippingCharge: number;
}

const ShopCard: React.FC<{ product: Product }> = ({ product }) => {
  const navigate = useNavigate();
  const firstVariant = product.variants?.[0];
  const image =
    product.images?.[0] ||
    firstVariant?.images?.[0] ||
    "https://via.placeholder.com/300x300?text=No+Image";

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col items-center p-4 border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      <div className="w-full h-64 flex items-center justify-center mb-4">
        <img
          src={image}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="text-center px-4 pb-4 w-full">
        <h3 className="font-serif text-xl text-gray-800 mb-2 font-normal">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 min-h-[40px]">
          {product.description || "No description available."}
        </p>
        <p className="font-bold text-2xl text-yellow-600 mb-3">
          ₹{firstVariant?.finalPrice ?? 0}
        </p>
        {firstVariant?.discount > 0 && (
          <p className="text-gray-400 text-sm line-through mb-2">
            ₹{firstVariant.price}
          </p>
        )}
        <button className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors w-full">
          View Details
        </button>
      </div>
    </div>
  );
};

const Shop: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cookies] = useCookies(["token"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [itemsPerLoad] = useState(8);
  const [hasMore, setHasMore] = useState(true);

  const categories = ["all", "dry-fruits", "honey", "nuts-seeds", "spices", "other"];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:3005/api/products/", {
          headers: { Authorization: `Bearer ${cookies.token}` },
        });
        setAllProducts(res.data.products || []);
        setDisplayProducts((res.data.products || []).slice(0, itemsPerLoad));
        if ((res.data.products || []).length <= itemsPerLoad) setHasMore(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight * 0.8) {
        loadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [displayProducts, hasMore, selectedCategory, allProducts]);

  const loadMore = () => {
    const filtered = selectedCategory === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === selectedCategory);

    const nextProducts = filtered.slice(displayProducts.length, displayProducts.length + itemsPerLoad);
    setDisplayProducts([...displayProducts, ...nextProducts]);
    if (displayProducts.length + nextProducts.length >= filtered.length) setHasMore(false);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    const filtered = cat === "all" ? allProducts : allProducts.filter((p) => p.category === cat);
    setDisplayProducts(filtered.slice(0, itemsPerLoad));
    setHasMore(filtered.length > itemsPerLoad);
  };

  if (loading) return <div className="container mx-auto p-8 text-center text-yellow-500">Loading products...</div>;
  if (error) return <div className="container mx-auto p-8 text-center text-red-500">{error}</div>;
 if (displayProducts.length === 0) {
  return (
    <div className="container mx-auto p-8 text-center text-gray-500">
      <p>No products found in this category.</p>
      <button
        onClick={() => handleCategoryChange({ target: { value: "all" } } as any)}
        className="mt-4 bg-yellow-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors"
      >
        Back to All Products
      </button>
    </div>
  );
}

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Our Products
      </h2>

      {/* Category Dropdown */}
 {/* Category Dropdown aligned to the right */}
<div className="flex justify-end mb-6">
  <select
    value={selectedCategory}
    onChange={handleCategoryChange}
    className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
  >
    {categories.map((cat) => (
      <option key={cat} value={cat}>
        {cat === "all" ? "All Categories" : cat.replace("-", " ").toUpperCase()}
      </option>
    ))}
  </select>
</div>


      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayProducts.map((product) => (
          <ShopCard key={product._id} product={product} />
        ))}
      </div>

      {!hasMore && (
        <p className="text-center text-gray-500 mt-6">No more products</p>
      )}
    </div>
  );
};

export { Shop };
