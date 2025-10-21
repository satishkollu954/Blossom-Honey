import React, { useState } from "react";
import axios from "axios";
import { Star, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
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
    // State to hold the selected File objects for upload
    const [images, setImages] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [cookies] = useCookies(["token"]);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    if (!isOpen) return null;

    // --- NEW: Image Handling Functions ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            // Convert FileList to Array and append to existing images
            const newFiles = Array.from(files);
            const totalImages = images.length + newFiles.length;

            // Limit to a reasonable number, e.g., 4 images
            if (totalImages > 4) {
                toast.warn("Maximum 4 images allowed per review.");
                setImages([...images, ...newFiles].slice(0, 4));
            } else {
                setImages((prev) => [...prev, ...newFiles]);
            }
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };
    // --- END: Image Handling Functions ---


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.warn("Please provide a rating (1-5 stars).");
            return;
        }

        setLoading(true);

        // --- KEY CHANGE: Use FormData for files ---
        const formData = new FormData();
        formData.append("rating", rating.toString());
        formData.append("comment", comment);

        images.forEach((file) => {
            formData.append("images", file); // 'images' must match the field name your backend expects for files
        });
        // --- END KEY CHANGE ---

        try {
            await axios.post(
                `${API_URL}/api/products/${productId}/review`, // Your review submission endpoint
                formData, // Send FormData object
                {
                    headers: {
                        Authorization: `Bearer ${cookies.token}`,
                        // Content-Type: multipart/form-data is automatically set by Axios when using FormData
                    },
                }
            );

            toast.success(`Review submitted successfully for ${productName}!`);
            onReviewSubmitted(productId);
            onClose();
        } catch (error: any) {
            console.error("Review submission failed:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to submit review.";

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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-6 relative max-h-[90vh] overflow-y-auto"> {/* Added max-height and overflow */}
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
                    {/* Rating Stars (UNCHANGED) */}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Your Rating
                        </label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={32}
                                    fill={star <= rating ? "#f59e0b" : "none"}
                                    stroke={star <= rating ? "#f59e0b" : "#d1d5db"}
                                    className="cursor-pointer transition-colors duration-150"
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Comment (UNCHANGED) */}
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
                            rows={3} // Reduced rows slightly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Tell us what you loved or what could be improved..."
                            disabled={loading}
                        />
                    </div>

                    {/* NEW: Image Upload Section */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Add Images (Max 4)
                        </label>

                        {/* Image Preview */}
                        <div className="flex flex-wrap gap-3 mb-3">
                            {images.map((file, index) => (
                                <div key={index} className="relative w-20 h-20 rounded-lg border overflow-hidden">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Review image ${index}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-0 right-0 bg-red-500 bg-opacity-70 p-1 rounded-bl-lg text-white hover:bg-opacity-100"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}

                            {/* File Input Trigger (Appears if max limit not reached) */}
                            {images.length < 3 && (
                                <label
                                    htmlFor="image-upload"
                                    className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <ImageIcon size={20} className="text-gray-500" />
                                    <span className="text-xs text-gray-500">Add</span>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        disabled={loading}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                    {/* END NEW: Image Upload Section */}


                    {/* Submit Button (UNCHANGED) */}
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