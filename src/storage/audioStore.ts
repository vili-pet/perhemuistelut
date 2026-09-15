const DB_NAME = 'perhemuistelut-audio'
const DB_VERSION = 1
const STORE = 'clips'

export interface StoredAudioClip {
  id: string
  blob: Blob
  mimeType: string
  createdAt: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB ei ole käytettävissä.'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB-virhe'))
  })
}

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

export async function saveAudioClip(clip: StoredAudioClip): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Äänen tallennus epäonnistui'))
    tx.objectStore(STORE).put(clip)
  })
  db.close()
}

export async function getAudioClip(id: string): Promise<StoredAudioClip | undefined> {
  const db = await openDb()
  const clip = await new Promise<StoredAudioClip | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).get(id)
    request.onsuccess = () => resolve(request.result as StoredAudioClip | undefined)
    request.onerror = () => reject(request.error ?? new Error('Äänen haku epäonnistui'))
  })
  db.close()
  return clip
}

export async function deleteAudioClip(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Äänen poisto epäonnistui'))
    tx.objectStore(STORE).delete(id)
  })
  db.close()
}

export async function deleteAudioClips(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Äänien poisto epäonnistui'))
    const store = tx.objectStore(STORE)
    for (const id of ids) {
      store.delete(id)
    }
  })
  db.close()
}

export async function createObjectUrl(id: string): Promise<string | undefined> {
  const clip = await getAudioClip(id)
  if (!clip) return undefined
  return URL.createObjectURL(clip.blob)
}
