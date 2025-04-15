import React, { useState, useEffect } from 'react'
import GameInterface from './components/GameInterface'

/**
 * 应用程序主组件
 * 负责整合所有子组件并提供全局状态管理
 */
function App() {
  // 状态管理
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [isLoading, setIsLoading] = useState(true)

  // 初始化应用
  useEffect(() => {
    // 应用暗黑模式
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // 模拟加载过程
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [darkMode])

  // 切换暗黑模式
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
  }

  // 加载界面
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
            AI-TRPG 叙事系统
          </h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载系统组件...</p>
        </div>
      </div>
    )
  }

  // 主界面
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <GameInterface />
    </div>
  )
}

export default App
