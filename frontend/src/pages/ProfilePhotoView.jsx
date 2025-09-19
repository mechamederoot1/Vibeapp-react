import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const ProfilePhotoView = () => {
  const { photoId } = useParams()
  const navigate = useNavigate()
  const [src, setSrc] = useState('')

  useEffect(() => {
    if (photoId) setSrc(`/api/media/profile/photo/id/${photoId}`)
  }, [photoId])

  return (
    <div className="w-full mx-auto max-w-2xl bg-white">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <div className="font-semibold truncate">Foto de perfil</div>
        <button onClick={() => navigate(-1)} className="text-vibe-blue">Voltar</button>
      </div>
      {src && (
        <img src={src} alt="Foto de perfil" className="w-full object-contain max-h-[80vh] bg-black" />
      )}
    </div>
  )
}

export default ProfilePhotoView
