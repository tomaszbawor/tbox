import { AiInput, AiLanguageModel } from "@effect/ai"
import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import { OllamaAiLanguageModelLive } from "./index.js"

// Example 1: Simple text generation
const testGenerateText = AiLanguageModel.generateText({
  prompt: "What is the capital of France?",
  system: "You are a helpful assistant. Answer concisely."
})

// Example 2: Using AiInput for conversation
const messages = [
  new AiInput.UserMessage({
    parts: [new AiInput.TextPart({ text: "Hello, who are you?" })]
  }),
  new AiInput.AssistantMessage({
    parts: [new AiInput.TextPart({ text: "I am an AI assistant powered by Ollama." })]
  }),
  new AiInput.UserMessage({
    parts: [new AiInput.TextPart({ text: "What can you help me with?" })]
  })
]

const testConversation = AiLanguageModel.generateText({
  prompt: new AiInput.AiInput({ messages })
})

// Example 3: Streaming text generation
const testStreamText = AiLanguageModel.streamText({
  prompt: "Write a short story about a robot.",
  system: "You are a creative writer."
})

// Run the examples
const program = Effect.gen(function*() {
  console.log("Test 1: Simple text generation")
  const result1 = yield* testGenerateText
  console.log("Response:", result1.text)
  console.log("Finish reason:", result1.finishReason)
  console.log()

  console.log("Test 2: Conversation")
  const result2 = yield* testConversation
  console.log("Response:", result2.text)
  console.log()

  console.log("Test 3: Streaming text")
  yield* testStreamText.pipe(
    Stream.tap((response) =>
      Effect.sync(() => {
        process.stdout.write(response.text.slice(response.text.lastIndexOf("\n") + 1))
      })
    ),
    Stream.runDrain
  )
  console.log("\n\nStreaming complete!")
})

// Execute the program with the Ollama provider
Effect.runPromise(
  program.pipe(
    Effect.provide(OllamaAiLanguageModelLive)
  )
).catch(console.error)
