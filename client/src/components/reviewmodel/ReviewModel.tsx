// src/components/ReviewFormModal.tsx (Create this new file)

import React, { useState } from "react";
import axios from "axios";
import { Star, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useCookies } from "react-cookie";

interface ReviewFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    onReviewSubmitted: (productId: string) => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
    isOpen,
    onClose,
    productId,
    productName,
    onReviewSubmitted,
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [cookies] = useCookies(["token"]);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.warn("Please provide a rating (1-5 stars).");
            return;
        }

        setLoading(true);
        try {

            await axios.post(
                `${API_URL}/api/products/${productId}`, // Assuming this is your review submission endpoint
                {
                    rating,
                    comment,
                    // You might need to send the orderId if your backend needs it for additional checks
                },
                {
                    headers: { Authorization: `Bearer ${cookies.token}` },
                }
            );

            toast.success(`Review submitted successfully for ${productName}!`);
            onReviewSubmitted(productId); // Inform the parent component (MyOrders)
            onClose();
        } catch (error: any) {
            console.error("Review submission failed:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to submit review.";

            // This is the key part for enforcing the "one review" rule
            if (errorMessage.includes("already reviewed")) {
                toast.error(`You have already reviewed ${productName}.`);
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <ToastContainer position="top-center" autoClose={1500} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                    disabled={loading}
                >
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                    Review {productName}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    Share your experience with this product. (Max one review per product)
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Rating Stars */}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Your Rating
                        </label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={32}
                                    fill={star <= rating ? "#f59e0b" : "none"} // amber-500
                                    stroke={star <= rating ? "#f59e0b" : "#d1d5db"} // gray-300
                                    className="cursor-pointer transition-colors duration-150"
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                        <label
                            htmlFor="comment"
                            className="block text-gray-700 font-semibold mb-2"
                        >
                            Comment (Optional)
                        </label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Tell us what you loved or what could be improved..."
                            disabled={loading}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={`w-full py-3 rounded-lg text-white font-bold transition ${loading
                            ? "bg-amber-400 cursor-not-allowed"
                            : "bg-amber-600 hover:bg-amber-700"
                            }`}
                        disabled={loading}
                    >
                        {loading ? "Submitting..." : "Submit Review"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// **NOTE ON BACKEND:** You need to implement a POST endpoint at `/api/products/:productId/review`
// that takes `rating` and `comment`, and **crucially**, checks if `req.user._id` (from the token)
// already exists in the `Product.reviews` array for the given product.