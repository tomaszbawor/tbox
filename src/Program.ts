import type { AiResponse } from "@effect/ai"
import { AiInput, AiLanguageModel } from "@effect/ai"
import { BunRuntime } from "@effect/platform-bun"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import { OllamaAiLanguageModelLive, OllamaService } from "./ollama/ollama.service.js"

const program = Effect.gen(function*() {
  yield* Effect.logInfo("Starting program ...")

  const ollama = yield* OllamaService
  const aiModel = yield* AiLanguageModel.AiLanguageModel

  yield* Effect.logInfo("Ollama service loaded", ollama.config)

  // Example 1: Simple text generation
  yield* Effect.logInfo("Testing text generation...")
  const completion = yield* aiModel.generateText({
    system: "You are a helpful AI assistant.",
    prompt: AiInput.make(
      new AiInput.UserMessage({
        parts: [new AiInput.TextPart({ text: "Write a haiku about Effect-TS:" })]
      })
    )
  })
  yield* Console.log("Generated text:", completion.text)

  // Example 2: Chat conversation
  yield* Effect.logInfo("Testing conversation...")
  const chatResponse = yield* aiModel.generateText({
    system: "You are a helpful TypeScript expert.",
    prompt: AiInput.make(
      new AiInput.UserMessage({
        parts: [new AiInput.TextPart({ text: "What is Effect-TS and why should I use it?" })]
      })
    )
  })
  yield* Console.log("Response:", chatResponse.text)

  // Example 3: Streaming text generation
  yield* Effect.logInfo("Testing streaming...")
  const streamingResponse = aiModel.streamText({
    prompt: AiInput.make(
      new AiInput.UserMessage({
        parts: [new AiInput.TextPart({ text: "List 3 benefits of using Effect-TS:" })]
      })
    )
  })

  yield* streamingResponse.pipe(
    Stream.tap((response) => {
      const text = response.parts
        .filter((part) => part._tag === "TextPart")
        .map((part) => (part as AiResponse.TextPart).text)
        .join("")
      if (text) {
        return Effect.sync(() => process.stdout.write(text))
      }
      return Effect.void
    }),
    Stream.runDrain
  )

  yield* Effect.logInfo("\nFinishing program ...")
})

const application = program.pipe(
  Effect.provide(OllamaService.Default),
  Effect.provide(OllamaAiLanguageModelLive)
)

BunRuntime.runMain(application)
