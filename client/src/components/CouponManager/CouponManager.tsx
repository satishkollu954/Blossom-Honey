import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useCookies } from "react-cookie";

interface Coupon {
    _id?: string;
    code: string;
    discountType: "percentage" | "flat";
    discountValue: number;
    minPurchase: number;
    expiryDate: string;
    isActive: boolean;
    maxUses?: number;
    usedCount?: number;
    oncePerUser?: boolean;
    applicableCategories?: string[];
}

export default function CouponManager() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [loading, setLoading] = useState(false);
    const [cookies] = useCookies(["token"]);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const categories = ["dry-fruits", "honey", "nuts-seeds", "spices", "other"];


    const [formData, setFormData] = useState<Coupon>({
        code: "",
        discountType: "percentage",
        discountValue: 0,
        minPurchase: 0,
        expiryDate: "",
        isActive: true,
        maxUses: 0,
        usedCount: 0,
        oncePerUser: false,
        applicableCategories: [],
    });

    const fetchCoupons = async () => {
        try {
            const res = await axios.get(`http://localhost:3005/api/coupons`, {
                headers: { Authorization: `Bearer ${cookies.token}` },
            });
            setCoupons(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch coupons");
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const newValue =
            type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code.trim()) return toast.error("Coupon code is required");
        if (!formData.discountValue || formData.discountValue <= 0)
            return toast.error("Discount value must be greater than 0");
        if (!formData.expiryDate) return toast.error("Expiry date is required");

        setLoading(true);
        try {
            if (editingCoupon) {
                await axios.put(
                    `http://localhost:3005/api/coupons/${editingCoupon._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${cookies.token}` } }
                );
                toast.success("Coupon updated successfully!");
            } else {
                await axios.post(`http://localhost:3005/api/coupons`, formData, {
                    headers: { Authorization: `Bearer ${cookies.token}` },
                });
                toast.success("Coupon created successfully!");
            }
            setShowModal(false);
            setEditingCoupon(null);
            fetchCoupons();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save coupon");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            ...coupon,
            expiryDate: coupon.expiryDate.split("T")[0],
        });
        setShowModal(true);
    };

    // const handleDelete = async (id: string) => {
    //     if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    //     try {
    //         await axios.delete(`http://localhost:3005/api/coupons/${id}`, {
    //             headers: { Authorization: `Bearer ${cookies.token}` },
    //         });
    //         toast.success("Coupon deleted successfully!");
    //         fetchCoupons();
    //     } catch (error) {
    //         console.error(error);
    //         toast.error("Failed to delete coupon");
    //     }
    // };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <ToastContainer position="top-right" autoClose={1500} />

            {/* Header + Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">
                    🎟 Coupon Management
                </h1>
                <button
                    onClick={() => {
                        setFormData({
                            code: "",
                            discountType: "percentage",
                            discountValue: 0,
                            minPurchase: 0,
                            expiryDate: "",
                            isActive: true,
                            maxUses: 0,
                            usedCount: 0,
                            oncePerUser: false,
                            applicableCategories: [],
                        });
                        setEditingCoupon(null);
                        setShowModal(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                    <Plus size={18} /> Add Coupon
                </button>
            </div>

            {/* Coupon Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {coupons.length > 0 ? (
                    coupons.map((coupon) => (
                        <div
                            key={coupon._id}
                            className={`bg-white shadow-lg rounded-xl border border-gray-200 p-4 flex flex-col justify-between transition hover:shadow-xl ${!coupon.isActive ? "opacity-60" : ""}`}
                        >
                            {/* Coupon Info */}
                            <div className="mb-4">
                                <h2 className="text-lg font-bold text-gray-800">{coupon.code}</h2>
                                <p className="text-sm text-gray-500 capitalize">{coupon.discountType}</p>
                                <p className="text-gray-700 font-semibold">
                                    {coupon.discountType === "percentage"
                                        ? `${coupon.discountValue}% off`
                                        : `₹${coupon.discountValue} off`}
                                </p>
                                <p className="text-sm text-gray-500">Min Purchase: ₹{coupon.minPurchase}</p>
                                <p className="text-sm text-gray-500">
                                    Expiry: {new Date(coupon.expiryDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Max Uses: {coupon.maxUses === 0 ? "Unlimited" : coupon.maxUses}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Used: {coupon.usedCount || 0}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Once per User: {coupon.oncePerUser ? "Yes" : "No"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Categories: {coupon.applicableCategories?.join(", ") || "-"}
                                </p>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center justify-between mt-auto">
                                <span
                                    className={`px-2 py-1 text-xs rounded-full font-semibold ${coupon.isActive
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {coupon.isActive ? "Active" : "Inactive"}
                                </span>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(coupon)}
                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDeleteId(coupon._id!);
                                            setShowDeleteModal(true);
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 py-6 italic">
                        No coupons available
                    </p>
                )}
            </div>


            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg overflow-y-auto max-h-[90vh]">
                        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">
                            {editingCoupon ? "Edit Coupon" : "Add Coupon"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Code */}
                            <div>
                                <label className="block font-medium mb-1 text-sm">Code</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="e.g. NEWYEAR2025"
                                    required
                                />
                            </div>

                            {/* Discount Type & Value */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Discount Type</label>
                                    <select
                                        name="discountType"
                                        value={formData.discountType}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="flat">Flat</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Discount Value</label>
                                    <input
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Min Purchase & Expiry */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Min Purchase</label>
                                    <input
                                        type="number"
                                        name="minPurchase"
                                        value={formData.minPurchase}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Expiry Date</label>
                                    <input
                                        type="date"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split("T")[0]}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Max Uses */}
                            <div>
                                <label className="block font-medium mb-1 text-sm">Max Uses (0 = Unlimited)</label>
                                <input
                                    type="number"
                                    name="maxUses"
                                    value={formData.maxUses}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            {/* Once per user */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="oncePerUser"
                                    checked={formData.oncePerUser}
                                    onChange={handleChange}
                                />
                                <label className="text-sm">Once Per User</label>
                            </div>

                            {/* Applicable Categories */}
                            <div>
                                <label className="block font-medium mb-1 text-sm">Applicable Categories</label>
                                <select
                                    multiple
                                    value={formData.applicableCategories}
                                    onChange={(e) => {
                                        const selectedOptions = Array.from(e.target.selectedOptions).map(
                                            (option) => option.value
                                        );
                                        setFormData((prev) => ({
                                            ...prev,
                                            applicableCategories: selectedOptions,
                                        }));
                                    }}
                                    className="w-full border rounded-lg px-3 py-2 h-32"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Active */}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                                <label className="text-sm">Active</label>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg w-full sm:w-auto"
                                >
                                    {loading ? "Saving..." : editingCoupon ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this coupon? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!deleteId) return;
                                    try {
                                        await axios.delete(`http://localhost:3005/api/coupons/${deleteId}`, {
                                            headers: { Authorization: `Bearer ${cookies.token}` },
                                        });
                                        toast.success("Coupon deleted successfully!");
                                        fetchCoupons();
                                    } catch (error) {
                                        console.error(error);
                                        toast.error("Failed to delete coupon");
                                    } finally {
                                        setShowDeleteModal(false);
                                        setDeleteId(null);
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
