import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function DashboardNavbar({ user }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate("/login");
    };

    return (
        <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">User Dashboard</h1>
            <div className="flex items-center gap-4">
                <span className="text-lg">{user.name} ({user.roles.join(", ")})</span>
                <Button onClick={handleLogout}>Logout</Button>
            </div>
        </nav>
    );
}
