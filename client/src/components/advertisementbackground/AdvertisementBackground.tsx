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
    const [ad, setAd] = useState<Advertisement | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/advertisements/active`, {
                    params: { position },
                });
                console.log(`Fetched ${position} advertisements:`, res.data);

                const ads = res.data || [];
                if (ads.length > 0) setAd(ads[0]); // take the first ad
            } catch (err) {
                console.error(`Failed to fetch ${position} advertisement`, err);
            }
        };
        fetchAd();
    }, [position]);

    // Auto-change image every 3 seconds
    useEffect(() => {
        if (!ad || !ad.images || ad.images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % ad.images.length);
        }, 3000); // change every 3 seconds

        return () => clearInterval(interval);
    }, [ad]);

    if (!ad || !ad.images || ad.images.length === 0) return null;

    const currentImage = ad.images[currentImageIndex];

    if (type === "background") {
        return (
            <div
                className="absolute inset-0 z-0 transition-all duration-700 ease-in-out"
                style={{
                    backgroundImage: `url(${currentImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.15,
                }}
            />
        );
    }

    return (
        <div className="w-full text-center my-3 relative">
            <a href={ad.link || "#"} target="_blank" rel="noopener noreferrer">
                <img
                    key={currentImage} // helps trigger re-render on change
                    src={currentImage}
                    alt={ad.title}
                    className="mx-auto rounded-lg shadow-md max-h-40 object-contain transition-opacity duration-700 ease-in-out opacity-100"
                />
            </a>
        </div>
    );
};

export default AdvertisementRenderer;
