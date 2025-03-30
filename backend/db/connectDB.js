import monggose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await monggose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected : ${conn.connection.host}`)
    } catch (error) {
        console.log("Error Connection to MongoDB :", error.message);
        process.exit(1); // 1 -> failure status code , 0 -> success status code
    }
}