import React from "react";
import { FaLeaf, FaSeedling, FaCubes, FaHandshake } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const WhyBlossom: React.FC = () => {
    const navigate = useNavigate();

    function HandleStoryClick() {
        navigate("/ourstory");
    }

    return (
        <section className="relative bg-cream text-[#3a2c1f] py-20 overflow-hidden">
            {/* 🌿 Subtle background pattern */}
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 bg-cover bg-center" />

            {/* ✨ Soft gradient glow */}
            <div className="absolute right-1/4 top-1/3 w-72 h-72 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-200 blur-3xl opacity-40 animate-pulse" />

            <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-12 tracking-wide text-[#5c4b35]">
                    WHY BLOSSOM?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 max-w-5xl mx-auto">
                    {/* Card 1 */}
                    <div className="flex flex-col items-center gap-4 group">
                        <FaLeaf className="text-6xl text-amber-600 group-hover:scale-110 transition-transform duration-300" />
                        <h3 className="text-xl font-medium text-[#4b3a27]">100% Clean</h3>
                    </div>

                    {/* Card 2 */}
                    <div className="flex flex-col items-center gap-4 group">
                        <FaSeedling className="text-6xl text-green-600 group-hover:scale-110 transition-transform duration-300" />
                        <h3 className="text-xl font-medium text-[#4b3a27]">Farm Fresh</h3>
                    </div>

                    {/* Card 3 */}
                    <div className="flex flex-col items-center gap-4 group">
                        <FaCubes className="text-6xl text-amber-700 group-hover:scale-110 transition-transform duration-300" />
                        <h3 className="text-xl font-medium text-[#4b3a27]">
                            Made in Small Batches
                        </h3>
                    </div>

                    {/* Card 4 */}
                    <div className="relative flex flex-col items-center gap-4 group">
                        <div className="absolute w-20 h-20 bg-gradient-to-r from-amber-200 via-pink-200 to-yellow-200 rounded-full blur-xl opacity-50 animate-pulse" />
                        <FaHandshake className="text-6xl text-amber-800 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        <h3 className="text-xl font-medium text-[#4b3a27] relative z-10">
                            Rooted in Tradition
                        </h3>
                    </div>
                </div>

                {/* CTA Button */}
                <div className="mt-12">
                    <button
                        onClick={HandleStoryClick}
                        className="bg-amber-600 text-white font-semibold text-lg px-8 py-3 rounded-full shadow-md hover:bg-amber-700 transition"
                    >
                        OUR STORY
                    </button>
                </div>
            </div>
        </section>
    );
};

export default WhyBlossom;
