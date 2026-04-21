import express from "express";
import cors from "cors";
// enviroment
import dotenv from "dotenv";
import { generate } from "./chatbot.js";
dotenv.config({ path: "./.env" });
const app = express();
// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:5173" }));
app.get("/", (req, res) => {
    res.send("hello from chatdpt server");
});
app.post("/message", async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message)
        return res.status(400).json({ message: "message not found." });
    const aiRes = await generate(message, sessionId);
    return res.status(200).json({ message: aiRes });
});
app.listen(3000, () => {
    console.log("server is running on the 3000 port.");
});
