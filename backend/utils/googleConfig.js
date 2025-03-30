import {google} from "googleapis"
import dotenv from "dotenv"
dotenv.config()
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

console.log("google", GOOGLE_CLIENT_ID)
console.log("google", GOOGLE_CLIENT_SECRET)


export const oauth2Client = new google.auth.OAuth2(
GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET,
'postmessage'
);

export const SCOPES = [
    "https://www.googleapis.com/auth/drive", // Full drive access
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // ✅ Get a refresh token
    prompt: "consent", // ✅ Force user to accept new scopes
    scope: SCOPES, // ✅ Make sure SCOPES includes Drive permissions
  });

  export const uploadDocumentToDrive = async (token, content, fileName) => {
    try {
      // Set credentials using the token
      oauth2Client.setCredentials({ access_token: token });
      
      // Create drive client
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      // Create file metadata
      const fileMetadata = {
        name: fileName || 'MyDocument.json',
        mimeType: 'application/json',
      };
      
      // Create media
      const media = {
        mimeType: 'application/json',
        body: content
      };
      
      // Upload file
      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,webViewLink',
      });
      
      return {
        success: true,
        fileId: response.data.id,
        fileUrl: response.data.webViewLink
      };
    } catch (error) {
      console.error("Google Drive upload error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };