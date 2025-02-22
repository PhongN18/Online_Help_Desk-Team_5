import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RequestForm({ facilities, userId }) {
  // Định nghĩa cấu hình form dựa trên structure của request
  const formConfig = [
    {
      name: "facility",
      label: "Chọn Facility",
      type: "select",
      options: facilities, 
    },
    {
      name: "severity",
      label: "Mức độ ưu tiên",
      type: "select",
      options: ["low", "medium", "high"],
    },
    {
      name: "description",
      label: "Mô tả sự cố",
      type: "textarea",
    },
  ];

  // Khởi tạo state cho form dựa theo cấu hình
  const initialState = {};
  formConfig.forEach((field) => {
    initialState[field.name] = "";
  });

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Lấy auth token từ localStorage (đã được lưu khi người dùng đăng nhập)
    const authToken = localStorage.getItem("authToken");

    // Xây dựng đối tượng request theo structure (sử dụng "Unassigned" với U in hoa)
    const requestData = {
      request_id: crypto.randomUUID(),
      created_by: userId,
      facility: formData.facility,
      severity: formData.severity,
      description: formData.description,
      status: "Unassigned", // Sử dụng chữ U in hoa để khớp với enum trong schema
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const response = await fetch("http://localhost:3000/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestData),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: "success", text: "Request submitted successfully!" });
        setFormData(initialState); // Reset form sau khi submit thành công
        
        // Chuyển hướng về dashboard sau 1 giây
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to submit request." });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage({ type: "error", text: "Network error. Try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 w-[500px] bg-white shadow-md">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Tạo Request mới</h2>
        {message && (
          <div className={`p-3 mb-3 text-white rounded ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {formConfig.map((field) => (
            <div key={field.name} className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">{field.label}</label>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{`Chọn ${field.label}`}</option>
                  {field.options.map((option) => {
                    if (typeof option === "object") {
                      return (
                        <option key={option.facility_id} value={option.facility_id}>
                          {option.name}
                        </option>
                      );
                    } else {
                      return (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      );
                    }
                  })}
                </select>
              ) : field.type === "textarea" ? (
                <Textarea
                  name={field.name}
                  placeholder={field.label}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  className="w-full h-24 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <input
                  type="text"
                  name={field.name}
                  placeholder={field.label}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
