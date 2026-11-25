export const qrPositions = [
  { key: 'top-left', label: 'Top left', x: 0, y: 0 },
  { key: 'top-center', label: 'Top centre', x: 0.5, y: 0 },
  { key: 'top-right', label: 'Top right', x: 1, y: 0 },
  { key: 'middle-left', label: 'Middle left', x: 0, y: 0.5 },
  { key: 'middle-right', label: 'Middle right', x: 1, y: 0.5 },
  { key: 'bottom-left', label: 'Bottom left', x: 0, y: 1 },
  { key: 'bottom-center', label: 'Bottom centre', x: 0.5, y: 1 },
  { key: 'bottom-right', label: 'Bottom right', x: 1, y: 1 },
]

export function qrFlyerLayout(width, height, position = 'bottom-right', size = 0.22) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    throw new Error('Invalid flyer dimensions')
  const point = qrPositions.find((item) => item.key === position)
  if (!point || ![0.16, 0.22, 0.28].includes(size)) throw new Error('Invalid QR placement')
  // Bound the exported bitmap, preserving the complete flyer and its aspect ratio.
  const scale = Math.min(1600 / Math.max(width, height), 1)
  const imageWidth = Math.max(1, Math.round(width * scale))
  const imageHeight = Math.max(1, Math.round(height * scale))
  const shortest = Math.min(imageWidth, imageHeight)
  const margin = shortest * 0.025
  const qrSize = shortest * size
  return {
    width: imageWidth,
    imageHeight,
    height: imageHeight + Math.max(40, Math.round(imageWidth * 0.06)),
    qrSize,
    x: margin + point.x * (imageWidth - qrSize - margin * 2),
    y: margin + point.y * (imageHeight - qrSize - margin * 2),
  }
}

export function drawQrExport(canvas, qrCanvas, image, { mode, position, size }) {
  if (mode !== 'qr' && mode !== 'flyer') throw new Error('Invalid export mode')
  if (mode === 'qr') {
    canvas.width = qrCanvas.width
    canvas.height = qrCanvas.height
    canvas.getContext('2d').drawImage(qrCanvas, 0, 0)
    return null
  }
  const layout = qrFlyerLayout(image.width, image.height, position, size)
  canvas.width = layout.width
  canvas.height = layout.height
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, layout.width, layout.imageHeight)
  context.imageSmoothingEnabled = false
  context.drawImage(qrCanvas, layout.x, layout.y, layout.qrSize, layout.qrSize)
  context.fillStyle = '#ffffff'
  context.fillRect(0, layout.imageHeight, layout.width, layout.height - layout.imageHeight)
  context.fillStyle = '#17151c'
  context.font = `500 ${Math.max(12, Math.round(layout.width * 0.022))}px sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(
    'Powered by Rush Hour Tickets',
    layout.width / 2,
    (layout.imageHeight + layout.height) / 2,
    layout.width * 0.9,
  )
  return layout
}
