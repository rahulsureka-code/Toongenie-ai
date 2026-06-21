import React, { useState } from 'react';
import { Wand2, Loader2, Play, Image as ImageIcon, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Scene {
  id: number;
  narration: string;
  imagePrompt: string;
  imageUrl: string;
}

export function Generator() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentScene, setCurrentScene] = useState(0);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setScenes([]);
    setLoadingText('Writing script...');
    
    try {
      // 1. Connect to Gemini
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const langInstruction = language === 'hi' 
        ? "Write the `narration` in Hindi script (Devanagari), but keep the `imagePrompt` in English." 
        : "Write the `narration` in English.";

      const aiPrompt = `
        You are a funny cartoon scriptwriter. 
        Write a 3-scene comic strip based on this idea: "${prompt}".
        ${langInstruction}
        
        CRITICAL RULES FOR IMAGE PROMPTS:
        - The \`imagePrompt\` MUST be completely different for every scene.
        - Describe exactly what the characters are doing in that specific scene.
        - Example Scene 1: "A green frog and a blue bird standing next to a rocket ship, simple flat 2d vector cartoon, solid colors, white background"
        - Example Scene 2: "A green frog pressing a big red button while the blue bird panics, simple flat 2d vector cartoon, solid colors, white background"
        - Example Scene 3: "The rocket ship crashing into a tree, the frog and bird look dizzy, simple flat 2d vector cartoon, solid colors, white background"
        
        You MUST return ONLY a raw JSON array of 3 objects. Do not use markdown blocks like \`\`\`json.
        [
          { "id": 1, "narration": "text to read aloud", "imagePrompt": "unique visual description of the action" },
          { "id": 2, "narration": "text to read aloud", "imagePrompt": "unique visual description of the action" },
          { "id": 3, "narration": "text to read aloud", "imagePrompt": "unique visual description of the action" }
        ]
      `;

      // 2. Get the Script from Gemini
      const result = await model.generateContent(aiPrompt);
      const responseText = result.response.text();
      
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedScenes: Scene[] = JSON.parse(cleanJson);

      setLoadingText('Drawing cartoons... (this takes about 10-15 seconds)');

      // 3. Generate Image URLs (WITH THE CACHE-BUSTING FIX RESTORED)
      const getImageUrl = (imgPrompt: string, sceneNumber: number) => {
        const uniquePrompt = `${imgPrompt} cartoon scene ${sceneNumber}`;
        const encoded = encodeURIComponent(uniquePrompt);
        const randomSeed = Math.floor(Math.random() * 999999999);
      
        return `https://image.pollinations.ai/prompt/${encoded}?width=768&height=432&nologo=true&seed=${randomSeed}`;
      };

      const finalScenes = generatedScenes.map((scene, index) => ({
        ...scene,
        imageUrl: getImageUrl(scene.imagePrompt, index + 1)
      }));

      // 4. Force the browser to wait until ALL images are fully downloaded
      // 4. Show scenes immediately
setScenes(finalScenes);
setCurrentScene(0);

// 5. Preload images in the background
finalScenes.forEach((scene) => {
  const img = new Image();
  img.src = scene.imageUrl;
});

    } catch (error) {
      console.error("Error generating cartoon:", error);
      alert("Something went wrong! Make sure your Gemini API key is in the .env file.");
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      const voices = window.speechSynthesis.getVoices();
      
      let selectedVoice;
      if (language === 'hi') {
        selectedVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india'));
      } else {
        selectedVoice = voices.find(v => v.lang.includes('en') || v.name.includes('Google'));
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Prompt to <span className="text-orange-500">Cartoon.</span></h1>
          <p className="text-lg text-slate-600">Type a silly idea, and the AI will write a script, draw the comic, and read it out loud.</p>
        </div>

        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xl shadow-orange-500/5 border border-slate-100 mb-12">
          <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="e.g., Two cats arguing about politics..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-lg" 
                disabled={isGenerating} 
              />
            </div>
            
            <div className="flex gap-4">
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                disabled={isGenerating}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>

              <button type="submit" disabled={isGenerating || !prompt.trim()} className="bg-orange-500 text-white px-8 rounded-2xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Wand2 className="w-5 h-5" /><span>Animate</span></>}
              </button>
            </div>
          </form>
        </div>

        {isGenerating && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-slate-600 font-medium animate-pulse">{loadingText}</p>
          </div>
        )}

        {!isGenerating && scenes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            
            <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
              {scenes.map((scene, index) => (
                <img
                key={scene.id}
                src={scene.imageUrl}
                alt={`Scene ${index + 1}`}
                loading="lazy"
                decoding="async" 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    currentScene === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                />
              ))}
              
              {!scenes[0]?.imageUrl && (
                <ImageIcon className="w-16 h-16 text-slate-700 opacity-50" />
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex items-start justify-between gap-6 mb-6">
                <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed flex-1">
                  "{scenes[currentScene].narration}"
                </p>
                <button 
                  onClick={() => playAudio(scenes[currentScene].narration)} 
                  className="bg-orange-100 hover:bg-orange-200 text-orange-600 p-4 rounded-full transition-all hover:scale-110 flex-shrink-0"
                  title="Play Audio"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  {scenes.map((scene, index) => (
                    <button 
                      key={scene.id} 
                      onClick={() => setCurrentScene(index)} 
                      className={`w-12 h-2 rounded-full transition-colors ${currentScene === index ? 'bg-orange-500' : 'bg-slate-200 hover:bg-slate-300'}`} 
                    />
                  ))}
                </div>
                <button 
                  onClick={() => { 
                    const next = (currentScene + 1) % scenes.length; 
                    setCurrentScene(next); 
                    playAudio(scenes[next].narration); 
                  }} 
                  className="flex items-center gap-2 text-slate-600 hover:text-orange-500 font-bold transition-colors"
                >
                  Next Scene <Play className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}