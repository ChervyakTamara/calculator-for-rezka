import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list, put } from '@vercel/blob'
import { formatBlobError, getBlobToken } from './blobToken'

export const config = {
  api: {
    bodyParser: true,
  },
}

const BLOB_PATH = 'laser-calc/app-data.json'

interface StoredData {
  settings: Record<string, unknown>
  metalPrices: unknown[]
  updatedAt: string | null
}

const emptyData = (): StoredData => ({
  settings: {},
  metalPrices: [],
  updatedAt: null,
})

async function readStored(): Promise<StoredData> {
  const token = getBlobToken()
  const { blobs } = await list({ prefix: BLOB_PATH, token })
  const blob = blobs.find((b) => b.pathname === BLOB_PATH)

  if (!blob) return emptyData()

  const response = await fetch(blob.url)
  if (!response.ok) {
    throw new Error('Не удалось прочитать файл настроек')
  }

  return response.json() as Promise<StoredData>
}

async function writeStored(data: StoredData): Promise<void> {
  const token = getBlobToken()
  await put(BLOB_PATH, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      const body = (req.body ?? {}) as Partial<StoredData>

      const updated: StoredData = {
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
