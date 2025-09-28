// api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({ baseURL: "http://10.193.99.240:5000/api" });

// Attach token if available (only for Node backend)
API.interceptors.request.use(async (req) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.log("Error reading token:", e);
  }
  return req;
});

// 🟢 Separate client for YOLOv8 FastAPI
const YOLO_API = axios.create({ baseURL: "http://10.193.99.240:8000" });

// Upload photo to YOLOv8 server
export const classifyPhoto = async (imageUri) => {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  try {
    const response = await YOLO_API.post("/classify-photo/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error calling classifyPhoto API:", error);
    throw error;
  }
};

// Save classification data for current user
export const saveClassification = async (data) => {
  try {
    const response = await API.post("/history/save", data);
    return response.data;
  } catch (error) {
    console.error("Error saving classification:", error);
    throw error;
  }
};

// Fetch recent classification history for current user
export const getRecentHistory = async () => {
  try {
    const response = await API.get("/history/recent");
    return response.data;
  } catch (error) {
    console.error("Error fetching recent history:", error);
    throw error;
  }
};



export default API;
