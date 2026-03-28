import { Buffer } from 'node:buffer'
import type { Env } from '../index'

const BACKBLAZE_CREDENTIALS = {
  applicationKeyId: 'ffbf175d7c5c',
  applicationKey: '005caf7f5180b9afe72ee36a1d1d9df8d2eec61504',
}

interface B2AuthResponse {
  authorizationToken: string
  apiUrl: string
  downloadUrl: string
  apiInfo: {
    storageApi: {
      downloadUrl: string
      apiUrl: string
    }
  }
}

interface B2DownloadAuthResponse {
  authorizationToken: string
}

function getValidatedB2BaseUrls(env: Pick<Env, 'B2_DOWNLOAD_URL'>) {
  const rawDownloadUrl = env.B2_DOWNLOAD_URL

  if (!rawDownloadUrl) {
    throw new Error('B2_DOWNLOAD_URL is not configured')
  }

  try {
    const normalizedDownloadUrl = new URL(rawDownloadUrl).toString().replace(/\/$/, '')
    return { downloadUrl: normalizedDownloadUrl }
  } catch {
    throw new Error(`B2_DOWNLOAD_URL is invalid: ${rawDownloadUrl}`)
  }
}

async function authorizeB2Account(): Promise<B2AuthResponse> {
  const credentials = Buffer.from(
    `${BACKBLAZE_CREDENTIALS.applicationKeyId}:${BACKBLAZE_CREDENTIALS.applicationKey}`,
  ).toString('base64')

  const response = await fetch('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  })

  if (!response.ok) {
    throw new Error(`B2 authorization failed: ${response.statusText}`)
  }

  return response.json() as Promise<B2AuthResponse>
}

async function getDownloadAuthorization(
  authToken: string,
  apiUrl: any,
  bucketId: string,
  fileNamePrefix: string,
  validDurationSeconds = 3600,
): Promise<B2DownloadAuthResponse> {
  const response = await fetch(`${apiUrl}/b2api/v3/b2_get_download_authorization`, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketId,
      fileNamePrefix,
      validDurationInSeconds: validDurationSeconds,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get download auth: ${response.statusText}`)
  }
  return response.json()
}
async function getFileInfo(
  authToken: string,
  apiUrl: string,
  fileId: string,
): Promise<{ fileName: string; bucketId: string }> {
  const response = await fetch(`${apiUrl}/b2api/v3/b2_get_file_info`, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get file info: ${response.statusText}`)
  }
  return response.json() as Promise<{ fileName: string; bucketId: string }>
}

function buildAuthorizedDownloadUrl(
  fileName: string,
  downloadToken: string,
  env: Pick<Env, 'B2_DOWNLOAD_URL'>,
) {
  const { downloadUrl } = getValidatedB2BaseUrls(env)
  return `${downloadUrl}/file/chronex/${fileName}?Authorization=${encodeURIComponent(downloadToken)}`
}

async function getBackblazeDownloadAuthorization(bucketId: string, fileName: string) {
  const authData = await authorizeB2Account()
  const { authorizationToken, apiInfo } = authData
  const apiUrl = apiInfo.storageApi.apiUrl

  const { authorizationToken: downloadToken } = await getDownloadAuthorization(
    authorizationToken,
    apiUrl,
    bucketId,
    fileName,
  )

  return downloadToken
}

export async function getBackblazeSignedUrlForFileName(
  fileName: string,
  bucketId: string,
  env: Pick<Env, 'B2_DOWNLOAD_URL'>,
): Promise<{ url: string; downloadToken: string }> {
  try {
    const downloadToken = await getBackblazeDownloadAuthorization(bucketId, fileName)
    return {
      url: buildAuthorizedDownloadUrl(fileName, downloadToken, env),
      downloadToken,
    }
  } catch (error) {
    throw new Error(`Error generating Backblaze signed URL: ${error}`)
  }
}

function extractBackblazeFileName(rawUrl: string): string | null {
  if (!rawUrl?.trim()) {
    return null
  }

  try {
    const url = new URL(rawUrl)

    if (url.pathname.includes('b2_download_file_by_id') || url.searchParams.has('fileId')) {
      return null
    }

    const pathMatch = url.pathname.match(/^\/file\/[^/]+\/(.+)$/)
    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1])
    }

    const pathname = url.pathname.replace(/^\/+/, '')
    return pathname ? decodeURIComponent(pathname) : null
  } catch {
    return null
  }
}

export async function getBackblazeSignedUrl(
  rawUrl: string,
  bucketId: string,
  env: Pick<Env, 'B2_DOWNLOAD_URL'>,
): Promise<{ url: string; downloadToken: string }> {
  try {
    const authData = await authorizeB2Account()
    const { authorizationToken, apiInfo } = authData
    const apiUrl = apiInfo.storageApi.apiUrl
    let fileName = extractBackblazeFileName(rawUrl)

    if (!fileName) {
      const url = new URL(rawUrl)
      const fileId = url.searchParams.get('fileId')
      if (!fileId) {
        throw new Error('fileId parameter missing from URL')
      }
      const fileInfo = await getFileInfo(authorizationToken, apiUrl, fileId)
      fileName = fileInfo.fileName
    }

    return getBackblazeSignedUrlForFileName(fileName, bucketId, env)
  } catch (error) {
    throw new Error(`Error generating Backblaze signed URL: ${error}`)
  }
}
