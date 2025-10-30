import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MultiStepForm from "@/components/forms/MultiStepForm";
import Navbar from "./components/NavBar";
// import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import EventNotifications from "./components/EventNotifications";
import { Toaster } from "react-hot-toast";
import { BuyerDashboard } from "./components/BuyerDashboard";
import { SellerDashboard } from "./components/SellerDashboard";
import BuyerDashboardPage from "./pages/BuyerDashBoardPage";
import { AssetDetailsPage } from "./components/AssetDetailPage";
import { Home } from "./pages/Home";
import { AdminDashboard } from "./components/AdminMainPage";
import { AdminAssetDetailsPage } from "./pages/AdminAssetDetailsPage";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="pt-20">
          <Toaster position="top-right" />   
      <EventNotifications />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<MultiStepForm />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/asset/:propertyId" element={<AdminAssetDetailsPage />} />

          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/buyer-dashboard" element={<BuyerDashboardPage />} />

          {/* <Route path="/asset/:propertyId" element={<PropertyDetailsPage />} /> */}
            <Route path="/property/:tokenId" element={<AssetDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
