import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list } from '@vercel/blob'
import { formatBlobError, getBlobToken } from './blobToken'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const hasToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  const hasStoreId = Boolean(process.env.BLOB_STORE_ID)

  let blobWorks = false
  let blobError: string | null = null

  if (hasToken) {
    try {
      await list({ prefix: 'laser-calc/', token: getBlobToken() })
      blobWorks = true
    } catch (error) {
      blobError = formatBlobError(error)
    }
  }

  res.status(200).json({
    ok: blobWorks,
    blobToken: hasToken,
    storeId: hasStoreId,
    blobWorks,
    blobError,
  })
}
