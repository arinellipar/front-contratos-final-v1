// src/lib/api/server-client.ts
import { headers } from "next/headers";

export async function serverFetch(endpoint: string, options?: RequestInit) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://fradema-backend-api-crguetd0f7gth9e3.brazilsouth-01.azurewebsites.net/api/v1";

  // Pegar cookies do request para forward
  const cookieStore = headers();

  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...options?.headers,
      Cookie: (await cookieStore).get("Cookie") || "",
    },
  });
}
