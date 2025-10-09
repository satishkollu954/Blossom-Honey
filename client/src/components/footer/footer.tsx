import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {


    return (
        <footer className="bg-[#F5F4F3] border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">

                    {/* Brand Info */}
                    <div>
                        <h3 className="font-serif text-2xl font-semibold text-yellow-800 mb-4">
                            Blossom Honey
                        </h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Premium artisanal honey sourced from nature's finest blossoms. Pure, natural, and delicious.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="p-2 bg-yellow-100 rounded-full hover:bg-yellow-200 transition">
                                <Facebook className="h-5 w-5 text-yellow-800" />
                            </a>
                            <a href="#" className="p-2 bg-yellow-100 rounded-full hover:bg-yellow-200 transition">
                                <Instagram className="h-5 w-5 text-yellow-800" />
                            </a>
                            <a href="#" className="p-2 bg-yellow-100 rounded-full hover:bg-yellow-200 transition">
                                <Twitter className="h-5 w-5 text-yellow-800" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4 text-gray-800">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-600 hover:text-yellow-800 transition">Home</Link>
                            </li>
                            <li>
                                <Link to="/shop" className="text-gray-600 hover:text-yellow-800 transition">Shop</Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-600 hover:text-yellow-800 transition">About Us</Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-600 hover:text-yellow-800 transition">Contact</Link>
                            </li>
                        </ul>
                    </div>


                    {/* Contact Info */}
                    <div>
                        <h4 className="font-semibold mb-4 text-gray-800">Contact Info</h4>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2">
                                <Mail className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-800" />
                                <span>info@blossomhoney.com</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Phone className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-800" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-800" />
                                <span>123 Honey Lane, Sweet Valley, CA 90210</span>
                            </li>
                        </ul>
                    </div>

                    {/* Logo Section */}
                    <div className="flex justify-center md:justify-start items-center">
                        <img
                            src="@/assets/home-bg.png" // or import logo from "@/assets/logo.png";
                            alt="Blossom Honey Logo"
                            className="h-16 w-auto sm:h-20 md:h-24 object-contain"
                        />
                    </div>

                </div>

                {/* Footer Bottom */}
                <div className="border-t mt-12 pt-8 text-center text-gray-500 text-sm">
                    <p>© 2025 Blossom Honey. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
