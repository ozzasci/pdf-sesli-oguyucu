/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Loader2, 
  Upload, 
  X,
  BookOpen,
  Settings,
  Info,
  Sparkles,
  ChevronLeft,
  Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { extractTextFromPdf } from './lib/pdf';
import { generateSpeech, summarizeText } from './lib/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Voice = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voice, setVoice] = useState<Voice>('Kore');
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setIsLoading(true);
      setError(null);
      try {
        const extractedText = await extractTextFromPdf(selectedFile);
        setText(extractedText);
        const summaryText = await summarizeText(extractedText);
        setSummary(summaryText);
      } catch (err) {
        console.error(err);
        setError('PDF okunamadı. Lütfen başka bir dosya deneyin.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Lütfen geçerli bir PDF dosyası yükleyin.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const handlePlay = async () => {
    if (audioUrl) {
      audioRef.current?.play();
      setIsReading(true);
      return;
    }

    if (!text) return;

    setIsLoading(true);
    try {
      const textToRead = text.slice(0, 2000);
      const url = await generateSpeech(textToRead, voice);
      if (url) {
        setAudioUrl(url);
        setIsReading(true);
      } else {
        setError('Ses oluşturulamadı.');
      }
    } catch (err) {
      setError('Seslendirme sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setIsReading(false);
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsReading(false);
  };

  const clearFile = () => {
    setFile(null);
    setText('');
    setSummary('');
    setAudioUrl(null);
    setIsReading(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-zinc-200">
              <Headphones size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none">VoxPDF</h1>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">AI Audio Reader</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
              <Settings size={20} />
            </button>
            <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
              <Info size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="max-w-3xl mx-auto pt-12"
            >
              <div className="text-center mb-16">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-6 border border-emerald-100"
                >
                  <Sparkles size={12} />
                  <span>Gemini 2.5 Flash ile Güçlendirildi</span>
                </motion.div>
                <h2 className="text-6xl font-bold tracking-tight mb-6 text-zinc-900 leading-[1.1]">
                  Belgelerinizi <span className="text-emerald-600 italic font-serif font-normal">Sese</span> Dönüştürün
                </h2>
                <p className="text-zinc-500 text-lg max-w-lg mx-auto font-medium leading-relaxed">
                  PDF dosyalarınızı yükleyin, yapay zeka sizin için okusun, özetlesin ve önemli noktaları çıkarsın.
                </p>
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  "relative group cursor-pointer",
                  "border-2 border-dashed rounded-[40px] p-20 transition-all duration-500",
                  isDragActive 
                    ? "border-emerald-500 bg-emerald-50/50 scale-[1.02] shadow-2xl shadow-emerald-100" 
                    : "border-zinc-200 bg-white hover:border-emerald-400 hover:shadow-2xl hover:shadow-zinc-200/50"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-8">
                  <div className={cn(
                    "w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-inner",
                    isDragActive ? "bg-emerald-500 text-white rotate-12" : "bg-zinc-50 text-zinc-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 group-hover:-rotate-6"
                  )}>
                    <Upload size={40} strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-zinc-900">
                      {isDragActive ? "Bırakın ve Başlayın" : "PDF Dosyasını Buraya Sürükleyin"}
                    </p>
                    <p className="text-zinc-400 mt-2 font-medium">veya bilgisayarınızdan seçmek için tıklayın</p>
                  </div>
                </div>
              </div>
              
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-center text-red-500 font-semibold flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  {error}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Sidebar: Controls & Summary */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <button 
                  onClick={clearFile}
                  className="group flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors font-semibold text-sm mb-2"
                >
                  <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Yeni Dosya Yükle
                </button>

                <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <FileText size={28} strokeWidth={1.5} />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-zinc-900 truncate text-lg">
                        {file.name}
                      </h3>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • PDF
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Anlatıcı Sesi</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Kore', 'Zephyr', 'Puck', 'Charon'] as Voice[]).map((v) => (
                          <button
                            key={v}
                            onClick={() => {
                              setVoice(v);
                              setAudioUrl(null);
                            }}
                            className={cn(
                              "px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                              voice === v 
                                ? "bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-200" 
                                : "bg-zinc-50 border-zinc-100 text-zinc-500 hover:bg-white hover:border-zinc-300"
                            )}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 space-y-3">
                      {!isReading ? (
                        <button
                          onClick={handlePlay}
                          disabled={isLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-200"
                        >
                          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
                          {isLoading ? "Hazırlanıyor..." : "Dinlemeye Başla"}
                        </button>
                      ) : (
                        <button
                          onClick={handlePause}
                          className="w-full bg-zinc-900 hover:bg-black text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-zinc-300"
                        >
                          <Pause size={20} fill="currentColor" />
                          Durdur
                        </button>
                      )}
                      <button
                        onClick={handleReset}
                        className="w-full h-12 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        <RotateCcw size={16} />
                        Başa Dön
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-900 text-white rounded-[32px] p-8 shadow-2xl shadow-emerald-900/20 overflow-hidden relative group">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <Sparkles size={16} className="text-emerald-400" />
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">AI Özet</h4>
                    </div>
                    {isLoading && !summary ? (
                      <div className="flex items-center gap-3 text-emerald-300">
                        <Loader2 className="animate-spin" size={18} />
                        <span className="text-sm font-medium italic">Metin analiz ediliyor...</span>
                      </div>
                    ) : (
                      <p className="text-base leading-relaxed text-emerald-50 font-medium">
                        {summary || "Özet hazır değil."}
                      </p>
                    )}
                  </div>
                  {/* Decorative Glow */}
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                </div>
              </div>

              {/* Main Reader: Text Content */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-[40px] shadow-2xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
                  <div className="px-10 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <BookOpen size={18} />
                      </div>
                      <span className="font-bold text-zinc-900">Okuma Modu</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-1 w-24 bg-zinc-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          animate={{ width: isReading ? '100%' : '0%' }}
                          transition={{ duration: 10, ease: "linear" }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                        {text.length} Karakter
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white">
                    {isLoading && !text ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-6">
                        <div className="relative">
                          <Loader2 className="animate-spin" size={48} strokeWidth={1} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                          </div>
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest">İçerik Hazırlanıyor</p>
                      </div>
                    ) : (
                      <div className="max-w-2xl mx-auto">
                        {text.split('\n\n').map((para, idx) => (
                          <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            key={idx} 
                            className="mb-10 text-zinc-700 leading-[1.8] text-xl font-serif"
                          >
                            {para}
                          </motion.p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsReading(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
