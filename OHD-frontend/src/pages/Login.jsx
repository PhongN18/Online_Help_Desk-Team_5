import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Login() {
    const [userType, setUserType] = useState(null);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [hovered, setHovered] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(`${userType} logging in with`, formData);
        // Implement authentication logic
    };

    return (
        <div className="custom-container">
            <div className="flex min-h-screen p-4">
                {/* Left Side - Login Selection */}
                <div className="flex flex-col gap-4">
                    <Card
                        onMouseEnter={() => setHovered("user")}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setUserType("user")}
                        className={`cursor-pointer p-6 text-center transition hover:shadow-lg ${
                            hovered === "user" ? "bg-blue-100" : "bg-white"
                        }`}
                    >
                        <CardContent>User Login</CardContent>
                    </Card>
                    <Card
                        onMouseEnter={() => setHovered("admin")}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setUserType("admin")}
                        className={`cursor-pointer p-6 text-center transition hover:shadow-lg ${
                            hovered === "admin" ? "bg-blue-100" : "bg-white"
                        }`}
                    >
                        <CardContent>Admin Login</CardContent>
                    </Card>
                </div>

                {/* Right Side - Image or Form */}
                <div className="ml-8 w-[400px] h-[250px] flex items-center justify-center bg-white shadow-md rounded-lg">
                    {userType ? (
                        <Card className="p-6 w-full">
                            <CardContent>
                                <h2 className="text-xl font-semibold mb-4">
                                    {userType === "user" ? "User Login" : "Admin Login"}
                                </h2>
                                <form onSubmit={handleSubmit}>
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
                                    <Button type="submit" className="w-full">
                                        Login
                                    </Button>
                                </form>
                                <Button variant="ghost" onClick={() => setUserType(null)} className="mt-4 w-full">
                                    Back
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <img
                            src={hovered === "user" ? "/images/user-image.jpg" : hovered === "admin" ? "/images/admin-image.jpg" : "/images/default-image.jpg"}
                            alt="Login Illustration"
                            className="w-full h-full object-cover rounded-lg"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
