import React, { useEffect, useState } from "react";
import axios from "axios";

interface Advertisement {
    _id: string;
    title: string;
    description?: string;
    images: string[];
    link?: string;
    position: "homepage" | "sidebar" | "banner" | "popup" | "footer";
}

const AdvertisementBackground: React.FC<{ position: "navbar" | "footer" }> = ({ position }) => {
    const [ad, setAd] = useState<Advertisement | null>(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/products/active`, {
                    params: { activeOnly: "true", position },
                });
                if (res.data.length > 0) {
                    setAd(res.data[0]); // take the first ad for simplicity
                }
            } catch (err) {
                console.error("Failed to fetch advertisement", err);
            }
        };
        fetchAd();
    }, [position]);

    if (!ad || ad.images.length === 0) return null;

    return (
        <div
            className={`absolute inset-0 z-0`}
            style={{
                backgroundImage: `url(${ad.images[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.15, // adjust transparency
            }}
        />
    );
};

export default AdvertisementBackground;
