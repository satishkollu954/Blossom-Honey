import React, { useState, useMemo, useEffect } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";
import { useCookies } from "react-cookie";

interface Product {
    _id: string;
    name: string;
    images: string[];
}

interface CartItem {
    _id: string;
   // variantId: string;
    product: Product;
    variant: {
        _id: string;
        weight: string;
    };
    price: number;
    quantity: number;
    stock: number;
}


interface CartResponse {
    items: CartItem[];
    totalAmount: number;
}

const Cart: React.FC = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cookies] = useCookies(["token"]);

    const token = cookies.token;

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const res = await axios.get<CartResponse>("http://localhost:3005/api/cart", {
                    headers: { Authorization: token ? `Bearer ${token}` : "" },
                });
                setCartItems(res.data.items || []);
            } catch (error) {
                console.error("Failed to load cart:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, [token]);

    // Increment quantity
    const handleIncrement = async (productId: string, variantId: string) => {
        const item = cartItems.find(
            (i) => i.product._id === productId && i.variant._id === variantId
        );
        if (!item) return;

        const newQuantity = item.quantity + 1;
        console.log(variantId, productId, newQuantity);
        try {
            await axios.put(
                "http://localhost:3005/api/cart/update",
                { productId, variantId, quantity: newQuantity },
                { headers: { Authorization: token ? `Bearer ${token}` : "" } }
            );

            // Update local state
            setCartItems((prev) =>
                prev.map((i) =>
                    i.product._id === productId && i.variant._id === variantId
                        ? { ...i, quantity: newQuantity }
                        : i
                )
            );
        } catch (error) {
            console.error("Failed to increment quantity:", error);
        }
    };

    // Decrement quantity
    const handleDecrement = async (productId: string, variantId: string) => {
        const item = cartItems.find(
            (i) => i.product._id === productId && i.variant._id === variantId
        );
        if (!item || item.quantity <= 1) return;

        const newQuantity = item.quantity - 1;

        try {
            await axios.put(
                "http://localhost:3005/api/cart/update",
                { productId, variantId, quantity: newQuantity },
                { headers: { Authorization: token ? `Bearer ${token}` : "" } }
            );

            // Update local state
            setCartItems((prev) =>
                prev.map((i) =>
                    i.product._id === productId && i.variant._id === variantId
                        ? { ...i, quantity: newQuantity }
                        : i
                )
            );
        } catch (error) {
            console.error("Failed to decrement quantity:", error);
        }
    };


    // Remove item
    const handleRemove = async (productId: string, variantId: string) => {
        try {
            await axios.delete(`http://localhost:3005/api/cart/remove/${productId}/${variantId}`, {
                headers: { Authorization: token ? `Bearer ${token}` : "" },
                data: { productId, variantId },
            });

            setCartItems((prev) =>
                prev.filter(
                    (item) => !(item.product._id === productId && item.variant._id === variantId)
                )
            );
        } catch (error) {
            console.error("Failed to remove item:", error);
        }
    };

    // Calculate total
    const totalPrice = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cartItems]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-yellow-600 text-lg">
                Loading your cart...
            </div>
        );
    }

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
                                key={`${item.product._id}-${item.variant._id}`}
                                className="flex gap-4 items-center p-4 border rounded-xl hover:shadow-md transition"
                            >
                                <img
                                    src={item.product.images?.[0] || "https://via.placeholder.com/100"}
                                    alt={item.product?.name}
                                    className="w-20 h-20 rounded-lg object-cover"
                                />

                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{item.product.name}</h3>

                                    <div className="text-sm text-gray-500 flex justify-between">
                                        <span>Price:</span>
                                        <span className="font-medium text-gray-700 ">
                                            ₹{item.price.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex justify-between">
                                        <span>Weight:</span>
                                        <span className="font-medium text-gray-700">
                                            {item.variant?.weight || "-"}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDecrement(item.product._id, item.variant._id)}
                                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                                disabled={item.quantity <= 1} // Disable decrement if quantity is 1
                                            >
                                                -
                                            </button>
                                            <span className="font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => handleIncrement(item.product._id, item.variant._id)}
                                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                                disabled={item.quantity >= (item.stock || Infinity)} // Disable increment if quantity reaches stock
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Item Total:</p>
                                            <p className="font-semibold text-gray-800">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRemove(item.product._id, item.variant._id)}
                                    className="text-red-500 hover:text-red-700 transition"
                                    title="Remove from cart"
                                >
                                    <Trash2 />
                                </button>
                            </div>
                        ))}

                        <div className="mt-6 border-t pt-4 flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                            <span className="text-xl font-bold text-gray-900">
                                ₹{totalPrice.toFixed(2)}
                            </span>
                        </div>

                        <button
                            onClick={() => alert(`Proceeding to checkout. Total: ₹${totalPrice.toFixed(2)}`)}
                            className="w-full mt-4 bg-yellow-500 text-white py-3 rounded-xl font-medium hover:bg-yellow-600 transition"
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
