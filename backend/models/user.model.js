import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email : {
        type: String,
        required: true,
        unique: true,
    },
    password : {
        type : String,
    },
    name : {
        type: String,
        required: true,
    }
},{timestamps: true});
// timestamps : true; -> will automatically create createdAt and updatedAt fields in database.

export const User = mongoose.model("User", userSchema);