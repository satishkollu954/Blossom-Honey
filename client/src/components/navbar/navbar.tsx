import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingCart, Moon, Menu, X, User } from "lucide-react";
import { useCookies } from "react-cookie";

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [cookies, , removeCookie] = useCookies(["role", "token"]);
    const [open, setOpen] = useState(false);
    const role = cookies.role;
    const isLoggedIn = role === "user" || role === "admin";





    const handleLogout = () => {

        removeCookie("role");
        removeCookie("token");
        window.location.href = "/login";
    }

    const toggleMenu = (): void => {
        setIsMenuOpen((prev) => !prev);
    };

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
                <div className="flex items-center justify-between h-16">

                    {/* Logo / Brand */}
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="font-serif text-2xl font-semibold text-amber-500 hover:text-amber-600 transition-colors duration-300">
                            Blossom Honey
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                } transition-colors`
                            }
                        >
                            Home
                        </NavLink>

                        <NavLink
                            to="/shop"
                            className={({ isActive }) =>
                                `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                } transition-colors`
                            }
                        >
                            Shop
                        </NavLink>

                        <NavLink
                            to="/about"
                            className={({ isActive }) =>
                                `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                } transition-colors`
                            }
                        >
                            About
                        </NavLink>

                        <NavLink
                            to="/contact"
                            className={({ isActive }) =>
                                `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                } transition-colors`
                            }
                        >
                            Contact
                        </NavLink>
                        <NavLink
                            to="/story"
                            className={({ isActive }) =>
                                `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                } transition-colors`
                            }
                        >
                            Our Story
                        </NavLink>

                        {
                            role === "admin" && (
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) =>
                                        `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                        } transition-colors`
                                    }
                                >
                                    Dashboard
                                </NavLink>
                            )
                        }

                        {/* Cart Icon */}
                        {
                            role !== "admin" && (
                                <Link to="/cart" className="text-gray-800 hover:text-amber-500 transition">
                                    <ShoppingCart size={22} />
                                </Link>
                            )
                        }
                        <div className="relative">
                            {!isLoggedIn ? (
                                <Link to="/login" className="text-gray-800 hover:text-amber-500 transition">
                                    <User size={22} />
                                </Link>
                            ) : (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpen(!open);
                                        }}
                                        className="text-gray-800 hover:text-amber-500 transition relative"
                                    >
                                        <User size={22} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {open && (
                                        <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg p-2 z-50">
                                            {/* Show Profile only if role === "user" */}
                                            {role === "user" && (
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setOpen(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-100 rounded"
                                                >
                                                    Profile
                                                </Link>
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

                    {/* Right Section (Dark Mode + Mobile Menu Button) */}
                    <div className="flex items-center space-x-4">
                        {/* Dark Mode Toggle */}
                        <button
                            className="p-2 rounded-full hover:bg-gray-100 transition"
                            aria-label="Toggle dark mode"
                        >
                            <Moon size={20} className="text-gray-800" />
                        </button>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-2 bg-white border-t border-gray-200 rounded-lg shadow-md">
                        <div className="flex flex-col space-y-2 px-6 py-4">
                            <NavLink
                                to="/"
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                    } transition-colors`
                                }
                            >
                                Home
                            </NavLink>
                            <NavLink
                                to="/shop"
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                    } transition-colors`
                                }
                            >
                                Shop
                            </NavLink>
                            <NavLink
                                to="/about"
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                    } transition-colors`
                                }
                            >
                                About
                            </NavLink>
                            <NavLink
                                to="/contact"
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                    } transition-colors`
                                }
                            >
                                Contact
                            </NavLink>
                            <NavLink
                                to="/story"
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                    } transition-colors`
                                }
                            >
                                Our Story
                            </NavLink>
                            {
                                role === "admin" && (
                                    <NavLink
                                        to="/admin"
                                        className={({ isActive }) =>
                                            `font-medium ${isActive ? "text-amber-500" : "text-gray-800 hover:text-amber-500"
                                            } transition-colors`
                                        }
                                    >
                                        Dashboard
                                    </NavLink>
                                )
                            }

                            {
                                role != "admin" && (
                                    <Link
                                        to="/cart"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-gray-800 hover:text-amber-500 transition flex items-center space-x-2"
                                    >
                                        <ShoppingCart size={20} />

                                    </Link>
                                )
                            }
                            <div className="relative">
                                {!isLoggedIn ? (
                                    <Link to="/login" className="text-gray-800 hover:text-amber-500 transition">
                                        <User size={22} />
                                    </Link>
                                ) : (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpen(!open);
                                            }}
                                            className="text-gray-800 hover:text-amber-500 transition relative"
                                        >
                                            <User size={22} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {open && (
                                            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg p-2 z-50">
                                                {/* Show Profile only if role === "user" */}
                                                {role === "user" && (
                                                    <Link
                                                        to="/profile"
                                                        onClick={() => setOpen(false)}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-100 rounded"
                                                    >
                                                        Profile
                                                    </Link>
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
