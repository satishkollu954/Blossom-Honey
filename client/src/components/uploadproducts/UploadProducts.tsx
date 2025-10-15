import React, { useState } from "react";
import type { ChangeEvent } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useCookies } from "react-cookie";
import "react-toastify/dist/ReactToastify.css";

interface Variant {
    weight: string;
    type: string;
    packaging: string;
    price: number;
    discount: number;
    stock: number;
    images: File[];
    previewImages?: string[];
}

interface Product {
    name: string;
    description: string;
    category: string;
    shippingCharge: number;
    deliveryTime: string;
    tags: string;
    variants: Variant[];
    images: File[];
    imagesPreview?: string[];
}

const UploadProduct: React.FC = () => {
    const [cookies] = useCookies(["token"]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [product, setProduct] = useState<Product>({
        name: "",
        description: "",
        category: "honey",
        shippingCharge: 0,
        deliveryTime: "3-5 business days",
        tags: "",
        variants: [],
        images: [],
        imagesPreview: [],
    });

    const [variant, setVariant] = useState<Variant>({
        weight: "250g",
        type: "",
        packaging: "Jar",
        price: 0,
        discount: 0,
        stock: 0,
        images: [],
        previewImages: [],
    });

    // ===========================
    // Product Images
    // ===========================
    const handleProductImages = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        const previews = files.map((file) => URL.createObjectURL(file));

        setProduct((prev) => ({
            ...prev,
            images: [...prev.images, ...files],
            imagesPreview: [...(prev.imagesPreview || []), ...previews],
        }));
    };

    // ===========================
    // Handle Variant Change
    // ===========================
    const handleVariantChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setVariant((prev) => ({ ...prev, [name]: value }));
    };

    // ===========================
    // Add Variant
    // ===========================
    const addVariant = () => {
        const { weight, type, packaging, price, discount, stock } = variant;

        if (!type || !price || !stock) {
            toast.warning("Please fill all variant fields");
            return;
        }

        if (price <= 0 || discount <= 0 || discount > 100 || stock <= 0) {
            toast.error("Price, Stock, and Discount must be greater than 0, and Discount ≤ 100");
            return;
        }


        // Check for duplicate variant
        const duplicate = product.variants.some(
            (v) => v.weight === weight && v.type.toLowerCase() === type.toLowerCase() && v.packaging === packaging
        );
        if (duplicate) {
            toast.warning("This variant already exists");
            return;
        }

        setProduct((prev) => ({
            ...prev,
            variants: [...prev.variants, { ...variant }],
        }));

        // reset variant
        setVariant({
            weight: "250g",
            type: "",
            packaging: "Jar",
            price: 0,
            discount: 0,
            stock: 0,
            images: [],
            previewImages: [],
        });
    };

    const handleProductChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProduct((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const { name, description, category, images, variants } = product;

        // Validation
        if (!name || !description || images.length === 0 || variants.length === 0) {
            toast.error("Please fill all product fields and add at least one variant");
            return;
        }

        // Check duplicate variant names
        const uniqueVariants = new Set(variants.map((v) => `${v.weight}-${v.type}-${v.packaging}`));
        if (uniqueVariants.size !== variants.length) {
            toast.error("Duplicate variants detected");
            return;
        }


        if (name.toLowerCase() === "blossom honey") {
            toast.error("This product already exists!");
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();

            formData.append("name", name);
            formData.append("description", description);
            formData.append("category", category);
            formData.append("shippingCharge", product.shippingCharge.toString());
            formData.append("deliveryTime", product.deliveryTime);
            formData.append("tags", JSON.stringify(product.tags ? product.tags.split(",") : []));

            product.images.forEach((file) => {
                formData.append("productImages", file);
            });

            const variantsData = product.variants.map(({ images, previewImages, ...rest }) => rest);
            formData.append("variants", JSON.stringify(variantsData));

            product.variants.forEach((v) => {
                v.images.forEach((file) => {
                    formData.append("variantImages", file);
                });
            });

            await axios.post("http://localhost:3005/api/products/admin", formData, {
                headers: {
                    Authorization: `Bearer ${cookies.token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success("Product uploaded successfully!");

            setProduct({
                name: "",
                description: "",
                category: "honey",
                shippingCharge: 0,
                deliveryTime: "3-5 business days",
                tags: "",
                variants: [],
                images: [],
                imagesPreview: [],
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload product");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-6 border border-gray-100">
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar />

            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Upload Product</h2>

            {/* Product Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input
                    name="name"
                    placeholder="Product Name"
                    value={product.name}
                    onChange={handleProductChange}
                    className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                />
                <select
                    name="category"
                    value={product.category}
                    onChange={handleProductChange}
                    className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                >
                    <option value="honey">Honey</option>
                    <option value="dry-fruits">Dry Fruits</option>
                    <option value="nuts-seeds">Nuts & Seeds</option>
                    <option value="spices">Spices</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <textarea
                name="description"
                placeholder="Description"
                value={product.description}
                onChange={handleProductChange}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none mt-4"
            />

            {/* Product Images */}
            <div className="mt-4">
                <label className="block text-gray-700 font-medium mb-2">Upload Product Images</label>
                <input type="file" multiple onChange={handleProductImages} />
                <div className="flex flex-wrap mt-3 gap-3">
                    {product.imagesPreview?.map((img, i) => (
                        <img key={i} src={img} alt="preview" className="w-20 h-20 rounded-lg object-cover border" />
                    ))}
                </div>
            </div>

            {/* Variants */}
            <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Add Variants</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <select
                        name="weight"
                        value={variant.weight}
                        onChange={handleVariantChange}
                        className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    >
                        <option value="100g">100g</option>
                        <option value="250g">250g</option>
                        <option value="500g">500g</option>
                        <option value="750g">750g</option>
                        <option value="1kg">1kg</option>
                        <option value="2kg">2kg</option>
                        <option value="250ml">250ml</option>
                        <option value="500ml">500ml</option>
                        <option value="1L">1L</option>
                    </select>
                    <input
                        name="type"
                        placeholder="Type"
                        value={variant.type}
                        onChange={handleVariantChange}
                        className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                    <select
                        name="packaging"
                        value={variant.packaging}
                        onChange={handleVariantChange}
                        className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    >
                        <option value="Jar">Jar</option>
                        <option value="Pouch">Pouch</option>
                        <option value="Bottle">Bottle</option>
                    </select>
                    <input
                        type="number"
                        name="price"
                        placeholder="Price"
                        value={variant.price || ""}
                        onChange={handleVariantChange}
                        className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                    <input
                        type="number"
                        name="discount"
                        placeholder="Discount (%)"
                        value={variant.discount || ""}
                        onChange={handleVariantChange}
                        className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                    <input
                        type="number"
                        name="stock"
                        placeholder="Stock"
                        value={variant.stock || ""}
                        onChange={handleVariantChange}
                        className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                </div>

                <button
                    onClick={addVariant}
                    className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition"
                >
                    Add Variant
                </button>

                <div className="mt-6 space-y-3">
                    {product.variants.map((v, i) => (
                        <div key={i} className="border rounded-lg p-4 bg-gray-50 flex justify-between items-center">
                            <p>
                                <strong>{v.weight}</strong> - {v.type} | ₹{v.price} (-{v.discount}%)
                            </p>
                            <p className="text-sm text-gray-500">{v.stock} in stock</p>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`mt-8 w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg transition font-medium flex justify-center items-center gap-2 ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                    }`}
            >
                {isSubmitting ? (
                    <>
                        <svg
                            className="w-5 h-5 animate-spin text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                            ></path>
                        </svg>
                        Uploading...
                    </>
                ) : (
                    "Upload Product"
                )}
            </button>
        </div>
    );
};

export default UploadProduct;
