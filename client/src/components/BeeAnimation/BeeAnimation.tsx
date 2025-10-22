import Lottie from "lottie-react";
import beeAnimation from "../../animations/bee.json";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

function SingleBee() {
    const controls = useAnimation();
    const beeSize = 50; // size of bee
    const margin = 20; // margin from edges

    const getRandomProps = (prevX?: number, prevY?: number) => {
        const maxX = window.innerWidth - beeSize - margin;
        const maxY = window.innerHeight - beeSize - margin;

        let x = Math.random() * maxX;
        let y = Math.random() * maxY;

        // optional: move relative to previous position for smooth curved motion
        if (prevX !== undefined && prevY !== undefined) {
            x = Math.min(maxX, Math.max(margin, prevX + (Math.random() * 200 - 100)));
            y = Math.min(maxY, Math.max(margin, prevY + (Math.random() * 200 - 100)));
        }

        const scale = 0.6 + Math.random() * 0.4;
        const rotate = Math.random() * 60 - 30;

        return { x, y, scale, rotate };
    };

    const moveBee = async () => {
        let prevX: number | undefined;
        let prevY: number | undefined;

        while (true) {
            const props = getRandomProps(prevX, prevY);
            prevX = props.x;
            prevY = props.y;

            await controls.start({
                ...props,
                transition: { duration: 2 + Math.random() * 2, ease: "easeInOut" },
            });
        }
    };

    useEffect(() => {
        moveBee();
    }, []);

    return (
        <motion.div
            animate={controls}
            className="absolute pointer-events-none z-50 drop-shadow-lg opacity-90"
            style={{ width: beeSize, height: beeSize }}
        >
            <Lottie animationData={beeAnimation} loop={true} />
        </motion.div>
    );
}

export default function BeeSwarm({ count = 5 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <SingleBee key={i} />
            ))}
        </>
    );
}





// for single bee code

// import Lottie from "lottie-react";
// import beeAnimation from "../../animations/bee.json";
// import { motion, useAnimation } from "framer-motion";
// import { useEffect } from "react";
// export default function BeeAnimation() {
//     const controls = useAnimation();
//     // Function to generate a random position within the viewport
//     const getRandomPosition = () => {
//         const x = Math.random() * (window.innerWidth - 100); // 100 is width of bee
//         const y = Math.random() * (window.innerHeight - 100); // 100 is height of bee
//         return { x, y };
//     };
//     const moveBee = async () => {
//         while (true) {
//             await controls.start({
//                 ...getRandomPosition(),
//                 transition: { duration: 3 + Math.random() * 2, ease: "easeInOut" },
//             });
//         }
//     };
//     useEffect(() => {
//         moveBee();
//     }, []);
//     return (
//         <motion.div
//             animate={controls}
//             className="absolute top-0 left-0 w-28 h-28 pointer-events-none z-50"
//         >
//             <Lottie animationData={beeAnimation} loop={true} />
//         </motion.div>
//     );
// }





