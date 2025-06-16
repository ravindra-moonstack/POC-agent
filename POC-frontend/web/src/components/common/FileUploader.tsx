"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Upload, X, File, ImageIcon, FileText } from "lucide-react"

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  onCancel: () => void
}

export default function FileUploader({ onFileSelect, onCancel }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon size={24} />
    if (fileType.includes("pdf") || fileType.includes("document")) return <FileText size={24} />
    return <File size={24} />
  }

  return (
    <>
      <style>{`
        .file-uploader {
          background-color: #faf5ff;
          border: 2px dashed #c084fc;
          border-radius: 0.75rem;
          padding: 1.5rem;
          position: relative;
        }
        
        .close-button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 0.25rem;
          color: #6b7280;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .close-button:hover {
          color: #374151;
          background-color: white;
        }
        
        .drop-zone {
          text-align: center;
          border-radius: 0.5rem;
          padding: 1rem;
          transition: background-color 0.2s;
        }
        
        .drop-zone.active {
          background-color: #e9d5ff;
        }
        
        .file-input {
          display: none;
        }
        
        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        
        .upload-icon {
          padding: 0.75rem;
          background-color: #ddd6fe;
          border-radius: 50%;
          color: #7c3aed;
        }
        
        .upload-text {
          color: #6b21a8;
          font-weight: 500;
        }
        
        .browse-button {
          color: #7c3aed;
          text-decoration: underline;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: inherit;
        }
        
        .browse-button:hover {
          color: #6b21a8;
        }
        
        .upload-subtitle {
          font-size: 0.875rem;
          color: #7c3aed;
          margin-top: 0.25rem;
        }
      `}</style>

      <div className="file-uploader">
        <button onClick={onCancel} className="close-button">
          <X size={16} />
        </button>

        <div
          className={`drop-zone ${dragActive ? "active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            className="file-input"
            onChange={handleChange}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.svg"
          />

          <div className="upload-content">
            <div className="upload-icon">
              <Upload size={24} />
            </div>

            <div>
              <p className="upload-text">
                Drop files here or{" "}
                <button onClick={onButtonClick} className="browse-button">
                  browse
                </button>
              </p>
              <p className="upload-subtitle">Supports PDF, DOC, DOCX, images, and text files</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
