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

    const farmData = [
        {
            img: "src/assets/home-bg.png",
            title: "Blossomhoney Fields",
            desc: "Our bees collect nectar from pesticide-free, lush flower fields that bloom all year round.",
        },
        {
            img: "src/assets/honey1.png",
            title: "Sustainable Beekeeping",
            desc: "We ensure the hives are nurtured naturally, keeping the bees safe and the environment thriving.",
        },
        {
            img: "src/assets/honey2.png",
            title: "Honey Extraction",
            desc: "Our honey is extracted manually with care to preserve all nutrients and natural flavors.",
        },

    ];

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-16">
            {/* Introduction Section */}
            <section className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-amber-700">
                    The Story Behind Our Honey 🍯
                </h1>
                <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
                    At <span className="font-semibold">Blossom Honey</span>, our journey begins in the lush
                    countryside where nature thrives. Sustainable beekeeping ensures every drop of honey reflects
                    the harmony between bees, flowers, and our hardworking farmers.
                </p>
            </section>

            {/* Farm Zigzag Section */}
            <section>
                <h2 className="text-3xl font-semibold text-amber-700 mb-10 text-center">Our Bee Farms</h2>
                <div className="space-y-16">
                    {farmData.map((farm, index) => (
                        <div
                            key={index}
                            className={`flex flex-col md:flex-row items-center gap-6 ${index % 2 === 0 ? "" : "md:flex-row-reverse"
                                }`}
                        >
                            <div className="md:w-1/2 overflow-hidden rounded-3xl shadow-lg hover:scale-105 transition-transform duration-300">
                                <img
                                    src={farm.img}
                                    alt={farm.title}
                                    className="w-full h-72 md:h-96 object-cover"
                                />
                            </div>
                            <div className="md:w-1/2 text-center md:text-left space-y-4">
                                <h3 className="text-2xl font-bold text-amber-700">{farm.title}</h3>
                                <p className="text-gray-600">{farm.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Honey Extraction Video */}
            <section className="text-center">
                <h2 className="text-3xl font-semibold text-amber-700 mb-6">How We Extract Pure Honey</h2>
                {!showVideo ? (
                    <div
                        onClick={() => setShowVideo(true)}
                        className="relative w-full max-w-4xl mx-auto cursor-pointer group rounded-3xl overflow-hidden shadow-xl"
                    >
                        <img
                            src="/images/extraction-thumbnail.jpg"
                            alt="Honey Extraction"
                            className="w-full h-64 md:h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition">
                            <PlayCircle className="text-white" size={70} />
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full max-w-4xl mx-auto" style={{ paddingTop: "35.25%" }}>
                        <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-3xl shadow-lg"
                            src="https://www.youtube.com/embed/KBHeypHgv_0"
                            title="Honey Extraction Process"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}
                <p className="text-gray-600 mt-4 max-w-3xl mx-auto">
                    Watch how our honey is gently extracted from natural honeycombs — no additives, no heating,
                    just raw purity.
                </p>
            </section>

            {/* Farmers Section */}
            <section>
                <h2 className="text-3xl font-semibold text-amber-700 mb-10 text-center">Meet Our Farmers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {farmers.map((farmer) => (
                        <div
                            key={farmer.id}
                            className="bg-white rounded-3xl shadow-xl hover:shadow-2xl p-6 text-center transition duration-300"
                        >
                            <img
                                src={farmer.image}
                                alt={farmer.name}
                                className="w-32 h-32 mx-auto rounded-full object-cover mb-4 border-4 border-amber-400"
                            />
                            <h3 className="text-xl font-semibold text-amber-700">{farmer.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">{farmer.role}</p>
                            <p className="text-gray-600 text-sm">{farmer.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Closing Note */}
            <section className="text-center py-8 bg-gradient-to-r from-amber-50 to-amber-100 rounded-3xl shadow-inner">
                <h3 className="text-2xl font-semibold text-amber-700 mb-3">Sustainability Promise 🌿</h3>
                <p className="text-gray-700 max-w-3xl mx-auto">
                    Our mission is to protect the bees, empower local farmers, and deliver authentic honey
                    straight from the hive to your home.
                </p>
            </section>
        </div>
    );
}
