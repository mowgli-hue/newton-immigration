const externalBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

function normalize(path: string) {
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

export function apiUrl(path: string) {
  const p = normalize(path);
  if (externalBase) return `${externalBase}${p}`;
  return `/api${p}`;
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), {
    ...init,
    credentials: "include"
  });
}
