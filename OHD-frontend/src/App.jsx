import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import CreateRequestPage from "./pages/CreateRequestPage";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Login from './pages/Login';
import RequestDetail from "./pages/RequestDetail";

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-request" element={<CreateRequestPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/request-detail/:request_id" element={<RequestDetail />} />
        </Routes>
      </Router>
      <Footer />
    </>
  )
}

export default App
