import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleLogin from "./GoogleLogin";

const GoogleAuthWrapper = () => {
  return (
    <GoogleOAuthProvider clientId="204371919261-177acrc8f3nlktcm8dfbp7ed3aicsdpv.apps.googleusercontent.com">
      <GoogleLogin />
    </GoogleOAuthProvider>
  );
};

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-96 p-8 bg-black border border-gray-600 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center text-white mb-6">
          Welcome Back
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 bg-white text-black rounded-md font-medium hover:bg-gray-300 transition"
          >
            Log in
          </button>
        </form>

        <div className="text-center text-white mt-4">or</div>

        <div className="mt-4">
          <GoogleAuthWrapper />
        </div>

        <div className="mt-4 text-center text-white">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-400 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
