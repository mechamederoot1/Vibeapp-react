import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const ProfileCoverView = () => {
  const { coverId } = useParams()
  const navigate = useNavigate()
  const [src, setSrc] = useState('')

  useEffect(() => {
    if (coverId) setSrc(`/api/media/profile/cover/id/${coverId}`)
  }, [coverId])

  return (
    <div className="w-full mx-auto max-w-3xl bg-white">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <div className="font-semibold truncate">Foto de capa</div>
        <button onClick={() => navigate(-1)} className="text-vibe-blue">Voltar</button>
      </div>
      {src && (
        <img src={src} alt="Foto de capa" className="w-full object-contain max-h-[80vh] bg-black" />
      )}
    </div>
  )
}

export default ProfileCoverView
