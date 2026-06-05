import React, { useState, useRef } from 'react';
import { 
  Languages, 
  FileUp, 
  X, 
  Copy, 
  Check, 
  Loader2, 
  FileText,
  AlertCircle,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { fileToBase64, translateText } from './utils';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [output, setOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limit to images and PDFs for standard usage
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Mohon unggah file gambar (JPG/PNG) atau dokumen PDF.');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim() && !selectedFile) {
      setError('Masukkan teks atau pilih file untuk diterjemahkan.');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      let fileData;
      if (selectedFile) {
        fileData = await fileToBase64(selectedFile);
      }

      const result = await translateText(inputText, fileData);
      setOutput(result);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menerjemahkan.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'terjemahan.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!output) return;
    const doc = new jsPDF();
    
    doc.setFont("helvetica");
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxLineWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const lineHeight = 7;
    
    // Split text to fit width
    const splitText = doc.splitTextToSize(output, maxLineWidth);
    
    let cursorY = margin + 5;
    
    splitText.forEach((line: string) => {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin + 5;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });
    
    doc.save('terjemahan.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-700">
            <Languages className="w-6 h-6" />
            <h1 className="font-semibold text-xl tracking-tight">Penerjemah Arab Gundul</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          
          {/* Input Panel */}
          <div className="flex flex-col gap-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 transition-shadow focus-within:shadow-md">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Sumber (Arab / Gambar)</h2>
            
            <textarea
              dir="rtl"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Masukkan teks Arab gundul di sini..."
              className="flex-1 w-full min-h-[250px] resize-none outline-none text-lg text-slate-800 placeholder:text-slate-400 placeholder:text-right font-serif leading-loose"
            />

            {/* Selected File Preview Area */}
            {selectedFile && (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-teal-100 text-teal-700 rounded-md shrink-0">
                    {selectedFile.type.startsWith('image/') ? <FileUp className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="truncate text-sm text-slate-600 font-medium">
                    {selectedFile.name}
                  </div>
                </div>
                <button 
                  onClick={removeFile}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Hapus file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  className="hidden" 
                  id="file-upload"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <FileUp className="w-4 h-4" />
                  Unggah Gambar/Dokumen
                </button>
              </div>
              
              <button
                onClick={handleTranslate}
                disabled={isTranslating || (!inputText.trim() && !selectedFile)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menerjemahkan...
                  </>
                ) : (
                  'Terjemahkan'
                )}
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="flex flex-col bg-slate-100 rounded-2xl border border-slate-200 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Hasil (Indonesia)</h2>
              {output && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors rounded-lg border border-transparent hover:border-teal-100"
                    title="Unduh sebagai TXT"
                  >
                    <Download className="w-4 h-4" />
                    TXT
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors rounded-lg border border-transparent hover:border-teal-100"
                    title="Unduh sebagai PDF"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                  <div className="w-px h-5 bg-slate-300 mx-1"></div>
                  <button
                    onClick={handleCopy}
                    className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors rounded-lg border border-transparent hover:border-teal-100"
                    title="Salin hasil"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 w-full min-h-[250px] overflow-auto whitespace-pre-wrap text-slate-800 text-lg leading-relaxed">
              {output ? (
                output
              ) : (
                <span className="text-slate-400 italic text-base">
                  Hasil terjemahan akan muncul di sini...
                </span>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
