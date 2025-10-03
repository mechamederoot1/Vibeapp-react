import { useEffect, useState } from 'react'

const getViewportHeight = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const { visualViewport } = window
  if (visualViewport && typeof visualViewport.height === 'number') {
    return Math.round(visualViewport.height)
  }

  return window.innerHeight || null
}

const useViewportHeight = () => {
  const [height, setHeight] = useState(() => getViewportHeight())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const update = () => {
      setHeight(getViewportHeight())
    }

    update()

    window.addEventListener('resize', update)
    window.addEventListener('focus', update)
    window.addEventListener('orientationchange', update)

    const { visualViewport } = window
    visualViewport?.addEventListener('resize', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('focus', update)
      window.removeEventListener('orientationchange', update)
      visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return height
}

export default useViewportHeight
