import React, { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";

const Cart: React.FC = () => {
    const [cartItems, setCartItems] = useState([
        {
            id: "1",
            name: "Organic Honey Jar",
            price: 15.99,
            quantity: 2,
            image: "https://via.placeholder.com/120",
        },
        {
            id: "2",
            name: "Raw Almond Pack",
            price: 9.49,
            quantity: 1,
            image: "https://via.placeholder.com/120",
        },
        {
            id: "3",
            name: "Green Tea Pouch",
            price: 6.25,
            quantity: 3,
            image: "https://via.placeholder.com/120",
        },
    ]);

    // Increment quantity
    const handleIncrement = (id: string) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    };

    // Decrement quantity
    const handleDecrement = (id: string) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        );
    };

    // Remove item
    const handleRemove = (id: string) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    // Calculate total
    const totalPrice = useMemo(() => {
        return cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }, [cartItems]);

    // Checkout
    const handleCheckout = () => {
        alert(`Proceeding to checkout. Total: $${totalPrice.toFixed(2)}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
            <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
                    🛒 Your Shopping Cart
                </h2>

                {cartItems.length === 0 ? (
                    <p className="text-gray-500 text-center">Your cart is empty.</p>
                ) : (
                    <div className="flex flex-col gap-5">
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-4 items-center p-4 border rounded-xl hover:shadow-md transition"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-20 h-20 rounded-lg object-cover"
                                />

                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{item.name}</h3>

                                    <div className="text-sm text-gray-500 flex justify-between">
                                        <span>Price:</span>
                                        <span className="font-medium text-gray-700">
                                            &#8377;{item.price.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDecrement(item.id)}
                                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                                -
                                            </button>
                                            <span className="font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => handleIncrement(item.id)}
                                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Item Total:</p>
                                            <p className="font-semibold text-gray-800">
                                                &#8377;{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="text-red-500 hover:text-red-700 transition"
                                    title="Remove from cart"
                                >
                                    <Trash2 />
                                </button>
                            </div>
                        ))}

                        <div className="mt-6 border-t pt-4 flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-700">
                                Total Amount
                            </span>
                            <span className="text-xl font-bold text-gray-900">
                                &#8377;{totalPrice.toFixed(2)}
                            </span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
