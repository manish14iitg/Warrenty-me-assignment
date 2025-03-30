import { google } from "googleapis";
import express from "express";
const router = express.Router();

router.post("/upload", async (req, res) => {
    const { content, name } = req.body;
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: req.headers.authorization.split(" ")[1] });

    const drive = google.drive({ version: "v3", auth });

    try {
        const fileMetadata = { name: `${name}.docx`, parents: ["Warranty Me Assignment"] };
        const media = { mimeType: "application/vnd.google-apps.document", body: content };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id, webViewLink",
        });

        res.json({ success: true, fileUrl: file.data.webViewLink });
    } catch (error) {
        console.error("Drive Upload Error:", error);
        res.status(500).json({ success: false, message: "Upload failed" });
    }
});

export default router;