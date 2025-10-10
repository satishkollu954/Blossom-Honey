
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';
import { Navbar } from './components/navbar/navbar'
import { Index } from "./components/index";
import { Footer } from "./components/footer/footer";
import { Shop } from "./components/Shop/shop";
import { About } from "./components/About/about";
import { Contact } from "./components/contact/contact";
import { AdminLogin } from "./components/Login/AdminLogin";
import { UserRegister } from "./components/Register/Register";




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

        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  )
}

export default App






