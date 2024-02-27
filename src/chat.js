import { openai } from './openai.js'
import redaline from 'node:readline'

const rl = redaline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const newMessage = async (message, history) => {
  const result = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [...history, message],
    temperature: 2,
  })
  return result.choices[0].message
}

const formatMessage = (userInput) => ({ role: 'user', content: userInput })

const chat = () => {
  const history = [
    {
      role: 'system',
      content:
        'you are an ai assistant, answer any questions to the best of your ability',
    },
  ]
  const start = () => {
    rl.question('You: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        rl.close()
        return
      }
      const message = formatMessage(userInput)
      const response = await newMessage(message, history)
      history.push(message, response)
      console.log(`\n\nAI:${response.content}`)
      start()
    })
  }
  start()
}
console.log("Chatbot initialized. Type 'exit' to end the chat.")
chat()
