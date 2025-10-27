import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, PlusCircle, Edit3, Trash2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Warehouse {
    _id?: string;
    name: string;
    contact: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    pickupTime: string;
    pickupLocationName: string;
}

const AdminPickupLocations: React.FC = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<Warehouse | null>(null);
    const [formData, setFormData] = useState<Warehouse>({
        name: "",
        contact: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        pickupTime: "",
        pickupLocationName: "",
    });

    const [errors, setErrors] = useState<Partial<Record<keyof Warehouse, string>>>({});

    // Fetch data
    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/warehouse`);
            setWarehouses(res.data);
        } catch {
            toast.error("Failed to fetch pickup locations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    // Validation logic
    const validateForm = () => {
        const newErrors: Partial<Record<keyof Warehouse, string>> = {};

        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.contact.trim()) newErrors.contact = "Contact person is required";
        if (!/^\d{10}$/.test(formData.phone))
            newErrors.phone = "Phone must be 10 digits";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!/^\d{6}$/.test(formData.pincode))
            newErrors.pincode = "Pincode must be 6 digits";
        if (!formData.pickupTime.trim())
            newErrors.pickupTime = "Pickup time is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetForm = () => {
        setFormData({
            name: "",
            contact: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            pickupTime: "",
            pickupLocationName: "",
        });
        setEditing(null);
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix validation errors before submitting");
            return;
        }

        try {
            if (editing) {
                await axios.put(`${API_BASE_URL}/api/warehouse/${editing._id}`, formData);
                toast.success("Pickup location updated");
            } else {
                await axios.post(`${API_BASE_URL}/api/warehouse`, formData);
                toast.success("Pickup location added");
            }
            resetForm();
            fetchWarehouses();
        } catch {
            toast.error("Error saving pickup location");
        }
    };

    const handleEdit = (wh: Warehouse) => {
        setEditing(wh);
        setFormData(wh);
        setErrors({});
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this location?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/warehouse/${id}`);
            toast.success("Pickup location deleted");
            fetchWarehouses();
        } catch {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <ToastContainer position="top-right" autoClose={1500} />

            <h2 className="text-2xl font-semibold mb-6 text-center">
                🏬 Manage Pickup Locations
            </h2>

            {/* Add/Edit Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
            >
                {(
                    Object.keys(formData) as (keyof Warehouse)[]
                ).map((key) => (
                    <div key={key} className="flex flex-col">
                        <input
                            type="text"
                            placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                            value={formData[key]}
                            onChange={(e) =>
                                setFormData({ ...formData, [key]: e.target.value })
                            }
                            className={`border p-2 rounded-md focus:ring-2 ${errors[key]
                                ? "border-red-500 focus:ring-red-300"
                                : "focus:ring-amber-400"
                                }`}
                        />
                        {errors[key] && (
                            <span className="text-red-500 text-sm mt-1">{errors[key]}</span>
                        )}
                    </div>
                ))}

                <div className="col-span-full flex gap-3">
                    <button
                        type="submit"
                        className="bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600 flex items-center justify-center gap-2 w-full"
                    >
                        {editing ? (
                            <>
                                <Edit3 className="h-5 w-5" /> Update Location
                            </>
                        ) : (
                            <>
                                <PlusCircle className="h-5 w-5" /> Add Location
                            </>
                        )}
                    </button>
                    {editing && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 w-full"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* Warehouse List */}
            <div className="bg-white rounded-2xl shadow-md p-4 overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                    </div>
                ) : warehouses.length > 0 ? (
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-amber-100 text-left">
                                <th className="p-3">Name</th>
                                <th className="p-3">Contact</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">City</th>
                                <th className="p-3">Pickup Time</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouses.map((wh) => (
                                <tr
                                    key={wh._id}
                                    className="border-b hover:bg-gray-50 transition"
                                >
                                    <td className="p-3">{wh.name}</td>
                                    <td className="p-3">{wh.contact}</td>
                                    <td className="p-3">{wh.phone}</td>
                                    <td className="p-3">{wh.city}</td>
                                    <td className="p-3">{wh.pickupTime}</td>
                                    <td className="p-3 flex gap-3 justify-center">
                                        <button
                                            onClick={() => handleEdit(wh)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(wh._id!)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center py-6 text-gray-500">No pickup locations found.</p>
                )}
            </div>
        </div>
    );
};

export default AdminPickupLocations;
