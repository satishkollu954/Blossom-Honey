

import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const SuccessPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white px-6 text-center">
            {/* Animated Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white/10 backdrop-blur-lg p-10 rounded-3xl shadow-2xl max-w-md w-full"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
                    className="flex justify-center mb-6"
                >
                    <CheckCircle2 className="w-20 h-20 text-white drop-shadow-lg" />
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-extrabold mb-3 tracking-tight"
                >
                    🎉 Order Placed Successfully!
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-white/90 mb-6 text-lg leading-relaxed"
                >
                    Thank you for shopping with{" "}
                    <span className="font-semibold text-yellow-300">Blossom</span>.
                    A confirmation email has been sent to your registered email.
                </motion.p>

                {/* Continue Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/")}
                    className="bg-white text-emerald-600 font-semibold px-6 py-3 rounded-full shadow-md hover:bg-yellow-300 hover:text-gray-900 transition"
                >
                    Continue Shopping
                </motion.button>
            </motion.div>

            {/* Decorative Sparkles */}
            {/* <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute text-white/70 text-sm"
            >
                <p>✨ Your happiness fuels our passion ✨</p>
            </motion.div> */}
        </div>
    );
};

export default SuccessPage;
