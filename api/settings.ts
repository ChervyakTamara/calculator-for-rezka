import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list, put } from '@vercel/blob'

const BLOB_PATH = 'laser-calc/app-data.json'

interface StoredData {
  settings: Record<string, unknown>
  metalPrices: unknown[]
  updatedAt: string | null
}

function getToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN не настроен. Подключите Blob Store в Vercel.')
  }
  return token
}

async function readStored(): Promise<StoredData> {
  const token = getToken()
  const { blobs } = await list({ prefix: BLOB_PATH, token })
  const blob = blobs.find((b) => b.pathname === BLOB_PATH)

  if (!blob) {
    return { settings: {}, metalPrices: [], updatedAt: null }
  }

  const response = await fetch(blob.url)
  if (!response.ok) {
    throw new Error('Не удалось прочитать файл настроек')
  }

  return response.json() as Promise<StoredData>
}

async function writeStored(data: StoredData): Promise<void> {
  const token = getToken()
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

  if (req.method === 'GET') {
    try {
      const data = await readStored()
      return res.status(200).json(data)
    } catch (error) {
      return res.status(500).json({ error: String(error) })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const existing = await readStored()
      const body = req.body as Partial<StoredData>

      const updated: StoredData = {
        settings: body.settings ?? existing.settings,
        metalPrices: body.metalPrices ?? existing.metalPrices,
        updatedAt: new Date().toISOString(),
      }

      await writeStored(updated)
      return res.status(200).json(updated)
    } catch (error) {
      return res.status(500).json({ error: String(error) })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
