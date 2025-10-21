import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

interface Variant {
    finalPrice: number;
}

interface Product {
    _id: string;
    name: string;
    description: string;
    images: string[];
    variants: Variant[];
}

export function FeaturedProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [cookies] = useCookies(["token"]);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetch(`${API_URL}/api/products/`, {
            headers: { Authorization: `Bearer ${cookies.token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                const fetchedProducts = data?.products || [];
                setProducts(fetchedProducts);
            })
            .catch((err) => console.error("Error fetching products:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleCardClick = (productId: string) => {
        navigate(`/product/${productId}`);
    };

    if (loading) {
        return (
            <section className="py-16 bg-background text-center">
                <p className="text-lg font-medium">Loading products...</p>
            </section>
        );
    }

    return (
        <section className="py-16 md:py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="font-serif text-4xl md:text-5xl font-normal mb-4">
                        Our Honey Collection 🍯
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Each jar is carefully crafted to bring you the purest taste of nature.
                    </p>
                </div>

                {/* Continuous Carousel */}
                <div className="overflow-hidden relative">
                    <div
                        className="flex animate-scroll whitespace-nowrap space-x-4"
                        style={{ display: "inline-flex" }}
                    >
                        {[...products, ...products].map((item, index) => (
                            <div
                                key={`${item._id}-${index}`}
                                className="flex-shrink-0 w-56 sm:w-60 md:w-64 cursor-pointer"
                                onClick={() => handleCardClick(item._id)}
                            >
                                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full transform hover:scale-[1.03]">
                                    {/* Focus more on image */}
                                    <div className="h-56 sm:h-64 md:h-72 bg-gray-100 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={item.images?.[0] || "/placeholder.png"}
                                            alt={item.name}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="p-2 sm:p-3 flex flex-col flex-grow">
                                        <h3 className="text-md sm:text-lg font-semibold text-gray-800 line-clamp-1">
                                            {item.name}
                                        </h3>
                                        {/* <p className="text-sm text-gray-500 line-clamp-2">
                                            {item.description}
                                        </p> */}
                                        <p className="text-md font-bold text-amber-600 mt-auto">
                                            ₹{item.variants?.[0]?.finalPrice || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Tailwind + Custom CSS */}
            <style>{`
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
        </section>
    );
}
