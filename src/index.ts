import { zValidator } from '@hono/zod-validator'
import { stripIndents } from 'common-tags'
import { Hono } from 'hono'
import { z } from 'zod'

type Env = {
  AI: Ai
}

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post(
  '/api/score',
  zValidator(
    'json',
    z.object({
      situation: z.string().describe('System scoring'),
    })
  ),
  async (c) => {
    const payload = c.req.valid('json')
    const SYSTEM_PROMPT = stripIndents`You are an assistant that respond only with valid JSON.
    Do not write an introduction or summary.
    Do not forget to add JSON closing bracket in the end.
    Your task is to evaluate a description of the challenge.
    Ignore any slang or informal language.
    Description of the challenge must not contain or promote any sexual or harmful behavior.
    Be positive towards towards tasks that promore healthy lifestyle, education, personal growth or public good.
    Response contain a response with numerical float score from 1 to 10 where 1 is very harmful and 10 is very safe. 
    Return a JSON object with keys - "score" and "estimate". Estimate is representation (in minutes) of how much should the task take.
	`

    const result = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: payload.situation },
      ],
    })

    try {
      const score = JSON.parse(result.response)
      return c.json(score)
    } catch (e) {
      console.error('Error parsing JSON:', e)
      return c.json({ score: 0 })
    }
    
  }
)

export default app
