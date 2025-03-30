import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  _id: String, // Use the document ID as the unique identifier
  data: Object, // Store the document content
});

export const Document = mongoose.model("Document", DocumentSchema);
