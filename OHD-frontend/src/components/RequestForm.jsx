import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function RequestForm({ facilities, userId }) {
    const [formData, setFormData] = useState({
        facility: "",
        severity: "medium",
        description: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const requestData = {
            request_id: crypto.randomUUID(), // Unique ID
            created_by: userId, // Logged-in user
            facility: formData.facility,
            severity: formData.severity,
            description: formData.description,
            status: "unassigned", // Default status
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        try {
            const response = await fetch("http://localhost:5000/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();
            if (response.ok) {
                setMessage({ type: "success", text: "Request submitted successfully!" });
                setFormData({ facility: "", severity: "medium", description: "" }); // Reset form
            } else {
                setMessage({ type: "error", text: result.error || "Failed to submit request." });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Network error. Try again later." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6 w-[500px] bg-white shadow-md">
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">Create a New Request</h2>
                
                {message && (
                <div className={`p-3 mb-3 text-white rounded ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
                    {message.text}
                </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Facility Selection */}
                    <label className="block text-gray-700 font-medium mb-2">Facility</label>
                    <select
                        name="facility"
                        value={formData.facility}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Facility</option>
                        {facilities.map((facility) => (
                        <option key={facility.facility_id} value={facility.facility_id}>
                            {facility.name}
                        </option>
                        ))}
                    </select>

                    {/* Severity Selection */}
                    <label className="block text-gray-700 font-medium mb-2">Severity</label>
                    <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>

                    {/* Description Input */}
                    <label className="block text-gray-700 font-medium mb-2">Description</label>
                    <Textarea
                        name="description"
                        placeholder="Describe the issue..."
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="w-full h-24 p-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
