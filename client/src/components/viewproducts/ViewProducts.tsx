import { useEffect, useState } from "react";
import { Edit, Trash2, Search, Loader2, Check, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
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
    length: number;
    width: number;
    height: number;
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
    const [newImages, setNewImages] = useState<File[]>([]);
    const [editedVariant, setEditedVariant] = useState<Partial<Variant>>({});
    const [cookies] = useCookies(["token"]);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const [confirmModal, setConfirmModal] = useState<{
        type: "product" | "variant" | null;
        productId: string | null;
        variantId?: string | null;
        message: string;
    }>({
        type: null,
        productId: null,
        variantId: null,
        message: "",
    });


    // ✅ Add inside the same file, just below other useState hooks
    const [addingVariantFor, setAddingVariantFor] = useState<string | null>(null);
    const [newVariant, setNewVariant] = useState({
        weight: "",
        type: "",
        packaging: "Jar",
        price: 0,
        discount: 0,
        stock: 0,
        length: 0,
        width: 0,
        height: 0,
    });

    function getProducts() {
        fetch(`${API_URL}/api/products/admin/`, {
            headers: { Authorization: `Bearer ${cookies.token}` },
        })
            .then((res) => res.json())
            .then((data) => {

                setProducts(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }

    useEffect(() => {
        getProducts();
    }, [])


    // ✅ Add Variant Handler
    const handleAddVariant = async (productId: string) => {
        if (
            !newVariant.weight ||
            !newVariant.type ||
            !newVariant.packaging ||
            newVariant.price <= 0 ||
            newVariant.stock <= 0
        ) {
            toast.error("All fields are required and must be valid");
            return;
        }

        setActionLoading(productId);
        try {
            const res = await fetch(`${API_URL}/api/products/admin/${productId}/variant`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cookies.token}`,
                },
                body: JSON.stringify(newVariant),
            });

            if (res.status === 201) {
                toast.success("Variant added successfully");
                setAddingVariantFor(null);
                setNewVariant({
                    weight: "",
                    type: "",
                    packaging: "Jar",
                    price: 0,
                    discount: 0,
                    stock: 0,
                    length: 0,
                    width: 0,
                    height: 0,
                });
                getProducts();
            } else {
                toast.error("Failed to add variant");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error adding variant");
        } finally {
            setActionLoading(null);
        }
    };


    // Update product
    const handleUpdateProduct = async (id: string) => {
        setActionLoading(id);
        try {
            const formData = new FormData();

            // Append text fields
            formData.append("name", editedProduct.name || "");
            formData.append("description", editedProduct.description || "");

            // ✅ If new images selected, append them
            if (newImages.length > 0) {
                newImages.forEach((img) => formData.append("productImages", img));
            }


            const res = await fetch(`${API_URL}/api/products/admin/${id}`, {
                method: "PUT",
                headers: {

                    Authorization: `Bearer ${cookies.token}`,

                },
                body: formData,
            });


            if (res.status == 200) {
                const updated = await res.json();
                setProducts((prev) =>
                    prev.map((p) => (p._id === id ? updated : p))
                );
                toast.success("Product updated successfully");
                getProducts();
                setEditProductId(null);
            } else {
                toast.error("Failed to update product");
            }
        } catch (err) {
            console.error(err);
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
                `${API_URL}/api/products/admin/${productId}/variant/${variantId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${cookies.token}`,
                    },
                    body: JSON.stringify({
                        variants: [
                            {
                                variantId,
                                ...editedVariant
                            }
                        ]
                    })
                }
            );

            if (res.status == 200) {
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
        setActionLoading(id);
        try {
            const res = await fetch(`${API_URL}/api/products/admin/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${cookies.token}` },
            });
            if (res.status == 200) {
                setProducts((prev) => prev.filter((p) => p._id !== id));
                toast.success("Product deleted successfully");
            } else toast.error("Failed to delete product");
        } catch {
            toast.error("Failed to delete product");
        } finally {
            setActionLoading(null);
            setConfirmModal({ type: null, productId: null, message: "" });
        }
    };


    // Delete variant

    const handleDeleteVariant = async (productId: string, variantId: string) => {
        setActionLoading(variantId);
        try {
            const res = await fetch(
                `${API_URL}/api/products/admin/${productId}/variant/${variantId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${cookies.token}` },
                }
            );

            if (res.status == 200) {
                setProducts((prev) =>
                    prev.flatMap((p) => {
                        if (p._id === productId) {
                            const updatedVariants = p.variants.filter((v) => v._id !== variantId);
                            return [{ ...p, variants: updatedVariants }];
                        }
                        return [p];
                    })
                );
                toast.success("Variant deleted");
                getProducts();
            } else {
                toast.error("Failed to delete variant");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete variant");
        } finally {
            setActionLoading(null);
            setConfirmModal({ type: null, productId: null, message: "" });
        }
    };




    const confirmDelete = (
        type: "product" | "variant",
        productId: string,
        variantId?: string
    ) => {
        const message =
            type === "product"
                ? "Are you sure you want to delete this product? This action cannot be undone."
                : "Delete this variant? If this is the last variant, the product will also be deleted.";
        setConfirmModal({ type, productId, variantId, message });
    };

    const handleConfirm = () => {
        if (confirmModal.type === "product" && confirmModal.productId)
            handleDeleteProduct(confirmModal.productId);
        if (
            confirmModal.type === "variant" &&
            confirmModal.productId &&
            confirmModal.variantId
        )
            handleDeleteVariant(confirmModal.productId, confirmModal.variantId);
    };


    const filteredProducts = products.filter((p) =>
        (p.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (p.category?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (p.sku?.toLowerCase() || "").includes(search.toLowerCase())
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
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar />
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
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                {/* Left side — Product Info */}
                                {editProductId === product._id ? (
                                    <div className="flex flex-col gap-2 w-full sm:w-2/3">
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
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            name="productImages"
                                            onChange={(e) => setNewImages(Array.from(e.target.files || []))}
                                            className="mt-2 border p-2 rounded"
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
                                    <div className="flex flex-col w-full sm:w-2/3">
                                        <h2 className="text-lg font-semibold text-amber-700">{product.name}</h2>
                                        <p className="text-sm text-gray-600">{product.description}</p>

                                        {/* ✅ Product Images (in header) */}
                                        {product.images && product.images.length > 0 ? (
                                            <div className="mt-3 flex flex-wrap gap-3">
                                                {product.images.slice(0, 3).map((img: string, i: number) => (
                                                    <img
                                                        key={i}
                                                        src={img}
                                                        alt={product.name}
                                                        className="w-20 h-20 object-cover rounded-lg border hover:scale-105 transition-transform"
                                                    />
                                                ))}
                                                {product.images.length > 3 && (
                                                    <span className="text-gray-500 text-sm self-center">
                                                        +{product.images.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 italic mt-2">No images available</p>
                                        )}
                                    </div>
                                )}

                                {/* Right side — Actions */}
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
                                            onClick={() => confirmDelete("product", product._id)}
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

                            {/* Variants Section */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-gray-700 text-lg">Variants</h3>
                                    {addingVariantFor === product._id ? (
                                        <button
                                            onClick={() => setAddingVariantFor(null)}
                                            className="text-sm bg-gray-400 text-white px-3 py-1 rounded"
                                        >
                                            Cancel
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setAddingVariantFor(product._id)}
                                            className="text-sm bg-amber-600 text-white px-3 py-1 rounded"
                                        >
                                            + Add Variant
                                        </button>
                                    )}
                                </div>

                                {/* Existing Variants as Cards */}
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {product.variants?.map((v) => (
                                        <div
                                            key={v._id}
                                            className="border rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition"
                                        >
                                            {editVariantId === v._id ? (
                                                <>
                                                    {/* Editable Fields */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {/* Weight */}
                                                        <select
                                                            className="border p-2 rounded"
                                                            value={editedVariant.weight}
                                                            onChange={(e) =>
                                                                setEditedVariant({ ...editedVariant, weight: e.target.value })
                                                            }
                                                        >
                                                            <option value="">Weight</option>
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

                                                        {/* Type */}
                                                        <select
                                                            className="border p-2 rounded"
                                                            value={editedVariant.type}
                                                            onChange={(e) =>
                                                                setEditedVariant({ ...editedVariant, type: e.target.value })
                                                            }
                                                        >
                                                            <option value="">Type</option>
                                                            <option value="Raw">Raw</option>
                                                            <option value="Organic">Organic</option>
                                                            <option value="Wild">Wild</option>
                                                            <option value="Natural">Natural</option>
                                                            <option value="Flavored">Flavored</option>
                                                            <option value="Pure">Pure</option>
                                                            <option value="Roasted">Roasted</option>
                                                            <option value="Salted">Salted</option>
                                                            <option value="Unsalted">Unsalted</option>
                                                            <option value="Plain">Plain</option>
                                                        </select>

                                                        {/* Packaging */}
                                                        <select
                                                            className="border p-2 rounded col-span-2"
                                                            value={editedVariant.packaging}
                                                            onChange={(e) =>
                                                                setEditedVariant({ ...editedVariant, packaging: e.target.value })
                                                            }
                                                        >
                                                            <option value="">Packaging</option>
                                                            <option value="Jar">Jar</option>
                                                            <option value="Pouch">Pouch</option>
                                                            <option value="Bottle">Bottle</option>
                                                            <option value="Tin">Tin</option>
                                                            <option value="Box">Box</option>
                                                        </select>

                                                        <input
                                                            type="number"
                                                            placeholder="Price"
                                                            className="border p-2 rounded"
                                                            defaultValue={v.price}
                                                            onChange={(e) =>
                                                                setEditedVariant({ ...editedVariant, price: +e.target.value })
                                                            }
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Discount"
                                                            className="border p-2 rounded"
                                                            defaultValue={v.discount}
                                                            onChange={(e) =>
                                                                setEditedVariant({ ...editedVariant, discount: +e.target.value })
                                                            }
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Stock"
                                                            className="border p-2 rounded"
                                                            defaultValue={v.stock}
                                                            onChange={(e) =>
                                                                setEditedVariant({ ...editedVariant, stock: +e.target.value })
                                                            }
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="L"
                                                            className="border p-2 rounded"
                                                            defaultValue={v.length}
                                                            onChange={(e) =>
                                                                setEditedVariant({ ...editedVariant, length: +e.target.value })
                                                            }
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="W"
                                                            className="border p-2 rounded"
                                                            defaultValue={v.width}
                                                            onChange={(e) =>
                                                                setEditedVariant({ ...editedVariant, width: +e.target.value })
                                                            }
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="H"
                                                            className="border p-2 rounded"
                                                            defaultValue={v.height}
                                                            onChange={(e) =>
                                                                setEditedVariant({ ...editedVariant, height: +e.target.value })
                                                            }
                                                        />
                                                    </div>

                                                    {/* Save / Cancel */}
                                                    <div className="flex justify-end gap-2 mt-3">
                                                        <button
                                                            disabled={actionLoading === v._id}
                                                            onClick={() => handleUpdateVariant(product._id, v._id)}
                                                            className="bg-green-500 text-white px-3 py-1 rounded"
                                                        >
                                                            {actionLoading === v._id ? (
                                                                <Loader2 size={16} className="animate-spin" />
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
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Display Variant Details */}
                                                    <div className="flex flex-wrap gap-1 text-sm text-gray-700">
                                                        <p><span className="font-medium">Weight:</span> {v.weight}</p>
                                                        <p><span className="font-medium">Type:</span> {v.type}</p>
                                                        <p><span className="font-medium">Packaging:</span> {v.packaging}</p>
                                                        <p><span className="font-medium">Price:</span> ₹{v.price}</p>
                                                        <p><span className="font-medium">Discount:</span> {v.discount}%</p>
                                                        <p><span className="font-medium">Stock:</span> {v.stock}</p>
                                                        <p><span className="font-medium">Size:</span> {v.length}×{v.width}×{v.height}</p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex justify-end gap-3 mt-3">
                                                        <button
                                                            onClick={() => {
                                                                setEditVariantId(v._id);
                                                                setEditedVariant(v);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete("variant", product._id, v._id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Add Variant Form */}
                                {addingVariantFor === product._id && (
                                    <div className="border rounded-xl bg-gray-50 p-4 mt-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Reuse same dropdowns */}
                                            <select
                                                className="border p-2 rounded"
                                                value={newVariant.weight}
                                                onChange={(e) =>
                                                    setNewVariant({ ...newVariant, weight: e.target.value })
                                                }
                                            >
                                                <option value="">Select Weight</option>
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

                                            <select
                                                className="border p-2 rounded"
                                                value={newVariant.type}
                                                onChange={(e) =>
                                                    setNewVariant({ ...newVariant, type: e.target.value })
                                                }
                                            >
                                                <option value="">Select Type</option>
                                                <option value="Raw">Raw</option>
                                                <option value="Organic">Organic</option>
                                                <option value="Wild">Wild</option>
                                                <option value="Natural">Natural</option>
                                                <option value="Flavored">Flavored</option>
                                                <option value="Pure">Pure</option>
                                                <option value="Roasted">Roasted</option>
                                                <option value="Salted">Salted</option>
                                                <option value="Unsalted">Unsalted</option>
                                                <option value="Plain">Plain</option>
                                            </select>

                                            <select
                                                className="border p-2 rounded col-span-2"
                                                value={newVariant.packaging}
                                                onChange={(e) =>
                                                    setNewVariant({ ...newVariant, packaging: e.target.value })
                                                }
                                            >
                                                <option value="">Select Packaging</option>
                                                <option value="Jar">Jar</option>
                                                <option value="Pouch">Pouch</option>
                                                <option value="Bottle">Bottle</option>
                                                <option value="Tin">Tin</option>
                                                <option value="Box">Box</option>
                                            </select>

                                            <input
                                                type="number"
                                                placeholder="Price"
                                                className="border p-2 rounded"
                                                value={newVariant.price || ""}
                                                onChange={(e) =>
                                                    setNewVariant({ ...newVariant, price: +e.target.value })
                                                }
                                            />
                                            <input
                                                type="number"
                                                placeholder="Discount"
                                                className="border p-2 rounded"
                                                value={newVariant.discount || ""}
                                                onChange={(e) =>
                                                    setNewVariant({ ...newVariant, discount: +e.target.value })
                                                }
                                            />
                                            <input
                                                type="number"
                                                placeholder="Stock"
                                                className="border p-2 rounded"
                                                value={newVariant.stock || ""}
                                                onChange={(e) =>
                                                    setNewVariant({ ...newVariant, stock: +e.target.value })
                                                }
                                            />
                                            <input
                                                type="number"
                                                placeholder="L"
                                                className="border p-2 rounded"
                                                value={newVariant.length || ""}
                                                onChange={(e) =>
                                                    setNewVariant({ ...newVariant, length: +e.target.value })
                                                }
                                            />
                                            <input
                                                type="number"
                                                placeholder="W"
                                                className="border p-2 rounded"
                                                value={newVariant.width || ""}
                                                onChange={(e) =>
                                                    setNewVariant({ ...newVariant, width: +e.target.value })
                                                }
                                            />
                                            <input
                                                type="number"
                                                placeholder="H"
                                                className="border p-2 rounded"
                                                value={newVariant.height || ""}
                                                onChange={(e) =>
                                                    setNewVariant({ ...newVariant, height: +e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="flex justify-end mt-3">
                                            <button
                                                disabled={actionLoading === product._id}
                                                onClick={() => handleAddVariant(product._id)}
                                                className="bg-green-500 text-white px-4 py-2 rounded"
                                            >
                                                {actionLoading === product._id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    "Add Variant"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>


                        </div>
                    ))
                )}
            </div>
            {/*  Tailwind Confirmation Modal */}
            {confirmModal.type && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-96 p-6 text-center">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">
                            Confirm Deletion
                        </h3>
                        <p className="text-gray-600 mb-6">{confirmModal.message}</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() =>
                                    setConfirmModal({ type: null, productId: null, message: "" })
                                }
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
