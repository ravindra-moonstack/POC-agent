"use client"

import type React from "react"
import { useState } from "react" 
import { Send, Paperclip } from "lucide-react"
import FileUploader from "./FileUploader"

interface MessageInputProps {
  onSendMessage?: (text: string) => void
  onSendFile?: (file: File) => void
  disabled?: boolean
}

export default function MessageInput({ onSendMessage, onSendFile, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [showFileUploader, setShowFileUploader] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message)
      setMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (file: File) => {
    onSendFile(file)
    setShowFileUploader(false)
  }

  return (
    <>
      <style>{`
        .message-input-container {
          border-top: 1px solid #e9d5ff;
          padding: 1rem;
          background: white;
        }
        
        .file-uploader-section {
          margin-bottom: 1rem;
        }
        
        .input-form {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
        }
        
        .attachment-button {
          flex-shrink: 0;
          padding: 0.75rem;
          color: #7c3aed;
          border-radius: 0.75rem;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .attachment-button:hover:not(:disabled) {
          color: #6b21a8;
          background-color: #faf5ff;
        }
        
        .attachment-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .textarea-wrapper {
          flex: 1;
          position: relative;
        }
        
        .message-textarea {
          width: 100%;
          padding: 0.75rem;
          padding-right: 3rem;
          border: 1px solid #ddd6fe;
          border-radius: 0.75rem;
          resize: none;
          min-height: 48px;
          max-height: 120px;
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.5;
          transition: all 0.2s;
        }
        
        .message-textarea:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
        }
        
        .message-textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .send-button {
          flex-shrink: 0;
          padding: 0.75rem;
          background-color: #7c3aed;
          color: white;
          border-radius: 0.75rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .send-button:hover:not(:disabled) {
          background-color: #6b21a8;
        }
        
        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="message-input-container">
        {showFileUploader && (
          <div className="file-uploader-section">
            <FileUploader onFileSelect={handleFileSelect} onCancel={() => setShowFileUploader(false)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="input-form">
          <button
            type="button"
            onClick={() => setShowFileUploader(!showFileUploader)}
            disabled={disabled}
            className="attachment-button"
          >
            <Paperclip size={20} />
          </button>

          <div className="textarea-wrapper">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? "Connecting..." : "Type your message..."}
              disabled={disabled}
              className="message-textarea"
              rows={1}
            />
          </div>

          <button type="submit" disabled={!message.trim() || disabled} className="send-button">
            <Send size={20} />
          </button>
        </form>
      </div>
    </>
  )
}
