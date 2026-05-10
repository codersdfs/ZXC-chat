import { useState, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'

// Icons
const IconSearch = () => (
  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
)

const IconPlus = () => (
  <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
)

const IconClose = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const IconDots = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
  </svg>
)

// Types
interface Space {
  id: string
  name: string
  customInstructions: string
  lastActive: string
  createdAt: number
}

// Color utilities
const getColor = (id: string) => {
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const formatLastActive = (date: number) => {
  const now = Date.now()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// Initial demo data
const initialSpaces: Space[] = [
  { id: '1', name: 'AI Coding Agent', customInstructions: 'You are an expert software engineer. Write clean, maintainable code with comprehensive comments and error handling.', lastActive: formatLastActive(Date.now() - 2 * 86400000), createdAt: Date.now() - 2 * 86400000 },
  { id: '2', name: 'Creative Writing', customInstructions: 'You are a creative writing assistant. Help with storytelling, character development, and world-building.', lastActive: formatLastActive(Date.now() - 12 * 86400000), createdAt: Date.now() - 12 * 86400000 },
  { id: '3', name: 'Data Analysis', customInstructions: 'You are a data scientist. Analyze data thoroughly, create visualizations, and provide actionable insights.', lastActive: formatLastActive(Date.now() - 19 * 86400000), createdAt: Date.now() - 19 * 86400000 },
  { id: '4', name: 'Learning Korean', customInstructions: 'You are a friendly Korean language teacher. Help with grammar, vocabulary, and pronunciation.', lastActive: formatLastActive(Date.now() - 3 * 3600000), createdAt: Date.now() - 3 * 3600000 },
  { id: '5', name: 'DevOps Assistant', customInstructions: 'You are a DevOps specialist. Help with CI/CD pipelines, infrastructure, and cloud deployments.', lastActive: formatLastActive(Date.now() - 5 * 86400000), createdAt: Date.now() - 5 * 86400000 },
]

export default function SpacesPage() {
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewSpaceModal, setShowNewSpaceModal] = useState(false)
  const [showSpaceDetails, setShowSpaceDetails] = useState<Space | null>(null)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string>('')
  const [newSpace, setNewSpace] = useState<{ name: string; customInstructions: string }>({ name: '', customInstructions: '' })

  const filteredSpaces = spaces.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customInstructions.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateSpace = () => {
    if (!newSpace.name.trim()) return
    const space: Space = {
      id: Date.now().toString(),
      name: newSpace.name.trim(),
      customInstructions: newSpace.customInstructions.trim(),
      lastActive: 'Just now',
      createdAt: Date.now(),
    }
    setSpaces(prev => [space, ...prev])
    setNewSpace({ name: '', customInstructions: '' })
    setShowNewSpaceModal(false)
    setSuggestions('')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this space?')) {
      setSpaces(prev => prev.filter(s => s.id !== id))
      if (showSpaceDetails?.id === id) setShowSpaceDetails(null)
    }
  }

  const handleSuggestSteps = () => {
    if (!newSpace.name.trim()) return
    const defaultQuestions = [
      'What are common problems or tasks in this space?',
      'What tone and style should the AI adopt?',
      'What are the expected inputs and outputs?',
      'What should the AI avoid or be cautious about?',
      'What tools or frameworks are used in this space?',
    ]
    setGeneratingQuestions(true)
    setTimeout(() => {
      const generated = defaultQuestions.map((q) => '• ' + q).join('\n')
      setSuggestions(generated)
      setGeneratingQuestions(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900 text-white shadow z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">S</div>
              <h1 className="text-lg font-semibold tracking-tight">Spaces</h1>
            </div>
            <div className="flex items-center space-x-4">
              <img src="/favicon.svg" alt="App logo" className="h-8 w-8" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Spaces</h2>
            <p className="text-sm text-gray-500 mt-1">Manage AI instruction environments for different tasks</p>
            <button
              onClick={() => navigate('/spaces-dashboard')}
              className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Open Chat Dashboard
            </button>
          </div>
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconSearch />
              </div>
              <input
                type="text"
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-64 transition-shadow bg-white"
              />
            </div>
            {/* New Space Button */}
            <button
              onClick={() => setShowNewSpaceModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
            >
              <IconPlus />
              New space
            </button>
          </div>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map(space => (
            <SpaceCard
              key={space.id}
              space={space}
              onViewDetails={() => setShowSpaceDetails(space)}
              onDelete={() => handleDelete(space.id)}
            />
          ))}
          {filteredSpaces.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No spaces found</p>
              <p className="text-sm">Try adjusting your search or create a new space</p>
            </div>
          )}
        </div>
      </div>

      {/* New Space Modal */}
      {showNewSpaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create New Space</h3>
                <button onClick={() => { setShowNewSpaceModal(false); setSuggestions(''); }} className="text-gray-400 hover:text-gray-600">
                  <IconClose />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Space Name</label>
                  <input
                    type="text"
                    placeholder="e.g., AI Coding Agent"
                    value={newSpace.name}
                    onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Instructions</label>
                  <textarea
                    placeholder="Define how the AI should behave in this space..."
                    value={newSpace.customInstructions}
                    onChange={(e) => setNewSpace({ ...newSpace, customInstructions: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">These instructions will automatically apply to all conversations in this space.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCreateSpace}
                    disabled={!newSpace.name.trim()}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition shadow-sm"
                  >
                    Create Space
                  </button>
                  <button
                    onClick={() => setShowNewSpaceModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
                <div className="border-t pt-4">
                  <button
                    onClick={handleSuggestSteps}
                    disabled={!newSpace.name.trim() || generatingQuestions}
                    className="w-full py-2 px-4 bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition text-left"
                  >
                    {generatingQuestions ? 'Generating suggestions...' : 'Suggest Questions for AI'}
                  </button>
                </div>
                {suggestions && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-500 mb-2">Suggested Questions:</p>
                    <ul className="text-sm text-gray-700 list-disc list-inside whitespace-pre-line">{suggestions}</ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Space Details Modal */}
      {showSpaceDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ backgroundColor: getColor(showSpaceDetails.id) }}>
                    {showSpaceDetails.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{showSpaceDetails.name}</h3>
                    <p className="text-xs text-gray-500">Last active {showSpaceDetails.lastActive}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/favicon.svg" alt="S" className="h-8 w-8 rounded-full" title="Owner" />
                  <button onClick={() => setShowSpaceDetails(null)} className="text-gray-400 hover:text-gray-600">
                    <IconClose />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Custom Instructions</h4>
                  <p className="text-sm text-gray-600 leading-relaxed p-3 bg-gray-50 rounded-lg border">{showSpaceDetails.customInstructions}</p>
                </div>
                <div className="pt-4 flex space-x-3">
                  <button className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition shadow-sm">
                    Open Space
                  </button>
                  <button onClick={() => handleDelete(showSpaceDetails.id)} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Space Card Component (memoized for performance)
const SpaceCard = memo(function SpaceCard({ space, onViewDetails, onDelete }: { space: Space; onViewDetails: () => void; onDelete: () => void }) {
  const [showActions, setShowActions] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(space.customInstructions)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [space.customInstructions])

  const handleViewDetails = useCallback(() => {
    onViewDetails()
  }, [onViewDetails])

  const handleDeleteClick = useCallback(() => {
    onDelete()
  }, [onDelete])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-52 cursor-pointer group">
      <div className="p-5 flex-1" onClick={handleViewDetails}>
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md" style={{ backgroundColor: getColor(space.id) }}>
            {space.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{space.name}</h3>
            <p className="text-xs text-gray-500">{space.lastActive}</p>
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions) }}
              className="p-1 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Actions"
            >
              <IconDots />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-1 w-36 bg-white border rounded-lg shadow-lg z-20 py-1">
                <button onClick={(e) => { e.stopPropagation(); setShowActions(false); handleViewDetails() }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">View Details</button>
                <button onClick={(e) => { e.stopPropagation(); setShowActions(false); handleDeleteClick() }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{space.customInstructions}</p>
      </div>
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shadow-md">S</div>
          <span className="text-xs text-gray-500">Owner</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-green-700 font-medium hover:text-green-800 transition"
        >
          {copied ? 'Copied!' : 'Copy Instructions'}
        </button>
      </div>
    </div>
  )
})
