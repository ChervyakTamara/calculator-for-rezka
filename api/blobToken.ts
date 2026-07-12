export function getBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error(
      'Нет BLOB_READ_WRITE_TOKEN. Storage → Blob → Tokens → Read/Write → добавьте в Environment Variables → Redeploy.',
    )
  }
  return token
}

export function formatBlobError(error: unknown): string {
  const msg = String(error)
  if (msg.includes('store does not exist')) {
    return (
      'Токен Blob устарел или от другого хранилища. ' +
      'Vercel → Storage → откройте АКТИВНЫЙ Blob → Settings → Tokens → ' +
      'создайте новый Read/Write токен → замените BLOB_READ_WRITE_TOKEN в Environment Variables → Redeploy. ' +
      'Если не помогло: удалите все BLOB_* переменные, создайте новый Blob Store и подключите заново.'
    )
  }
  return msg
}
