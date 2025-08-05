import { useState, useEffect, useRef } from "react"
import { useAudioRecorder } from "src/hooks/use-audio-recorder"
import { Button } from "src/components/ui/button"
import { ScrollArea } from "src/components/ui/scroll-area"
import { Mic, Square, Volume2 } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert"
import { PaperPlaneIcon, ReloadIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"

type Status = "idle" | "recording" | "transcribing" | "processing" | "speaking"

const statusMessages: Record<Status, string> = {
  idle: "Click to speak or type a message",
  recording: "Recording... Click to stop",
  transcribing: "Transcribing your voice...",
  processing: "Leo is thinking...",
  speaking: "Leo is speaking...",
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function VoicePanelConnected() {
  const { isRecording, audioBlob, startRecording, stopRecording, error: recorderError } = useAudioRecorder()
  const [messages, setMessages] = useState<Message[]>([
    { id: "init", role: "assistant", content: "Hello! How can I help you with your story today?" },
  ])
  const [input, setInput] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement>(null)
  const [baseUrl, setBaseUrl] = useState("")

  useEffect(() => {
    // Set the base URL once the component mounts on the client
    setBaseUrl(window.location.origin)
  }, [])

  useEffect(() => {
    if (recorderError) {
      setError(recorderError)
    }
  }, [recorderError])

  // Effect to handle the end of recording
  useEffect(() => {
    if (!isRecording && audioBlob) {
      handleVoiceSubmission(audioBlob)
    }
  }, [isRecording, audioBlob])

  const handleVoiceSubmission = async (blob: Blob) => {
    setStatus("transcribing")
    setError(null)
    try {
      // 1. STT: Send audio to be transcribed
      const sttResponse = await fetch(`${baseUrl}/api/voice/stt`, { method: "POST", body: blob })
      if (!sttResponse.ok) throw new Error("Failed to transcribe audio.")
      const { transcript } = await sttResponse.json()

      if (transcript) {
        const userMessage: Message = { id: Date.now().toString(), role: "user", content: transcript }
        setMessages((prev) => [...prev, userMessage])
        await processAndSpeak(transcript)
      } else {
        setError("Could not understand audio. Please try again.")
        setStatus("idle")
      }
    } catch (err) {
      console.error("Error in voice submission pipeline:", err)
      setError("An error occurred during voice processing.")
      setStatus("idle")
    }
  }

  const handleTextSubmission = async () => {
    if (!input.trim()) return
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    await processAndSpeak(input)
  }

  const processAndSpeak = async (prompt: string) => {
    setStatus("processing")
    setError(null)
    try {
      // 2. Chat: Send transcript to AI
      const chatResponse = await fetch(`${baseUrl}/api/voice/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      // **IMPROVED ERROR HANDLING**
      if (!chatResponse.ok) {
        // If the server returned an error, read the JSON and display it.
        const errorData = await chatResponse.json()
        throw new Error(errorData.error || "Failed to get response from Leo.")
      }

      if (!chatResponse.body) {
        throw new Error("Received an empty response from the server.")
      }

      const reader = chatResponse.body.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ""
      const assistantMessageId = Date.now().toString()
      setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "..." }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantResponse += decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: assistantResponse } : msg)),
        )
      }

      setStatus("speaking")
      // 3. TTS: Send AI response to be converted to speech
      const ttsResponse = await fetch(`${baseUrl}/api/voice/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: assistantResponse }),
      })
      if (!ttsResponse.ok) throw new Error("Failed to generate audio.")
      const { audioUrl } = await ttsResponse.json()

      // 4. Play audio
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioUrl
        audioPlayerRef.current.play().catch((e) => {
          console.error("Audio playback failed:", e)
          setError("Could not play audio response.")
          setStatus("idle")
        })
      }
    } catch (err: any) {
      console.error("Error processing and speaking:", err)
      setError(err.message || "An unknown error occurred while getting Leo's response.")
      setStatus("idle")
    }
  }

  return (
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role}>
              {msg.content}
            </ChatMessage>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-gray-100">
        {error && (
          <Alert variant="destructive" className="mb-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center space-x-2">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            size="icon"
            disabled={status !== "idle" && status !== "recording"}
            className={`transition-all ${
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTextSubmission()}
            placeholder="Or type a message..."
            disabled={status !== "idle"}
            className="flex-1 p-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
          />
          <Button onClick={handleTextSubmission} size="icon" disabled={status !== "idle"}>
            <PaperPlaneIcon className="w-5 h-5" />
          </Button>
        </div>
        <div className="h-6 mt-2 flex items-center justify-center text-sm text-gray-500 font-medium">
          {status !== "idle" && status !== "speaking" && <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />}
          {status === "speaking" && <Volume2 className="w-4 h-4 mr-2 animate-pulse text-blue-500" />}
          <span>{statusMessages[status]}</span>
        </div>
      </div>
      <audio ref={audioPlayerRef} onEnded={() => setStatus("idle")} />
    </div>
  )
}
