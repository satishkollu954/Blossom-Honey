import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useCart } from "../context/cartcontext"; // adjust path as needed


interface Address {
    _id?: string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
}

interface CartItem {
    product: {
        _id: string;
        name: string;
        images: string[];
    };
    variant: {
        _id: string;
        weight: string;
    };
    price: number;
    quantity: number;
}

export const Checkout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [cookies] = useCookies(["token"]);
    const token = cookies.token;
    const { cartItems, totalPrice } = location.state || {};
    const [loading, setLoading] = useState(false);
    const { setCartCount } = useCart();



    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY" | "">("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAddress, setNewAddress] = useState<Address>({
        fullName: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
    });

    const [couponCode, setCouponCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const [shippingCharge, setShippingCharge] = useState(totalPrice < 500 ? 50 : 0);
    const [finalAmount, setFinalAmount] = useState(totalPrice + shippingCharge);

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAddresses(res.data.addresses || []);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load addresses");
            }
        };
        fetchAddresses();
    }, [token]);

    useEffect(() => {
        const shipping = totalPrice < 500 ? 50 : 0;
        setShippingCharge(shipping);
        setFinalAmount(totalPrice - discount + shipping);
    }, [totalPrice, discount]);


    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return toast.error("Enter a coupon code");
        try {
            const res = await axios.post(
                `${API_URL}/api/coupons/apply`,
                { code: couponCode, totalAmount: totalPrice },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { discountAmount, message } = res.data;
            setDiscount(discountAmount);
            toast.success(message || "Coupon applied successfully!");
        } catch (err: any) {
            // Safely extract error message
            const message =
                err.response?.data?.message ||
                err.message?.split("\n")[0] || // remove stack trace part
                "Invalid or expired coupon";

            toast.error(message);
            setDiscount(0);
        }

    };

    const handleCheckout = async () => {
        if (!selectedAddress) return toast.error("Please select an address");
        if (!paymentMethod) return toast.error("Please select a payment method");

        setLoading(true); // Start spinner
        try {
            const res = await axios.post(
                `${API_URL}/api/cart/checkout`,
                {
                    address: selectedAddress,
                    paymentType: paymentMethod,
                    discount,
                    shippingCharge,
                    finalAmount,
                    items: cartItems.map((item: CartItem) => ({
                        productId: item.product._id,
                        variantId: item.variant._id,
                        quantity: item.quantity,
                        price: item.price,
                        weight: item.variant.weight,
                    })),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (paymentMethod === "COD") {
                toast.success("COD Order placed successfully!");
                setCartCount(0);
                navigate("/success");
            } else {
                const { razorpayOrder, orderId } = res.data;
                const options = {
                    key: razorpayKey,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: "Blossomhoney Store",
                    description: "Order Payment",
                    order_id: razorpayOrder.id,
                    handler: async (response: any) => {
                        try {
                            await axios.post(
                                `${API_URL}/api/cart/payment/verify`,
                                {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderId,
                                },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            toast.success("Payment successful! Order placed.");
                            setCartCount(0);
                            navigate("/success");
                        } catch {
                            toast.error("Payment verification failed!");
                        } finally {
                            setLoading(false);
                        }
                    },
                    theme: { color: "#f59e0b" },
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Checkout failed");
        } finally {
            setLoading(false); // Stop spinner
        }
    };


    // 🏠 Add Address Handler
    const handleAddAddress = async () => {
        const { fullName, phone, street, city, state, postalCode } = newAddress;

        if (!fullName || !phone || !street || !city || !state || !postalCode)
            return toast.error("All fields are required");
        if (!/^\d{10}$/.test(phone))
            return toast.error("Phone number must be exactly 10 digits");

        try {
            await axios.post(`${API_URL}/api/user/addresses`, newAddress, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Address added successfully!");
            setShowAddForm(false);
            setNewAddress({
                fullName: "",
                phone: "",
                street: "",
                city: "",
                state: "",
                postalCode: "",
                country: "India",
            });
            const res = await axios.get(`${API_URL}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAddresses(res.data.addresses || []);
        } catch {
            toast.error("Failed to add address");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <ToastContainer position="top-right" autoClose={2000} />
            <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8">
                <h2 className="text-3xl font-bold text-center text-amber-600 mb-8">
                    Checkout
                </h2>

                {/* 🏠 Address Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Delivery Address
                        </h3>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="text-amber-600 hover:text-amber-700 font-medium"
                        >
                            {showAddForm ? "Cancel" : "+ Add New"}
                        </button>
                    </div>

                    {showAddForm && (
                        <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg mb-4 bg-gray-50">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={newAddress.fullName}
                                onChange={(e) =>
                                    setNewAddress({ ...newAddress, fullName: e.target.value })
                                }
                                className="border p-2 rounded"
                            />
                            <input
                                type="text"
                                placeholder="Phone (10 digits)"
                                maxLength={10}
                                value={newAddress.phone}
                                onChange={(e) =>
                                    setNewAddress({
                                        ...newAddress,
                                        phone: e.target.value.replace(/\D/g, ""),
                                    })
                                }
                                className="border p-2 rounded"
                            />
                            <input
                                type="text"
                                placeholder="Street"
                                value={newAddress.street}
                                onChange={(e) =>
                                    setNewAddress({ ...newAddress, street: e.target.value })
                                }
                                className="border p-2 rounded col-span-2"
                            />
                            <input
                                type="text"
                                placeholder="City"
                                value={newAddress.city}
                                onChange={(e) =>
                                    setNewAddress({ ...newAddress, city: e.target.value })
                                }
                                className="border p-2 rounded"
                            />
                            <input
                                type="text"
                                placeholder="State"
                                value={newAddress.state}
                                onChange={(e) =>
                                    setNewAddress({ ...newAddress, state: e.target.value })
                                }
                                className="border p-2 rounded"
                            />
                            <input
                                type="text"
                                placeholder="Postal Code"
                                value={newAddress.postalCode}
                                onChange={(e) =>
                                    setNewAddress({ ...newAddress, postalCode: e.target.value })
                                }
                                className="border p-2 rounded"
                            />
                            <button
                                onClick={handleAddAddress}
                                className="bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition col-span-2"
                            >
                                Save Address
                            </button>
                        </div>
                    )}

                    {addresses.length > 0 ? (
                        <div className="space-y-3 mb-6">
                            {addresses.map((addr) => (
                                <label
                                    key={addr._id}
                                    className={`block border p-3 rounded-lg cursor-pointer transition ${selectedAddress === addr._id
                                        ? "border-amber-500 bg-amber-50"
                                        : "border-gray-300 hover:border-amber-300"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="address"
                                        value={addr._id}
                                        onChange={() => setSelectedAddress(addr._id!)}
                                        checked={selectedAddress === addr._id}
                                        className="mr-2"
                                    />
                                    <span className="font-medium">{addr.fullName}</span> — {addr.phone}
                                    <p className="text-sm text-gray-600">
                                        {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                                    </p>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 mb-4">
                            No addresses found. Please add one.
                        </p>
                    )}
                </div>

                {/* 💳 Payment Method */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Payment Method
                    </h3>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="payment"
                                value="COD"
                                checked={paymentMethod === "COD"}
                                onChange={() => setPaymentMethod("COD")}
                            />
                            Cash on Delivery
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="payment"
                                value="RAZORPAY"
                                checked={paymentMethod === "RAZORPAY"}
                                onChange={() => setPaymentMethod("RAZORPAY")}
                            />
                            Razorpay
                        </label>
                    </div>
                </div>

                {/* 🎟️ Coupon Section + Order Summary */}
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>

                        {!discount ? (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Enter coupon"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="border px-3 py-1 rounded w-32"
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    className="bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600 text-sm"
                                >
                                    Apply
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 bg-green-50 border border-green-400 px-3 py-1 rounded-lg">
                                <span className="text-green-700 font-medium">
                                    Coupon “{couponCode}” applied ✓
                                </span>
                                <button
                                    onClick={() => {
                                        setCouponCode("");
                                        setDiscount(0);
                                        toast.info("Coupon removed");
                                    }}
                                    className="text-red-600 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>


                    {cartItems.map((item: CartItem) => (
                        <div
                            key={item.variant._id}
                            className="flex justify-between border-b py-2 text-sm"
                        >
                            <span className="font-medium text-gray-800">
                                {item.product.name} ({item.variant.weight}) × {item.quantity}
                            </span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}

                    <div className="flex justify-between mt-3">
                        <span>Subtotal:</span>
                        <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-green-600 font-medium mt-2">
                            <span>Discount:</span>
                            <span>- ₹{discount.toFixed(2)}</span>
                        </div>
                    )}
                    {shippingCharge > 0 && (
                        <div className="flex justify-between text-blue-600 mt-2">
                            <span>Shipping:</span>
                            <span>₹{shippingCharge.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg mt-4 border-t pt-3">
                        <span>Total Payable:</span>
                        <span>₹{finalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className={`w-full mt-8 flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-xl hover:bg-amber-600 transition text-lg font-semibold ${loading ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                >
                    {loading && (
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                        </svg>
                    )}
                    {loading ? "Processing..." : "Place Order"}
                </button>

            </div>
        </div>
    );
};
