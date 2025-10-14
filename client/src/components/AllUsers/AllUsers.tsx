import { useEffect, useState } from "react";
import { Loader2, Search, Mail, User, Shield } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCookies } from "react-cookie";

interface UserData {
    _id: string | { $oid?: string };
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt?: string | { $date?: string };
}

export default function UserList() {
    const [cookies] = useCookies(["token"]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");

    const parseDate = (d?: any) => {
        if (!d) return "-";
        if (typeof d === "string") return new Date(d).toLocaleString();
        if (d?.$date) return new Date(d.$date).toLocaleString();
        return "-";
    };

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:3005/api/user", {
                    headers: {
                        Authorization: `Bearer ${cookies.token}`,
                    },
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                console.log("Raw data:", data); // 👈 Check structure here

                // 🔍 Handle both cases — array or wrapped object
                const usersArray = Array.isArray(data)
                    ? data
                    : Array.isArray(data.users)
                        ? data.users
                        : [];

                const normalized = usersArray.map((u: any) => ({
                    ...u,
                    _id: typeof u._id === "object" && u._id.$oid ? u._id.$oid : u._id,
                }));


                setUsers(normalized);
            } catch (err) {
                console.error("Fetch users failed:", err);
                toast.error("Failed to fetch users. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [cookies.token]);

    const filtered = users.filter((u) => {
        const q = search.trim().toLowerCase();
        return (
            (u.name || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q) ||
            (u.role || "").toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-semibold text-amber-700">All Users</h1>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or role"
                        className="pl-10 pr-3 py-2 w-full border rounded-lg focus:ring-amber-400 focus:border-amber-400 outline-none"
                    />
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin text-amber-600" size={36} />
                    <span className="ml-3 text-amber-700">Loading users...</span>
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">No users found.</p>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Role</th>
                                    <th className="p-3 text-left">Verified</th>
                                    <th className="p-3 text-left">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u) => (
                                    <tr key={String(u._id)} className="border-t hover:bg-gray-50">
                                        <td className="p-3">{u.name}</td>
                                        <td className="p-3">{u.email}</td>
                                        <td className="p-3 capitalize">{u.role}</td>
                                        <td className="p-3">
                                            {u.isVerified ? (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                                    Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">{parseDate(u.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        {filtered.map((u) => (
                            <div
                                key={String(u._id)}
                                className="bg-white shadow rounded-lg p-4 border border-gray-100"
                            >
                                <div className="flex items-center mb-2">
                                    <User className="text-amber-600 mr-2" size={18} />
                                    <span className="font-medium text-gray-800">{u.name}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 mb-1">
                                    <Mail className="text-gray-400 mr-2" size={16} />
                                    {u.email}
                                </div>
                                <div className="flex items-center text-sm text-gray-600 mb-1">
                                    <Shield className="text-gray-400 mr-2" size={16} />
                                    Role: <span className="ml-1 capitalize">{u.role}</span>
                                </div>
                                <div className="text-sm mt-1">
                                    Status:{" "}
                                    {u.isVerified ? (
                                        <span className="text-green-600 font-medium">Verified</span>
                                    ) : (
                                        <span className="text-yellow-600 font-medium">
                                            Unverified
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                    Created: {parseDate(u.createdAt)}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
