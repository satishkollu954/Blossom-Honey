import Lottie from "lottie-react";
import beeAnimation from "../../animations/bee.json";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export default function BeeAnimation() {
    const controls = useAnimation();

    // Function to generate a random position within the viewport
    const getRandomPosition = () => {
        const x = Math.random() * (window.innerWidth - 100); // 100 is width of bee
        const y = Math.random() * (window.innerHeight - 100); // 100 is height of bee
        return { x, y };
    };

    const moveBee = async () => {
        while (true) {
            await controls.start({
                ...getRandomPosition(),
                transition: { duration: 3 + Math.random() * 2, ease: "easeInOut" },
            });
        }
    };

    useEffect(() => {
        moveBee();
    }, []);

    return (
        <motion.div
            animate={controls}
            className="absolute top-0 left-0 w-28 h-28 pointer-events-none z-50"
        >
            <Lottie animationData={beeAnimation} loop={true} />
        </motion.div>
    );
}
