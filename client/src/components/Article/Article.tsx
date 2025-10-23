import axios from "axios";
import { useEffect, useState } from "react";

interface Coupon {
    _id: string;
    code: string;
    isActive: boolean;
    expiryDate: string;
    discountType: "percentage" | "flat";
    discountValue: number;
    applicableCategories?: string[];
}

interface Props {
    currentCategory?: string; // optional category filter
}

export function Article({ currentCategory }: Props) {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        axios
            .get<Coupon[]>(`${API_BASE_URL}/api/coupons/user`)
            .then((res) => {
                const today = new Date();
                const activeCoupons = res.data.filter((c) => {
                    const expiry = new Date(c.expiryDate);
                    const notExpired = c.isActive && expiry >= today;

                    // Category check
                    const categoryValid =
                        !c.applicableCategories ||
                        c.applicableCategories.length === 0 ||
                        (currentCategory
                            ? c.applicableCategories.some(cat => cat.trim().toLowerCase() === currentCategory.trim().toLowerCase())
                            : true);

                    return notExpired && categoryValid;
                });


                setCoupons(activeCoupons);
            })
            .catch((err) => {
                console.error("Failed to fetch coupons:", err);
                setCoupons([]);
            });
    }, [API_BASE_URL, currentCategory]);

    // Duplicate for smooth continuous scrolling
    const displayCoupons = [...coupons, ...coupons];

    return (
        <article className="w-full overflow-hidden relative font-[Satoshi] backdrop-blur-sm bg-gradient-to-r from-neutral-900/95 via-neutral-800/90 to-neutral-900/95 text-white shadow-inner py-3 h-10 flex items-center">
            {coupons.length > 0 ? (
                <div className="marquee-wrapper w-full overflow-hidden relative">
                    <div className="marquee flex gap-6 whitespace-nowrap">
                        {displayCoupons.map((coupon, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-2 px-6 text-[15px] font-medium tracking-wide text-yellow-100"
                                title={`Applies to: ${coupon.applicableCategories?.join(", ") || "All categories"}`}
                            >
                                {index % 3 === 0 && "🔥"}
                                {index % 3 === 1 && "🎁"}
                                {index % 3 === 2 && "✨"}
                                {coupon.discountType === "percentage"
                                    ? `${coupon.discountValue}% OFF`
                                    : `FLAT ${coupon.discountValue}`}{" "}
                                | Code: {coupon.code.toUpperCase()}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="w-full text-center text-gray-300 italic text-[15px]">
                    WELCOME TO BLOSSOM..
                </div>
            )}

            {/* Smooth continuous scrolling animation */}
            <style>
                {`
          @import url('https://fonts.cdnfonts.com/css/satoshi?styles=20876,20877,20878,20879');

          .marquee-wrapper {
            position: relative;
          }

          .marquee {
            display: flex;
            animation: scroll 12s linear infinite;
          }

          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .marquee span {
            margin-right: 2rem;
          }

          @media (prefers-color-scheme: light) {
            article {
              background: linear-gradient(
                to right,
                rgba(255, 231, 173, 0.9),
                rgba(255, 220, 150, 0.85),
                rgba(255, 231, 173, 0.9)
              );
              color: #222;
            }
            .marquee span {
              color: #222 !important;
            }
          }
        `}
            </style>
        </article>
    );
}
