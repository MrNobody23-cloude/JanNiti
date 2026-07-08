"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { submissionsApi } from "@/lib/api";
import { SECTORS } from "@/lib/constants";
import {
  Send, Upload, Mic, MicOff, MapPin, Camera, Video, FileText, X, Loader2,
} from "lucide-react";
import { PlacesAutocomplete } from "@/components/maps/places-autocomplete";
import { useState, useRef } from "react";

interface SubmissionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmissionForm({ onClose, onSuccess }: SubmissionFormProps) {
  const [text, setText] = useState("");
  const [channel, setChannel] = useState("web");
  const [language, setLanguage] = useState("hi");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<Array<{ type: string; url: string; mimeType: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{ lat?: number; lng?: number }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // The constituency ID from seed data
  const CONSTITUENCY_ID = "c1000001-0000-0000-0000-000000000001";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setError("");
    setLoading(true);

    try {
      await submissionsApi.create({
        constituencyId: CONSTITUENCY_ID,
        text: text.trim(),
        channel: channel as any,
        language,
        attachments: attachments.length > 0 ? attachments : undefined,
        location: (location.lat || address) ? { lat: location.lat, lng: location.lng, address } : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith("image") ? "image" :
                 file.type.startsWith("video") ? "video" :
                 file.type.startsWith("audio") ? "audio" : "document";

    setUploading(true);
    try {
      const result = await submissionsApi.upload(file, type);
      setAttachments(prev => [...prev, { type, url: result.data.url, mimeType: file.type }]);
    } catch {
      setError("File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleVoiceRecord = async () => {
    if (recording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        setUploading(true);
        try {
          const result = await submissionsApi.submitVoice(blob, CONSTITUENCY_ID, {
            lat: location.lat,
            lng: location.lng,
            address,
          });
          // Voice submission creates the submission directly
          onSuccess();
        } catch {
          setError("Voice submission failed");
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone access denied");
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => { setError("Location access denied"); setLocating(false); },
      { enableHighAccuracy: true }
    );
  };

  return (
    <Card className="animate-scale-in border-primary-200 dark:border-primary-800">
      <CardHeader>
        <CardTitle>Submit a New Problem / Suggestion</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} icon={<X className="h-4 w-4" />}>
          Close
        </Button>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Main text */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Describe the issue or suggestion *
          </label>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="E.g., The main water pipeline in our village has been broken for 2 weeks. 500 families are affected..."
            required
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Channel + Language */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="web">Web Portal</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="voice">Voice Call</option>
              <option value="mobile_app">Mobile App</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="hi">Hindi</option>
              <option value="en">English</option>
              <option value="bn">Bengali</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="mr">Marathi</option>
            </select>
          </div>
        </div>

        {/* Location with Google Places Autocomplete */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Location</label>
          <div className="flex gap-2">
            <PlacesAutocomplete
              placeholder="Search village, area, or landmark..."
              className="flex-1"
              onSelect={(place) => {
                setAddress(place.address);
                setLocation({ lat: place.lat, lng: place.lng });
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGetLocation}
              disabled={locating}
              icon={locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            >
              {location.lat ? "Located" : "GPS"}
            </Button>
          </div>
          {location.lat && (
            <p className="mt-1 text-xs text-emerald-600">
              GPS: {location.lat.toFixed(4)}, {location.lng?.toFixed(4)}
            </p>
          )}
        </div>

        {/* Media buttons */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Attachments (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              icon={uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            >
              Photo/Video
            </Button>
            <Button type="button" variant={recording ? "primary" : "secondary"} size="sm"
              onClick={handleVoiceRecord}
              icon={recording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            >
              {recording ? "Stop Recording" : "Record Voice"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Attached files */}
          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary-50 dark:bg-primary-900/20 px-2 py-1 text-xs text-primary-700 dark:text-primary-300">
                  {a.type === "image" ? <Camera className="h-3 w-3" /> : a.type === "video" ? <Video className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                  {a.type}
                  <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" disabled={loading || !text.trim()}
            icon={loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
