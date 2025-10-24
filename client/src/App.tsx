import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { Navbar } from "./components/navbar/navbar";
import { Index } from "./components/index";
import { Footer } from "./components/footer/footer";
import { Shop } from "./components/Shop/shop";
import { About } from "./components/About/about";
import { Contact } from "./components/contact/contact";
import { AdminLogin } from "./components/Login/AdminLogin";
import { UserRegister } from "./components/Register/Register";
import { ForgetPassword } from "./components/forgetPassword/forgetPassword";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { Unauthorized } from "./components/unauthorized/unauthorized";

import { UserProfile } from "./components/UserProfile/UserProfile";
import AdminDashboard from "./components/AdminDahsboard/AdminDashboard";
import UploadProduct from "./components/uploadproducts/UploadProducts";
import ViewProducts from "./components/viewproducts/ViewProducts";
import HoneyStory from "./components/honeystory/HoneyStory";
import UsersList from "./components/AllUsers/AllUsers";
import ProductDetails from "./components/ProductDetails/ProductDetails";
import { MyOrders } from "./components/MyOrders/MyOrders";
import Cart from "./components/Cart/Cart";
import { Checkout } from "./components/checkout/Checkout";
import SuccessPage from "./components/successpage/successpage";
import CouponManager from "./components/CouponManager/CouponManager";
import OrderForAdmin from "./components/Order/OrderForAdmin";
import NotFound from "./components/NotFound/NotFound";
import { Article } from "./components/Article/Article";
import WhyBlossom from "./components/WhyBlossom/WhyBlossom";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";



function App() {
  return (
    <>
      <BrowserRouter>
        <ScrollToTop />

        <Navbar />
        <Article />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/forget" element={<ForgetPassword />} />
          <Route path="/ourstory" element={<HoneyStory />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/whyblossom" element={<WhyBlossom />} />





          {/* Protected Admin Route */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coupon"
            element={
              <ProtectedRoute allowedRole="admin">
                <CouponManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRole="admin">
                <OrderForAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/allusers"
            element={
              <ProtectedRoute allowedRole="admin">
                <UsersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addproduct"
            element={
              <ProtectedRoute allowedRole="admin">
                <UploadProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewproducts"
            element={
              <ProtectedRoute allowedRole="admin">
                <ViewProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRole="user">
                <UserProfile />
              </ProtectedRoute>
            }
          />


          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRole="user">
                <MyOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRole="user">
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/success"
            element={
              <ProtectedRoute allowedRole="user">
                <SuccessPage />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized Page */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Catch-All Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
