function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error(
      'Нет BLOB_READ_WRITE_TOKEN. Storage → Blob → Tokens → Read/Write → Environment Variables → Redeploy.',
    )
  }
  return token
}

function formatBlobError(error) {
  const msg = String(error)
  if (msg.includes('store does not exist')) {
    return (
      'Токен Blob устарел. Storage → Blob → Tokens → новый Read/Write токен → ' +
      'замените BLOB_READ_WRITE_TOKEN → Redeploy.'
    )
  }
  return msg
}

module.exports = { getBlobToken, formatBlobError }
