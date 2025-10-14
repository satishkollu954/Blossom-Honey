import { useEffect, useState } from "react";
import { Edit, Trash2, Search, ImagePlus, Loader2, Check, X } from "lucide-react";
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
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [editProductId, setEditProductId] = useState<string | null>(null);
    const [editVariantId, setEditVariantId] = useState<string | null>(null);
    const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
    const [editedVariant, setEditedVariant] = useState<Partial<Variant>>({});
    const [cookies] = useCookies(["token"]);

    // Fetch products
    useEffect(() => {
        console.log("----");
        fetch(`http://localhost:3005/api/products/admin/`, {
            headers: { Authorization: `Bearer ${cookies.token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setProducts(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Update product
    const handleUpdateProduct = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`http://localhost:3005/api/products/admin/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cookies.token}`,
                },
                body: JSON.stringify(editedProduct),
            });
            if (res.ok) {
                setProducts((prev) =>
                    prev.map((p) => (p._id === id ? { ...p, ...editedProduct } as Product : p))
                );
                toast.success("Product updated successfully");
                setEditProductId(null);
            } else toast.error("Failed to update product");
        } catch {
            toast.error("Error updating product");
        } finally {
            setActionLoading(null);
        }
    };

    // Update variant
    const handleUpdateVariant = async (productId: string, variantId: string) => {
        setActionLoading(variantId);
        try {
            const res = await fetch(
                `http://localhost:3005/api/products/admin/${productId}/variants/${variantId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${cookies.token}`,
                    },
                    body: JSON.stringify(editedVariant),
                }
            );
            if (res.ok) {
                setProducts((prev) =>
                    prev.map((p) =>
                        p._id === productId
                            ? {
                                ...p,
                                variants: p.variants.map((v) =>
                                    v._id === variantId ? { ...v, ...editedVariant } : v
                                ),
                            }
                            : p
                    )
                );
                toast.success("Variant updated successfully");
                setEditVariantId(null);
            } else toast.error("Failed to update variant");
        } catch {
            toast.error("Error updating variant");
        } finally {
            setActionLoading(null);
        }
    };

    // Delete product
    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        setActionLoading(id);

        try {
            const res = await fetch(`http://localhost:3005/api/products/admin/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${cookies.token}` },
            });
            if (res.ok) {
                setProducts(products.filter((p) => p._id !== id));
                toast.success("Product deleted successfully");
            } else toast.error("Failed to delete product");
        } catch {
            toast.error("Failed to delete product");
        } finally {
            setActionLoading(null);
        }
    };

    // Delete variant
    const handleDeleteVariant = async (productId: string, variantId: string) => {
        if (!window.confirm("Delete this variant?")) return;
        setActionLoading(variantId);

        try {
            const res = await fetch(
                `http://localhost:3005/api/products/admin/${productId}/variants/${variantId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${cookies.token}` },
                }
            );
            if (res.ok) {
                setProducts((prev) =>
                    prev.map((p) =>
                        p._id === productId
                            ? { ...p, variants: p.variants.filter((v) => v._id !== variantId) }
                            : p
                    )
                );
                toast.success("Variant deleted");
            } else toast.error("Failed to delete variant");
        } catch {
            toast.error("Failed to delete variant");
        } finally {
            setActionLoading(null);
        }
    };

    // // Upload images
    // const handleImageUpload = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    //     const files = e.target.files;
    //     if (!files || files.length === 0) return;
    //     setActionLoading(productId);

    //     const formData = new FormData();
    //     Array.from(files).forEach((file) => formData.append("images", file));

    //     try {
    //         const res = await fetch(
    //             `http://localhost:3005/api/products/admin/${productId}/images`,
    //             {
    //                 method: "POST",
    //                 headers: { Authorization: `Bearer ${cookies.token}` },
    //                 body: formData,
    //             }
    //         );
    //         if (res.ok) toast.success("Images uploaded successfully");
    //         else toast.error("Failed to upload images");
    //     } catch {
    //         toast.error("Error uploading images");
    //     } finally {
    //         setActionLoading(null);
    //     }
    // };

    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())
    );

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-amber-600" size={40} />
                <p className="ml-3 text-amber-700 font-medium">Loading products...</p>
            </div>
        );

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Search Bar */}
            <div className="flex justify-between items-center mb-6">
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
                            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
                        >
                            {/* Product Header */}
                            <div className="flex justify-between items-center">
                                {editProductId === product._id ? (
                                    <div className="flex flex-col gap-2 w-full">
                                        <input
                                            className="border p-2 rounded"
                                            defaultValue={product.name}
                                            onChange={(e) =>
                                                setEditedProduct({
                                                    ...editedProduct,
                                                    name: e.target.value,
                                                })
                                            }
                                        />
                                        <textarea
                                            className="border p-2 rounded"
                                            defaultValue={product.description}
                                            onChange={(e) =>
                                                setEditedProduct({
                                                    ...editedProduct,
                                                    description: e.target.value,
                                                })
                                            }
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                disabled={actionLoading === product._id}
                                                onClick={() => handleUpdateProduct(product._id)}
                                                className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded"
                                            >
                                                {actionLoading === product._id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Check size={16} />
                                                )}
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditProductId(null)}
                                                className="flex items-center gap-1 bg-gray-400 text-white px-3 py-1 rounded"
                                            >
                                                <X size={16} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="text-lg font-semibold text-amber-700">
                                            {product.name}
                                        </h2>
                                        <p className="text-sm text-gray-600">{product.description}</p>
                                    </div>
                                )}

                                {editProductId !== product._id && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditProductId(product._id);
                                                setEditedProduct(product);
                                            }}
                                            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded"
                                        >
                                            <Edit size={16} /> Edit
                                        </button>
                                        <button
                                            disabled={actionLoading === product._id}
                                            onClick={() => handleDeleteProduct(product._id)}
                                            className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded disabled:opacity-60"
                                        >
                                            {actionLoading === product._id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Variants */}
                            <div className="mt-4">
                                <h3 className="font-semibold text-gray-700 mb-2">Variants</h3>
                                <table className="min-w-full text-sm border border-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2 text-left">Weight</th>
                                            <th className="p-2 text-left">Price</th>
                                            <th className="p-2 text-left">Discount</th>
                                            <th className="p-2 text-left">Stock</th>
                                            <th className="p-2 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.variants?.map((v) => (
                                            <tr key={v._id} className="border-t">
                                                {editVariantId === v._id ? (
                                                    <>
                                                        <td className="p-2">
                                                            <input
                                                                className="border p-1 rounded w-full"
                                                                defaultValue={v.weight}
                                                                onChange={(e) =>
                                                                    setEditedVariant({
                                                                        ...editedVariant,
                                                                        weight: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                className="border p-1 rounded w-full"
                                                                defaultValue={v.price}
                                                                onChange={(e) =>
                                                                    setEditedVariant({
                                                                        ...editedVariant,
                                                                        price: parseFloat(
                                                                            e.target.value
                                                                        ),
                                                                    })
                                                                }
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                className="border p-1 rounded w-full"
                                                                defaultValue={v.discount}
                                                                onChange={(e) =>
                                                                    setEditedVariant({
                                                                        ...editedVariant,
                                                                        discount: parseFloat(
                                                                            e.target.value
                                                                        ),
                                                                    })
                                                                }
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                className="border p-1 rounded w-full"
                                                                defaultValue={v.stock}
                                                                onChange={(e) =>
                                                                    setEditedVariant({
                                                                        ...editedVariant,
                                                                        stock: parseInt(
                                                                            e.target.value
                                                                        ),
                                                                    })
                                                                }
                                                            />
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                disabled={actionLoading === v._id}
                                                                onClick={() =>
                                                                    handleUpdateVariant(
                                                                        product._id,
                                                                        v._id
                                                                    )
                                                                }
                                                                className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                                                            >
                                                                {actionLoading === v._id ? (
                                                                    <Loader2
                                                                        size={16}
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    <Check size={16} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => setEditVariantId(null)}
                                                                className="bg-gray-400 text-white px-3 py-1 rounded"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="p-2">{v.weight}</td>
                                                        <td className="p-2">₹{v.price}</td>
                                                        <td className="p-2">{v.discount}%</td>
                                                        <td className="p-2">{v.stock}</td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => {
                                                                    setEditVariantId(v._id);
                                                                    setEditedVariant(v);
                                                                }}
                                                                className="text-blue-500 hover:text-blue-700 mr-3"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteVariant(
                                                                        product._id,
                                                                        v._id
                                                                    )
                                                                }
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
