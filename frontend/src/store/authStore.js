import {create} from "zustand"
import axios from "axios"
import { loadGapiInsideDOM } from "gapi-script";
const API_URL="https://warrenty-me-assignment.onrender.com/api/auth"
axios.defaults.withCredentials = true;
// with every request it will send cookies with it.

export const useAuthStore = create((set) => ({
    user:null,
    token: null,
    isAuthenticated: false,
    isCheckingAuth: true,
    error: null,
    googleAccessToken: null,

    signup : async (email, password, name ) => {
        set({error:null})
        try {
            const response = await axios.post(`${API_URL}/signup`, {email,password,name});
            set({user:response.data.user, isAuthenticated: true});
        } catch (error) {
            set({error: error.response.data.message || "Error Signing Up"});
            throw error;
        }
    },
    checkAuth : async () => {
        set({isCheckingAuth: true, error: null});
        try {
            const response = await axios.get(`${API_URL}/check-auth`);
            set({user: response.data.user, isAuthenticated: true, isCheckingAuth: false});
        } catch (error) {
            set({error: null, isCheckingAuth: false,isAuthenticated: false});
        }
    },
    login : async (email,password) => {
        set({error: null});
        try {
            const response = await axios.post(`${API_URL}/login`, {email,password});
            set({user: response.data.user, isAuthenticated: true, error: null})
        } catch (error) {
            set({error: error.response.data.message || "Error Loging in"});
            throw error;
        }
    },
    logout : async () => {
        set({error: null});
        try {
            const response = await axios.post(`${API_URL}/logout`);
            set({user:null, isAuthenticated: false, error: null});
        } catch (error) {
            set({error: "Error Loging out"});
            throw error;
        }
    },
    googleAuth: async (code) => {
        set({ error: null, isAuthenticated: false });
        try {
          const response = await axios.get(`${API_URL}/google?code=${code}`);
          set({ user: response.data.user, token: response.data.token,googleAccessToken:response.data.googleAccessToken, isAuthenticated: true });
        } catch (error) {
          set({ error: "Error in Google Login" });
        }
      },
      reauthenticateUser : async () => {
        try {
            // Ensure gapi is loaded
            if (!gapi.auth2) {
                console.warn("⚠️ gapi.auth2 is undefined. Initializing now...");
                await gapi.load("auth2", async () => {
                    await gapi.auth2.init({
                        clientId: "YOUR_CLIENT_ID.apps.googleusercontent.com",
                    });
                });
            }
    
            // Get auth instance after initialization
            const authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance) {
                console.error("❌ Auth instance not found!");
                return;
            }
    
            await authInstance.signIn();
            console.log("✅ User reauthenticated successfully!");
        } catch (error) {
            console.error("❌ Error during reauthentication:", error);
        }
    }
    
    
}))
