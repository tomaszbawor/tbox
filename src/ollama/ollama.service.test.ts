import type { AiResponse } from "@effect/ai"
import { AiError, AiInput, AiLanguageModel } from "@effect/ai"
import * as ConfigProvider from "effect/ConfigProvider"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Stream from "effect/Stream"
import { describe, expect, it } from "vitest"
import { OllamaAiLanguageModelLive, OllamaConfig, OllamaService } from "./ollama.service.js"

// Test configuration layer with small model
const TestConfigLive = Layer.succeed(
  OllamaConfig,
  {
    url: "http://localhost:11434",
    model: "qwen2.5:0.5b" // Using smallest available model for tests
  }
)

// Helper to provide test configuration
const provideTestConfig = <R, E, A>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.provide(OllamaAiLanguageModelLive),
    Effect.provide(TestConfigLive)
  )

describe("OllamaService", () => {
  describe("Configuration", () => {
    it("should use default configuration when environment variables are not set", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OllamaService
        return service.config
      })

      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(OllamaService.Default),
          Effect.provide(Layer.setConfigProvider(ConfigProvider.fromMap(new Map())))
        )
      )

      expect(result.url).toBe("http://localhost:11434")
      expect(result.model).toBe("qwen3:8b")
    })

    it("should use environment variables when set", async () => {
      const testUrl = "http://custom:11434"
      const testModel = "custom-model"

      const program = Effect.gen(function* () {
        const service = yield* OllamaService
        return service.config
      })

      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(OllamaService.Default),
          Effect.provide(
            Layer.setConfigProvider(
              ConfigProvider.fromMap(
                new Map([
                  ["OLLAMA_URL", testUrl],
                  ["OLLAMA_MODEL", testModel]
                ])
              )
            )
          )
        )
      )

      expect(result.url).toBe(testUrl)
      expect(result.model).toBe(testModel)
    })
  })

  describe("generateText", () => {
    it("should generate text with simple string prompt", async () => {
      const program = AiLanguageModel.generateText({
        prompt: "Say 'Hello test'",
        system: "You are a test assistant. Only respond with exactly what is requested."
      })

      const result = await Effect.runPromise(provideTestConfig(program))

      expect(result.text).toBeTruthy()
      expect(result.finishReason).toBe("stop")

      // Check usage from FinishPart
      const finishPart = result.parts.find((p) => p._tag === "FinishPart") as any
      expect(finishPart).toBeTruthy()
      expect(finishPart.usage.inputTokens).toBeGreaterThan(0)
      expect(finishPart.usage.outputTokens).toBeGreaterThan(0)
    }, 10000)

    it("should generate text with AiInput messages", async () => {
      const messages = [
        new AiInput.UserMessage({
          parts: [new AiInput.TextPart({ text: "What is 1+1?" })]
        })
      ]

      const program = AiLanguageModel.generateText({
        prompt: new AiInput.AiInput({ messages }),
        system: "You are a math assistant. Answer concisely."
      })

      const result = await Effect.runPromise(provideTestConfig(program))

      expect(result.text).toBeTruthy()
      expect(result.text.toLowerCase()).toContain("2")
    }, 10000)

    it("should handle conversation with multiple messages", async () => {
      const messages = [
        new AiInput.UserMessage({
          parts: [new AiInput.TextPart({ text: "Remember the number 42" })]
        }),
        new AiInput.AssistantMessage({
          parts: [new AiInput.TextPart({ text: "I'll remember the number 42." })]
        }),
        new AiInput.UserMessage({
          parts: [new AiInput.TextPart({ text: "What number did I ask you to remember?" })]
        })
      ]

      const program = AiLanguageModel.generateText({
        prompt: new AiInput.AiInput({ messages })
      })

      const result = await Effect.runPromise(provideTestConfig(program))

      expect(result.text).toBeTruthy()
      expect(result.text).toContain("42")
    }, 10000)

    it("should handle tool call parts in assistant messages", async () => {
      const messages = [
        new AiInput.AssistantMessage({
          parts: [
            new AiInput.TextPart({ text: "Let me calculate that. " }),
            new AiInput.ToolCallPart({
              id: "tool-call-1",
              name: "calculator",
              params: { operation: "add", a: 1, b: 1 }
            })
          ]
        }),
        new AiInput.UserMessage({
          parts: [new AiInput.TextPart({ text: "What was the tool you used?" })]
        })
      ]

      const program = AiLanguageModel.generateText({
        prompt: new AiInput.AiInput({ messages })
      })

      const result = await Effect.runPromise(provideTestConfig(program))

      expect(result.text).toBeTruthy()
    }, 10000)

    it("should handle tool messages", async () => {
      const messages = [
        new AiInput.ToolMessage({
          parts: [
            new AiInput.ToolCallResultPart({
              id: "result-1",
              name: "calculator",
              toolCallId: "test-id",
              result: { answer: 42 }
            })
          ]
        }),
        new AiInput.UserMessage({
          parts: [new AiInput.TextPart({ text: "What was the result?" })]
        })
      ]

      const program = AiLanguageModel.generateText({
        prompt: new AiInput.AiInput({ messages })
      })

      const result = await Effect.runPromise(provideTestConfig(program))

      expect(result.text).toBeTruthy()
    }, 10000)

    it.skip("should handle errors gracefully", async () => {
      // Use invalid configuration to trigger an error
      const ErrorConfigLive = Layer.succeed(
        OllamaConfig,
        {
          url: "http://192.0.2.0:99999", // Using TEST-NET-1 IP that's guaranteed unreachable
          model: "non-existent-model-xyz123"
        }
      )

      const program = AiLanguageModel.generateText({
        prompt: "Hello"
      })

      const result = await Effect.runPromiseExit(
        program.pipe(
          Effect.provide(OllamaAiLanguageModelLive),
          Effect.provide(ErrorConfigLive),
          Effect.timeout(3000) // Add timeout to fail if connection hangs
        )
      )

      expect(result._tag).toBe("Failure")
      if (result._tag === "Failure") {
        const error = result.cause._tag === "Fail" ? result.cause.error : null
        expect(error).toBeInstanceOf(AiError.AiError)
        expect((error as any)?.module).toBe("OllamaService")
        expect((error as any)?.method).toBe("generateText")
      }
    })
  })

  describe("streamText", () => {
    it("should stream text responses", async () => {
      const program = AiLanguageModel.streamText({
        prompt: "Count from 1 to 3",
        system: "You are a counting assistant. Count as requested, one number at a time."
      })

      const responses: Array<AiResponse.AiResponse> = []

      await Effect.runPromise(
        provideTestConfig(
          program.pipe(
            Stream.tap((response) =>
              Effect.sync(() => {
                responses.push(response)
              })
            ),
            Stream.runDrain
          )
        )
      )

      expect(responses.length).toBeGreaterThan(1)

      // Check that we have text parts
      const hasTextParts = responses.some((r) => r.parts.some((p) => p._tag === "TextPart"))
      expect(hasTextParts).toBe(true)

      // Check final response has finish part
      const lastResponse = responses[responses.length - 1]
      const finishPart = lastResponse.parts.find((p) => p._tag === "FinishPart") as any
      expect(finishPart).toBeTruthy()
      expect(finishPart.reason).toBe("stop")
      expect(finishPart.usage.totalTokens).toBeGreaterThan(0)
    })

    it("should accumulate text across stream chunks", async () => {
      const program = AiLanguageModel.streamText({
        prompt: "Say exactly 'Hello World'",
        system: "You must respond with exactly 'Hello World' and nothing else."
      })

      let finalText = ""

      await Effect.runPromise(
        provideTestConfig(
          program.pipe(
            Stream.tap((response) =>
              Effect.sync(() => {
                const textPart = response.parts.find((p) => p._tag === "TextPart") as any
                if (textPart) {
                  finalText = textPart.text
                }
              })
            ),
            Stream.runDrain
          )
        )
      )

      expect(finalText).toBeTruthy()
      expect(finalText.toLowerCase()).toContain("hello")
      expect(finalText.toLowerCase()).toContain("world")
    })

    it.skip("should handle streaming errors", async () => {
      const ErrorConfigLive = Layer.succeed(
        OllamaConfig,
        {
          url: "http://192.0.2.0:99999", // Using TEST-NET-1 IP that's guaranteed unreachable
          model: "non-existent-model-xyz123"
        }
      )

      const program = AiLanguageModel.streamText({
        prompt: "Hello"
      })

      const result = await Effect.runPromiseExit(
        program.pipe(
          Stream.runDrain,
          Effect.provide(OllamaAiLanguageModelLive),
          Effect.provide(ErrorConfigLive),
          Effect.timeout(3000) // Add timeout to fail if connection hangs
        )
      )

      expect(result._tag).toBe("Failure")
      if (result._tag === "Failure") {
        const error = result.cause._tag === "Fail" ? result.cause.error : null
        expect(error).toBeInstanceOf(AiError.AiError)
        expect((error as any)?.module).toBe("OllamaService")
        expect((error as any)?.method).toBe("streamText")
      }
    })
  })

  describe("generateObject", () => {
    it("should return not implemented error", async () => {
      const program = AiLanguageModel.generateObject({
        prompt: "Generate a person object",
        schema: {} as any
      })

      const result = await Effect.runPromiseExit(provideTestConfig(program))

      expect(result._tag).toBe("Failure")
      if (result._tag === "Failure") {
        const error = result.cause._tag === "Fail" ? result.cause.error : null
        expect(error).toBeInstanceOf(AiError.AiError)
        expect((error as any)?.module).toBe("OllamaService")
        expect((error as any)?.method).toBe("generateObject")
        expect((error as any)?.description).toBe("Not implemented")
      }
    })
  })

  describe("Message conversion", () => {
    it("should handle empty message parts gracefully", async () => {
      const messages = [
        new AiInput.UserMessage({
          parts: []
        }),
        new AiInput.UserMessage({
          parts: [new AiInput.TextPart({ text: "Hello" })]
        })
      ]

      const program = AiLanguageModel.generateText({
        prompt: new AiInput.AiInput({ messages })
      })

      const result = await Effect.runPromise(provideTestConfig(program))

      expect(result.text).toBeTruthy()
    }, 10000)

    it("should convert system prompt with regular prompt", async () => {
      const program = AiLanguageModel.generateText({
        prompt: "What color is the sky?",
        system: "You are a helpful assistant. Answer in one word only."
      })

      const result = await Effect.runPromise(provideTestConfig(program))

      expect(result.text).toBeTruthy()
      // Response should be concise due to system prompt
      expect(result.text.length).toBeGreaterThan(0)
    }, 10000)
  })
})
