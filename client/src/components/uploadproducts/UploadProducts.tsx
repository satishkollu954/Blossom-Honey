import React, { useState } from "react";
import type { ChangeEvent } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useCookies } from "react-cookie";

interface Variant {
    weight: string;
    type: string;
    packaging: string;
    price: number;
    discount: number;
    stock: number;
    images: string[];
}

interface Product {
    name: string;
    description: string;
    category: string;
    shippingCharge: number;
    deliveryTime: string;
    tags: string;
    variants: Variant[];
    images: string[];
}

const UploadProduct: React.FC = () => {
    const [product, setProduct] = useState<Product>({
        name: "",
        description: "",
        category: "honey",
        shippingCharge: 0,
        deliveryTime: "3-5 business days",
        tags: "",
        variants: [],
        images: [],
    });

    const [cookies] = useCookies(["token"]);



    const [variant, setVariant] = useState<Variant>({
        weight: "250g",
        type: "",
        packaging: "Jar",
        price: 0,
        discount: 0,
        stock: 0,
        images: [],
    });

    // 📸 Handle image upload (for simplicity, accept image URLs)
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const urls = files.map((file) => URL.createObjectURL(file));
            setProduct({ ...product, images: [...product.images, ...urls] });
        }
    };

    // 📸 Handle variant image upload
    const handleVariantImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const urls = files.map((file) => URL.createObjectURL(file));
            setVariant({ ...variant, images: [...variant.images, ...urls] });
        }
    };

    const handleVariantChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setVariant({ ...variant, [name]: value });
    };

    const handleProductChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
    };

    // ➕ Add variant
    const addVariant = () => {
        if (!variant.type || !variant.price) {
            toast.warning("Please fill variant details");
            return;
        }
        setProduct({ ...product, variants: [...product.variants, variant] });
        setVariant({
            weight: "250g",
            type: "",
            packaging: "Jar",
            price: 0,
            discount: 0,
            stock: 0,
            images: [],
        });
    };

    // 🚀 Submit product
    const handleSubmit = async () => {
        try {
            console.log("====", product);
            await axios.post("http://localhost:3005/api/products/admin/", product, {
                headers: { Authorization: `Bearer ${cookies.token}` },
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
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload product");
        }
    };

    return (
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-6 border border-gray-100">
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar />

            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Upload Product</h2>

            {/* Basic Product Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input
                    name="name"
                    placeholder="Product Name"
                    value={product.name}
                    onChange={handleProductChange}
                    className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                />
                {/* <input
                    name="sku"
                    placeholder="SKU"
                    value={product.sku}
                    onChange={handleProductChange}
                    className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                /> */}
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
                {/* <input
                    name="seller"
                    placeholder="Seller ID"
                    value={product.seller}
                    onChange={handleProductChange}
                    className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                /> */}
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
                <input type="file" multiple onChange={handleImageChange} />
                <div className="flex flex-wrap mt-3 gap-3">
                    {product.images.map((img, i) => (
                        <img key={i} src={img} alt="preview" className="w-20 h-20 rounded-lg object-cover border" />
                    ))}
                </div>
            </div>

            {/* Variant Section */}
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
                        <option value="1kg">1kg</option>
                        <option value="2kg">2kg</option>
                        <option value="250ml">250ml</option>
                        <option value="500ml">500ml</option>
                        <option value="1L">1L</option>
                    </select>
                    <input
                        name="type"
                        placeholder="Type (e.g., Organic, Raw)"
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
                        <option value="Tin">Tin</option>
                        <option value="Box">Box</option>
                    </select>

                    <input
                        type="number"
                        name="price"
                        placeholder="Price"
                        value={variant.price}
                        onChange={handleVariantChange}
                        className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                    <input
                        type="number"
                        name="discount"
                        placeholder="Discount (%)"
                        value={variant.discount}
                        onChange={handleVariantChange}
                        className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                    <input
                        type="number"
                        name="stock"
                        placeholder="Stock"
                        value={variant.stock}
                        onChange={handleVariantChange}
                        className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    />

                    <input type="file" multiple onChange={handleVariantImageChange} />
                </div>

                <button
                    onClick={addVariant}
                    className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition"
                >
                    Add Variant
                </button>

                {/* Variant Preview */}
                <div className="mt-6 space-y-3">
                    {product.variants.map((v, i) => (
                        <div
                            key={i}
                            className="border rounded-lg p-4 bg-gray-50 flex justify-between items-center"
                        >
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
                className="mt-8 w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg transition font-medium"
            >
                Upload Product
            </button>
        </div>
    );
};

export default UploadProduct;
