import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";

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
    const token = cookies.token;

    // Fetch user details
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        const { name, value } = e.target;
        setUser({ ...user, [name]: value });
    };

    const handleSave = async () => {
        try {
            await axios.put(
                "http://localhost:3005/api/users/profile",
                { name: user?.name, email: user?.email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error("Error updating profile");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-600">Loading user profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-10 text-red-500">
                Failed to load user data.
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6 text-amber-600">
                User Profile
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-gray-700 font-medium">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={user.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={user.email}
                        onChange={handleChange}
                        readOnly
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-400"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium">Role</label>
                    <input
                        type="text"
                        value={user.role}
                        disabled
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                </div>

                {/* Addresses */}
                <div>
                    <h3 className="text-lg font-medium mt-6 mb-2">Addresses</h3>
                    {user.addresses.length > 0 ? (
                        <div className="space-y-2">
                            {user.addresses.map((address, index) => (
                                <div
                                    key={index}
                                    className="p-3 border rounded-lg bg-gray-50 text-gray-700"
                                >
                                    <p>
                                        <strong>{address.fullName}</strong> ({address.phone})
                                    </p>
                                    <p>
                                        {address.houseNo}, {address.street}, {address.city},{" "}
                                        {address.state} - {address.postalCode}
                                    </p>
                                    <p>{address.country}</p>
                                    {address.isDefault && (
                                        <span className="text-amber-600 text-sm font-medium">
                                            Default
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No addresses found.</p>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end mt-6 space-x-3">
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
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
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
            </div>
        </div>
    );
}
