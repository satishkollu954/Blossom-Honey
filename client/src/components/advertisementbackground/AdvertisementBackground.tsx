import React, { useEffect, useState } from "react";
import axios from "axios";

interface Advertisement {
    _id: string;
    title: string;
    description?: string;
    images: string[];
    link?: string;
    position: string;
}

interface Props {
    position: "navbar" | "homepage" | "banner" | "sidebar" | "popup" | "footer";
    type?: "background" | "image";
}

const AdvertisementRenderer: React.FC<Props> = ({ position, type = "image" }) => {
    const [allImages, setAllImages] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    // 🔹 Fetch all ads for this position
    useEffect(() => {
        const fetchAds = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/advertisements/active`, {
                    params: { position },
                });

                const ads: Advertisement[] = res.data.advertisements || res.data || [];
                console.log(`Fetched ${position} ads:`, ads);

                if (ads.length > 0) {
                    const images: string[] = ads.flatMap((ad) => ad.images);
                    setAllImages(images);
                    setCurrentAd(ads[0]);
                }
            } catch (err) {
                console.error(`Failed to fetch ${position} advertisement`, err);
            }
        };

        fetchAds();
    }, [position]);

    // 🔹 Auto image rotation (for all ads)
    useEffect(() => {
        if (allImages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % allImages.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [allImages]);
    const [visible, setVisible] = useState(true);

    if (allImages.length === 0 || !currentAd) return null;

    const currentImage = allImages[currentIndex];
    const backgroundStyle: React.CSSProperties = {
        backgroundImage: `url(${currentImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "background-image 0.8s ease-in-out",
    };


    // 🔹 Layouts per position
    switch (position) {
        /** 🔸 NAVBAR BACKGROUND */
        case "navbar":
            return (
                <div
                    className="absolute inset-0 transition-all duration-700 ease-in-out"
                    style={{
                        ...backgroundStyle,
                        opacity: 0.15,
                        zIndex: -1,
                        pointerEvents: "none", // ✅ So navbar buttons still clickable
                    }}
                />
            );

        /** 🔸 HOMEPAGE HERO SLIDER */
        case "homepage":
            return (
                <div className="relative w-full h-[500px] overflow-hidden rounded-lg shadow-xl">
                    <img
                        src={currentImage}
                        alt={currentAd.title}
                        className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-white text-center">
                        <h2 className="text-4xl font-bold mb-2 drop-shadow-lg">
                            {currentAd.title}
                        </h2>
                        {currentAd.description && (
                            <p className="text-lg max-w-2xl drop-shadow-md mb-4">
                                {currentAd.description}
                            </p>
                        )}
                        {currentAd.link && (
                            <a
                                href={currentAd.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-full text-white font-semibold shadow-lg transition"
                            >
                                Learn More
                            </a>
                        )}
                    </div>
                </div>
            );

        /** 🔸 BANNER STYLE */
        case "banner":
            return (
                <div className="relative w-full h-[200px] overflow-hidden shadow-lg rounded-md my-3">
                    <img
                        src={currentImage}
                        alt={currentAd.title}
                        className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center text-white">
                        <h3 className="text-2xl font-semibold">{currentAd.title}</h3>
                        {currentAd.link && (
                            <a
                                href={currentAd.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-yellow-300 underline hover:text-yellow-400"
                            >
                                View Offer
                            </a>
                        )}
                    </div>
                </div>
            );

        /** 🔸 SIDEBAR CARD STYLE */
        case "sidebar":
            return (
                <div className="sticky top-4 bg-white shadow-md rounded-lg overflow-hidden">
                    <img
                        src={currentImage}
                        alt={currentAd.title}
                        className="w-full h-[300px] object-cover transition-opacity duration-700 ease-in-out"
                    />
                    <div className="p-3 text-center">
                        <h4 className="text-lg font-semibold text-gray-800">
                            {currentAd.title}
                        </h4>
                        {currentAd.description && (
                            <p className="text-sm text-gray-500 mt-1">{currentAd.description}</p>
                        )}
                        {currentAd.link && (
                            <a
                                href={currentAd.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-yellow-600 hover:text-yellow-700 font-medium"
                            >
                                Learn more →
                            </a>
                        )}
                    </div>
                </div>
            );

        /** 🔸 POPUP MODAL STYLE */
        case "popup":

            if (!visible) return null;

            return (
                <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
                    {/* 🔹 Backdrop */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

                    {/* 🔹 Popup Container */}
                    <div className="relative w-50  bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                        {/* 🔹 Close Button */}
                        <button
                            onClick={() => setVisible(false)}
                            className="absolute top-3 right-3 bg-white/50 hover:bg-white rounded-full p-2 shadow-md z-10 transition"
                            title="Close"
                        >
                            ✖
                        </button>

                        {/* 🔹 Image */}
                        {currentImage && (
                            <div className="relative h-48">
                                <img
                                    src={currentImage}
                                    alt={currentAd?.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                        )}

                        {/* 🔹 Content */}
                        <div className="p-4 text-left">
                            {currentAd?.description && (
                                <p className="text-sm text-red-700  mb-3">{currentAd.description.toUpperCase()}</p>
                            )}
                            {currentAd?.link && (
                                <a
                                    href={currentAd.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full font-medium shadow-sm transition"
                                >
                                    Visit
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            );



        /** 🔸 FOOTER BACKGROUND STYLE */
        case "footer":
            return (
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                    <div
                        className="w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out"
                        style={{
                            backgroundImage: `url(${currentImage})`,
                            opacity: 0.3,
                            filter: "brightness(0.8)",
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
            );

        default:
            return null;
    }
};

export default AdvertisementRenderer;
