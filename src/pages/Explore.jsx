import React from 'react'
import { Search, TrendingUp, MapPin } from 'lucide-react'

const Explore = () => {
  const trendingTags = [
    '#VibeLife', '#TrendingNow', '#SãoPaulo', '#Weekend', 
    '#Photography', '#FoodLover', '#Travel', '#Nature'
  ]

  const exploreContent = Array(20).fill(null).map((_, index) => ({
    id: index,
    type: index % 4 === 0 ? 'video' : 'image',
    likes: Math.floor(Math.random() * 1000) + 100,
    isPopular: index % 6 === 0
  }))

  return (
    <div className="bg-white min-h-full">
      {/* Barra de Busca */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pessoas, lugares, hashtags..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Tags Trending */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp size={20} className="text-vibe-blue" />
          <h3 className="font-semibold">Trending</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag, index) => (
            <button
              key={index}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm font-medium transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Locais Próximos */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <MapPin size={20} className="text-vibe-blue" />
          <h3 className="font-semibold">Perto de você</h3>
        </div>
        <div className="flex space-x-3 overflow-x-auto">
          {['Shopping Center', 'Parque Central', 'Café da Esquina', 'Academia Fitness'].map((place, index) => (
            <div key={index} className="flex-shrink-0 bg-gray-50 rounded-lg p-3 min-w-[120px]">
              <div className="w-full h-16 bg-gray-200 rounded mb-2 flex items-center justify-center">
                <MapPin size={16} className="text-gray-400" />
              </div>
              <p className="text-xs font-medium text-center">{place}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Explorar */}
      <div className="grid grid-cols-3 gap-1">
        {exploreContent.map((item) => (
          <div key={item.id} className="relative aspect-square bg-gray-100">
            {item.isPopular && (
              <div className="absolute top-2 right-2 bg-vibe-blue text-white px-2 py-1 rounded-full">
                <TrendingUp size={12} />
              </div>
            )}
            {item.type === 'video' && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                <span className="text-xs">▶</span>
              </div>
            )}
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">
                {item.type === 'video' ? '🎥' : '📸'}
              </span>
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              <span className="text-xs">❤️ {item.likes}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Explore
