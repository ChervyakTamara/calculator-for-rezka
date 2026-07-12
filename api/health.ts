import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    blobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    storeId: Boolean(process.env.BLOB_STORE_ID),
  })
}
