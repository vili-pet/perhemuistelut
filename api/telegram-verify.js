import { handleNodeRequest } from '../bot/server.mjs'

export default async function handler(req, res) {
  req.url = '/api/telegram-verify'
  await handleNodeRequest(req, res)
}
