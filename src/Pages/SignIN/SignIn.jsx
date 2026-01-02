import React, { useState, useContext } from "react";
import "./SignIn.css";
import { StoreContext } from "../../context/StoreContext";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://protien-backend-1.onrender.com/api/users");

function SignIn({ onAuthSuccess, modeDefault = "Login" }) {
  const [mode, setMode] = useState(modeDefault);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useContext(StoreContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const endpoint =
      mode === "Sign Up" ? `${BACKEND_URL}/signup` : `${BACKEND_URL}/login`;

    const payload =
      mode === "Sign Up"
        ? formData
        : { email: formData.email, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      setMessage(result.message || JSON.stringify(result));

      if (result.success) {
        // Handle login - token is in result.data
        if (mode === "Login" && result.data) {
          const token = result.data; // Token string from backend
          // Save token to localStorage
          localStorage.setItem('token', token);
          // Save user info to context
          loginUser({ 
            email: formData.email,
            name: formData.name || formData.email.split('@')[0], // Use name or email prefix
            token: token
          });
          setFormData({ name: "", email: "", password: "" });
          if (onAuthSuccess) onAuthSuccess();
        } 
        // Handle signup - DO NOT auto-login, just show success and switch to login
        else if (mode === "Sign Up") {
          setMessage("Account created successfully! Please login to continue.");
          // Clear form but keep email for convenience
          const userEmail = formData.email;
          setFormData({ name: "", email: userEmail, password: "" });
          // Switch to login mode after 1.5 seconds
          setTimeout(() => {
            setMode("Login");
            setMessage("");
          }, 1500);
        }
      }
    } catch (err) {
      setMessage("Unable to connect to server!");
    }

    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">{mode}</h1>

        {message && (
          <p className={message.toLowerCase().includes("success") ? "msg success" : "msg error"}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "Sign Up" && (
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              className="auth-input"
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="auth-input"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Your Password"
            value={formData.password}
            onChange={handleChange}
            className="auth-input"
            required
          />

          <button className="auth-btn" disabled={loading}>
            {loading ? "Please wait..." : mode}
          </button>
        </form>

        <p className="switch-text">
          {mode === "Login" ? (
            <>
              Don't have an account?{" "}
              <span onClick={() => setMode("Sign Up")}>Create one</span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span onClick={() => setMode("Login")}>Login here</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default SignIn;
