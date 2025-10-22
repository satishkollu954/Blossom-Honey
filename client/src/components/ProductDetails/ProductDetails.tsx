import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCookies } from "react-cookie";
import { useCart } from "../context/cartcontext";
import { formatDistanceToNow } from "date-fns";


interface Review {
    user: string; // User ID as string
    rating: number;
    comment?: string;
    images?: string[];
    createdAt: string; // or Date
    username?: string; // optional, populate from backend for display
}

interface Variant {
    _id: string;
    weight: string;
    price: number;
    finalPrice: number;
    discount: number;
    images: string[];
    stock: number;
}

interface Product {
    _id: string;
    name: string;
    description: string;
    category: string;
    variants: Variant[];
    images: string[];
    deliveryTime: string;
    shippingCharge: number;
    reviews?: Review[];

}

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [imageIndex, setImageIndex] = useState(0);
    const [cookies] = useCookies(["token", "role"]);
    const location = useLocation();
    const { setCartCount } = useCart();
    const [isInCart, setIsInCart] = useState(false);
    const isAuthenticated = cookies.token;

    const [sameCategoryProducts, setSameCategoryProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
    const [itemsPerLoad] = useState(10);
    const [hasMore, setHasMore] = useState(true);

    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    const navigate = useNavigate();
    const carouselRef = useRef<HTMLDivElement>(null);


    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to top whenever this page loads
    }, [id]);


    // --- Fetch Product ---
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/products/product/${id}`);
                setProduct(res.data);
                setSelectedVariant(res.data.variants?.[0]);
            } catch (err) {
                console.error("Failed to fetch product", err);
            }
        };
        fetchProduct();
    }, [id]);

    // --- Fetch Same Category Products ---
    useEffect(() => {
        if (!product) return;

        const fetchSameCategory = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/products/category/${product.category}`);
                const filtered = res.data.products.filter((p: Product) => p._id !== product._id);
                setSameCategoryProducts(filtered);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSameCategory();
    }, [product]);

    // --- Fetch Categories ---
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/products/categories`);
                setCategories(res.data.categories || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCategories();
    }, []);

    // --- Fetch All Products once ---
    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/products`);
                const filteredProducts = res.data.products.filter((p: Product) => p._id !== id);
                setAllProducts(filteredProducts);
                setDisplayProducts(filteredProducts.slice(0, itemsPerLoad));
                if (filteredProducts.length <= itemsPerLoad) setHasMore(false);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAllProducts();
    }, [id, itemsPerLoad]);

    // --- Handle Lazy Loading ---
    useEffect(() => {
        const handleScroll = () => {
            if (!hasMore) return;
            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;

            if (scrollTop + windowHeight >= fullHeight * 0.7) {
                loadMoreProducts();
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [displayProducts, hasMore, allProducts]);

    const loadMoreProducts = () => {
        const nextProducts = allProducts.slice(displayProducts.length, displayProducts.length + itemsPerLoad);
        setDisplayProducts([...displayProducts, ...nextProducts]);
        if (displayProducts.length + nextProducts.length >= allProducts.length) setHasMore(false);
    };

    if (!product || !selectedVariant)
        return <div className="text-center py-12 text-yellow-600 text-lg font-medium">Loading...</div>;

    const allImages = [...(product.images || []), ...(selectedVariant.images || [])];
    const currentImage = allImages[imageIndex] || "https://via.placeholder.com/500x500?text=No+Image";

    // const nextImage = () => setImageIndex((prev) => (prev + 1) % allImages.length);
    // const prevImage = () => setImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

    const handleRedirectIfNotLoggedIn = () => navigate("/login", { state: { from: location.pathname } });

    const handleCartClick = async (productId: string, variantId: string, quantity: number) => {
        if (!isAuthenticated) return handleRedirectIfNotLoggedIn();
        try {
            const token = cookies.token;
            const res = await axios.post(
                `${API_URL}/api/cart/add`,
                { productId, variantId, quantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message || "Added to cart!");
            setCartCount((prev) => prev + 1);
            setIsInCart(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add to cart.");
        }
    };

    // --- Carousel Scroll ---
    //   const scrollCarousel = (direction: "left" | "right") => {
    //     if (!carouselRef.current) return;
    //     const scrollAmount = 300;
    //     carouselRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    //   };

    return (
        <div className="container mx-auto px-6 py-10 flex flex-col gap-1 m-0 p-0">
            <ToastContainer position="top-center" autoClose={1500} />

            {/* Product Details */}
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Images Section */}
                <div className="lg:w-1/2 flex flex-col items-center relative">
                    <div className="flex flex-col-reverse lg:flex-row-reverse w-full justify-center items-center gap-4">
                        {/* Preview Images */}
                        <div className="flex lg:flex-col flex-row justify-center lg:justify-start lg:h-[400px] lg:w-24 w-full gap-2 overflow-auto p-1">
                            {allImages.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt={`Preview ${i}`}
                                    onClick={() => setImageIndex(i)}
                                    className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 transition ${i === imageIndex
                                        ? "border-yellow-500 scale-105"
                                        : "border-transparent hover:border-gray-300"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Main Image */}
                        <div className="flex-1 flex justify-center items-center w-full">
                            <img
                                src={currentImage}
                                alt={product.name}
                                className="w-full h-[350px] sm:h-[400px] object-contain rounded-lg shadow-md bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="lg:w-1/2 flex flex-col justify-center px-2 sm:px-4">
                    <h1 className="text-2xl sm:text-3xl font-semibold mb-3 text-gray-800 text-center lg:text-left">
                        {product.name}
                    </h1>

                    <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                        <span className="text-xl sm:text-2xl font-bold text-yellow-600">
                            ₹{selectedVariant.finalPrice}
                        </span>
                        {selectedVariant.discount > 0 && (
                            <span className="text-gray-400 line-through">
                                ₹{selectedVariant.price}
                            </span>
                        )}
                    </div>

                    <div className="text-center lg:text-left">
                        <span className="text-gray-500 block">
                            Discount: {selectedVariant.discount}%
                        </span>
                        <span className="text-gray-500 block mb-4">
                            Stock: {selectedVariant.stock}
                        </span>
                    </div>

                    <p className="text-gray-700 mb-2 text-center lg:text-left">
                        Select Weight:
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
                        {product.variants.map((v) => (
                            <button
                                key={v._id}
                                onClick={() => {
                                    setSelectedVariant(v);
                                    setIsInCart(false);
                                }}
                                className={`px-4 py-2 border rounded-md text-sm sm:text-base ${selectedVariant._id === v._id
                                    ? "bg-yellow-500 text-white border-yellow-500"
                                    : "border-gray-300 hover:border-yellow-400"
                                    }`}
                            >
                                {v.weight}
                            </button>
                        ))}
                    </div>

                    {cookies.role !== "admin" && (
                        <button
                            onClick={() =>
                                !isInCart &&
                                handleCartClick(product._id, selectedVariant._id, 1)
                            }
                            disabled={isInCart || selectedVariant.stock === 0}
                            className={`w-full sm:w-auto px-6 py-3 rounded-md text-lg font-semibold transition ${selectedVariant.stock === 0 || isInCart
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-yellow-500 text-white hover:bg-yellow-600"
                                }`}
                        >
                            {selectedVariant.stock === 0
                                ? "Out of Stock"
                                : isInCart
                                    ? "Already in Cart"
                                    : "Add to Cart"}
                        </button>
                    )}

                    <div className="mt-4 text-sm text-gray-500 text-center lg:text-left">
                        <p>Delivery Time: {product.deliveryTime}</p>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-b-xl shadow-inner">
                <p className="text-gray-800 font-semibold mb-1">Description:</p>
                <p className="text-gray-600 text-sm line-clamp-3">
                    {product.description}
                </p>
            </div>



            {/* Reviews Section */}
            <div className="flex-1 p-3 bg-gray-50 rounded-xl shadow-inner max-h-80 overflow-y-auto">
                <p className="text-gray-800 font-semibold mb-3">Reviews</p>

                {/* Overall Rating Section */}
                {product.reviews && product.reviews.length > 0 ? (
                    <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                        <div>
                            <p className="text-gray-700 font-semibold">Overall Rating</p>
                            <div className="flex items-center mt-1">
                                {(() => {
                                    const averageRating =
                                        product.reviews.reduce((acc, r) => acc + r.rating, 0) /
                                        product.reviews.length;
                                    const roundedRating = Math.round(averageRating * 10) / 10;

                                    return (
                                        <>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <svg
                                                    key={i}
                                                    className={`w-5 h-5 ${i < Math.round(averageRating)
                                                        ? "text-amber-400"
                                                        : "text-gray-300"
                                                        }`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.148c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.945c.3.922-.755 1.688-1.538 1.118l-3.36-2.44a1 1 0 00-1.175 0l-3.36 2.44c-.783.57-1.838-.196-1.538-1.118l1.287-3.945a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.148a1 1 0 00.95-.69l1.286-3.946z" />
                                                </svg>
                                            ))}
                                            <span className="ml-2 text-sm font-medium text-gray-700">
                                                {roundedRating} / 5
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        <span className="text-sm text-gray-500">
                            ({product.reviews.length} reviews)
                        </span>
                    </div>
                ) : null}

                {/* Individual Reviews */}
                {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((review, index) => (
                        <div
                            key={index}
                            className="mb-4 p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                        >
                            {/* Reviewer Name & Rating */}
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-gray-700">
                                    {review.username || "Anonymous"}
                                </p>
                                <span className="text-gray-400 text-xs italic">
                                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                </span>
                                <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`w-4 h-4 ${i < review.rating ? "text-amber-400" : "text-gray-300"
                                                }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.148c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.945c.3.922-.755 1.688-1.538 1.118l-3.36-2.44a1 1 0 00-1.175 0l-3.36 2.44c-.783.57-1.838-.196-1.538-1.118l1.287-3.945a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.148a1 1 0 00.95-.69l1.286-3.946z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>

                            {/* Comment */}
                            {review.comment && (
                                <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
                            )}

                            {/* Review Images */}
                            {review.images && review.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto">
                                    {review.images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt="review"
                                            className="w-16 h-16 object-cover rounded-md"
                                        />
                                    ))}

                                </div>
                            )}

                        </div>

                    ))
                ) : (
                    <p className="text-gray-500 text-sm">No reviews yet.</p>
                )}
            </div>


            {/* Same Category Carousel */}
            {/* Same Category Carousel */}
            {/* Same Category Carousel */}
            {sameCategoryProducts.length > 0 && (
                <div className="relative">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">More in {product.category}</h2>

                    {/* Carousel Container */}
                    <div
                        ref={carouselRef}
                        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4"
                        style={{ scrollbarWidth: "none" }} // hide scrollbar in Firefox
                    >
                        {sameCategoryProducts.map((p) => (
                            <div
                                key={p._id}
                                className="min-w-[200px] border rounded-lg shadow-md p-3 flex-shrink-0 cursor-pointer hover:shadow-xl transition snap-start"
                                onClick={() => navigate(`/product/${p._id}`)}
                            >
                                <img
                                    src={p.images?.[0] || "https://via.placeholder.com/200"}
                                    alt={p.name}
                                    className="w-full h-40 object-cover rounded-md mb-2"
                                />
                                <p className="text-gray-800 font-medium">{p.name}</p>
                                {p.variants?.[0] && (
                                    <p className="text-yellow-600 font-bold">₹{p.variants[0].finalPrice}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}



            {/* Explore Products with Lazy Load */}
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Explore Products</h2>

                {/* Category Buttons */}
                <div className="flex gap-3 mb-6 flex-wrap">
                    <button
                        onClick={() => setSelectedCategory("All")}
                        className={`px-4 py-2 rounded-md border ${selectedCategory === "All" ? "bg-yellow-500 text-white border-yellow-500" : "bg-white text-gray-800 border-gray-300 hover:border-yellow-400"
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-md border ${selectedCategory === cat ? "bg-yellow-500 text-white border-yellow-500" : "bg-white text-gray-800 border-gray-300 hover:border-yellow-400"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {displayProducts.map((p) => (
                        <div
                            key={p._id}
                            className="border rounded-lg shadow-md p-3 cursor-pointer hover:shadow-xl transition"
                            onClick={() => navigate(`/product/${p._id}`)}
                        >
                            <img src={p.images?.[0] || "https://via.placeholder.com/200"} alt={p.name} className="w-full h-40 object-cover rounded-md mb-2" />
                            <p className="text-gray-800 font-medium">{p.name}</p>
                            {p.variants?.[0] && <p className="text-yellow-600 font-bold">₹{p.variants[0].finalPrice}</p>}
                        </div>
                    ))}
                </div>

                {!hasMore && <p className="text-gray-500 mt-4 text-center">No more products</p>}
            </div>
        </div>
    );
};

export default ProductDetails;
