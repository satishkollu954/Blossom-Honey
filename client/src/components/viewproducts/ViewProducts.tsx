import { useEffect, useState } from "react";
import { Edit, Trash2, Search, ImagePlus } from "lucide-react";
import { toast } from "react-toastify";
import { useCookies } from "react-cookie";

interface Variant {
    _id: string;
    weight: string;
    type: string;
    packaging: string;
    price: number;
    discount: number;
    finalPrice: number;
    stock: number;
    images: string[];
}

interface Product {
    _id: string;
    name: string;
    description: string;
    category: string;
    sku: string;
    variants: Variant[];
    images: string[];
    shippingCharge: number;
    deliveryTime: string;
    isApproved: boolean;
}

export default function ViewProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [cookies] = useCookies(["token"]);

    // Fetch products
    useEffect(() => {

        fetch(`http://localhost:3005/api/products/admin/`, {
            headers: { Authorization: `Bearer ${cookies.token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);


    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
            if (res.ok) {
                setProducts(products.filter((p) => p._id !== id));
                toast.success("Product deleted successfully");
            }
        } catch {
            toast.error("Failed to delete product");
        }
    };

    // Handle delete variant
    const handleDeleteVariant = async (productId: string, variantId: string) => {
        if (!window.confirm("Delete this variant?")) return;

        try {
            const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setProducts((prev) =>
                    prev.map((p) =>
                        p._id === productId
                            ? { ...p, variants: p.variants.filter((v) => v._id !== variantId) }
                            : p
                    )
                );
                toast.success("Variant deleted");
            }
        } catch {
            toast.error("Failed to delete variant");
        }
    };

    // Handle image upload
    const handleImageUpload = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("images", file));

        try {
            const res = await fetch(`/api/admin/products/${productId}/images`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                toast.success("Images updated successfully");
            }
        } catch {
            toast.error("Failed to upload images");
        }
    };

    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <p className="text-center mt-10">Loading products...</p>;

    return (
        <div className="p-4 md:p-6">
            {/* Search Bar */}
            <div className="flex items-center mb-6">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, SKU, or category"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-3 py-2 w-full border rounded-lg focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                </div>
            </div>

            {/* Product List */}
            <div className="grid gap-6">
                {filteredProducts.length === 0 ? (
                    <p className="text-gray-600 text-center">No products found.</p>
                ) : (
                    filteredProducts.map((product) => (
                        <div
                            key={product._id}
                            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold text-lg">{product.name}</h2>
                                    <p className="text-sm text-gray-600">{product.category}</p>
                                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => toast.info("Edit product feature coming soon")}
                                        className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>

                                    <button
                                        onClick={() => handleDeleteProduct(product._id)}
                                        className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>

                                    <label className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 cursor-pointer">
                                        <ImagePlus size={16} />
                                        <span>Images</span>
                                        <input
                                            type="file"
                                            multiple
                                            hidden
                                            onChange={(e) => handleImageUpload(product._id, e)}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Variants */}
                            <div className="mt-4">
                                <h3 className="font-medium text-gray-700 mb-2">Variants</h3>
                                {product.variants.length === 0 ? (
                                    <p className="text-sm text-gray-500">No variants available.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                                            <thead className="bg-gray-100 text-gray-700">
                                                <tr>
                                                    <th className="p-2 text-left">Weight</th>
                                                    <th className="p-2 text-left">Type</th>
                                                    <th className="p-2 text-left">Price</th>
                                                    <th className="p-2 text-left">Discount</th>
                                                    <th className="p-2 text-left">Final Price</th>
                                                    <th className="p-2 text-left">Stock</th>
                                                    <th className="p-2 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {product.variants.map((variant) => (
                                                    <tr key={variant._id} className="border-t">
                                                        <td className="p-2">{variant.weight}</td>
                                                        <td className="p-2">{variant.type}</td>
                                                        <td className="p-2">₹{variant.price}</td>
                                                        <td className="p-2">{variant.discount}%</td>
                                                        <td className="p-2 text-green-600">₹{variant.finalPrice}</td>
                                                        <td className="p-2">{variant.stock}</td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => toast.info("Edit variant feature coming soon")}
                                                                className="text-blue-500 hover:text-blue-700 mr-3"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteVariant(product._id, variant._id)
                                                                }
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
