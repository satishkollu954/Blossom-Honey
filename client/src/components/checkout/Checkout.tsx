import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

interface Address {
    _id?: string;
    fullName: string;
    phone: string;
    street?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    landmark?: string;
    isDefault?: boolean;
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

    const handleAddAddress = async () => {
        // --- Validation ---
        if (
            !newAddress.fullName.trim() ||
            !newAddress.phone.trim() ||
            !newAddress.street?.trim() ||
            !newAddress.city.trim() ||
            !newAddress.state.trim() ||
            !newAddress.postalCode.trim()
        ) {
            return toast.error("All fields are required!");
        }

        // Validate phone number (10 digits, numbers only)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(newAddress.phone)) {
            return toast.error("Phone number must be 10 digits!");
        }

        try {
            await axios.post(
                "http://localhost:3005/api/user/addresses",
                newAddress,
                { headers: { Authorization: `Bearer ${token}` } }
            );
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
            const res = await axios.get("http://localhost:3005/api/user/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAddresses(res.data.addresses || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to add address");
        }
    };


    const handleCheckout = async () => {
        if (!selectedAddress) return toast.error("Please select an address");
        if (!paymentMethod) return toast.error("Please select a payment method");

        try {
            // --- Call backend checkout endpoint ---
            const res = await axios.post(
                "http://localhost:3005/api/cart/checkout",
                {
                    address: selectedAddress,
                    paymentType: paymentMethod,
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
                navigate("/orders");
            } else if (paymentMethod === "RAZORPAY") {
                const { razorpayOrder, orderId } = res.data;

                const options = {
                    key: razorpayKey, // add your Razorpay key in .env
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: "My Store",
                    description: "Order Payment",
                    order_id: razorpayOrder.id,
                    handler: async (response: any) => {
                        try {
                            await axios.post(
                                "http://localhost:3005/api/cart/payment/verify",
                                {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderId,
                                },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            toast.success("Payment successful! Order placed.");
                            navigate("/orders");
                        } catch (err) {
                            console.error(err);
                            toast.error("Payment verification failed!");
                        }
                    },
                    prefill: {
                        name: "",
                        email: "",
                        contact:
                            addresses.find((a) => a._id === selectedAddress)?.phone || "",
                    },
                    theme: { color: "#f59e0b" },
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Checkout failed");
        }
    };

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-600">
                No items in cart.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <ToastContainer position="top-right" autoClose={2000} />
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-center mb-6 text-amber-600">
                    Checkout
                </h2>

                {/* Address Section */}
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Select Delivery Address
                </h3>
                {addresses.length > 0 ? (
                    <div className="space-y-3 mb-4">
                        {addresses.map((addr) => (
                            <label
                                key={addr._id}
                                className={`block border p-3 rounded-lg cursor-pointer ${selectedAddress === addr._id
                                    ? "border-amber-500 bg-amber-50"
                                    : "border-gray-300"
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
                                <span className="font-medium">{addr.fullName}</span> —{" "}
                                {addr.phone}
                                <p className="text-sm text-gray-600">
                                    {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                                </p>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-4">No addresses found. Please add one.</p>
                )}

                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="text-amber-600 font-medium mb-6"
                    >
                        + Add New Address
                    </button>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <input
                            placeholder="Full Name"
                            value={newAddress.fullName}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, fullName: e.target.value })
                            }
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Phone"
                            value={newAddress.phone}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, phone: e.target.value })
                            }
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Street"
                            value={newAddress.street}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, street: e.target.value })
                            }
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="City"
                            value={newAddress.city}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, city: e.target.value })
                            }
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="State"
                            value={newAddress.state}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, state: e.target.value })
                            }
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Postal Code"
                            value={newAddress.postalCode}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, postalCode: e.target.value })
                            }
                            className="border px-3 py-2 rounded"
                        />
                        <button
                            onClick={handleAddAddress}
                            className="col-span-2 bg-green-500 text-white py-2 rounded hover:bg-green-600"
                        >
                            Save Address
                        </button>
                    </div>
                )}

                {/* Payment Method */}
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Payment Method
                </h3>
                <div className="flex gap-4 mb-6">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="payment"
                            value="COD"
                            checked={paymentMethod === "COD"}
                            onChange={() => setPaymentMethod("COD")}
                        />
                        Cash on Delivery
                    </label>
                    <label className="flex items-center gap-2">
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

                {/* Cart Summary */}
                <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Order Summary
                    </h3>
                    {cartItems.map((item: CartItem) => (
                        <div
                            key={item.variant._id}
                            className="flex justify-between border-b py-2 text-sm"
                        >
                            <span>
                                {item.product.name} ({item.variant.weight})
                            </span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between mt-3 font-semibold text-lg">
                        <span>Total:</span>
                        <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                </div>

                <button
                    onClick={handleCheckout}
                    className="w-full mt-6 bg-amber-500 text-white py-3 rounded-xl hover:bg-amber-600 transition"
                >
                    Place Order
                </button>
            </div>
        </div>
    );
};
