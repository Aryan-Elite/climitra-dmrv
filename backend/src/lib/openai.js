const OpenAI = require('openai')

let _client = null

function getOpenAI() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

module.exports = getOpenAI
