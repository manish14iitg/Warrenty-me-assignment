import express from "express";
import mongoose from "mongoose";
import { Document } from "../models/document.model.js";
import {google} from "googleapis"
import { oauth2Client } from "../utils/googleConfig.js";
import { uploadDocumentToDrive } from "../controller/auth.controller.js";

const router = express.Router();

// Fetch all documents
router.get("/", async (req, res) => {
  try {
    const documents = await Document.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching documents" });
  }
});

// Create a new document
router.post("/", async (req, res) => {
  try {
    const newDoc = new Document({ _id: new mongoose.Types.ObjectId().toString(), data: "" });
    await newDoc.save();
    res.json(newDoc);
  } catch (error) {
    res.status(500).json({ error: "Error creating document" });
  }
});

// Function to find or create folder in Google Drive
const findOrCreateFolder = async (drive, folderName) => {
  try {
    // Search for the folder
    const folderQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const folderResponse = await drive.files.list({
      q: folderQuery,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    // If folder exists, return its ID
    if (folderResponse.data.files.length > 0) {
      console.log(`Folder "${folderName}" found with ID: ${folderResponse.data.files[0].id}`);
      return folderResponse.data.files[0].id;
    }

    // If folder doesn't exist, create it
    console.log(`Folder "${folderName}" not found, creating it...`);
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const newFolder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    console.log(`Folder "${folderName}" created with ID: ${newFolder.data.id}`);
    return newFolder.data.id;
  } catch (error) {
    console.error(`Error finding/creating folder "${folderName}":`, error.message);
    throw error;
  }
};

// Upload document to Google Drive in specific folder
router.post("/upload", async (req, res) => {
  try {
    const { content, name, token } = req.body;
    const folderName = "Warranty Me Assignment"; // The folder name you want to use
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "No Google access token provided" 
      });
    }
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: "No document content provided" 
      });
    }
    
    // Set the access token for this request
    oauth2Client.setCredentials({ access_token: token });
    
    // Verify token before uploading
    try {
      const tokenInfo = await oauth2Client.getTokenInfo(token);
      console.log("Token verified, scopes:", tokenInfo.scopes);
      
      // Check if token has the required scopes
      const hasDriveScope = tokenInfo.scopes.some(scope => 
        scope.includes('drive') || scope.includes('drive.file')
      );
      
      if (!hasDriveScope) {
        return res.status(403).json({
          success: false,
          message: "Token doesn't have Drive permissions"
        });
      }
    } catch (error) {
      console.error("Token validation error:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google token"
      });
    }
    
    // Create drive client
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Find or create the folder
    const folderId = await findOrCreateFolder(drive, folderName);
    
    // Update file metadata to include the parent folder
    const fileMetadata = {
      name: name || 'MyDocument.txt',
      mimeType: 'text/plain', // Changed to text/plain for plain text content
      parents: [folderId] // This specifies the parent folder ID
    };
    
    const media = {
      mimeType: 'text/plain', // Changed to text/plain to match
      body: content
    };
    
    // Upload the file to the folder
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,webViewLink',
    });
    
    return res.status(200).json({
      success: true,
      fileId: file.data.id,
      fileUrl: file.data.webViewLink,
      folderId: folderId,
      folderName: folderName
    });
    
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload to Google Drive",
      error: error.message
    });
  }
});

export default router;
