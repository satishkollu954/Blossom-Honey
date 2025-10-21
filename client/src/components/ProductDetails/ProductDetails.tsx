import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCookies } from "react-cookie";
import { useCart } from "../context/cartcontext";

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

    const nextImage = () => setImageIndex((prev) => (prev + 1) % allImages.length);
    const prevImage = () => setImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

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
                {/* Images */}
                <div className="lg:w-1/2 flex flex-col items-center relative">
                    <img src={currentImage} alt={product.name} className="w-full h-[400px] object-contain rounded-lg shadow-md bg-white" />
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-yellow-50">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-yellow-50">
                        <ChevronRight size={24} />
                    </button>
                    <div className="flex gap-2 mt-4 overflow-x-auto">
                        {allImages.map((img, i) => (
                            <img
                                key={i}
                                src={img}
                                alt=""
                                onClick={() => setImageIndex(i)}
                                className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${i === imageIndex ? "border-yellow-500" : "border-transparent"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Info */}
                <div className="lg:w-1/2 flex flex-col justify-center -mt-6">
                    <h1 className="text-3xl font-semibold mb-3 text-gray-800">{product.name}</h1>
                    <p className="text-gray-600 mb-4">{product.description}</p>

                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl font-bold text-yellow-600">₹{selectedVariant.finalPrice}</span>
                        {selectedVariant.discount > 0 && <span className="text-gray-400 line-through">₹{selectedVariant.price}</span>}
                    </div>
                    <span className="text-gray-500">Discount: {selectedVariant.discount}%</span>
                    <span className="text-gray-500 block mb-4">Stock: {selectedVariant.stock}</span>

                    <p className="text-gray-700 mb-2">Select Weight:</p>
                    <div className="flex gap-3 mb-6">
                        {product.variants.map((v) => (
                            <button
                                key={v._id}
                                onClick={() => {
                                    setSelectedVariant(v);
                                    setIsInCart(false);
                                }}
                                className={`px-4 py-2 border rounded-md ${selectedVariant._id === v._id
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
                            onClick={() => !isInCart && handleCartClick(product._id, selectedVariant._id, 1)}
                            disabled={isInCart || selectedVariant.stock === 0}
                            className={`px-6 py-3 rounded-md text-lg font-semibold transition ${selectedVariant.stock === 0 || isInCart
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-yellow-500 text-white hover:bg-yellow-600"
                                }`}
                        >
                            {selectedVariant.stock === 0 ? "Out of Stock" : isInCart ? "Already in Cart" : "Add to Cart"}
                        </button>
                    )}

                    <div className="mt-4 text-sm text-gray-500">
                        <p>Delivery Time: {product.deliveryTime}</p>
                    </div>
                </div>
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
