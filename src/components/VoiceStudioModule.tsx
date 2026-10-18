import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  Trash2,
  Sparkles,
  CheckCircle2,
  FileText,
  Clock,
  Languages,
  ArrowRight
} from 'lucide-react';
import { VoiceRecord, Page } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { GeminiService } from '../services/geminiService.ts';

interface VoiceStudioModuleProps {
  onNavigateToNote?: (pageId: string) => void;
}

export const VoiceStudioModule: React.FC<VoiceStudioModuleProps> = ({ onNavigateToNote }) => {
  const [records, setRecords] = useState<VoiceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<VoiceRecord | null>(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'bn-BD'>('en-US');

  // AI Extraction state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setRecords(StorageService.getVoiceRecords());
  }, []);

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioBlobUrl = URL.createObjectURL(audioBlob);
        
        const now = new Date().toISOString();
        const newRecord: VoiceRecord = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          title: `Voice Note - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          durationSeconds: recordingSeconds,
          audioBlobUrl,
          transcript: liveTranscript || 'Audio recorded.',
          language: selectedLanguage,
          createdAt: now,
        };

        const updated = [newRecord, ...records];
        StorageService.saveVoiceRecords(updated);
        setRecords(updated);
        setSelectedRecord(newRecord);
        setIsRecording(false);
        setRecordingSeconds(0);
        setLiveTranscript('');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setLiveTranscript('');

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Web Speech API for live transcription if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage;
        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + ' ';
          }
          setLiveTranscript(text);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err: any) {
      alert('Microphone access denied or error: ' + err.message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // AI Summarize Transcript & Extract Action Items
  const handleSummarizeWithAI = async () => {
    if (!selectedRecord || !selectedRecord.transcript) return;
    setIsSummarizing(true);
    setSaveSuccessMsg(null);
    try {
      const res = await GeminiService.summarize(selectedRecord.transcript, 'cornell');
      const updated: VoiceRecord = {
        ...selectedRecord,
        summary: res.summary || '',
        actionItems: res.actionItems || [],
      };
      const all = records.map(r => r.id === updated.id ? updated : r);
      StorageService.saveVoiceRecords(all);
      setRecords(all);
      setSelectedRecord(updated);
    } catch (err: any) {
      alert('Failed to summarize recording: ' + err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Turn Voice Note into University Notebook Page
  const handleExportToNotebook = () => {
    if (!selectedRecord) return;
    const now = new Date().toISOString();
    const newPage: Page = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      notebookId: 'default',
      title: selectedRecord.title,
      type: 'cornell',
      content: `<p><strong>Voice Recording Transcript:</strong></p><p>${selectedRecord.transcript}</p>`,
      cornellSummary: selectedRecord.summary || '',
      cornellCues: selectedRecord.actionItems || [],
      tags: ['voice-recording'],
      createdAt: now,
      updatedAt: now,
    };

    const pages = StorageService.getPages();
    pages.unshift(newPage);
    StorageService.savePages(pages);
    setSaveSuccessMsg('Created new Cornell Note in University Notebook!');
    if (onNavigateToNote) {
      setTimeout(() => onNavigateToNote(newPage.id), 800);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden bg-[#FAF8F3] dark:bg-[#111815]">
      
      {/* Left List of Voice Notes */}
      <div className="w-full lg:w-80 shrink-0 border-r border-[#E9E5DC] dark:border-[#263630] flex flex-col bg-white/70 dark:bg-[#18221E]/70 backdrop-blur-md">
        
        {/* Recording Controls Card */}
        <div className="p-4 border-b border-[#E9E5DC] dark:border-[#263630] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base font-bold text-[#23483F] dark:text-[#F1F3EE]">
              Voice Studio
            </h3>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="text-[11px] px-2 py-1 rounded-lg border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
            >
              <option value="en-US">English (US)</option>
              <option value="bn-BD">Bangla (বাংলা)</option>
            </select>
          </div>

          {/* Record Button */}
          {isRecording ? (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-red-600 font-mono font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span>
                  {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-[11px] text-red-700 dark:text-red-300">
                {liveTranscript || 'Listening and transcribing...'}
              </p>
              <button
                onClick={stopRecording}
                className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop & Save Recording</span>
              </button>
            </div>
          ) : (
            <button
              onClick={startRecording}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Mic className="w-4 h-4 text-[#D6BD87]" />
              <span>Record Lecture or Voice Note</span>
            </button>
          )}
        </div>

        {/* Recordings List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {records.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#777970] dark:text-[#9AA096]">
              <Mic className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#23483F]" />
              <p className="font-semibold text-[#242823] dark:text-[#F1F3EE]">No voice recordings</p>
              <p className="mt-1">Tap record to capture lecture audio and generate notes.</p>
            </div>
          ) : (
            records.map((rec) => {
              const isSelected = selectedRecord?.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-[#18221E] border-[#23483F]/30 dark:border-[#3C7265] shadow-xs'
                      : 'border-transparent hover:bg-white/60 dark:hover:bg-[#18221E]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE] truncate">
                      {rec.title}
                    </h4>
                    <span className="text-[10px] text-[#777970] font-mono">
                      {Math.floor(rec.durationSeconds / 60)}:{(rec.durationSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777970] dark:text-[#9AA096] line-clamp-2 mt-1">
                    {rec.transcript}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Transcript & AI Summary Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#141E1A]">
        {selectedRecord ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3]/60 dark:bg-[#111815]/60">
              <div>
                <h3 className="text-sm font-bold text-[#242823] dark:text-[#F1F3EE]">
                  {selectedRecord.title}
                </h3>
                <span className="text-[11px] text-[#777970]">
                  Recorded on {new Date(selectedRecord.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSummarizeWithAI}
                  disabled={isSummarizing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#23483F] dark:text-[#D6BD87] bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-[#FAF8F3] disabled:opacity-50"
                  title="Generate structured Cornell notes from this transcript"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                  <span>{isSummarizing ? 'Synthesizing...' : 'AI Notes & Tasks'}</span>
                </button>

                <button
                  onClick={handleExportToNotebook}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Send to Notebook</span>
                </button>

                <button
                  onClick={() => {
                    const updated = records.filter(r => r.id !== selectedRecord.id);
                    StorageService.saveVoiceRecords(updated);
                    setRecords(updated);
                    setSelectedRecord(null);
                  }}
                  className="p-1.5 text-[#777970] hover:text-red-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between">
                <span>{saveSuccessMsg}</span>
                <button onClick={() => setSaveSuccessMsg(null)}>×</button>
              </div>
            )}

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
              {/* Audio player if blob url exists */}
              {selectedRecord.audioBlobUrl && (
                <div className="p-3 rounded-2xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630]">
                  <audio controls src={selectedRecord.audioBlobUrl} className="w-full h-8" />
                </div>
              )}

              {/* Transcript */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87]">
                  Speech Transcript
                </span>
                <div className="p-4 rounded-2xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] text-sm leading-relaxed text-[#242823] dark:text-[#F1F3EE]">
                  {selectedRecord.transcript}
                </div>
              </div>

              {/* AI Generated Cornell Summary & Action Items */}
              {selectedRecord.summary && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    AI Cornell Summary
                  </span>
                  <p className="text-xs leading-relaxed text-[#242823] dark:text-[#F1F3EE]">
                    {selectedRecord.summary}
                  </p>

                  {selectedRecord.actionItems && selectedRecord.actionItems.length > 0 && (
                    <div className="pt-2 border-t border-[#E9E5DC] dark:border-[#263630]">
                      <span className="text-xs font-bold text-[#23483F] dark:text-[#D6BD87] block mb-2">
                        Extracted Action Items
                      </span>
                      <ul className="space-y-1 text-xs text-[#777970] dark:text-[#9AA096]">
                        {selectedRecord.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#23483F]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F3] dark:bg-[#111815]">
            <Mic className="w-12 h-12 text-[#23483F] dark:text-[#3C7265] mb-3 opacity-60" />
            <h3 className="font-editorial text-xl font-bold text-[#242823] dark:text-[#F1F3EE]">
              Voice Studio & Lecture Transcription
            </h3>
            <p className="text-xs text-[#777970] dark:text-[#9AA096] max-w-sm mt-1">
              Record voice notes or lectures with instant transcription in English or Bangla, and convert them to Cornell study notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
