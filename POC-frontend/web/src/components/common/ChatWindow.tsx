"use client"

import { useEffect, useRef } from "react" 
import type { Message } from "../../pages/ChatPage"
import MessageBubble from "./MessageBubble"

interface ChatWindowProps {
  messages?: Message[]
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <>
      <style>{`
        .chat-window {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: linear-gradient(180deg, #fefbff 0%, #ffffff 100%);
        }
        
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6b7280;
        }
      `}</style>

      <div className="chat-window">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={messagesEndRef} />
      </div>
    </>
  )
}
