import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingCart, Moon, Menu, X, User } from "lucide-react";
import { useCookies } from "react-cookie";
import { useCart } from "../context/cartcontext";
import AdvertisementRenderer from "../advertisementbackground/AdvertisementBackground";


export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cookies, , removeCookie] = useCookies(["role", "token"]);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const role = cookies.role;
    const isLoggedIn = role === "user" || role === "admin";
    const { cartCount } = useCart();


    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleLogout = () => {
        removeCookie("role");
        removeCookie("token");
        window.location.href = "/login";
    };

    const toggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-200 shadow-sm">
           <AdvertisementRenderer position="navbar" type="background" />
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
              
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="font-serif text-2xl font-semibold text-amber-500 hover:text-amber-600 transition-colors duration-300">
                            Blossom Honey
                        </span>
                    </Link>

                     

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {["Home", "Shop", "About", "Contact", "Our Story"].map((name) => (
                            <NavLink
                                key={name}
                                to={name === "Home" ? "/" : `/${name.toLowerCase().replace(" ", "")}`}
                                className={({ isActive }) =>
                                    `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"} transition-colors`
                                }
                            >
                                {name}
                            </NavLink>
                        ))}

                        {role === "admin" && (
                            <NavLink
                                to="/admin"
                                className={({ isActive }) =>
                                    `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"} transition-colors`
                                }
                            >
                                Dashboard
                            </NavLink>
                        )}

                        {role !== "admin" && (
                            <Link
                                to="/cart"
                                className="relative flex items-center text-gray-800 hover:text-amber-500 transition"
                            >
                                <ShoppingCart size={22} />
                                {cartCount > 0 && (
                                    <span
                                        className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md"
                                    >
                                        {cartCount}
                                    </span>
                                )}
                            </Link>




                        )}


                        {/* Profile Icon with Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            {!isLoggedIn ? (
                                <Link to="/login" className="text-gray-800 hover:text-amber-500 transition">
                                    <User size={22} />
                                </Link>
                            ) : (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpen((prev) => !prev);
                                        }}
                                        className="text-gray-800 hover:text-amber-500 transition relative"
                                    >
                                        <User size={22} />
                                    </button>

                                    {open && (
                                        <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg p-2 z-50">
                                            {role === "user" && (
                                                <>
                                                    <Link
                                                        to="/profile"
                                                        onClick={() => setOpen(false)}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-100 rounded"
                                                    >
                                                        Profile
                                                    </Link>

                                                    <Link
                                                        to="/my-orders"
                                                        onClick={() => setOpen(false)}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-100 rounded"
                                                    >
                                                        My Orders
                                                    </Link>
                                                </>
                                            )}

                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-100 rounded"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Right Section */}
                    <div className="flex items-center space-x-4">
                        <button className="p-2 rounded-full hover:bg-gray-100 transition" aria-label="Toggle dark mode">
                            <Moon size={20} className="text-gray-800" />
                        </button>
                        <button
                            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-2 bg-white border-t border-gray-200 rounded-lg shadow-md">
                        <div className="flex flex-col space-y-2 px-6 py-4">
                            {["Home", "Shop", "About", "Contact", "Our Story"].map((name) => (
                                <NavLink
                                    key={name}
                                    to={name === "Home" ? "/" : `/${name.toLowerCase().replace(" ", "")}`}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"} transition-colors`
                                    }
                                >
                                    {name}
                                </NavLink>
                            ))}

                            {role === "admin" && (
                                <NavLink
                                    to="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"} transition-colors`
                                    }
                                >
                                    Dashboard
                                </NavLink>
                            )}

                            {role !== "admin" && (
                                <Link
                                    to="/cart"
                                    className="relative flex items-center text-gray-800 hover:text-amber-500 transition"
                                >
                                    <ShoppingCart size={22} />
                                    {cartCount > 0 && (
                                        <span
                                            className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md"
                                        >
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>


                            )}

                            {/* Profile for Mobile */}
                            <div className="relative" ref={dropdownRef}>
                                {!isLoggedIn ? (
                                    <Link to="/login" className="text-gray-800 hover:text-amber-500 transition">
                                        <User size={22} />
                                    </Link>
                                ) : (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpen((prev) => !prev);
                                            }}
                                            className="text-gray-800 hover:text-amber-500 transition relative"
                                        >
                                            <User size={22} />
                                        </button>

                                        {open && (
                                            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg p-2 z-50">
                                                {role === "user" && (
                                                    <>
                                                        <Link
                                                            to="/profile"
                                                            onClick={() => setOpen(false)}
                                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-100 rounded"
                                                        >
                                                            Profile
                                                        </Link>

                                                        <Link
                                                            to="/my-orders"
                                                            onClick={() => setOpen(false)}
                                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-100 rounded"
                                                        >
                                                            My Orders
                                                        </Link>
                                                    </>
                                                )}
                                                <button
                                                    onClick={handleLogout}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-100 rounded"
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
