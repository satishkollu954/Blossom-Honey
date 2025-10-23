import { useState } from "react";
import AdvertisementRenderer from "../advertisementbackground/AdvertisementBackground";
import backgroundImage from "../../assets/home-bg.png";
import SingleBee from "../BeeAnimation/singlebee";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Main() {
    const [adImage, setAdImage] = useState<string | null>(null);
    const navigate = useNavigate();

    const onShopNowClick = (): void => {
        navigate("/shop");
    };

    const onLearnMoreClick = (): void => {
        navigate("/about");
    };

    // Determine if default background is visible
    const isDefaultBackground = !adImage;

    return (
        <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">

            {/* Dynamic Advertisement */}
            <AdvertisementRenderer
                position="homepage"
                onImageChange={(img) => setAdImage(img)}
            />

            {/* Bee animation */}
            <SingleBee />

            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                style={{
                    backgroundImage: `url(${adImage || backgroundImage})`,
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-transparent" />
            </div>

            {/* Content only for default background */}
            {isDefaultBackground && (
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 transition-opacity duration-700">
                    <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-6 leading-tight">
                        Nature&apos;s Golden
                        <br />
                        <span className="font-display font-semibold">Treasure</span>
                    </h1>

                    <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-7 max-w-2xl mx-auto leading-relaxed">
                        Discover our premium collection of artisanal honey, sourced from the finest blossoms.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={onShopNowClick}
                            className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white px-7 py-3 text-lg rounded-lg shadow-md transition-all duration-300"
                        >
                            Shop Now
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </button>

                        <button
                            onClick={onLearnMoreClick}
                            className="flex items-center justify-center border border-white/30 text-white backdrop-blur-sm bg-white/10 hover:bg-white/20 px-7 py-3 text-lg rounded-lg transition-all duration-300"
                        >
                            Learn More
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
