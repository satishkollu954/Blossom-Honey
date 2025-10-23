import axios from "axios";
import { useEffect, useState } from "react";

interface Coupon {
    _id: string;
    code: string;
    isActive: boolean;
    expiryDate: string;
}

export function Article() {
    const [codes, setCodes] = useState<string[]>([]);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        axios
            .get<Coupon[]>(`${API_BASE_URL}/api/coupons`)
            .then((res) => {
                const today = new Date();
                const activeCoupons = res.data.filter((c) => {
                    const expiry = new Date(c.expiryDate);
                    return c.isActive && expiry >= today;
                });
                setCodes(activeCoupons.map((c) => c.code.toUpperCase()));
            })
            .catch((err) => {
                console.error("Failed to fetch coupons:", err);
                setCodes([]);
            });
    }, [API_BASE_URL]);

    // Duplicate for smooth loop
    const displayCodes =
        codes.length > 0
            ? [...codes, ...codes]
            : ["No active coupons available", "No active coupons available"];

    return (
        <article className="w-full py-2 overflow-hidden relative font-[Satoshi] backdrop-blur-sm bg-gradient-to-r from-neutral-900/90 via-neutral-800/85 to-neutral-900/90 text-white shadow-inner">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 overflow-hidden h-8">
                    <div className="marquee-track">
                        {displayCodes.map((code, index) => (
                            <span
                                key={index}
                                className={`inline-flex items-center gap-2 px-6 py-1 text-[15px] font-medium tracking-wide ${codes.length > 0
                                    ? "text-yellow-100"
                                    : "text-gray-300 italic"
                                    }`}
                            >
                                {codes.length > 0 ? (
                                    <>
                                        {index % 3 === 0 && "🔥"}
                                        {index % 3 === 1 && "🎁"}
                                        {index % 3 === 2 && "✨"}
                                        {code}
                                    </>
                                ) : (
                                    code
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Smooth one-by-one scrolling animation */}
            <style>
                {`
          @import url('https://fonts.cdnfonts.com/css/satoshi?styles=20876,20877,20878,20879');

          .marquee-track {
            display: inline-flex;
            white-space: nowrap;
            animation: scrollLeft 14s linear infinite;
          }

          @keyframes scrollLeft {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }

          .marquee-track span {
            margin-right: 3rem;
          }

          /* Light theme adaptation */
          @media (prefers-color-scheme: light) {
            article {
              background: linear-gradient(
                to right,
                rgba(255, 223, 128, 0.9),
                rgba(255, 215, 145, 0.8),
                rgba(255, 223, 128, 0.9)
              );
              color: #2d2d2d;
            }
            .marquee-track span {
              color: #2d2d2d !important;
            }
          }
        `}
            </style>
        </article>
    );
}
