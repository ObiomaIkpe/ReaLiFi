import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MultiStepForm from "@/components/forms/MultiStepForm";
import Navbar from "./components/NavBar";
import AdminControlPanel from "./pages/AdminPage";
import HomePage from "./pages/Home";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import EventNotifications from "./components/EventNotifications";
import { Toaster } from "react-hot-toast";
import AssetsPage from "./pages/AssetsPage";
import MarketplacePage from "./pages/MarketPlacePage";
import { BuyerDashboard } from "./components/BuyerDashboard";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="pt-20"> {/* offset for fixed navbar */}
          <Toaster position="top-right" />   
      <EventNotifications />
        <Routes>
         <Route path="/" element={<div className="text-center text-text-primary mt-10"><HomePage /></div>} />
          <Route path="/upload" element={<MultiStepForm />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
          <Route path="/market-place" element={<MarketplacePage />} />
          <Route path="/asset/:propertyId" element={<PropertyDetailsPage />} />
          <Route path="/admin" element={<AdminControlPanel/>} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
