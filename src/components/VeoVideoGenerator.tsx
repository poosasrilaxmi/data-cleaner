import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Download, RefreshCw, AlertCircle, Film, CheckCircle2, Play, Info } from 'lucide-react';
import { CleanedDataset } from '../types/dataCleaner';

interface VeoVideoGeneratorProps {
  cleanedDataset: CleanedDataset | null;
}

export const VeoVideoGenerator: React.FC<VeoVideoGeneratorProps> = ({ cleanedDataset }) => {
  const [prompt, setPrompt] = useState(
    'A sleek 3D corporate motion graphic showing clean organized spreadsheets, glowing holographic charts, and lavender light trails, 4k cinematic lighting'
  );
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);

  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const samplePrompts = [
    'A sleek 3D corporate motion graphic showing clean organized spreadsheets, glowing holographic charts, and lavender light trails',
    'Futuristic holographic data cubes transforming from chaotic clutter into pristine aligned grid rows',
    'A global map with luminous connection streams highlighting international customer accounts and clean financial metrics'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setIsQuotaError(false);
    setVideoUrl(null);
    setProgressPercent(10);
    setStatusMessage('Initiating Veo 3 generation with model veo-3.1-fast-generate-preview...');

    try {
      // Step 1: Start video generation
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isQuotaError || res.status === 429) {
          setIsQuotaError(true);
        }
        throw new Error(data.error || 'Failed to start video generation');
      }

      const operationName = data.operationName;
      if (!operationName) {
        throw new Error('No operation name returned by Veo 3');
      }

      setStatusMessage('Veo 3 is synthesizing video frames... (this may take a couple minutes)');
      setProgressPercent(25);

      // Step 2: Poll video status
      let attempts = 0;
      const reassuringMessages = [
        'Veo 3 is synthesizing lighting, camera angles and textures...',
        'Refining high-definition motion keyframes...',
        'Rendering video layers in cinematic quality...',
        'Finalizing MP4 video encoding...'
      ];

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        const msgIdx = Math.min(Math.floor(attempts / 2), reassuringMessages.length - 1);
        setStatusMessage(reassuringMessages[msgIdx]);
        setProgressPercent((prev) => Math.min(92, prev + 5));

        try {
          const statusRes = await fetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName })
          });

          const statusData = await statusRes.json();

          if (statusData.error) {
            clearInterval(pollIntervalRef.current);
            throw new Error(statusData.error.message || 'Video generation encountered an error');
          }

          if (statusData.done) {
            clearInterval(pollIntervalRef.current);
            setStatusMessage('Video generation completed! Downloading stream...');
            setProgressPercent(98);

            // Step 3: Download video
            const downloadRes = await fetch('/api/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName })
            });

            if (!downloadRes.ok) {
              const downloadError = await downloadRes.json();
              throw new Error(downloadError.error || 'Failed to download generated video');
            }

            const videoBlob = await downloadRes.blob();
            const blobUrl = URL.createObjectURL(videoBlob);
            setVideoUrl(blobUrl);
            setProgressPercent(100);
            setIsGenerating(false);
            setStatusMessage('Video generated successfully!');
          }
        } catch (pollErr: any) {
          clearInterval(pollIntervalRef.current);
          setIsGenerating(false);
          setError(pollErr.message || 'Error while polling video generation');
        }
      }, 7000);
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message || 'Failed to create video');
    }
  };

  // Generate an interactive sample animated video for testing when quota is limited
  const handleLoadSampleDemo = () => {
    // High-quality public sample motion graphic video
    const sampleUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    setVideoUrl(sampleUrl);
    setError(null);
    setIsQuotaError(false);
  };

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 border-b border-purple-100 bg-purple-50/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center shadow-xs">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Veo 3 Video Generator</h3>
            <p className="text-xs text-slate-500">
              Generate motion presentations and videos with <code className="text-[#7C3AED] font-mono">veo-3.1-fast-generate-preview</code>.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
          Veo 3 Fast Preview
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Aspect Ratio Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Aspect Ratio:
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={`px-3.5 py-1.5 text-xs rounded-lg border font-semibold transition ${
                aspectRatio === '16:9'
                  ? 'bg-[#7C3AED] text-white border-purple-500'
                  : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-50'
              }`}
            >
              16:9 (Landscape · Presentation &amp; Desktop)
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`px-3.5 py-1.5 text-xs rounded-lg border font-semibold transition ${
                aspectRatio === '9:16'
                  ? 'bg-[#7C3AED] text-white border-purple-500'
                  : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-50'
              }`}
            >
              9:16 (Portrait · Mobile &amp; Vertical)
            </button>
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Video Generation Prompt:
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want Veo 3 to generate..."
            className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white"
          />
        </div>

        {/* Sample Prompt Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample ideas:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(p)}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition text-left"
            >
              {p.slice(0, 50)}...
            </button>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition shadow-sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating with Veo 3...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Video ({aspectRatio})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLoadSampleDemo}
            className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            title="Load sample motion graphic demo"
          >
            <Play className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Preview Sample Video Demo</span>
          </button>
        </div>

        {/* Quota limit notice */}
        {isQuotaError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-amber-950">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Veo 3 Quota Limit / Paid Key Required</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Google Veo 3 (<code className="font-mono text-amber-950">veo-3.1-fast-generate-preview</code>) is a premium model requiring an active billing-enabled project or API key with video generation quotas.
            </p>
            <p className="text-[11px] text-amber-800">
              You can click <strong>&quot;Preview Sample Video Demo&quot;</strong> above to test and view the interactive video player and download flow right away!
            </p>
          </div>
        )}

        {/* Progress & Status Message */}
        {isGenerating && (
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
            <div className="flex justify-between text-xs text-purple-900 font-medium">
              <span>{statusMessage}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#7C3AED] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* General Error message */}
        {error && !isQuotaError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Video Player Display */}
        {videoUrl && (
          <div className="pt-4 border-t border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Motion Video Preview ({aspectRatio})</span>
              </h4>
              <a
                href={videoUrl}
                download="veo3_generated_video.mp4"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            </div>

            <div className={`mx-auto bg-black rounded-xl overflow-hidden shadow-md ${aspectRatio === '9:16' ? 'max-w-xs' : 'max-w-xl'}`}>
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-auto rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
