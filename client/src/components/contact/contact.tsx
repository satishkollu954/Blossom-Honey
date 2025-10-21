import { useState } from 'react'; // <-- Import useState
import { useForm } from "react-hook-form";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react"; // <-- Import Loader2 for spinner icon
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

type ContactFormValues = {
    name: string;
    email: string;
    subject: string;
    message: string;
};

export function Contact() {
    // 1. Add Loading State
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ContactFormValues>();

    const onSubmit = (data: ContactFormValues) => {
        // 2. Set loading to true on submission start
        setIsLoading(true);


        axios.post(`${API_URL}/api/contact-Us`, data)
            .then((response) => {
                toast.success("Message sent! We'll get back to you soon.");
                reset();
            })
            .catch((error) => {
                console.error("Error sending message:", error);
                toast.error("Failed to send message. Please try again later.");
            })
            .finally(() => {
                // 3. Set loading to false regardless of success or failure
                setIsLoading(false);
            });
    };

    return (
        <div className="min-h-screen py-16 md:py-24 bg-gray-50">
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Heading */}
                <div className="text-center mb-16">
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Have questions? We'd love to hear from you
                    </p>
                </div>

                {/* Content */}
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Form */}
                    <div>
                        <div className="bg-white shadow rounded-xl p-8">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* ... (Your existing form fields: Name, Email, Subject, Message) ... */}
                                <div>
                                    <label className="block mb-2 font-medium">Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        {...register("name", { required: "Name is required", minLength: { value: 2, message: "Name must be at least 2 characters" } })}
                                    />
                                    {errors.name && <p className="text-red-500 mt-1">{errors.name.message}</p>}
                                </div>

                                <div>
                                    <label className="block mb-2 font-medium">Email</label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })}
                                    />
                                    {errors.email && <p className="text-red-500 mt-1">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <label className="block mb-2 font-medium">Subject</label>
                                    <input
                                        type="text"
                                        placeholder="How can we help?"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        {...register("subject", { required: "Subject is required", minLength: { value: 5, message: "Subject must be at least 5 characters" } })}
                                    />
                                    {errors.subject && <p className="text-red-500 mt-1">{errors.subject.message}</p>}
                                </div>

                                <div>
                                    <label className="block mb-2 font-medium">Message</label>
                                    <textarea
                                        placeholder="Your message..."
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 min-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        {...register("message", { required: "Message is required", minLength: { value: 10, message: "Message must be at least 10 characters" } })}
                                    />
                                    {errors.message && <p className="text-red-500 mt-1">{errors.message.message}</p>}
                                </div>


                                {/* 4. Updated Submit Button */}
                                <button
                                    type="submit"
                                    // Disable the button while loading to prevent double submission
                                    disabled={isLoading}
                                    className={`w-full text-white font-semibold py-3 rounded-lg transition flex items-center justify-center space-x-2 
                                        ${isLoading
                                            ? 'bg-yellow-400 cursor-not-allowed' // Slightly different background/color when disabled
                                            : 'bg-yellow-500 hover:bg-yellow-600'
                                        }`}
                                >
                                    {isLoading ? (
                                        <>
                                            {/* Tailwind Spinner: animate-spin utility class with Lucide icon */}
                                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <span>Send Message</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Contact Info (Remains the same) */}
                    <div className="space-y-6">
                        {/* Email */}
                        <div className="bg-white shadow rounded-xl p-6 flex items-start gap-4 hover:shadow-lg transition">
                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                <Mail className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Email</h3>
                                <p className="text-gray-600">info@blossomhoney.com</p>
                                <p className="text-gray-600">support@blossomhoney.com</p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="bg-white shadow rounded-xl p-6 flex items-start gap-4 hover:shadow-lg transition">
                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                <Phone className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Phone</h3>
                                <p className="text-gray-600">+1 (555) 123-4567</p>
                                <p className="text-gray-600 text-sm">Mon-Fri, 9am-6pm PST</p>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-white shadow rounded-xl p-6 flex items-start gap-4 hover:shadow-lg transition">
                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Address</h3>
                                <p className="text-gray-600">123 Honey Lane</p>
                                <p className="text-gray-600">Sweet Valley, CA 90210</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}