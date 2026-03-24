import { Buffer } from 'node:buffer'

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

export async function getBackblazeSignedUrl(rawUrl: string, bucketId: string): Promise<string> {
  try {
    const authData = await authorizeB2Account()
    const { authorizationToken, apiInfo } = authData
    const downloadUrl = apiInfo.storageApi.downloadUrl
    const apiUrl = apiInfo.storageApi.apiUrl
    const bucketName = 'chronex'

    const url = new URL(rawUrl)
    let fileName: string

    // Detect URL format: fileId-based vs friendly URL
    if (url.pathname.includes('b2_download_file_by_id') || url.searchParams.has('fileId')) {
      // fileId-based URL: e.g. .../b2api/v3/b2_download_file_by_id?fileId=XXXX
      const fileId = url.searchParams.get('fileId')
      if (!fileId) {
        throw new Error('fileId parameter missing from URL')
      }
      const fileInfo = await getFileInfo(authorizationToken, apiUrl, fileId)
      fileName = fileInfo.fileName
    } else {
      // Friendly URL: e.g. .../file/bucket-name/path/to/file.jpg
      const pathMatch = url.pathname.match(/^\/file\/[^/]+\/(.+)$/)
      if (pathMatch) {
        fileName = pathMatch[1]
      } else {
        fileName = url.pathname.replace(/^\//, '')
      }
    }

    const { authorizationToken: downloadToken } = await getDownloadAuthorization(
      authorizationToken,
      apiUrl,
      bucketId,
      fileName,
    )

    return `${downloadUrl}/file/${bucketName}/${fileName}?Authorization=${encodeURIComponent(downloadToken)}`
  } catch (error) {
    throw new Error(`Error generating Backblaze signed URL: ${error}`)
  }
}
