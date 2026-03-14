import { Buffer } from "node:buffer";

const BACKBLAZE_CREDENTIALS = {
  applicationKeyId: "ffbf175d7c5c",
  applicationKey: "005caf7f5180b9afe72ee36a1d1d9df8d2eec61504"
};

interface B2AuthResponse {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  apiInfo: {
    storageApi: {
        downloadUrl: string;
        apiUrl: string;
    }
  },
 
  };



interface B2DownloadAuthResponse {
  authorizationToken: string;
}


async function authorizeB2Account(): Promise<B2AuthResponse> {
  const credentials = Buffer.from(
    `${BACKBLAZE_CREDENTIALS.applicationKeyId}:${BACKBLAZE_CREDENTIALS.applicationKey}`,
  ).toString("base64");

  const response = await fetch(
    "https://api.backblazeb2.com/b2api/v3/b2_authorize_account",
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`B2 authorization failed: ${response.statusText}`);
  }

  return response.json() as Promise<B2AuthResponse>;
}




















async function getDownloadAuthorization(authToken: string, apiUrl: any, bucketId: string, fileNamePrefix: string, validDurationSeconds = 3600):Promise<B2DownloadAuthResponse> {
  const response = await fetch(
    `${apiUrl}/b2api/v3/b2_get_download_authorization`,
    {
      method: "POST",
      headers: {
        Authorization: authToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bucketId,
        fileNamePrefix,
        validDurationInSeconds: validDurationSeconds,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get download auth: ${response.statusText}`);
  }
  return response.json(); 
}
export async function getBackblazeSignedUrl(
  rawUrl: string,
  bucketId :string,
): Promise<string> {
 try {
    
    const { authorizationToken, apiInfo } = await authorizeB2Account();
    const downloadUrl = apiInfo.storageApi.downloadUrl;

    
    const url = new URL(rawUrl);
    const fileNamePrefix = url.pathname.replace(/^\/file\/[^/]+\//, ""); 

    
    const { authorizationToken: downloadToken } = await getDownloadAuthorization(
      authorizationToken,
      apiInfo.storageApi.apiUrl,
      bucketId,
      fileNamePrefix
    );

    
    const signedUrl = `${downloadUrl}${url.pathname}?Authorization=${encodeURIComponent(downloadToken)}`;
    return signedUrl;

  } catch (error) {
    throw new Error(`Error generating Backblaze signed URL: ${error}`);
  }
}