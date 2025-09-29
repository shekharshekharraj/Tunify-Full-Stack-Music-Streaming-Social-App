// backend/probe-gemini.mjs
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const gen = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = gen.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const res = await model.generateContent("Say 'pong'.");
console.log(res.response.text());
