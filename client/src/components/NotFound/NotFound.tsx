import Lottie from "lottie-react";
import notFoundAnimation from "../../animations/notfound.json";

export default function NotFound() {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-100 overflow-x-hidden px-4">
            <div className="w-full max-w-md sm:max-w-lg">
                <Lottie
                    animationData={notFoundAnimation}
                    loop={true}
                    className="w-full h-auto"
                />
            </div>

        </div>
    );
}
