import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';



const UserRegisterSchema = Yup.object().shape({
    name: Yup.string()
        .min(4, 'Name must be at least 4 characters')
        .required('Name is required'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),

});

// TypeScript type derived from the Yup schema
type UserRegisterValues = Yup.InferType<typeof UserRegisterSchema>;



export function UserRegister() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const formik = useFormik<UserRegisterValues>({
        initialValues: {
            name: '',
            email: '',
            password: '',

        },
        validationSchema: UserRegisterSchema,
        onSubmit: (values) => {
            setIsLoading(true);
            console.log('User Registration Attempt:', values);

            // We only send the required data to the backend (excluding confirmPassword)
            const { name, email, password } = values;

            axios.post(`${API_URL}/api/auth/signup`, { name, email, password })
                .then((response) => {
                    setIsLoading(false);

                    alert('Registration Successful! Please log in.');
                    navigate('/login'); // Redirect to login page
                })
                .catch((error) => {
                    setIsLoading(false);
                    console.error('Registration failed:', error.message);
                    alert(`${error.response?.data?.message || error.message}`); // Simple failure message
                });
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <ToastContainer position="top-center" autoClose={1500} />
            <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-semibold text-gray-800">Create Account</h1>
                    <p className="text-gray-500 mt-2">Join us to explore our products</p>
                </div>

                <form onSubmit={formik.handleSubmit} className="space-y-4">

                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                id="name"
                                type="text"
                                placeholder="Your full name"
                                {...formik.getFieldProps('name')}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:outline-none 
                  ${formik.touched.name && formik.errors.name
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-yellow-500'}`}
                            />
                        </div>
                        {formik.touched.name && formik.errors.name && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                id="email"
                                type="email"
                                placeholder="your@gmail.com"
                                {...formik.getFieldProps('email')}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:outline-none 
                  ${formik.touched.email && formik.errors.email
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-yellow-500'}`}
                            />
                        </div>
                        {formik.touched.email && formik.errors.email && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter password"
                                {...formik.getFieldProps('password')}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:outline-none 
                  ${formik.touched.password && formik.errors.password
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-yellow-500'}`}
                            />
                        </div>
                        {formik.touched.password && formik.errors.password && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
                        )}
                    </div>

                    {/* Submit Button (with loading spinner) */}
                    <button
                        type="submit"
                        disabled={isLoading || !formik.isValid}
                        className={`w-full py-2.5 rounded-lg font-semibold text-white transition flex items-center justify-center space-x-2 
              ${isLoading || !formik.isValid
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-yellow-500 hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5" />
                                <span>Registering...</span>
                            </>
                        ) : (
                            <span>Register</span>
                        )}
                    </button>
                </form>

                {/* Link back to login */}
                <div className="text-center mt-4">
                    <Link
                        to="/login"
                        className="text-gray-600 hover:text-yellow-600 transition-colors block text-sm"
                    >
                        Already have an account? <strong className="font-semibold text-yellow-500 hover:text-yellow-600">Login here</strong>
                    </Link>
                </div>
            </div>
        </div>
    );
}