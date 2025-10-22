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

const AdvertisementRenderer: React.FC<Props> = ({ position, type = "background" }) => {
    const [ad, setAd] = useState<Advertisement | null>(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/advertisements/active`, {
                    params: { position },
                });
                console.log(`Fetched ${position} advertisements:`, res.data);

                const ads = res.data || []; // ✅ fix here
                if (ads.length > 0) setAd(ads[0]); // ✅ store full ad object
            } catch (err) {
                console.error(`Failed to fetch ${position} advertisement`, err);
            }
        };
        fetchAd();
    }, [position]);

    if (!ad || !ad.images || ad.images.length === 0) return null;

    if (type === "background") {
        return (
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url(${ad.images[0]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.1,
                }}
            />
        );
    }

    return (
        <div className="w-full text-center my-3">
            <a href={ad.link || "#"} target="_blank" rel="noopener noreferrer">
                <img
                    src={ad.images[0]}
                    alt={ad.title}
                    className="mx-auto rounded-lg shadow-md max-h-40 object-contain"
                />
            </a>
        </div>
    );
};

export default AdvertisementRenderer;
