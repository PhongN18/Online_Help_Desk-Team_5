import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CreateRequestPage from "./pages/CreateRequestPage";
import LandingPage from "./pages/LandingPage";
import Login from './pages/Login';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-request" element={<CreateRequestPage />} />
      </Routes>
    </Router>
  )
}

export default App
