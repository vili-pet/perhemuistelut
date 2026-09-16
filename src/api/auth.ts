export function bearerHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }
  return headers
}

export function jsonHeaders(apiKey?: string): HeadersInit {
  return {
    ...bearerHeaders(apiKey),
    'Content-Type': 'application/json',
  }
}
