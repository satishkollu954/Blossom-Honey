import { useState } from "react";
import { PlayCircle } from "lucide-react";

interface Farmer {
    id: string;
    name: string;
    role: string;
    image: string;
    description: string;
}

export default function HoneyStory() {
    const [showVideo, setShowVideo] = useState(false);

    const farmers: Farmer[] = [
        {
            id: "1",
            name: "Ravi Kumar",
            role: "Lead Beekeeper",
            image: "/images/farmers/farmer1.jpg",
            description:
                "Ravi has been nurturing bees for over 15 years. His expertise ensures every drop of honey is pure and natural.",
        },
        {
            id: "2",
            name: "Lakshmi Devi",
            role: "Honey Quality Supervisor",
            image: "/images/farmers/farmer2.jpg",
            description:
                "Lakshmi oversees the honey extraction and filtration process, ensuring top quality in every jar.",
        },
        {
            id: "3",
            name: "Suresh Reddy",
            role: "Organic Farmer",
            image: "/images/farmers/farmer3.jpg",
            description:
                "Suresh manages the organic flower fields that provide nectar for our bees — free from pesticides.",
        },
    ];

    const farmingImages = [
        "/images/farm/farm1.jpg",
        "/images/farm/farm2.jpg",
        "/images/farm/farm3.jpg",
        "/images/farm/farm4.jpg",
    ];

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
            {/* Introduction Section */}
            <section className="text-center space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-amber-700">
                    The Story Behind Our Honey 🍯
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    At <span className="font-semibold">Blossom Honey</span>, our journey begins in the lush
                    countryside where nature thrives. We believe in sustainable beekeeping — where every drop
                    of honey reflects the harmony between bees, flowers, and our hardworking farmers.
                </p>
            </section>

            {/* Farming Image Gallery */}
            <section>
                <h2 className="text-2xl font-semibold text-amber-700 mb-4 text-center">
                    Our Bee Farms
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {farmingImages.map((img, index) => (
                        <div key={index} className="overflow-hidden rounded-2xl shadow-md">
                            <img
                                src={img}
                                alt={`Farm ${index + 1}`}
                                className="w-full h-56 object-cover hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Honey Extraction Video */}
            <section className="text-center">
                <h2 className="text-2xl font-semibold text-amber-700 mb-4">
                    How We Extract Pure Honey
                </h2>

                {!showVideo ? (
                    <div
                        onClick={() => setShowVideo(true)}
                        className="relative w-full max-w-3xl mx-auto cursor-pointer group"
                    >
                        <img
                            src="/images/extraction-thumbnail.jpg"
                            alt="Honey Extraction"
                            className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-lg"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl group-hover:bg-black/60 transition">
                            <PlayCircle className="text-white" size={60} />
                        </div>
                    </div>
                ) : (
                    <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/abcd1234"
                        title="Honey Extraction Process"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                )}

                <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
                    Watch how our honey is gently extracted from natural honeycombs — no additives, no
                    heating, just raw purity.
                </p>
            </section>

            {/* Farmers Section */}
            <section>
                <h2 className="text-2xl font-semibold text-amber-700 mb-6 text-center">
                    Meet Our Farmers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {farmers.map((farmer) => (
                        <div
                            key={farmer.id}
                            className="bg-white rounded-2xl shadow-md hover:shadow-lg p-4 text-center transition"
                        >
                            <img
                                src={farmer.image}
                                alt={farmer.name}
                                className="w-32 h-32 mx-auto rounded-full object-cover mb-4 border-4 border-amber-400"
                            />
                            <h3 className="text-lg font-semibold text-amber-700">{farmer.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">{farmer.role}</p>
                            <p className="text-sm text-gray-600">{farmer.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Closing Note */}
            <section className="text-center py-6 bg-amber-50 rounded-2xl shadow-inner">
                <h3 className="text-xl font-semibold text-amber-700 mb-2">Sustainability Promise 🌿</h3>
                <p className="text-gray-700 max-w-2xl mx-auto">
                    Our mission is to protect the bees, empower local farmers, and deliver authentic honey
                    straight from the hive to your home.
                </p>
            </section>
        </div>
    );
}
