"use client"

import ChatWindow from "../components/common/ChatWindow"
import MessageInput from "../components/common/MessageInput"

export interface Message {
  id: string
  text: string
  sender: "user" | "other"
  timestamp: Date
  file?: {
    name: string
    url: string
    type: string
    size: number
  }
}

export interface ChatAppProps {
  messages?: Message[]
  onSendMessage?: (text: string) => void
  onSendFile?: (file: File) => void
  isConnected?: boolean
}

export default function ChatPage({ messages, onSendMessage, onSendFile, isConnected }: ChatAppProps) {
  return (
    <>
      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);
        }
        
        .header {
          background: white;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border-bottom: 1px solid #e9d5ff;
          padding: 1rem;
        }
        
        .header-content {
          max-width: 64rem;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .header-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #6b21a8;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .status-dot {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
        }
        
        .status-dot.connected {
          background-color: #10b981;
        }
        
        .status-dot.disconnected {
          background-color: #ef4444;
        }
        
        .status-text {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .main-container {
          flex: 1;
          max-width: 64rem;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          padding: 1rem;
        }
        
        .chat-wrapper {
          flex: 1;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9d5ff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <div className="chat-container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <h1 className="header-title">Real-Time Chat</h1>
            <div className="connection-status">
              <div className={`status-dot ${isConnected ? "connected" : "disconnected"}`}></div>
              <span className="status-text">{isConnected ? "Connected" : "Connecting..."}</span>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="main-container">
          <div className="chat-wrapper">
            <ChatWindow messages={messages} />
            <MessageInput onSendMessage={onSendMessage} onSendFile={onSendFile} disabled={!isConnected} />
          </div>
        </div>
      </div>
    </>
  )
}
