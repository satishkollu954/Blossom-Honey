// import { Navigate, useLocation } from 'react-router-dom';

// const ProtectedRoute = ({ children, isAuthenticated }) => {
//     const location = useLocation();

//     if (!isAuthenticated) {
//         // Redirect to the login page, but pass the current location in the state
//         return <Navigate to="/login" state={{ from: location }} replace />;
//     }

//     return children;
// };