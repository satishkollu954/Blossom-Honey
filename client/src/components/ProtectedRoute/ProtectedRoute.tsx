import type { ReactNode } from "react";
import { useCookies } from "react-cookie";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRole?: string;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
    const [cookies] = useCookies(["token", "role"]);
    const isAuthenticated = cookies.token !== undefined;

    const role = cookies.role;

    // If user is not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If user role doesn’t match the allowed role
    if (allowedRole && role !== allowedRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    // If authenticated and authorized
    return <>{children}</>;
}
