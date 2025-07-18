// Load required libraries
import express from "express";
import cors from "cors";
import axios from "axios";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer();

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function: upload an image buffer to Cloudinary
async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: "image" }, (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          return reject(new Error("Failed to upload image to Cloudinary"));
        }
        resolve(result.secure_url);
      })
      .end(file.buffer);
  });
}

// POST /api/child — receives 2 images + gender, returns generated child image
app.post("/api/child", upload.fields([{ name: "father_image" }, { name: "mother_image" }]), async (req, res) => {
  try {
    const gender = req.body.gender;
    const fatherFile = req.files?.father_image?.[0];
    const motherFile = req.files?.mother_image?.[0];

    if (!fatherFile || !motherFile || !gender) {
      return res.status(400).json({ error: "Missing inputs" });
    }

    // Upload images to Cloudinary
    const fatherUrl = await uploadToCloudinary(fatherFile);
    const motherUrl = await uploadToCloudinary(motherFile);

    console.log("👨 Father URL:", fatherUrl);
    console.log("👩 Mother URL:", motherUrl);
    console.log("⚧️ Gender:", gender);

    // Call your Replicate model
    const replicateRes = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "ff468394511c14964291096709b7295158bcb595fe3e8a830f3c7a5ae54c0177",
        input: {
          father_image: fatherUrl,
          mother_image: motherUrl,
          gender: gender,
        },
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const predictionUrl = replicateRes.data.urls.get;
    let status = replicateRes.data.status;
    let output = null;

    // Wait for model to finish (max 5 minutes)
    for (let i = 0; i < 75; i++) {
      const pollRes = await axios.get(predictionUrl, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      status = pollRes.data.status;
      output = pollRes.data.output;

      if (status === "succeeded" && output) break;
      if (status === "failed") throw new Error("Replicate prediction failed");

      console.log(`⏳ Waiting... Status: ${status}`);
      await new Promise((resolve) => setTimeout(resolve, 4000)); // wait 4 seconds
    }
    
    console.log("✅ Replicate output:", output);

    res.json({ output });
  } catch (err) {
    console.error("❌ Error (full):", err);
    res.status(500).json({ error: "Failed to generate child face" });
  }
});

app.post("/api/codeformer", async (req, res) => {
  try {
    const { image_url } = req.body;

    const startRes = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2", // ✅ Latest CodeFormer
        input: {
          image: image_url,
          upscale: 2,
          face_upsample: true,
          background_enhance: true,
          codeformer_fidelity: 0.5,
        },
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const predictionUrl = startRes.data.urls.get;
    let output = null;
    let status = startRes.data.status;

    for (let i = 0; i < 60; i++) {
      const pollRes = await axios.get(predictionUrl, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      status = pollRes.data.status;
      output = pollRes.data.output;

      if (status === "succeeded" && output) break;
      if (status === "failed") throw new Error("CodeFormer failed");

      console.log(`⏳ CodeFormer running... Status: ${status}`);
      await new Promise((r) => setTimeout(r, 4000));
    }

    console.log("✅ CodeFormer output:", output);
    res.json({ output });
  } catch (err) {
    console.error("❌ CodeFormer Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to run CodeFormer" });
  }
});

app.post("/api/flux", async (req, res) => {
  try {
    const { image_url } = req.body;

    const startRes = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "black-forest-labs/flux-kontext-pro", // Full version ID for FLUX Kontext Pro
        input: {
          input_image: image_url,
          prompt: "Generate a child version of this face with big eyes, soft round cheeks, and a warm smile. Make it look like an adorable, lovable child, cute, and visually appealing. Ignore age in the original image and always produce a young child look (around 8 years old). Make the face look hyper-realistic and very cute.",
          aspect_ratio: "1:1",
          output_format: "png",
          safety_tolerance: 2,
          prompt_upsampling: true,
          seed: 42
        }
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const predictionUrl = startRes.data.urls.get;
    let status = startRes.data.status;
    let output = null;

    for (let i = 0; i < 60; i++) {
      const pollRes = await axios.get(predictionUrl, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      status = pollRes.data.status;
      output = pollRes.data.output;

      if (status === "succeeded" && output) break;
      if (status === "failed") throw new Error("Flux Kontext failed");

      console.log(`⏳ Flux status: ${status}`);
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    console.log("✅ Flux output:", output);
    res.json({ output });
  } catch (err) {
    console.error("❌ Flux error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to apply Flux model" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});