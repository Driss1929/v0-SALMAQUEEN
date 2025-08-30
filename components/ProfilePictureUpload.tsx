"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "../contexts/AuthContext"

interface ProfilePictureUploadProps {
  onClose: () => void
}

function ProfilePictureUpload({ onClose }: ProfilePictureUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentUser, updateProfilePicture } = useAuth()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB")
        return
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return

    setIsUploading(true)

    try {
      // Convert file to base64 for storage in localStorage
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        updateProfilePicture(base64String)
        onClose()
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      alert("Failed to upload profile picture. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreviewUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Update Profile Picture</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {/* Current Profile Picture */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full mx-auto mb-3 overflow-hidden border-2 border-gray-200">
            {previewUrl ? (
              <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <img
                  src={
                    currentUser?.profilePicture ||
                    (currentUser?.username === "idriss" ? "/idriss-profile.jpg.jpg" : "/salma-profile.jpg.jpg")
                  }
                  alt={`${currentUser?.name}'s profile`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const fallback = target.nextSibling as HTMLElement
                    if (fallback) {
                      fallback.style.display = "flex"
                    }
                  }}
                />
                <div
                  className={`w-full h-full flex items-center justify-center text-2xl ${
                    currentUser?.color === "pink" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
                  }`}
                  style={{ display: "none" }}
                >
                  {currentUser?.name.charAt(0)}
                </div>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600">Current profile picture</p>
        </div>

        {/* File Input */}
        <div className="mb-6">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors"
          >
            <div className="text-4xl mb-2">📷</div>
            <p className="text-gray-600">Click to select a new photo</p>
            <p className="text-sm text-gray-500 mt-1">Max size: 5MB</p>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {selectedFile && (
            <button
              onClick={handleRemove}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Remove
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
              selectedFile && !isUploading
                ? `bg-gradient-to-r ${
                    currentUser?.color === "pink"
                      ? "from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600"
                      : "from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600"
                  } text-white`
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePictureUpload
