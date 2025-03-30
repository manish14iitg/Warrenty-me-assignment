import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

function GoogleLogin() {
  const { googleAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const responseGoogle = async (authResult) => {
    try {
      if (authResult["code"]) {
        await googleAuth(authResult.code);
        if (isAuthenticated) {
          navigate("/dashboard");
        }
      } else {
        console.error("Google Login Failed", authResult);
      }
    } catch (e) {
      console.error("Error while Google Login...", e);
    }
  };
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });
  return (
    <div>
      <button
        className="w-full py-2 bg-white text-black rounded-md font-medium hover:bg-gray-300 transition"
        onClick={handleGoogleLogin}
      >
        Login with Google
      </button>
    </div>
  );
}

export default GoogleLogin;
