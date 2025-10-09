import React, { useState, useEffect } from 'react';
import honey from '../../assets/honey1.png';
import honey1 from '../../assets/honey2.png';
import honey2 from '../../assets/honey3.png';
import honey3 from '../../assets/honey4.png';

// 1. Interface for Product Data
interface Product {
    id: number;
    image: string;
    title: string;
    description: string;
    price: number;
}

// Dummy API to simulate fetching product data
const fetchProducts = (): Promise<Product[]> => {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            const products: Product[] = [
                {
                    id: 1,
                    image: honey,
                    title: 'Wildflower Honey',
                    description: 'A delicate blend from diverse wildflowers',
                    price: 24.99,
                },
                {
                    id: 2,
                    image: honey1,
                    title: 'Acacia Honey',
                    description: 'Light, mild flavor with floral notes',
                    price: 28.99,
                },
                {
                    id: 3,
                    image: honey2,
                    title: 'Manuka Honey',
                    description: 'Rich, robust with unique properties',
                    price: 49.99,
                },
                {
                    id: 4,
                    image: honey3,
                    title: 'Orange Blossom',
                    description: 'Citrus-infused sweetness',
                    price: 26.99,
                },
            ];
            resolve(products);
        }, 500); // 500ms delay
    });
};

// 2. Individual Card Component (Renamed from HoneyCard to ShopCard to avoid confusion)
const ShopCard: React.FC<Product> = ({ image, title, description, price }) => {




    // The styling exactly matches the image.
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col items-center p-4 border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <div className="w-full h-64 flex items-center justify-center mb-4">
                {/* Placeholder image styling, ensure your real images are sized appropriately */}
                <img src={image} alt={title} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="text-center px-4 pb-4 w-full">
                <h3 className="font-serif text-xl text-gray-800 mb-2 font-normal">{title}</h3>
                <p className="text-gray-600 text-sm mb-4 min-h-[40px] flex items-center justify-center">{description}</p>
                <p className="font-bold text-2xl text-yellow-600 mb-4">&#8377;{price.toFixed(2)}</p>

                {/* Add to Cart Button */}
                <button className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors flex-grow">
                    Add to Cart
                </button>
            </div>
        </div>
    );
};

// 3. Shop Component (The main container/grid, using the requested name 'Shop')
const Shop: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts().then((data) => {
            setProducts(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto p-8 text-center text-gray-500">
                Loading products...
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    // We use ShopCard here, mapping the product data to the card's props
                    <ShopCard key={product.id} {...product} />
                ))}
            </div>
        </div>
    );
};


export { Shop };
