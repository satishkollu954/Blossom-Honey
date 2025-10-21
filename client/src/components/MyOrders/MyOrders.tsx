import { useEffect, useState } from "react";
import axios from "axios";
import { Package, Truck, CreditCard, Calendar } from "lucide-react";
import { useCookies } from "react-cookie";
import { toast, ToastContainer } from "react-toastify";
import { ReviewFormModal } from "../reviewmodel/ReviewModel"; // Import the new modal component

// --- INTERFACES (UNCHANGED) ---
interface Variant {
    weight?: string;
    type?: string;
    packaging?: string;
}

interface OrderItem {
    product: string | { _id: string; name: string }; // 👈 Allow both string or populated object
    name: string;
    variant?: Variant;
    price: number;
    quantity: number;
    images: string[];
}

// ... (Delivery and ShippingAddress interfaces are unchanged) ...

interface Delivery {
    partner?: string;
    trackingId?: string;
    deliveryStatus?: string;
    estimatedDeliveryDate?: string;
}

interface ShippingAddress {
    fullName: string;
    houseNo: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    landmark?: string;
    phone: string;
}

interface Order {
    _id: string;
    products: OrderItem[];
    totalAmount: number;
    discountAmount: number;
    paymentType: string;
    paymentStatus: string;
    status: string;
    createdAt: string;
    deliveredAt?: string;
    isReturned?: boolean;
    delivery?: Delivery;
    coupon?: { code?: string };
    shippingAddress?: ShippingAddress;
}

// --- NEW INTERFACE FOR MODAL STATE ---
interface ModalState {
    isOpen: boolean;
    productId: string;
    productName: string;
}

export function MyOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [cookies] = useCookies(["token"]);

    // State to track the product ID and name for the review modal
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        productId: "",
        productName: "",
    });

    // State to locally manage which products are reviewed (optional but helpful for UX)
    // Map of productId to boolean (true if reviewed)
    const [reviewedProducts, setReviewedProducts] = useState<Record<string, boolean>>({});

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchOrders();
        // **OPTIONAL ENHANCEMENT**: Fetch initial review status for all products in all orders.
        // This would require a new, dedicated endpoint on the backend.
        // For simplicity, we rely on the `onReviewSubmitted` function for real-time updates.
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/orders/`, {
                headers: { Authorization: `Bearer ${cookies.token}` },
            });
            setOrders(res.data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast.error("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (orderId: string) => {
        try {
            await axios.post(
                `${API_URL}/api/orders/${orderId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${cookies.token}` } }
            );
            toast.success("Order cancelled successfully");
            fetchOrders();
        } catch (error) {
            console.error(error);
            toast.error("Failed to cancel order");
        }
    };

    // --- NEW REVIEW FUNCTIONS ---

    const openReviewModal = (productId: string, productName: string) => {
        console.log("Opening review modal for product:", productId, productName);
        setModalState({
            isOpen: true,
            productId,
            productName,
        });
    };


    const closeReviewModal = () => {
        setModalState({
            isOpen: false,
            productId: "",
            productName: "",
        });
    };

    const handleReviewSubmitted = (productId: string) => {
        // Mark the product as reviewed locally after successful submission
        setReviewedProducts((prev) => ({
            ...prev,
            [productId]: true,
        }));
    };

    // --- END NEW REVIEW FUNCTIONS ---

    if (loading) {
        return (
            <div className="flex justify-center items-center h-60">
                <p className="text-gray-500 text-lg animate-pulse">
                    Loading your orders...
                </p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex justify-center items-center h-60">
                <p className="text-gray-500 italic text-lg">No orders found.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            <ToastContainer position="top-center" autoClose={1500} />
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center sm:text-left">
                My Orders
            </h1>

            <div className="grid grid-cols-1 gap-6">
                {orders.map((order) => {
                    const isDelivered = order.status === "Delivered";

                    return (
                        <div
                            key={order._id}
                            className="bg-white shadow-lg rounded-2xl border border-gray-200 p-5 sm:p-6 hover:shadow-xl transition-all"
                        >
                            {/* ... (Order Header - UNCHANGED) ... */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b pb-3">
                                <div>
                                    <h2 className="font-semibold text-gray-800">
                                        Order ID:{" "}
                                        <span className="text-amber-600">{order._id}</span>
                                    </h2>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Calendar size={14} />{" "}
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 text-sm font-semibold rounded-full ${order.status === "Delivered"
                                        ? "bg-green-100 text-green-700"
                                        : order.status === "Cancelled"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700"
                                        }`}
                                >
                                    {order.status}
                                </span>
                            </div>

                            {/* Products (UPDATED) */}
                            <div className="space-y-4 mb-4">
                                {order.products.map((item, index) => {
                                    // Determine if the review button should be disabled
                                    const productId =
                                        typeof item.product === "object" ? item.product._id : item.product;
                                    const hasReviewed = reviewedProducts[productId];


                                    return (
                                        <div
                                            key={index}
                                            className="flex flex-col sm:flex-row gap-4 border-b pb-4 last:border-b-0"
                                        >
                                            <img
                                                src={item.images?.[0] || "/placeholder.png"}
                                                alt={item.name}
                                                className="w-24 h-24 object-cover rounded-lg border"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                                                {/* ... (Product Details - UNCHANGED) ... */}
                                                {item.variant && (
                                                    <p className="text-sm text-gray-500">
                                                        {item.variant.weight && `Weight: ${item.variant.weight}`}{" "}
                                                        {item.variant.type && `• Type: ${item.variant.type}`}{" "}
                                                        {item.variant.packaging &&
                                                            `• Packaging: ${item.variant.packaging}`}
                                                    </p>
                                                )}
                                                <p className="text-gray-700">
                                                    Qty: <span className="font-medium">{item.quantity}</span>
                                                </p>
                                                <p className="text-gray-700">
                                                    Price:{" "}
                                                    <span className="font-semibold text-amber-700">
                                                        ₹{item.price.toFixed(2)}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* NEW: Review Button */}
                                            {isDelivered && (
                                                <div className="sm:self-center sm:ml-auto">
                                                    <button
                                                        onClick={() => openReviewModal(productId, item.name)}
                                                        disabled={hasReviewed}
                                                        className={`px-3 py-1 text-sm font-semibold rounded-lg transition ${hasReviewed
                                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                            : "bg-amber-500 text-white hover:bg-amber-600"
                                                            }`}
                                                    >
                                                        {hasReviewed ? "Reviewed" : "Write a Review"}
                                                    </button>

                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ... (Order Summary and Delivery Info - UNCHANGED) ... */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <CreditCard size={16} className="text-amber-600" />
                                    Payment:{" "}
                                    <span className="font-medium">
                                        {order.paymentType} ({order.paymentStatus})
                                    </span>
                                </div>


                                <div className="flex items-center gap-2">
                                    <Package size={16} className="text-amber-600" />
                                    Total:{" "}
                                    <span className="font-semibold text-amber-700">
                                        ₹{(order.totalAmount - (order.discountAmount || 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {(order.delivery || order.shippingAddress) && (
                                <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Truck size={18} className="text-amber-600" />
                                        <p className="font-semibold text-gray-800">Delivery Information</p>
                                    </div>
                                    <p>
                                        Status:{" "}
                                        <span className="font-medium">
                                            {order.delivery?.deliveryStatus || order.status}
                                        </span>
                                    </p>
                                    {order.delivery?.partner && <p>Partner: {order.delivery.partner}</p>}
                                    {order.delivery?.trackingId && (
                                        <p>Tracking ID: {order.delivery.trackingId}</p>
                                    )}
                                    {order.delivery?.estimatedDeliveryDate && (
                                        <p>
                                            Estimated Delivery:{" "}
                                            <span className="font-medium">
                                                {new Date(order.delivery.estimatedDeliveryDate).toLocaleDateString()}
                                            </span>
                                        </p>
                                    )}
                                    {order.shippingAddress && (
                                        <div className="mt-2">
                                            <p className="font-semibold">Shipping Address:</p>
                                            <p>
                                                {order.shippingAddress.fullName}, {order.shippingAddress.houseNo}{" "}
                                                {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                                                {order.shippingAddress.state} - {order.shippingAddress.postalCode},{" "}
                                                {order.shippingAddress.country}
                                            </p>
                                            {order.shippingAddress.landmark && (
                                                <p>Landmark: {order.shippingAddress.landmark}</p>
                                            )}
                                            <p>Phone: {order.shippingAddress.phone}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions (UNCHANGED) */}
                            <div className="mt-4 flex gap-3">
                                {["Pending", "Processing", "Placed"].includes(order.status) && (
                                    <button
                                        onClick={() => handleCancel(order._id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Review Form Modal */}
            <ReviewFormModal
                isOpen={modalState.isOpen}
                onClose={closeReviewModal}
                productId={modalState.productId}
                productName={modalState.productName}
                onReviewSubmitted={handleReviewSubmitted}
            />
        </div>
    );
}