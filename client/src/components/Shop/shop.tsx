import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";

// 1. Product Interface (matches your backend data)
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

// 2. Individual Card Component
const ShopCard: React.FC<{ product: Product }> = ({ product }) => {
    const firstVariant = product.variants?.[0];
    const image =
        product.images?.[0] ||
        firstVariant?.images?.[0] ||
        "https://via.placeholder.com/300x300?text=No+Image";

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col items-center p-4 border border-gray-100 hover:shadow-md transition-shadow duration-300">
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
                    Add to Cart
                </button>
            </div>
        </div>
    );
};

// 3. Main Shop Component
const Shop: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [cookies] = useCookies(["token"])

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get("http://localhost:3005/api/products/", {
                    headers: { Authorization: `Bearer ${cookies.token}` },
                }); // adjust base URL if needed
                setProducts(res.data.products || []);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError("Failed to load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto p-8 text-center text-gray-500">
                Loading products...
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-8 text-center text-red-500">
                {error}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="container mx-auto p-8 text-center text-gray-500">
                No products found.
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Our Honey Products
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ShopCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    );
};

export { Shop };
