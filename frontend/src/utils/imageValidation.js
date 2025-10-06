// Utility to validate image dimensions and file type/size

export const DimensionPresets = {
  avatar: { minWidth: 400, minHeight: 400, maxWidth: 8000, maxHeight: 8000 },
  cover: { minWidth: 1200, minHeight: 400, maxWidth: 8000, maxHeight: 8000 },
  general: { minWidth: 800, minHeight: 400, maxWidth: 8000, maxHeight: 8000 },
  story: { minWidth: 800, minHeight: 1200, maxWidth: 8000, maxHeight: 8000 },
  message: { minWidth: 800, minHeight: 400, maxWidth: 8000, maxHeight: 8000 },
  post: { minWidth: 800, minHeight: 400, maxWidth: 8000, maxHeight: 8000 },
  highlight: { minWidth: 800, minHeight: 400, maxWidth: 8000, maxHeight: 8000 },
}

export function getImageDimensionsFromFile(file) {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const dims = { width: img.width, height: img.height }
        URL.revokeObjectURL(url)
        resolve(dims)
      }
      img.onerror = (e) => {
        try { URL.revokeObjectURL(url) } catch {}
        reject(new Error('Falha ao ler a imagem'))
      }
      img.src = url
    } catch (e) {
      reject(e)
    }
  })
}

export async function validateImageDimensions(file, opts = {}) {
  const {
    minWidth = 800,
    minHeight = 400,
    maxWidth = 8000,
    maxHeight = 8000,
    allowedTypes = ['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','image/avif'],
    maxBytes = 10 * 1024 * 1024,
  } = opts

  if (!file || typeof file.type !== 'string') {
    return { ok: false, error: 'Arquivo inválido' }
  }

  if (!allowedTypes.some(t => file.type.toLowerCase().includes(t.split('/')[1]) || t === file.type)) {
    return { ok: false, error: 'Formato não suportado. Use JPEG, PNG ou WebP.' }
  }

  if (file.size > maxBytes) {
    return { ok: false, error: `Arquivo muito grande. Máximo ${(maxBytes/1024/1024)|0}MB.` }
  }

  try {
    const { width, height } = await getImageDimensionsFromFile(file)
    if (width < minWidth || height < minHeight) {
      return { ok: false, width, height, error: `A imagem deve ter no mínimo ${minWidth}x${minHeight} pixels. (${width}x${height})` }
    }
    if (width > maxWidth || height > maxHeight) {
      return { ok: false, width, height, error: `A imagem é muito grande (${width}x${height}). Máximo ${maxWidth}x${maxHeight}px.` }
    }
    return { ok: true, width, height }
  } catch (e) {
    return { ok: false, error: 'Não foi possível validar a imagem' }
  }
}

export function presetOptions(preset = 'general') {
  return DimensionPresets[preset] || DimensionPresets.general
}
