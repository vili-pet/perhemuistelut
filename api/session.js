import { handleNodeRequest } from '../bot/server.mjs'

export default async function handler(req, res) {
  req.url = '/api/session'
  await handleNodeRequest(req, res)
}
