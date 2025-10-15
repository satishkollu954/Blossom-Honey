import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Variant {
    _id: string;
    weight: string;
    price: number;
    finalPrice: number;
    discount: number;
    images: string[];
}

interface Product {
    _id: string;
    name: string;
    description: string;
    category: string;
    variants: Variant[];
    images: string[];
    deliveryTime: string;
    shippingCharge: number;
}

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [imageIndex, setImageIndex] = useState(0);


    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:3005/api/products/product/${id}`);
                setProduct(res.data);
                setSelectedVariant(res.data.variants?.[0]);
            } catch (err) {
                console.error("Failed to fetch product", err);
            }
        };

        fetchProduct();
    }, [id]);

    if (!product || !selectedVariant) {
        return <div className="text-center py-12 text-yellow-600">Loading...</div>;
    }

    const allImages = [...(product.images || []), ...(selectedVariant.images || [])];
    const currentImage = allImages[imageIndex] || "https://via.placeholder.com/500x500?text=No+Image";

    const nextImage = () => {
        setImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = () => {
        setImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };




    return (
        <div className="container mx-auto px-6 py-10 flex flex-col lg:flex-row gap-10">
            {/* LEFT: Image carousel */}
            <div className="lg:w-1/2 flex flex-col items-center relative">
                <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-[400px] object-contain rounded-lg shadow-md bg-white"
                />
                <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-yellow-50"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-yellow-50"
                >
                    <ChevronRight size={24} />
                </button>
                <div className="flex gap-2 mt-4">
                    {allImages.map((img, i) => (
                        <img
                            key={i}
                            src={img}
                            alt=""
                            onClick={() => setImageIndex(i)}
                            className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${i === imageIndex ? "border-yellow-500" : "border-transparent"}`}
                        />
                    ))}
                </div>
            </div>

            {/* RIGHT: Product Info */}
            <div className="lg:w-1/2 flex flex-col justify-center">
                <h1 className="text-3xl font-semibold mb-3 text-gray-800">{product.name}</h1>
                <p className="text-gray-600 mb-4">{product.description}</p>

                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold text-yellow-600">
                        ₹{selectedVariant.finalPrice}
                    </span>
                    {selectedVariant.discount > 0 && (
                        <span className="text-gray-400 line-through">
                            ₹{selectedVariant.price}
                        </span>
                    )}
                </div>

                {/* Weight Selector */}
                <div className="mb-6">
                    <p className="text-gray-700 mb-2">Select Weight:</p>
                    <div className="flex gap-3">
                        {product.variants.map((v) => (
                            <button
                                key={v._id}
                                onClick={() => setSelectedVariant(v)}
                                className={`px-4 py-2 border rounded-md ${selectedVariant._id === v._id
                                    ? "bg-yellow-500 text-white border-yellow-500"
                                    : "border-gray-300 hover:border-yellow-400"
                                    }`}
                            >
                                {v.weight}
                            </button>
                        ))}
                    </div>
                </div>

                <button className="bg-yellow-500 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-yellow-600 transition">
                    Add to Cart
                </button>

                <div className="mt-6 text-sm text-gray-500">
                    <p>Delivery Time: {product.deliveryTime}</p>
                    <p>Shipping Charge: ₹{product.shippingCharge}</p>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
