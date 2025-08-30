import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const dailyTasks = [
  "Pray all 5 Salat",
  "Read Quran (at least 1 page)",
  "15–20 min Sports Activity",
  "Read 5 pages of a book",
  "Learn or practice 1 new skill",
  "Send 1 picture of your day",
  "Couple activity (Movie, Game, Cooking, or Call)"
]

const motivationalQuotes = [
  "The best way to predict the future is to create it together. 💕",
  "Every day is a new opportunity to grow stronger together. 🌟",
  "Small daily improvements are the key to long-term success. ✨",
  "Love is not about finding the perfect person, but about seeing an imperfect person perfectly. 💖",
  "The greatest happiness in life is the conviction that we are loved. 🥰",
  "Together we can achieve what seems impossible alone. 💪",
  "Every challenge we face together makes our bond stronger. 🔗",
  "Success in marriage is not about finding the right person, it's about being the right person. 💑",
  "The best relationships are built on mutual respect, trust, and daily effort. 🏗️",
  "Love grows stronger with each shared experience. 🌱"
]

function Challenge() {
  const [progress, setProgress] = useState({})
  const [quoteOfTheDay, setQuoteOfTheDay] = useState("")
  const { currentUser } = useAuth()

  // Load progress from localStorage on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('idrissSalmaProgress')
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress))
    }
    
    // Set quote of the day based on current date
    const today = new Date()
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
    setQuoteOfTheDay(motivationalQuotes[dayOfYear % motivationalQuotes.length])
  }, [])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('idrissSalmaProgress', JSON.stringify(progress))
  }, [progress])

  // Calculate progress for each person
  const calculatePersonProgress = (person) => {
    const totalTasks = 30 * dailyTasks.length
    const completedTasks = Object.keys(progress).filter(key => 
      key.includes(person) && progress[key]
    ).length
    return Math.round((completedTasks / totalTasks) * 100)
  }

  // Calculate overall progress
  const totalTasks = 30 * dailyTasks.length * 2
  const completedTasks = Object.values(progress).filter(Boolean).length
  const overallProgress = Math.round((completedTasks / totalTasks) * 100)

  // Handle checkbox changes
  const handleCheckboxChange = (day, taskIndex, person) => {
    const key = `${day}-${taskIndex}-${person}`
    setProgress(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Reset all progress
  const resetProgress = () => {
    setProgress({})
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
                 <div className="mb-4">
           <div className="inline-block w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-2 border-gray-200">
             <img
               src={currentUser.username === 'idriss' ? '/idriss-profile.jpg' : '/salma-profile.jpg'}
               alt={`${currentUser.name}'s profile`}
               className="w-full h-full object-cover"
               onError={(e) => {
                 // Try SVG fallback first
                 if (e.target.src.includes('.jpg')) {
                   e.target.src = currentUser.username === 'idriss' ? '/idriss-profile.svg' : '/salma-profile.svg'
                 } else {
                   // Fallback to colored initial if both images fail
                   e.target.style.display = 'none'
                   e.target.nextSibling.style.display = 'flex'
                 }
               }}
             />
             <div className={`w-full h-full flex items-center justify-center text-3xl ${
               currentUser.color === 'pink' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
             }`} style={{ display: 'none' }}>
               {currentUser.name.charAt(0)}
             </div>
           </div>
           <p className="text-lg text-gray-600">Welcome back, <span className="font-semibold text-gray-800">{currentUser.name}</span>! 💕</p>
         </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          🌸 IDRISS AND SALMA 30 DAY CHALLENGE 🌸
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Complete daily activities together and track our progress!
        </p>
        
        {/* Motivational Quote */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <p className="text-xl text-gray-700 italic font-medium">
            💭 "{quoteOfTheDay}"
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Overall Progress</h3>
          <div className="text-center mb-3">
            <span className="text-3xl font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="bg-gradient-to-r from-pink-400 to-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-gray-500">
            {completedTasks} of {totalTasks} tasks completed
          </div>
        </div>

        {/* Idriss Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-pink-700 mb-4 text-center">Idriss Progress</h3>
          <div className="text-center mb-3">
            <span className="text-3xl font-bold text-pink-600">{calculatePersonProgress('idriss')}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="bg-pink-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${calculatePersonProgress('idriss')}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-gray-500">
            {Object.keys(progress).filter(key => key.includes('idriss') && progress[key]).length} of {30 * dailyTasks.length} tasks completed
          </div>
        </div>

        {/* Salma Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">Salma Progress</h3>
          <div className="text-center mb-3">
            <span className="text-3xl font-bold text-blue-600">{calculatePersonProgress('salma')}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${calculatePersonProgress('salma')}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-gray-500">
            {Object.keys(progress).filter(key => key.includes('salma') && progress[key]).length} of {30 * dailyTasks.length} tasks completed
          </div>
        </div>
      </div>

      {/* Challenge Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 30 }, (_, index) => {
          const day = index + 1
          return (
            <div key={day} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Day {day}
                </h3>
              </div>
              
              <div className="space-y-3">
                {dailyTasks.map((task, taskIndex) => (
                  <div key={taskIndex} className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium leading-tight">
                      {task}
                    </p>
                    
                    {/* Idriss Checkbox */}
                    <div className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
                      <span className="text-xs font-medium text-pink-700">Idriss</span>
                      <input
                        type="checkbox"
                        checked={progress[`${day}-${taskIndex}-idriss`] || false}
                        onChange={() => handleCheckboxChange(day, taskIndex, 'idriss')}
                        className="w-4 h-4 text-pink-600 bg-gray-100 border-pink-300 rounded focus:ring-pink-500 focus:ring-2"
                      />
                    </div>
                    
                    {/* Salma Checkbox */}
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <span className="text-xs font-medium text-blue-700">Salma</span>
                      <input
                        type="checkbox"
                        checked={progress[`${day}-${taskIndex}-salma`] || false}
                        onChange={() => handleCheckboxChange(day, taskIndex, 'salma')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-blue-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reset Button */}
      <div className="text-center">
        <button
          onClick={resetProgress}
          className="bg-gradient-to-r from-pink-400 to-blue-500 hover:from-pink-500 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          🔄 Reset Progress
        </button>
      </div>
    </div>
  )
}

export default Challenge
