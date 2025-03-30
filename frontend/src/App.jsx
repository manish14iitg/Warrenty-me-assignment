import { Navigate, Route, Routes } from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import { useAuthStore } from "./store/authStore";
import { Children, useEffect } from "react";
import DashboardPage from "./pages/DashboardPage";
import TextEditor from "./TestEditorComponents/TextEditor";
import { gapi } from "gapi-script";

const initializeGapi = async () => {
  try {
    await gapi.load("client", async () => {
      await gapi.client.init({
        clientId:
          "204371919261-177acrc8f3nlktcm8dfbp7ed3aicsdpv.apps.googleusercontent.com",
        scope:
          "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly",
      });
      console.log("✅ GAPI Initialized Successfully");
    });
  } catch (error) {
    console.error("❌ Error initializing gapi:", error);
  }
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const { isCheckingAuth, isAuthenticated, user, checkAuth } = useAuthStore();
  useEffect(() => {
    initializeGapi();
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
          exact
        />
        <Route
          path="signup"
          element={
            <RedirectAuthenticatedUser>
              <SignUpPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route path="/document/:id" element={<TextEditor />} />
        <Route
          path="/login"
          element={
            <RedirectAuthenticatedUser>
              <LoginPage />
            </RedirectAuthenticatedUser>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
