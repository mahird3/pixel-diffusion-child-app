import React, { useState } from "react";

function App() {
  const [fatherImg, setFatherImg] = useState(null);
  const [motherImg, setMotherImg] = useState(null);
  const [gender, setGender] = useState("boy");
  const [resultImg, setResultImg] = useState(null);
  const [loading, setLoading] = useState(false);

const handleGenerate = async () => {
  if (!fatherImg || !motherImg) {
    alert("Please upload both images!");
    return;
  }

  setResultImg(null);
  setLoading(true);

  const formData = new FormData();
  formData.append("father_image", fatherImg);
  formData.append("mother_image", motherImg);
  formData.append("gender", gender);

  try {
    // Step 1: Call your custom model
    const rawRes = await fetch("http://localhost:5000/api/child", {
      method: "POST",
      body: formData,
    });
    const rawData = await rawRes.json();
    const rawOutput = Array.isArray(rawData.output) ? rawData.output[0] : rawData.output;

    if (!rawOutput) throw new Error("Failed at stage 1");
    console.log("🧒 Raw output:", rawOutput);

    // Step 2: Call CodeFormer
    const codeRes = await fetch("http://localhost:5000/api/codeformer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: rawOutput }),
    });
    const codeData = await codeRes.json();
    const codeOutput = Array.isArray(codeData.output) ? codeData.output[0] : codeData.output;

    if (!codeOutput) throw new Error("Failed at stage 2");
    console.log("🎨 CodeFormer output:", codeOutput);

    // Step 3: Call FLUX Kontext
    const fluxRes = await fetch("http://localhost:5000/api/flux", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: codeOutput }),
    });
    const fluxData = await fluxRes.json();
    const fluxOutput = Array.isArray(fluxData.output) ? fluxData.output[0] : fluxData.output;

    if (!fluxOutput) throw new Error("Failed at stage 3");
    console.log("✨ FLUX output:", fluxOutput);

    // Final: Show the final adorable child face
    setResultImg(fluxOutput);
  } catch (err) {
    console.error("❌ Error in generation pipeline:", err);
    alert("Something went wrong.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h1>🧒 Future Child Face Generator</h1>

      <p>Upload Father's Photo:</p>
      <input type="file" accept="image/*" onChange={(e) => setFatherImg(e.target.files[0])} />

      <p>Upload Mother's Photo:</p>
      <input type="file" accept="image/*" onChange={(e) => setMotherImg(e.target.files[0])} />

      <p>Select Gender:</p>
      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="boy">Boy</option>
        <option value="girl">Girl</option>
      </select>

      <br /><br />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Child"}
      </button>

      {resultImg && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Generated Child Face:</h3>
          <img src={resultImg} alt="Generated Child" style={{ width: "100%", borderRadius: "8px" }} />
          <p style={{ fontSize: "0.8rem", color: "#888", wordBreak: "break-all" }}>{resultImg}</p>
        </div>
      )}
    </div>
  );
}

export default App;