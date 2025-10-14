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
import { NotFound } from "./components/NotFound/NotFound";
import { UserProfile } from "./components/UserProfile/UserProfile";
import AdminDashboard from "./components/AdminDahsboard/AdminDashboard";
import UploadProduct from "./components/uploadproducts/UploadProducts";
import ViewProducts from "./components/viewproducts/ViewProducts";
import HoneyStory from "./components/honeystory/HoneyStory";


function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/forget" element={<ForgetPassword />} />
          <Route path="/ourstory" element={<HoneyStory />} />

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
