'use client'

import { useState, useEffect } from 'react'

interface Provider {
  id: string
  name: string
  provider: string
  api_key_env_var: string
  is_default: boolean
}

interface ModelOption {
  id: string
  modelId: string
  displayName: string
  parameters: any
  provider: string
  providerName: string
  apiKeyEnvVar: string
}

interface ModelSelectorProps {
  currentTask: string
  onModelChange?: (model: string, provider: string, apiKeyEnvVar?: string) => void
}

const STORAGE_KEY = 'dseo_selected_model'

export default function ModelSelector({ currentTask, onModelChange }: ModelSelectorProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [modelsByProvider, setModelsByProvider] = useState<Record<string, ModelOption[]>>({})
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar preferencia guardada
    const savedProvider = localStorage.getItem(`${STORAGE_KEY}_provider_${currentTask}`)
    const savedModel = localStorage.getItem(`${STORAGE_KEY}_model_${currentTask}`)
    if (savedProvider) setSelectedProvider(savedProvider)
    if (savedModel) setSelectedModel(savedModel)

    // Fetch modelos disponibles
    fetch('/api/seo/ai-models')
      .then(res => res.json())
      .then(data => {
        if (data.providers && data.modelsByProvider) {
          setProviders(data.providers)
          setModelsByProvider(data.modelsByProvider)
          
          // Si no hay preferencia, usar el provider por defecto
          if (!savedProvider) {
            const defaultProvider = data.providers.find((p: Provider) => p.is_default)
            if (defaultProvider) {
              setSelectedProvider(defaultProvider.name)
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

  const handleProviderChange = (providerName: string) => {
    setSelectedProvider(providerName)
    localStorage.setItem(`${STORAGE_KEY}_provider_${currentTask}`, providerName)
    
    // Seleccionar primer modelo del provider
    const providerModels = modelsByProvider[providerName]
    if (providerModels && providerModels.length > 0) {
      setSelectedModel(providerModels[0].modelId)
      localStorage.setItem(`${STORAGE_KEY}_model_${currentTask}`, providerModels[0].modelId)
      if (onModelChange) {
        onModelChange(providerModels[0].modelId, providerName, providerModels[0].apiKeyEnvVar)
      }
    }
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    localStorage.setItem(`${STORAGE_KEY}_model_${currentTask}`, modelId)
    // Buscar el modelo seleccionado para obtener su apiKeyEnvVar
    const currentModel = currentModels.find(m => m.modelId === modelId)
    if (onModelChange) {
      onModelChange(modelId, selectedProvider, currentModel?.apiKeyEnvVar)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Cargando...</span>
      </div>
    )
  }

  const currentModels = modelsByProvider[selectedProvider] || []

  if (providers.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Sin proveedores configurados</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Selector de Proveedor */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Proveedor:</label>
        <select
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.name}>
              {provider.name} ({provider.provider})
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Modelo */}
      {currentModels.length > 0 && (
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Modelo:</label>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            {currentModels.map((model) => (
              <option key={model.id} value={model.modelId}>
                {model.displayName}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

export function getSelectedModel(task: string): { model: string; provider: string } {
  if (typeof window === 'undefined') return { model: '', provider: '' }
  return {
    model: localStorage.getItem(`${STORAGE_KEY}_model_${task}`) || '',
    provider: localStorage.getItem(`${STORAGE_KEY}_provider_${task}`) || ''
  }
}
