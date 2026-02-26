'use client'

import { useState, useEffect } from 'react'

interface ModelOption {
  task: string
  model: string
  parameters: any
  provider: string
  isNew?: boolean
}

interface ModelSelectorProps {
  currentTask: string
  onModelChange?: (model: string) => void
}

const STORAGE_KEY = 'dseo_selected_model'

export default function ModelSelector({ currentTask, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelOption[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar preferencia guardada
    const saved = localStorage.getItem(`${STORAGE_KEY}_${currentTask}`)
    if (saved) {
      setSelectedModel(saved)
    }

    // Fetch modelos disponibles
    fetch('/api/seo/ai-models')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.allModels) {
          setModels(data.allModels)
          // Si no hay preferencia guardada, usar el primero para la tarea
          if (!saved && data.allModels.length > 0) {
            const taskModels = data.allModels.filter((m: ModelOption) => m.task === currentTask)
            if (taskModels.length > 0) {
              setSelectedModel(taskModels[0].model)
            }
          }
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading models:', err)
        setLoading(false)
      })
  }, [currentTask])

  const handleChange = (model: string) => {
    setSelectedModel(model)
    localStorage.setItem(`${STORAGE_KEY}_${currentTask}`, model)
    if (onModelChange) {
      onModelChange(model)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Cargando modelos...</span>
      </div>
    )
  }

  const taskModels = models.filter(m => m.task === currentTask)

  if (taskModels.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Sin modelos disponibles</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <label className="text-sm font-medium text-gray-700">Modelo:</label>
      <select
        value={selectedModel}
        onChange={(e) => handleChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
      >
        {taskModels.map((model) => (
          <option key={model.model} value={model.model}>
            {model.model} {model.isNew ? '⭐' : ''} ({model.provider})
          </option>
        ))}
      </select>
      {selectedModel && (
        <span className="text-xs text-gray-500">
          {selectedModel.includes('gemini') ? 'Google' : 'OpenRouter'}
        </span>
      )}
    </div>
  )
}

export function getSelectedModel(task: string): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(`${STORAGE_KEY}_${task}`) || ''
}
