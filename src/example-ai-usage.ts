import type { AiResponse } from "@effect/ai"
import { AiInput, AiLanguageModel } from "@effect/ai"
import { BunRuntime } from "@effect/platform-bun"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import { OllamaAiLanguageModelLive } from "./ollama/index.js"

// Example of using the Ollama AI Language Model with effect/ai

const exampleProgram = Effect.gen(function*() {
  const aiModel = yield* AiLanguageModel.AiLanguageModel

  // Simple text generation
  yield* Console.log("=== Simple Text Generation ===")
  const completion = yield* aiModel.generateText({
    prompt: AiInput.make(
      new AiInput.UserMessage({
        parts: [
          new AiInput.TextPart({
            text: "Complete this sentence: The benefits of functional programming include"
          })
        ]
      })
    )
  })
  yield* Console.log(completion.text)
  const finishPart = completion.parts.find((part) => part._tag === "FinishPart") as AiResponse.FinishPart | undefined
  yield* Console.log(`Tokens used: ${finishPart?.usage?.totalTokens}`)

  // Conversation with system message
  yield* Console.log("\n=== Conversation with Context ===")
  const chatResponse = yield* aiModel.generateText({
    system: "You are an Effect-TS expert. Provide concise, accurate answers about Effect-TS.",
    prompt: AiInput.make(
      new AiInput.UserMessage({
        parts: [new AiInput.TextPart({ text: "What is a Layer in Effect-TS?" })]
      })
    )
  })
  yield* Console.log(chatResponse.text)

  // Streaming response for real-time output
  yield* Console.log("\n=== Streaming Response ===")
  yield* aiModel.streamText({
    prompt: AiInput.make(
      new AiInput.UserMessage({
        parts: [
          new AiInput.TextPart({
            text: "Write a simple Effect-TS program that reads a file:"
          })
        ]
      })
    )
  }).pipe(
    Stream.tap((response) => {
      const textParts = response.parts.filter((part) => part._tag === "TextPart")
      const lastText = textParts[textParts.length - 1] as AiResponse.TextPart | undefined
      if (lastText) {
        return Effect.sync(() => process.stdout.write(lastText.text))
      }
      const finishPart = response.parts.find((part) => part._tag === "FinishPart")
      if (finishPart) {
        return Console.log("\n\nStreaming completed!")
      }
      return Effect.void
    }),
    Stream.runDrain
  )

  // Multi-turn conversation
  yield* Console.log("\n=== Multi-turn Conversation ===")
  const conversation = AiInput.make([
    new AiInput.UserMessage({
      parts: [new AiInput.TextPart({ text: "What is Effect.gen?" })]
    }),
    new AiInput.AssistantMessage({
      parts: [
        new AiInput.TextPart({
          text:
            "Effect.gen is a generator function syntax in Effect-TS that allows you to write asynchronous code in a synchronous style."
        })
      ]
    }),
    new AiInput.UserMessage({
      parts: [new AiInput.TextPart({ text: "Can you show me a simple example?" })]
    })
  ])

  const multiTurnResponse = yield* aiModel.generateText({
    prompt: conversation
  })
  yield* Console.log(multiTurnResponse.text)
})

// Run the example
exampleProgram.pipe(
  Effect.provide(OllamaAiLanguageModelLive),
  BunRuntime.runMain
)
