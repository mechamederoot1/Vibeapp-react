import React from 'react'
import { Search, TrendingUp, MapPin, Play } from 'lucide-react'

const Explore = () => {
  const trendingTags = [
    { tag: '#VibeLife', posts: '2.8M' },
    { tag: '#SãoPaulo', posts: '15.2M' },
    { tag: '#Photography', posts: '245M' },
    { tag: '#Weekend', posts: '892K' },
    { tag: '#FoodLover', posts: '5.7M' },
    { tag: '#Travel', posts: '89.3M' },
    { tag: '#Nature', posts: '156M' },
    { tag: '#Fitness', posts: '23.1M' }
  ]

  const nearbyPlaces = [
    { 
      name: 'Shopping Iguatemi', 
      distance: '0.8 km',
      posts: 1247,
      image: 'https://picsum.photos/150/150?random=place1'
    },
    { 
      name: 'Parque Ibirapuera', 
      distance: '1.2 km',
      posts: 8932,
      image: 'https://picsum.photos/150/150?random=place2'
    },
    { 
      name: 'Café Central', 
      distance: '0.3 km',
      posts: 567,
      image: 'https://picsum.photos/150/150?random=place3'
    },
    { 
      name: 'Academia Fitness', 
      distance: '0.5 km',
      posts: 234,
      image: 'https://picsum.photos/150/150?random=place4'
    }
  ]

  const exploreContent = [
    // Vídeo em destaque
    {
      id: 1,
      type: 'video',
      likes: 15420,
      comments: 892,
      image: 'https://picsum.photos/400/600?random=explore1',
      isPopular: true,
      duration: '0:45'
    },
    // Posts normais
    {
      id: 2,
      type: 'image',
      likes: 2847,
      comments: 156,
      image: 'https://picsum.photos/400/400?random=explore2',
      isPopular: false
    },
    {
      id: 3,
      type: 'image',
      likes: 1234,
      comments: 89,
      image: 'https://picsum.photos/400/500?random=explore3',
      isPopular: false
    },
    // Vídeo popular
    {
      id: 4,
      type: 'video',
      likes: 8956,
      comments: 445,
      image: 'https://picsum.photos/400/400?random=explore4',
      isPopular: true,
      duration: '1:23'
    },
    {
      id: 5,
      type: 'image',
      likes: 567,
      comments: 34,
      image: 'https://picsum.photos/400/600?random=explore5',
      isPopular: false
    },
    // Mais vídeos e imagens...
    ...Array(15).fill(null).map((_, index) => ({
      id: index + 6,
      type: index % 4 === 0 ? 'video' : 'image',
      likes: Math.floor(Math.random() * 5000) + 100,
      comments: Math.floor(Math.random() * 200) + 10,
      image: `https://picsum.photos/400/${300 + (index % 3) * 100}?random=explore${index + 6}`,
      isPopular: index % 6 === 0,
      duration: index % 4 === 0 ? `${Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : undefined
    }))
  ]

  return (
    <div className="bg-white min-h-full">
      {/* Barra de Busca */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pessoas, lugares, hashtags..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-vibe-blue focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Tags Trending */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp size={20} className="text-vibe-blue" />
          <h3 className="font-semibold">Em alta</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {trendingTags.map((item, index) => (
            <button
              key={index}
              className="bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-left transition-colors"
            >
              <p className="font-semibold text-sm">{item.tag}</p>
              <p className="text-gray-500 text-xs">{item.posts} posts</p>
            </button>
          ))}
        </div>
      </div>

      {/* Locais Próximos */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2 mb-3">
          <MapPin size={20} className="text-vibe-blue" />
          <h3 className="font-semibold">Perto de você</h3>
        </div>
        <div className="flex space-x-3 overflow-x-auto">
          {nearbyPlaces.map((place, index) => (
            <div key={index} className="flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden min-w-[140px]">
              <img 
                src={place.image} 
                alt={place.name}
                className="w-full h-20 object-cover"
              />
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{place.name}</p>
                <p className="text-gray-500 text-xs">{place.distance}</p>
                <p className="text-gray-400 text-xs">{place.posts.toLocaleString()} posts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Explorar */}
      <div className="grid grid-cols-3 gap-1">
        {exploreContent.map((item) => (
          <div key={item.id} className="relative aspect-square">
            <img 
              src={item.image} 
              alt={`Explore ${item.id}`}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay de hover com stats */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex items-center space-x-4 text-white">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">❤️</span>
                  <span className="text-sm font-semibold">{item.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">💬</span>
                  <span className="text-sm font-semibold">{item.comments}</span>
                </div>
              </div>
            </div>

            {/* Indicador de vídeo */}
            {item.type === 'video' && (
              <>
                <div className="absolute top-2 right-2">
                  <Play size={16} className="text-white drop-shadow-lg" fill="white" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-1.5 py-0.5 rounded text-xs">
                  {item.duration}
                </div>
              </>
            )}

            {/* Badge de popular */}
            {item.isPopular && (
              <div className="absolute top-2 left-2 bg-vibe-blue text-white px-2 py-1 rounded-full flex items-center space-x-1">
                <TrendingUp size={12} />
                <span className="text-xs font-semibold">Popular</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Explore
