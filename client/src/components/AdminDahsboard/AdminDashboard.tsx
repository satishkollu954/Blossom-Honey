import { useState, useEffect } from "react";
import {
    Package,
    Users,
    ShoppingCart,
    Upload,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import UploadProduct from "../uploadproducts/UploadProducts";
import ViewProducts from "../viewproducts/ViewProducts";
import { useCookies } from "react-cookie";
import UsersList from "../AllUsers/AllUsers";

export default function AdminDashboard() {
    const [activeSection, setActiveSection] = useState("upload");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [cookie, , removeCookie] = useCookies(["token", "role"]);

    // Detect screen resize (to toggle mobile mode)
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleMenuClick = (section: string) => {
        setActiveSection(section);
        if (isMobile) setSidebarOpen(false); // close sidebar on mobile after selecting
    };

    const handleLogout = () => {
        removeCookie("token");
        removeCookie("role");
    };

    const renderContent = () => {
        switch (activeSection) {
            case "upload":
                return <UploadProduct />;
            case "products":
                return <ViewProducts />;
            case "users":
                return <UsersList />;
            case "orders":
                return <div className="p-6">📑 View Orders Component Here</div>;
            default:
                return <div className="p-6">Select an option from the sidebar.</div>;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div
                className={`fixed md:relative z-20 bg-white shadow-md w-64 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0 transition-transform duration-300 ease-in-out`}
            >
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b">
                    <h1 className="text-xl font-bold text-amber-600">Admin Panel</h1>
                    <button
                        className="md:hidden text-gray-700"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Sidebar Menu */}
                <nav className="mt-4 space-y-1">
                    <button
                        onClick={() => handleMenuClick("upload")}
                        className={`flex items-center w-full px-4 py-2 text-left hover:bg-amber-100 transition ${activeSection === "upload"
                            ? "bg-amber-100 text-amber-600 font-semibold"
                            : "text-gray-700"
                            }`}
                    >
                        <Upload className="mr-3" size={18} />
                        Upload Products
                    </button>

                    <button
                        onClick={() => handleMenuClick("products")}
                        className={`flex items-center w-full px-4 py-2 text-left hover:bg-amber-100 transition ${activeSection === "products"
                            ? "bg-amber-100 text-amber-600 font-semibold"
                            : "text-gray-700"
                            }`}
                    >
                        <Package className="mr-3" size={18} />
                        View Products
                    </button>

                    <button
                        onClick={() => handleMenuClick("users")}
                        className={`flex items-center w-full px-4 py-2 text-left hover:bg-amber-100 transition ${activeSection === "users"
                            ? "bg-amber-100 text-amber-600 font-semibold"
                            : "text-gray-700"
                            }`}
                    >
                        <Users className="mr-3" size={18} />
                        View Users
                    </button>

                    <button
                        onClick={() => handleMenuClick("orders")}
                        className={`flex items-center w-full px-4 py-2 text-left hover:bg-amber-100 transition ${activeSection === "orders"
                            ? "bg-amber-100 text-amber-600 font-semibold"
                            : "text-gray-700"
                            }`}
                    >
                        <ShoppingCart className="mr-3" size={18} />
                        View Orders
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition mt-4"
                    >
                        <LogOut className="mr-3" size={18} />
                        Logout
                    </button>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Navbar (for mobile) */}
                <header className="bg-white shadow-sm p-4 flex items-center justify-between md:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-700 focus:outline-none"
                    >
                        <Menu size={22} />
                    </button>
                    <h1 className="text-lg font-semibold text-amber-600">
                        Admin Dashboard
                    </h1>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto">{renderContent()}</main>
            </div>
        </div>
    );
}
