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

export default function ProductReviewCarousel() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/products`); // your products API
                const allReviews: Review[] = [];

                res.data.products.forEach((product: Product) => {
                    if (product.reviews && product.reviews.length > 0) {
                        allReviews.push(...product.reviews);
                    }
                });

                // Sort by createdAt descending
                allReviews.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                // Take at least 4 reviews
                setReviews(allReviews.slice(0, Math.max(allReviews.length, 4)));
            } catch (err) {
                console.error("Failed to fetch product reviews", err);
            }
        };

        fetchReviews();
    }, []);

    if (reviews.length === 0)
        return <p className="text-center text-gray-500 py-16">No reviews yet.</p>;

    const displayReviews = [...reviews, ...reviews]; // duplicate for continuous scroll

    return (
        <section className="py-16 md:py-24 bg-amber-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Heading */}
                <div className="text-center mb-12">
                    <h2 className="font-serif text-4xl md:text-5xl font-normal mb-4 text-amber-800">
                        What Our Customers Say
                    </h2>
                    <p className="text-lg text-gray-600">Trusted by honey lovers everywhere</p>
                </div>

                {/* Continuous Scroll */}
                <div className="flex space-x-6 animate-scroll">
                    {displayReviews.map((review, index) => (
                        <div
                            key={review._id + index} // unique key for duplicated array
                            className="min-w-[300px] bg-white shadow-md rounded-2xl p-6 flex-shrink-0"
                        >
                            <div className="flex gap-1 mb-4 text-amber-500">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                                ))}
                            </div>

                            <p className="text-gray-700 mb-4 leading-relaxed">“{review.comment}”</p>
                            <p className="font-semibold text-amber-800">{review.username}</p>
                            <p className="text-xs text-gray-400 mt-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tailwind animation */}
            <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          display: flex;
          gap: 24px;
          animation: scroll 10s linear infinite;
        }
      `}</style>
        </section>
    );
}
