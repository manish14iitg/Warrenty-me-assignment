import React, { useEffect, useRef, useCallback, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./TextEditor.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore"; // Google token from Zustand
import { googleLogout } from "@react-oauth/google";

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

function TextEditor() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const { googleAccessToken, user, reauthenticateUser } = useAuthStore();

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;
    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });
    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);
    return () => socket.off("receive-changes", handler);
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);
    return () => quill.off("text-change", handler);
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper === null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    setQuill(q);
  }, []);

  // 🔹 Function to Upload Document to Google Drive
  const uploadToGoogleDrive = async () => {
    if (!quill) {
      alert("Editor not initialized!");
      return;
    }

    setUploading(true);

    setUploadStatus("Preparing document...");

    if (!googleAccessToken) {
      setUploading(false);
      setUploadStatus("Authentication required");
      reauthenticateUser();
      alert("You need to sign in with Google first!");
      return;
    }

    try {
      // Extract plain text from Quill editor instead of delta structure
      const plainText = quill.getText(); // This gets just the text content without formatting
      setUploadStatus("Uploading to Google Drive...");

      const response = await fetch(
        "http://localhost:5000/api/documents/upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${googleAccessToken}`,
          },
          body: JSON.stringify({
            content: plainText, // Just the plain text, not the Delta object
            name: `Document-${documentId}.txt`,
            token: googleAccessToken,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setUploadStatus("Upload successful!");
        alert(`Uploaded successfully! View: ${data.fileUrl}`);
      } else {
        setUploadStatus("Upload failed");

        if (data.message && data.message.includes("token")) {
          reauthenticateUser();
          alert("Your session has expired. Please sign in again.");
        } else {
          alert(`Upload failed: ${data.message || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadStatus("Connection error");
      alert("Failed to connect to the server. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  // 🔹 Function to Check or Create Folder
  const getOrCreateFolder = async (googleAccessToken, folderName) => {
    try {
      const searchQuery = encodeURIComponent(
        `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`
      );
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        }
      );

      if (!searchResponse.ok) {
        console.error("Error fetching folder:", await searchResponse.text());
        return null; // Handle the error properly
      }

      const searchData = await searchResponse.json();
      if (!searchData.files || searchData.files.length === 0) {
        console.log("Folder not found, creating new folder...");
        const createResponse = await fetch(
          "https://www.googleapis.com/drive/v3/files",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${googleAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: folderName,
              mimeType: "application/vnd.google-apps.folder",
            }),
          }
        );

        if (!createResponse.ok) {
          console.error("Error creating folder:", await createResponse.text());
          return null;
        }

        const createData = await createResponse.json();
        return createData.id;
      }

      return searchData.files[0].id;
    } catch (error) {
      console.error("Error in getOrCreateFolder:", error);
      return null;
    }
  };

  return (
    <div>
      <div ref={wrapperRef} className="container"></div>
      <button
        onClick={uploadToGoogleDrive}
        className="mt-4 px-4 py-2 bg-white text-black font-semibold rounded-md transition duration-200 hover:bg-gray-300 fixed right-5 bottom-5"
      >
        Upload to Google Drive
      </button>
    </div>
  );
}

export default TextEditor;
