import axios from "axios";
import { useState } from "react";
import type { FormEvent, MouseEvent, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { Loader2, Mail, Lock, CheckCircle } from "lucide-react";

// =================================================================
// TypeScript Interfaces for API communication
// =================================================================

interface ResetPasswordResponse {
    success: boolean;
    message: string;
    // Add other properties your successful reset response might contain
}

interface ErrorResponse {
    message: string;
    // Add other error properties
}

// =================================================================
// Component
// =================================================================

export function ForgetPassword() {
    const [email, setEmail] = useState<string>("");
    const [otpSent, setOtpSent] = useState<boolean>(false);
    const [otpVerified, setOtpVerified] = useState<boolean>(false);
    const [otp, setOtp] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const navigate = useNavigate();
    const [isOtpLoading, setIsOtpLoading] = useState<boolean>(false);
    const [isResetLoading, setIsResetLoading] = useState<boolean>(false);

    // Ensure VITE_API_BASE_URL is defined in your .env file
    const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL as string;

    // Simple email validation regex
    const isEmailValid: boolean = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // ===================================
    // Handlers
    // ===================================

    const handleSendOtp = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        if (!email || !isEmailValid) {
            toast.error("Please enter a valid email.");
            return;
        }

        setIsOtpLoading(true);

        try {
            await axios.post(`${API_BASE_URL}/api/auth/send-otp`, {
                email: email,
            });
            toast.success("OTP sent to your email.");
            setOtpSent(true);
        } catch (error) {
            console.error("Error sending OTP:", error);
            const errorMessage = axios.isAxiosError(error)
                ? (error.response?.data as ErrorResponse)?.message || "Failed to send OTP. Please try again."
                : "An unexpected error occurred.";
            toast.error(errorMessage);
        } finally {
            setIsOtpLoading(false);
        }
    };

    const handleVerifyOtp = async (): Promise<void> => {
        if (!otp) {
            toast.error("Please enter the OTP");
            return;
        }

        setIsOtpLoading(true);

        try {
            await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
                email: email,
                otp: otp,
            });

            toast.success("OTP verified!");
            setOtpVerified(true);
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? (error.response?.data as ErrorResponse)?.message || "Invalid or expired OTP."
                : "An unexpected error occurred.";
            toast.error(errorMessage);
        } finally {
            setIsOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (!otpVerified) {
            toast.error("Please verify the OTP first.");
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        setIsResetLoading(true);

        try {
            const res = await axios.post<ResetPasswordResponse>(
                `${API_BASE_URL}/api/auth/reset-password`,
                {
                    email: email,
                    newPassword: newPassword,
                }
            );

            if (res.data?.success || res.status === 200) { // Check for success field or 200 status
                toast.success("Password updated successfully.");
                setTimeout(() => {
                    navigate("/user-login");
                }, 1000);
            } else {
                toast.error(res.data?.message || "Something went wrong. Please try again.");
            }
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? (error.response?.data as ErrorResponse)?.message || "Failed to update password."
                : "An unexpected error occurred.";
            toast.error(errorMessage);
        } finally {
            setIsResetLoading(false);
        }
    };

    // ===================================
    // JSX (Tailwind)
    // ===================================

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar />

            <div
                className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md"
            >
                <h4 className="mb-6 text-2xl font-semibold text-center text-gray-800">Forgot Password</h4>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Email Field */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition"
                                value={email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                disabled={otpSent}
                            />
                        </div>
                    </div>

                    {/* Send OTP / OTP Sent Status */}
                    <div className="space-y-3">
                        {!otpVerified && (
                            <button
                                type="button"
                                className={`w-full py-2.5 rounded-lg font-semibold text-white transition flex items-center justify-center space-x-2 
                                    ${isOtpLoading || otpSent || !isEmailValid
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-yellow-500 hover:bg-yellow-600'
                                    }`}
                                onClick={handleSendOtp}
                                disabled={isOtpLoading || otpSent || !isEmailValid}
                            >
                                {isOtpLoading ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5" />
                                        <span>Sending...</span>
                                    </>
                                ) : otpSent ? (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        <span>OTP Sent</span>
                                    </>
                                ) : (
                                    <span>Send OTP</span>
                                )}
                            </button>
                        )}
                    </div>

                    {/* OTP Verification */}
                    {otpSent && !otpVerified && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Enter OTP</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="form-control w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                                    value={otp}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                                    placeholder="6-digit code"
                                />
                                <button
                                    type="button"
                                    className={`px-4 py-2 rounded-lg font-semibold text-white transition flex items-center justify-center whitespace-nowrap
                                        ${isOtpLoading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    onClick={handleVerifyOtp}
                                    disabled={isOtpLoading || otp.length < 4}
                                >
                                    {isOtpLoading ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : (
                                        "Verify"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* OTP Verified Status */}
                    {otpVerified && (
                        <div className="flex items-center justify-center text-center p-3 rounded-lg bg-green-100 text-green-700 font-semibold">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span>OTP Verified Successfully!</span>
                        </div>
                    )}

                    {/* New Password Field */}
                    {otpVerified && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition"
                                    value={newPassword}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                />
                            </div>
                        </div>
                    )}

                    {/* Reset Password Button (Submit) */}
                    <button
                        type="submit"
                        className={`w-full py-2.5 rounded-lg font-semibold text-white transition flex items-center justify-center space-x-2
                            ${!otpVerified || isResetLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        disabled={!otpVerified || isResetLoading}
                    >
                        {isResetLoading ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5" />
                                <span>Resetting...</span>
                            </>
                        ) : (
                            <span>Reset Password</span>
                        )}
                    </button>

                </form>

                {/* Back to Login Link */}
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-sm font-medium text-yellow-600 hover:text-yellow-700 transition">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}