import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/connectDB.js";
import authRoute from "./routes/auth.route.js"
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";
import http from "http"; // Import HTTP module to create server
import { Document } from "./models/document.model.js";
import documentRoute from "./routes/document.route.js";
import path from "path";

const __dirname = path.resolve();



dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({origin:process.env.ORIGIN, credentials: true}))
app.use(express.json());
app.use(cookieParser()); // to parse the cookie, that can be accessed in req.cookies.cookie_name.
app.get("/" , (req,res) => {
    res.send("Hii Helllo");
})
app.use("/api/auth", authRoute);
app.use("/api/documents", documentRoute);

if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname,"/frontend/dist")))
  app.get("*", (req,res) => {
    res.sendFile(path.resolve(__dirname,"frontend","dist","index.html"))
  })
}


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  const defaultValue = ""

  io.on("connection", socket => {
    socket.on("get-document", async documentId => {
      const document = await findOrCreateDocument(documentId)
      socket.join(documentId)
      socket.emit("load-document", document.data)
  
      socket.on("send-changes", delta => {
        socket.broadcast.to(documentId).emit("receive-changes", delta)
      })
  
      socket.on("save-document", async data => {
        await Document.findByIdAndUpdate(documentId, { data })
      })
    })
  })
  
  async function findOrCreateDocument(id) {
    if (!id) return null;
    let document = await Document.findById(id);
    if (!document) {
      document = new Document({ _id: id, data: "" });
      await document.save();
    }
    return document;
  }
server.listen(PORT, ()=>{
    // whenever server starts listening connect to database.
    connectDB();
    console.log("Server is running on PORT : ", PORT);
})

