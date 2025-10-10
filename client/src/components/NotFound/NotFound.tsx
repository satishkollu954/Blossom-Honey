export function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
            <p className="text-lg text-gray-600">
                Sorry, the page you are looking for doesn’t exist.
            </p>
        </div>
    );
}
