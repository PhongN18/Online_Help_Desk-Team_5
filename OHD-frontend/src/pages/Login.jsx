import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [view, setView] = useState(null); // "user" = user login, "admin" = admin login, "register" = create account
    const [formData, setFormData] = useState({ email: "", password: "", name: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let response;
            if (view === "register") {
                // Handle New Account Creation
                response = await fetch("http://localhost:5000/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
            } else {
                // Handle Login
                response = await fetch("http://localhost:5000/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: formData.email, password: formData.password }),
                });
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Something went wrong");
            }

            // Store authentication token (if applicable)
            localStorage.setItem("authToken", result.token);

            // Redirect user
            if (view === "register" || view === "user") {
                navigate("/dashboard"); // Redirect to User Dashboard
            } else if (view === "admin") {
                navigate("/admin-dashboard"); // Redirect to Admin Dashboard
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            {/* Selection Screen */}
            {!view ? (
                <div className="flex flex-col gap-4">
                    <Button onClick={() => setView("user")} className="w-64 p-4 text-lg bg-blue-500 text-white hover:opacity-75">
                        Continue as User
                    </Button>
                    <Button onClick={() => setView("admin")} className="w-64 p-4 text-lg bg-black text-white hover:opacity-75">
                        Continue as Admin
                    </Button>
                </div>
            ) : (
                <div className="bg-white p-6 shadow-md rounded-lg w-80">
                    <h2 className="text-2xl font-semibold text-center mb-6">
                        {view === "register" ? "Create New Account" : view === "user" ? "User Login" : "Admin Login"}
                    </h2>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <form onSubmit={handleSubmit}>
                        {view === "register" && (
                            <Input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="mb-4"
                                required
                            />
                        )}
                        <Input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="mb-4"
                            required
                        />
                        <Input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mb-4"
                            required
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Processing..." : view === "register" ? "Create Account" : "Login"}
                        </Button>
                    </form>

                    {/* "Create New Account" Text Link (Only in User Login) */}
                    {view === "user" && (
                        <p
                            className="text-blue-600 text-center mt-4 cursor-pointer hover:underline"
                            onClick={() => setView("register")}
                        >
                            Create New Account
                        </p>
                    )}

                    <Button onClick={() => setView(null)} className="mt-4 w-full">
                        Back
                    </Button>
                </div>
            )}
        </div>
    );
}
