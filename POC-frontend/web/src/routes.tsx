import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import type { Message } from './pages/ChatPage';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Clients = React.lazy(() => import('./pages/Clients'));
const ClientDetails = React.lazy(() => import('./pages/ClientDetails'));
const Reports = React.lazy(() => import('./pages/Reports'));
const ReportDetails = React.lazy(() => import('./pages/ReportDetails'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const Profile = React.lazy(() => import('./pages/Profile'));

class MockWebSocket {
  private callbacks: { [key: string]: Function[] } = {}
  private isOpen = false

  constructor(url: string) {
    // Simulate connection delay
    setTimeout(() => {
      this.isOpen = true
      this.emit("open")
    }, 1000)
  }

  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
  }

  emit(event: string, data?: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((callback) => callback(data))
    }
  }

  send(data: string) {
    if (this.isOpen) {
      // Simulate receiving a response after a delay
      setTimeout(
        () => {
          const responses = [
            "That's interesting! Tell me more.",
            "I understand what you're saying.",
            "Thanks for sharing that with me.",
            "How can I help you with that?",
            "That sounds great!",
          ]
          const randomResponse = responses[Math.floor(Math.random() * responses.length)]

          this.emit("message", {
            id: Date.now().toString(),
            text: randomResponse,
            sender: "other",
            timestamp: new Date(),
          })
        },
        1000 + Math.random() * 2000,
      )
    }
  }

  close() {
    this.isOpen = false
    this.emit("close")
  }
}

const AppRoutes = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! Welcome to the chat. Feel free to send messages or upload files.",
      sender: "other",
      timestamp: new Date(),
    },
  ])
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<MockWebSocket | null>(null)

  
  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = new MockWebSocket("ws://localhost:8080")

    socketRef.current.on("open", () => {
      setIsConnected(true)
      console.log("Connected to chat server")
    })

    socketRef.current.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    socketRef.current.on("close", () => {
      setIsConnected(false)
      console.log("Disconnected from chat server")
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !isConnected) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])

    // Send to server via WebSocket
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify(newMessage))
    }
  }

  const handleSendFile = async (file: File) => {
    if (!isConnected) return

    // Create a blob URL for the file (in a real app, you'd upload to a server)
    const fileUrl = URL.createObjectURL(file)

    const fileMessage: Message = {
      id: Date.now().toString(),
      text: `Shared a file: ${file.name}`,
      sender: "user",
      timestamp: new Date(),
      file: {
        name: file.name,
        url: fileUrl,
        type: file.type,
        size: file.size,
      },
    }

    setMessages((prev) => [...prev, fileMessage])

    // In a real app, you'd upload the file to your server here
    // and then send the file metadata via WebSocket
    if (socketRef.current) {
      socketRef.current.send(
        JSON.stringify({
          ...fileMessage,
          file: { ...fileMessage.file, url: "server-file-url" },
        }),
      )
    }
  }
  return (
    <React.Suspense fallback={<div className="flex-center h-full">Loading...</div>}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<ChatPage
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onSendFile={handleSendFile}
                  isConnected={isConnected} />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes; 