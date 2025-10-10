import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

interface Address {
    _id?: string;
    fullName: string;
    phone: string;
    houseNo?: string;
    street?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    landmark?: string;
    isDefault?: boolean;
}

interface User {
    name: string;
    email: string;
    role: string;
    addresses: Address[];
}

export function UserProfile() {
    const [cookies] = useCookies(["token"]);
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState<Address>({
        fullName: "",
        phone: "",
        houseNo: "",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        landmark: "",
        isDefault: false,
    });

    const token = cookies.token;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get("http://localhost:3005/api/user/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch user details");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [token]);

    // User name edit
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        const { name, value } = e.target;
        setUser({ ...user, [name]: value });
    };

    const handleSave = async () => {
        try {
            await axios.put(
                "http://localhost:3005/api/user/profile",
                { name: user?.name },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error("Error updating profile");
        }
    };

    // Address handlers
    const handleAddressChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        id?: string
    ) => {
        const { name, value, type, checked } = e.target;
        if (id && user) {
            // editing existing address
            const updatedAddresses = user.addresses.map((addr) =>
                addr._id === id ? { ...addr, [name]: type === "checkbox" ? checked : value } : addr
            );
            setUser({ ...user, addresses: updatedAddresses });
        } else {
            // new address
            setNewAddress({
                ...newAddress,
                [name]: type === "checkbox" ? checked : value,
            });
        }
    };

    // const addAddress = async () => {
    //     if (!user) return;
    //     try {
    //         const res = await axios.post(
    //             "http://localhost:3005/api/user/addresses",
    //             newAddress,
    //             { headers: { Authorization: `Bearer ${token}` } }
    //         );
    //         // Update user state immediately
    //         setUser({
    //             ...user,
    //             addresses: [...user.addresses, res.data], // Add newly created address
    //         });
    //         toast.success("Address added successfully!");
    //         setShowAddAddress(false); // hide add form
    //         // Reset newAddress
    //         setNewAddress({
    //             fullName: "",
    //             phone: "",
    //             houseNo: "",
    //             street: "",
    //             city: "",
    //             state: "",
    //             postalCode: "",
    //             country: "India",
    //             landmark: "",
    //             isDefault: false,
    //         });
    //     } catch (error) {
    //         console.error(error);
    //         toast.error("Failed to add address");
    //     }
    // };


    const addAddress = async () => {
        if (!user) return;
        try {
            await axios.post(
                "http://localhost:3005/api/user/addresses",
                newAddress,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Re-fetch user profile to get updated addresses
            const res = await axios.get("http://localhost:3005/api/user/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data);

            toast.success("Address added successfully!");
            setNewAddress({
                fullName: "",
                phone: "",
                houseNo: "",
                street: "",
                city: "",
                state: "",
                postalCode: "",
                country: "India",
                landmark: "",
                isDefault: false,
            });
            setShowAddAddress(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to add address");
        }
    };



    const saveAddress = async (id: string) => {
        if (!user) return;
        const editedAddress = user.addresses.find((addr) => addr._id === id);
        if (!editedAddress) return;

        try {
            await axios.put(
                `http://localhost:3005/api/user/addresses/${id}`,
                editedAddress,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Re-fetch full user to ensure backend state matches
            const res = await axios.get("http://localhost:3005/api/user/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data);

            toast.success("Address updated successfully!");
            setEditingAddressId(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update address");
        }
    };



    const deleteAddress = async (id: string) => {
        if (!user) return;
        try {
            await axios.delete(`http://localhost:3005/api/user/addresses/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Remove the deleted address from state
            setUser((prevUser) => ({
                ...prevUser!,
                addresses: prevUser!.addresses.filter((addr) => addr._id !== id),
            }));
            toast.success("Address deleted successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete address");
        }
    };


    if (loading) return <p className="text-center py-10">Loading...</p>;
    if (!user) return <p className="text-center py-10 text-red-500">No user found.</p>;

    return (
        <div className="max-w-3xl mx-auto mb-4 mt-10 p-6 bg-white rounded-2xl shadow-md border border-gray-200">
            <ToastContainer position="top-right" autoClose={1500} />
            <h2 className="text-2xl font-semibold mb-6 text-amber-600">User Profile</h2>

            {/* Name */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm space-y-4">
                {/* Name Field */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={user.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 rounded-lg border ${isEditing ? "border-amber-400 focus:ring-amber-400 focus:outline-none" : "border-gray-300 bg-gray-100"
                            }`}
                        placeholder="Enter your full name"
                    />
                </div>

                {/* Email Field */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={user.email}
                        onChange={handleChange}
                        disabled
                        readOnly
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-amber-400"
                        placeholder="Your email"
                    />
                </div>
            </div>

            <div className="flex justify-end mb-6">
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                    >
                        Edit
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 mx-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>

            {/* Addresses */}
            <h3 className="text-lg font-medium mb-2">Addresses</h3>

            {/* Add New Address */}
            <div className="mb-4">
                {!showAddAddress ? (
                    <button
                        onClick={() => setShowAddAddress(true)}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                    >
                        + Add New Address
                    </button>
                ) : (
                    <div className="border p-4 rounded-lg bg-gray-50 shadow-sm space-y-3">
                        <h4 className="font-semibold text-gray-700 text-lg">New Address</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                name="fullName"
                                placeholder="Full Name"
                                value={newAddress.fullName}
                                onChange={(e) => handleAddressChange(e)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                            />
                            <input
                                name="phone"
                                placeholder="Phone"
                                value={newAddress.phone}
                                onChange={(e) => handleAddressChange(e)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                            />
                            <input
                                name="houseNo"
                                placeholder="House No"
                                value={newAddress.houseNo}
                                onChange={(e) => handleAddressChange(e)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                            />
                            <input
                                name="street"
                                placeholder="Street"
                                value={newAddress.street}
                                onChange={(e) => handleAddressChange(e)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                            />
                            <input
                                name="city"
                                placeholder="City"
                                value={newAddress.city}
                                onChange={(e) => handleAddressChange(e)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                            />
                            <input
                                name="state"
                                placeholder="State"
                                value={newAddress.state}
                                onChange={(e) => handleAddressChange(e)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                            />
                            <input
                                name="postalCode"
                                placeholder="Postal Code"
                                value={newAddress.postalCode}
                                onChange={(e) => handleAddressChange(e)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                            />
                            <input
                                name="landmark"
                                placeholder="Landmark"
                                value={newAddress.landmark}
                                onChange={(e) => handleAddressChange(e)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                            />
                        </div>
                        <div className="flex justify-end space-x-2 mt-3">
                            <button
                                onClick={addAddress}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            >
                                Save
                            </button>

                            <button
                                onClick={() => setShowAddAddress(false)}
                                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Existing Addresses */}
            <div className="space-y-3">
                {user.addresses.map((address) => (
                    <div key={address._id} className="p-3 border rounded-lg bg-gray-50">
                        {editingAddressId === address._id ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <input
                                        name="fullName"
                                        value={address.fullName}
                                        onChange={(e) => handleAddressChange(e, address._id)}
                                        className="px-2 py-1 border rounded"
                                    />
                                    <input
                                        name="phone"
                                        value={address.phone}
                                        onChange={(e) => handleAddressChange(e, address._id)}
                                        className="px-2 py-1 border rounded"
                                    />
                                    <input
                                        name="houseNo"
                                        value={address.houseNo || ""}
                                        onChange={(e) => handleAddressChange(e, address._id)}
                                        className="px-2 py-1 border rounded"
                                    />
                                    <input
                                        name="street"
                                        value={address.street || ""}
                                        onChange={(e) => handleAddressChange(e, address._id)}
                                        className="px-2 py-1 border rounded"
                                    />
                                    <input
                                        name="city"
                                        value={address.city}
                                        onChange={(e) => handleAddressChange(e, address._id)}
                                        className="px-2 py-1 border rounded"
                                    />
                                    <input
                                        name="state"
                                        value={address.state}
                                        onChange={(e) => handleAddressChange(e, address._id)}
                                        className="px-2 py-1 border rounded"
                                    />
                                    <input
                                        name="postalCode"
                                        value={address.postalCode}
                                        onChange={(e) => handleAddressChange(e, address._id)}
                                        className="px-2 py-1 border rounded"
                                    />
                                    <input
                                        name="landmark"
                                        value={address.landmark || ""}
                                        onChange={(e) => handleAddressChange(e, address._id)}
                                        className="px-2 py-1 border rounded"
                                    />
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                        onClick={() => saveAddress(address._id!)}
                                        className="px-3  py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingAddressId(null)}
                                        className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p>
                                    <strong>{address.fullName}</strong> ({address.phone})
                                </p>
                                <p>
                                    {address.houseNo}, {address.street}, {address.city},{" "}
                                    {address.state} - {address.postalCode}
                                </p>
                                <p>{address.country}</p>
                                {address.isDefault && (
                                    <span className="text-amber-600 text-sm font-medium">Default</span>
                                )}
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                        onClick={() => setEditingAddressId(address._id!)}
                                        className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteAddress(address._id!)}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
