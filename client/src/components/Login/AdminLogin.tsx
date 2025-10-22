import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Lock, User } from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // <-- Import useLocation
import { useCookies } from 'react-cookie';
import { toast, ToastContainer } from 'react-toastify';


const AdminLoginSchema = Yup.object().shape({
    email: Yup.string()
        .min(1, 'Email is required')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
});

type AdminLoginValues = Yup.InferType<typeof AdminLoginSchema>;


export function AdminLogin() {
    const [cookie, setCookie] = useCookies(["role", "token"]);
    const navigate = useNavigate();
    const location = useLocation();


    const fromPath = location.state?.from?.pathname || '/';

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const formik = useFormik<AdminLoginValues>({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: AdminLoginSchema,
        onSubmit: (values) => {
            axios.post(`${API_URL}/api/auth/login`, values)
                .then((response) => {
                    const { user, token } = response.data;


                    setCookie("role", user.role);
                    setCookie("token", token);


                    toast.success(`Welcome back, ${user.name}` || "User");
                    if (user.role === 'admin') {
                        setTimeout(() => navigate("/admin", { replace: true }), 800);
                    } else {
                        setTimeout(() => navigate(fromPath, { replace: true }), 800);
                    }
                })
                .catch((error) => {
                    console.error("Login failed:", error);
                    toast.error(error.response.data.message || "Invalid credentials. Please try again.");

                });


        },
    });

    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar />

            <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-semibold text-gray-800">Login Panel</h1>
                </div>

                <form onSubmit={formik.handleSubmit} className="space-y-6">

                    {/* Username/Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            Email
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                id="email"
                                type="text"
                                placeholder="Enter your email"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg font-semibold text-white transition flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                        <span>Login</span>
                    </button>
                </form>

                <div className="text-center mt-4 space-y-2">
                    <Link
                        to="/register"
                        className="text-gray-600 hover:text-yellow-600 transition-colors block"
                    >
                        New User? <strong className="font-semibold text-yellow-500 hover:text-yellow-600">Register</strong>
                    </Link>

                    <Link
                        to="/forget"
                        className="text-gray-600 hover:text-yellow-600 transition-colors block"
                    >
                        <strong className="font-semibold text-yellow-500 hover:text-yellow-600">Forgot Password</strong>
                    </Link>
                </div>
            </div>
        </div>
    );
}