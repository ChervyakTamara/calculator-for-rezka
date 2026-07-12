const { list, put } = require('@vercel/blob')
const { getBlobToken, formatBlobError } = require('./blobToken')

const BLOB_PATH = 'laser-calc/app-data.json'

const emptyData = () => ({
  settings: {},
  metalPrices: [],
  updatedAt: null,
})

async function readStored() {
  const token = getBlobToken()
  const { blobs } = await list({ prefix: BLOB_PATH, token })
  const blob = blobs.find((b) => b.pathname === BLOB_PATH)

  if (!blob) return emptyData()

  const response = await fetch(blob.url)
  if (!response.ok) {
    throw new Error('Не удалось прочитать файл настроек')
  }

  return response.json()
}

async function writeStored(data) {
  const token = getBlobToken()
  await put(BLOB_PATH, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token,
  })
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      const data = await readStored()
      return res.status(200).json(data)
    }

    if (req.method === 'PATCH') {
      const existing = await readStored()
      const body = req.body ?? {}

      const updated = {
        settings: body.settings ?? existing.settings,
        metalPrices: body.metalPrices ?? existing.metalPrices,
        updatedAt: new Date().toISOString(),
      }

      await writeStored(updated)
      return res.status(200).json(updated)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('api/settings error:', error)
    return res.status(500).json({ error: formatBlobError(error) })
  }
}

handler.config = {
  api: {
    bodyParser: true,
  },
}

module.exports = handler
