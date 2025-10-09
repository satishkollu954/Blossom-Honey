import { Star } from "lucide-react";

interface Testimonial {
    id: string;
    name: string;
    text: string;
    rating: number;
}

interface ReviewProps {
    testimonials?: Testimonial[];
}

export default function Review({ testimonials = [] }: ReviewProps) {
    const defaultTestimonials: Testimonial[] = [
        {
            id: "1",
            name: "Sarah Johnson",
            text: "The wildflower honey is absolutely divine! You can taste the quality in every spoonful. It's become a staple in our household.",
            rating: 5,
        },
        {
            id: "2",
            name: "Michael Chen",
            text: "I've tried many honey brands, but Blossom Honey stands out. The manuka honey helped with my seasonal allergies tremendously.",
            rating: 5,
        },
        {
            id: "3",
            name: "Emma Davis",
            text: "Pure, natural, and delicious. The lavender honey is my favorite - perfect for tea and baking. Highly recommend!",
            rating: 5,
        },
    ];

    const displayTestimonials =
        testimonials.length > 0 ? testimonials : defaultTestimonials;

    return (
        <section className="py-16 md:py-24 bg-amber-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Heading */}
                <div className="text-center mb-12">
                    <h2 className="font-serif text-4xl md:text-5xl font-normal mb-4 text-amber-800">
                        What Our Customers Say
                    </h2>
                    <p className="text-lg text-gray-600">
                        Trusted by honey lovers everywhere
                    </p>
                </div>

                {/* Testimonials grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {displayTestimonials.map((testimonial) => (
                        <div
                            key={testimonial.id}
                            className="bg-white shadow-md rounded-2xl p-6 transition-transform hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="flex gap-1 mb-4 text-amber-500">
                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                                ))}
                            </div>

                            <p className="text-gray-700 mb-4 leading-relaxed">
                                “{testimonial.text}”
                            </p>

                            <p className="font-semibold text-amber-800">{testimonial.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
