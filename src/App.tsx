import React, { useState } from 'react';
import { Upload, Sparkles, Baby, Heart, Camera, Wand2, Share2, Copy, Facebook, Twitter, MessageCircle, Link } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;


interface GeneratedResult {
  imageUrl: string;
  timestamp: number;
}

function App() {
  const [fatherImg, setFatherImg] = useState<File | null>(null);
  const [motherImg, setMotherImg] = useState<File | null>(null);
  const [fatherPreview, setFatherPreview] = useState<string | null>(null);
  const [motherPreview, setMotherPreview] = useState<string | null>(null);
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [resultImg, setResultImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleFileUpload = (file: File, type: 'father' | 'mother') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (type === 'father') {
        setFatherImg(file);
        setFatherPreview(preview);
      } else {
        setMotherImg(file);
        setMotherPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!fatherImg || !motherImg) {
      alert("Please upload both parent photos!");
      return;
    }

    setResultImg(null);
    setLoading(true);
    setCurrentStep(1);

    const formData = new FormData();
    formData.append("father_image", fatherImg);
    formData.append("mother_image", motherImg);
    formData.append("gender", gender);

    try {
      // Step 1: Generate initial child face
      setCurrentStep(1);
      const rawRes = await fetch(`${API_BASE}/api/child`, {
        method: "POST",
        body: formData,
      });
      const rawData = await rawRes.json();
      const rawOutput = Array.isArray(rawData.output) ? rawData.output[0] : rawData.output;

      if (!rawOutput) throw new Error("Failed at stage 1");

      // Step 2: Enhance with CodeFormer
      setCurrentStep(2);
      const codeRes = await fetch(`${API_BASE}/api/codeformer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: rawOutput }),
      });
      const codeData = await codeRes.json();
      const codeOutput = Array.isArray(codeData.output) ? codeData.output[0] : codeData.output;

      if (!codeOutput) throw new Error("Failed at stage 2");

      // Step 3: Final styling with FLUX
      setCurrentStep(3);
      const fluxRes = await fetch(`${API_BASE}/api/flux`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: codeOutput }),
      });
      const fluxData = await fluxRes.json();
      const fluxOutput = Array.isArray(fluxData.output) ? fluxData.output[0] : fluxData.output;

      if (!fluxOutput) throw new Error("Failed at stage 3");

      setResultImg(fluxOutput);
      setCurrentStep(0);
      
      // Generate a shareable URL (in a real app, you'd save this to a database)
      const shareableUrl = `${window.location.origin}/shared/${Date.now()}`;
      setShareUrl(shareableUrl);
    } catch (err) {
      console.error("Generation error:", err);
      alert("Something went wrong during generation. Please try again.");
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform?: string) => {
    if (!resultImg || !shareUrl) return;

    const shareData = {
      title: 'Check out my future child!',
      text: 'I used AI to generate what my future child might look like! 👶✨',
      url: shareUrl,
    };

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      }
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shareUrl}`)}`, '_blank');
    } else {
      setShowShareModal(true);
    }
  };

  const steps = [
    { name: "Analyzing Features", icon: Camera },
    { name: "Enhancing Quality", icon: Sparkles },
    { name: "Creating Magic", icon: Wand2 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-b border-purple-100">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-purple-100/50"></div>
        <div className="relative max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
              <Baby className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Future Child Generator
            </h1>
            <p className="text-gray-600 text-lg">
              Discover what your future child might look like using advanced AI
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Father Upload */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Father's Photo</h3>
              <p className="text-gray-600 mb-6">Upload a clear photo of the father</p>
              
              {fatherPreview ? (
                <div className="relative group">
                  <img 
                    src={fatherPreview} 
                    alt="Father preview" 
                    className="w-48 h-48 object-cover rounded-xl mx-auto border-4 border-blue-200 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                    <button 
                      onClick={() => document.getElementById('father-upload')?.click()}
                      className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <label 
                  htmlFor="father-upload" 
                  className="block w-48 h-48 mx-auto border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 flex flex-col items-center justify-center group"
                >
                  <Upload className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-blue-600 font-medium">Click to upload</span>
                  <span className="text-gray-500 text-sm mt-1">PNG, JPG up to 10MB</span>
                </label>
              )}
              
              <input
                id="father-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'father')}
                className="hidden"
              />
            </div>
          </div>

          {/* Mother Upload */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-4">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Mother's Photo</h3>
              <p className="text-gray-600 mb-6">Upload a clear photo of the mother</p>
              
              {motherPreview ? (
                <div className="relative group">
                  <img 
                    src={motherPreview} 
                    alt="Mother preview" 
                    className="w-48 h-48 object-cover rounded-xl mx-auto border-4 border-pink-200 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                    <button 
                      onClick={() => document.getElementById('mother-upload')?.click()}
                      className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <label 
                  htmlFor="mother-upload" 
                  className="block w-48 h-48 mx-auto border-2 border-dashed border-pink-300 rounded-xl cursor-pointer hover:border-pink-400 hover:bg-pink-50/50 transition-all duration-300 flex flex-col items-center justify-center group"
                >
                  <Upload className="w-8 h-8 text-pink-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-pink-600 font-medium">Click to upload</span>
                  <span className="text-gray-500 text-sm mt-1">PNG, JPG up to 10MB</span>
                </label>
              )}
              
              <input
                id="mother-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'mother')}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Gender Selection */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-100 shadow-lg mb-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Choose Gender</h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setGender('boy')}
                className={`px-8 py-4 rounded-xl font-medium transition-all duration-300 ${
                  gender === 'boy'
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                👦 Boy
              </button>
              <button
                onClick={() => setGender('girl')}
                className={`px-8 py-4 rounded-xl font-medium transition-all duration-300 ${
                  gender === 'girl'
                    ? 'bg-pink-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                👧 Girl
              </button>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-12">
          <button
            onClick={handleGenerate}
            disabled={loading || !fatherImg || !motherImg}
            className="inline-flex items-center px-12 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                Generating Magic...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-3" />
                Generate Your Future Child
              </>
            )}
          </button>
        </div>

        {/* Loading Steps */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-100 shadow-lg mb-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Creating Your Future Child</h3>
              <p className="text-gray-600">This may take a few minutes...</p>
            </div>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === index + 1;
                const isCompleted = currentStep > index + 1;
                
                return (
                  <div key={index} className={`flex items-center p-4 rounded-xl transition-all duration-300 ${
                    isActive ? 'bg-purple-50 border-2 border-purple-200' : 
                    isCompleted ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      isActive ? 'bg-purple-500 text-white animate-pulse' :
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <span className={`font-medium ${
                      isActive ? 'text-purple-700' :
                      isCompleted ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {step.name}
                    </span>
                    {isActive && (
                      <div className="ml-auto">
                        <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Result */}
        {resultImg && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-100 shadow-lg">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-6">
                <Baby className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Future Child</h3>
              <p className="text-gray-600 mb-8">Here's what your little one might look like!</p>
              
              <div className="relative inline-block">
                <img 
                  src={resultImg} 
                  alt="Generated Child" 
                  className="w-80 h-80 object-cover rounded-2xl shadow-2xl border-4 border-white"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = resultImg;
                    link.download = `future-child-${Date.now()}.png`;
                    link.click();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Download Image
                </button>
                <button
                  onClick={() => handleShare()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={() => {
                    setResultImg(null);
                    setFatherImg(null);
                    setMotherImg(null);
                    setFatherPreview(null);
                    setMotherPreview(null);
                    setShareUrl(null);
                    setShowShareModal(false);
                  }}
                  className="px-6 py-3 bg-gray-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Generate Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Share Your Future Child</h3>
                <p className="text-gray-600">Let others see your adorable AI-generated child!</p>
              </div>

              <div className="space-y-3 mb-6">
                {/* Native Share (if supported) */}
                {navigator.share && (
                  <button
                    onClick={() => handleShare('native')}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-800">Share via device</span>
                  </button>
                )}

                {/* Copy Link */}
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Copy className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-800">Copy link</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Share on Facebook</span>
                </button>

                {/* Twitter */}
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full flex items-center gap-3 p-4 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
                >
                  <Twitter className="w-5 h-5 text-sky-600" />
                  <span className="font-medium text-sky-800">Share on Twitter</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Share on WhatsApp</span>
                </button>
              </div>

              {/* Share URL Display */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Link className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Shareable Link</span>
                </div>
                <div className="text-sm text-gray-600 break-all bg-white p-2 rounded border">
                  {shareUrl}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;