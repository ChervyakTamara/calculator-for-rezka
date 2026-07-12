const { list } = require('@vercel/blob')
const { getBlobToken, formatBlobError } = require('./blobToken')

module.exports = async function handler(_req, res) {
  try {
    const hasToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
    const hasStoreId = Boolean(process.env.BLOB_STORE_ID)

    let blobWorks = false
    let blobError = null

    if (hasToken) {
      try {
        await list({ prefix: 'laser-calc/', token: getBlobToken() })
        blobWorks = true
      } catch (error) {
        blobError = formatBlobError(error)
      }
    }

    return res.status(200).json({
      ok: blobWorks,
      blobToken: hasToken,
      storeId: hasStoreId,
      blobWorks,
      blobError,
    })
  } catch (error) {
    console.error('api/health error:', error)
    return res.status(500).json({ ok: false, error: String(error) })
  }
}
