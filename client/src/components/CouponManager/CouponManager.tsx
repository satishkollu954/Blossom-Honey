import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { useCookies } from "react-cookie";

interface Coupon {
    _id?: string;
    code: string;
    discountType: "percentage" | "flat";
    discountValue: number;
    minPurchase: number;
    expiryDate: string;
    isActive: boolean;
    maxUses: number;
    usedCount: number;
    oncePerUser: boolean;
    applicableCategories: string;
}

export default function CouponManager() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [loading, setLoading] = useState(false);
    const [cookies] = useCookies(["token"]);

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
        applicableCategories: "",
    });

    const API_URL = "http://localhost:3005/api/coupons";

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${cookies.token}` },
            });
            setCoupons(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch coupons");
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const newValue =
            type === "checkbox"
                ? (e.target as HTMLInputElement).checked
                : value;

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

        // ✅ Prevent past expiry date
        const today = new Date();
        const expiry = new Date(formData.expiryDate);
        if (expiry < new Date(today.toDateString()))
            return toast.error("Expiry date cannot be before today");

        setLoading(true);
        try {
            if (editingCoupon) {
                await axios.put(`${API_URL}/${editingCoupon._id}`, formData, {
                    headers: { Authorization: `Bearer ${cookies.token}` },
                });
                toast.success("Coupon updated successfully!");
            } else {
                await axios.post(API_URL, formData, {
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
            applicableCategories: Array.isArray(
                (coupon as any).applicableCategories
            )
                ? (coupon as any).applicableCategories.join(", ")
                : (coupon as any).applicableCategories || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${cookies.token}` },
            });
            toast.success("Coupon deleted successfully!");
            fetchCoupons();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete coupon");
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
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
                            applicableCategories: "",
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
            <div className="overflow-x-auto bg-white shadow-lg rounded-xl border border-gray-200">
                <table className="min-w-full text-sm text-gray-700">
                    <thead className="bg-amber-100 text-gray-800">
                        <tr>
                            <th className="px-3 sm:px-4 py-3 text-left">Code</th>
                            <th className="px-3 sm:px-4 py-3 text-left">Type</th>
                            <th className="px-3 sm:px-4 py-3 text-left">Value</th>
                            <th className="px-3 sm:px-4 py-3 text-left">Min Purchase</th>
                            <th className="px-3 sm:px-4 py-3 text-left">Expiry</th>
                            <th className="px-3 sm:px-4 py-3 text-left">Status</th>
                            <th className="px-3 sm:px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.length > 0 ? (
                            coupons.map((coupon) => (
                                <tr
                                    key={coupon._id}
                                    className="border-t hover:bg-gray-50 transition"
                                >
                                    <td className="px-3 sm:px-4 py-3 font-semibold">{coupon.code}</td>
                                    <td className="px-3 sm:px-4 py-3 capitalize">{coupon.discountType}</td>
                                    <td className="px-3 sm:px-4 py-3">
                                        {coupon.discountType === "percentage"
                                            ? `${coupon.discountValue}%`
                                            : `₹${coupon.discountValue}`}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3">₹{coupon.minPurchase}</td>
                                    <td className="px-3 sm:px-4 py-3">
                                        {new Date(coupon.expiryDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${coupon.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {coupon.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleEdit(coupon)}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon._id!)}
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center text-gray-500 py-6 italic"
                                >
                                    No coupons available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg">
                        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">
                            {editingCoupon ? "Edit Coupon" : "Add Coupon"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                />
                                <label className="text-sm">Active</label>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                                >
                                    {loading ? "Saving..." : editingCoupon ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
}
