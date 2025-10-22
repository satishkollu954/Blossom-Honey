import { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";

interface Review {
    _id: string;
    username: string;
    rating: number;
    comment: string;
    createdAt: string;
}

interface Product {
    _id: string;
    name: string;
    reviews: Review[];
}

export default function ProductReviewRotator() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const REVIEWS_PER_PAGE = 3;
    const INTERVAL = 5000; // 5 seconds

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/products`);
                const allReviews: Review[] = [];

                res.data.products.forEach((product: Product) => {
                    if (product.reviews?.length) {
                        allReviews.push(...product.reviews);
                    }
                });

                // Sort by latest
                allReviews.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                setReviews(allReviews);
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            }
        };

        fetchReviews();
    }, []);

    // Rotate reviews
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + REVIEWS_PER_PAGE) % reviews.length);
        }, INTERVAL);
        return () => clearInterval(interval);
    }, [reviews]);

    if (reviews.length === 0)
        return <p className="text-center text-gray-500 py-16">No reviews yet.</p>;

    const currentReviews = reviews.slice(
        currentIndex,
        currentIndex + REVIEWS_PER_PAGE
    );

    // If we reach end and not enough reviews, wrap around
    if (currentReviews.length < REVIEWS_PER_PAGE) {
        currentReviews.push(
            ...reviews.slice(0, REVIEWS_PER_PAGE - currentReviews.length)
        );
    }

    return (
        <section className="py-16 md:py-24 bg-amber-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Heading */}
                <div className="text-center mb-12">
                    <h2 className="font-serif text-4xl md:text-5xl font-normal mb-4 text-amber-800">
                        What Our Customers Say
                    </h2>
                    <p className="text-lg text-gray-600">Trusted by honey lovers everywhere</p>
                </div>

                {/* Reviews */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {currentReviews.map((review) => (
                        <div
                            key={review._id}
                            className="bg-white shadow-md rounded-2xl p-6 transition-opacity duration-1000 opacity-100"
                        >
                            <div className="flex gap-1 mb-4 text-amber-500">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                                ))}
                            </div>

                            <p className="text-gray-700 mb-4 leading-relaxed break-all">
                                “{review.comment}”
                            </p>

                            <p className="font-semibold text-amber-800">{review.username}</p>
                            <p className="text-xs text-gray-400 mt-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
