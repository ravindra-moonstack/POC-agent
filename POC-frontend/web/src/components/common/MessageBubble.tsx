"use client"
import { Download, File, ImageIcon, FileText } from "lucide-react"
import type { Message } from "../../pages/ChatPage"

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user"

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon size={20} />
    if (fileType.includes("pdf") || fileType.includes("document")) return <FileText size={20} />
    return <File size={20} />
  }

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <style>{`
        .message-container {
          display: flex;
        }
        
        .message-container.user {
          justify-content: flex-end;
        }
        
        .message-container.other {
          justify-content: flex-start;
        }
        
        .message-wrapper {
          max-width: 20rem;
        }
        
        @media (min-width: 1024px) {
          .message-wrapper {
            max-width: 28rem;
          }
        }
        
        .message-bubble {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        
        .message-bubble.user {
          background-color: #7c3aed;
          color: white;
          border-bottom-right-radius: 0.25rem;
        }
        
        .message-bubble.other {
          background-color: white;
          color: #1f2937;
          border: 1px solid #e9d5ff;
          border-bottom-left-radius: 0.25rem;
        }
        
        .message-text {
          font-size: 0.875rem;
          line-height: 1.6;
        }
        
        .file-attachment {
          margin-top: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid;
        }
        
        .file-attachment.user {
          background-color: #6d28d9;
          border-color: #8b5cf6;
        }
        
        .file-attachment.other {
          background-color: #f9fafb;
          border-color: #e5e7eb;
        }
        
        .file-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .file-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 0;
        }
        
        .file-icon.user {
          color: #ddd6fe;
        }
        
        .file-icon.other {
          color: #7c3aed;
        }
        
        .file-details {
          flex: 1;
          min-width: 0;
        }
        
        .file-name {
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .file-name.user {
          color: white;
        }
        
        .file-name.other {
          color: #1f2937;
        }
        
        .file-size {
          font-size: 0.75rem;
        }
        
        .file-size.user {
          color: #ddd6fe;
        }
        
        .file-size.other {
          color: #6b7280;
        }
        
        .download-button {
          padding: 0.25rem;
          border-radius: 0.25rem;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .download-button:hover {
          background-color: rgba(107, 114, 128, 0.2);
        }
        
        .download-button.user {
          color: #ddd6fe;
        }
        
        .download-button.user:hover {
          color: white;
        }
        
        .download-button.other {
          color: #7c3aed;
        }
        
        .download-button.other:hover {
          color: #6b21a8;
        }
        
        .file-image {
          margin-top: 0.5rem;
        }
        
        .file-image img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          max-height: 200px;
        }
        
        .timestamp {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        
        .timestamp.user {
          text-align: right;
        }
        
        .timestamp.other {
          text-align: left;
        }
      `}</style>

      <div className={`message-container ${isUser ? "user" : "other"}`}>
        <div className="message-wrapper">
          <div className={`message-bubble ${isUser ? "user" : "other"}`}>
            <p className="message-text">{message.text}</p>

            {message.file && (
              <div className={`file-attachment ${isUser ? "user" : "other"}`}>
                <div className="file-content">
                  <div className="file-info">
                    <div className={`file-icon ${isUser ? "user" : "other"}`}>{getFileIcon(message.file.type)}</div>
                    <div className="file-details">
                      <p className={`file-name ${isUser ? "user" : "other"}`}>{message.file.name}</p>
                      <p className={`file-size ${isUser ? "user" : "other"}`}>{formatFileSize(message.file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(message.file!.url, message.file!.name)}
                    className={`download-button ${isUser ? "user" : "other"}`}
                  >
                    <Download size={16} />
                  </button>
                </div>

                {message.file.type.startsWith("image/") && (
                  <div className="file-image">
                    <img src={message.file.url || "/placeholder.svg"} alt={message.file.name} />
                  </div>
                )}
              </div>
            )}
          </div>

          <p className={`timestamp ${isUser ? "user" : "other"}`}>{formatTime(message.timestamp)}</p>
        </div>
      </div>
    </>
  )
}
