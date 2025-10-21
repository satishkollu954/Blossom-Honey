import { Heart, Leaf, Award } from "lucide-react";

export function About() {
    return (
        <div className="min-h-screen py-16 md:py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Heading */}
                <div className="text-center mb-16">
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal mb-4">
                        About Blossom Honey
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Crafting nature's finest honey with passion and dedication since 2020
                    </p>
                </div>
                {/* Description */}
                <div className="prose prose-lg max-w-3xl mx-auto mb-16 text-gray-700">
                    <p className="leading-relaxed">
                        At Blossom Honey, we believe in the pure, unadulterated goodness of nature. Our journey began with a simple mission: to bring the finest artisanal honey to families who appreciate quality and authenticity.
                    </p>
                    <p className="leading-relaxed mt-4">
                        Every jar of our honey is carefully sourced from sustainable apiaries, where bees thrive in pristine natural environments. We work closely with local beekeepers who share our commitment to ethical practices and environmental stewardship.
                    </p>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition-all duration-300 text-center p-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Heart className="h-8 w-8 text-yellow-500" />
                        </div>
                        <h3 className="font-serif text-2xl font-medium mb-3">Passionate Craft</h3>
                        <p className="text-gray-600">
                            Each batch is created with care and attention to preserve the unique flavors of every blossom
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition-all duration-300 text-center p-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                            <Leaf className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="font-serif text-2xl font-medium mb-3">Sustainable</h3>
                        <p className="text-gray-600">
                            We're committed to eco-friendly practices that protect our bees and the environment
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition-all duration-300 text-center p-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <Award className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="font-serif text-2xl font-medium mb-3">Premium Quality</h3>
                        <p className="text-gray-600">
                            Award-winning honey that meets the highest standards of purity and taste
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
