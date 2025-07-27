import type { AiInput } from "@effect/ai"
import { AiError, AiLanguageModel, AiResponse } from "@effect/ai"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import { Ollama } from "ollama"

// Configuration Schema
const _OllamaConfigSchema = Schema.Struct({
  url: Schema.String,
  model: Schema.String
})

export type OllamaConfigData = Schema.Schema.Type<typeof _OllamaConfigSchema>

// Configuration Service
export class OllamaConfig extends Effect.Service<OllamaConfig>()("OllamaConfig", {
  effect: Effect.gen(function* () {
    const url = yield* Config.string("OLLAMA_URL").pipe(
      Config.withDefault("http://localhost:11434")
    )
    const model = yield* Config.string("OLLAMA_MODEL").pipe(
      Config.withDefault("qwen3:8b")
    )

    const config: OllamaConfigData = {
      url,
      model
    }
    return config
  })
}) { }

// Main Ollama Service
export class OllamaService extends Effect.Service<OllamaService>()("OllamaService", {
  dependencies: [OllamaConfig.Default],
  effect: Effect.gen(function* () {
    const config = yield* OllamaConfig
    const ollama = new Ollama({ host: config.url })

    const makeError = (method: string, error: unknown) =>
      new AiError.AiError({
        module: "OllamaService",
        method,
        description: String(error)
      })

    // Convert AiInput messages to Ollama chat format
    const convertToOllamaMessages = (input: AiInput.AiInput | string, system: string | undefined) => {
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = []

      // Add system message if provided
      if (system) {
        messages.push({ role: "system", content: system })
      }

      // Handle string prompt
      if (typeof input === "string") {
        messages.push({ role: "user", content: input })
        return messages
      }

      // Check if it has messages property (could be plain object)
      if (!input.messages) {
        throw new Error("Invalid input: expected string or AiInput with messages")
      }

      // Convert each message
      for (const message of input.messages) {
        if (!message) continue // Skip undefined messages

        let content = ""
        let role: "system" | "user" | "assistant" = "user"

        try {
          if (message._tag === "UserMessage") {
            role = "user"
            // Extract text from parts
            for (const part of message.parts) {
              if (!part) continue // Skip undefined parts
              if (part._tag === "TextPart") {
                content += part.text
              }
            }
          } else if (message._tag === "AssistantMessage") {
            role = "assistant"
            // Extract text from parts
            for (const part of message.parts) {
              if (!part) continue // Skip undefined parts
              if (part._tag === "TextPart") {
                content += part.text
              } else if (part._tag === "ToolCallPart") {
                // For now, we'll include tool calls as text
                content += `[Tool Call: ${part.name}(${JSON.stringify(part.params)})]`
              }
            }
          } else if (message._tag === "ToolMessage") {
            // Tool messages are responses from tools, we'll treat them as assistant messages
            role = "assistant"
            for (const part of message.parts) {
              if (!part) continue // Skip undefined parts
              if (part._tag === "ToolCallResultPart") {
                content += `[Tool Result: ${JSON.stringify(part.result)}]`
              }
            }
          }

          if (content) {
            messages.push({ role, content })
          }
        } catch (err) {
          throw err
        }
      }

      return messages
    }

    return {
      config,
      ollama,
      generateText: (options: any) =>
        Effect.tryPromise({
          try: async () => {
            try {
              const messages = convertToOllamaMessages(options.prompt, options.system)

              const response = await ollama.chat({
                model: config.model,
                messages,
                stream: false
              })

              return new AiResponse.AiResponse({
                parts: [
                  new AiResponse.TextPart({
                    text: response.message.content
                  }),
                  new AiResponse.FinishPart({
                    reason: "stop",
                    usage: new AiResponse.Usage({
                      inputTokens: response.prompt_eval_count ?? 0,
                      outputTokens: response.eval_count ?? 0,
                      totalTokens: (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),
                      reasoningTokens: 0,
                      cacheReadInputTokens: 0,
                      cacheWriteInputTokens: 0
                    }),
                    providerMetadata: {}
                  })
                ]
              })
            } catch (innerError) {
              throw innerError
            }
          },
          catch: (error) => makeError("generateText", error)
        }),
      streamText: (options: any) =>
        Stream.fromAsyncIterable(
          (async function* () {
            try {
              const messages = convertToOllamaMessages(options.prompt, options.system)

              const response = await ollama.chat({
                model: config.model,
                messages,
                stream: true
              })

              let accumulatedText = ""
              let promptTokens = 0
              let completionTokens = 0

              for await (const part of response) {
                if (part.message?.content) {
                  accumulatedText += part.message.content
                  yield new AiResponse.AiResponse({
                    parts: [
                      new AiResponse.TextPart({
                        text: accumulatedText
                      })
                    ]
                  })
                }

                // Capture token counts if available
                if (part.prompt_eval_count) promptTokens = part.prompt_eval_count
                if (part.eval_count) completionTokens = part.eval_count
              }

              // Final response with finish reason
              yield new AiResponse.AiResponse({
                parts: [
                  new AiResponse.TextPart({
                    text: accumulatedText
                  }),
                  new AiResponse.FinishPart({
                    reason: "stop",
                    usage: new AiResponse.Usage({
                      inputTokens: promptTokens,
                      outputTokens: completionTokens,
                      totalTokens: promptTokens + completionTokens,
                      reasoningTokens: 0,
                      cacheReadInputTokens: 0,
                      cacheWriteInputTokens: 0
                    }),
                    providerMetadata: {}
                  })
                ]
              })
            } catch (error) {
              throw makeError("streamText", error)
            }
          })(),
          (error) => makeError("streamText", error)
        )
    }
  })
}) { }

// Create the AiLanguageModel implementation from OllamaService
export const OllamaAiLanguageModel = Effect.gen(function* () {
  const service = yield* OllamaService

  return {
    generateText: service.generateText,
    streamText: service.streamText,
    generateObject: () =>
      Effect.fail(
        new AiError.AiError({
          module: "OllamaService",
          method: "generateObject",
          description: "Not implemented"
        })
      )
  } as any
})

// Layer for providing OllamaService as AiLanguageModel
export const OllamaAiLanguageModelLive = Layer.effect(
  AiLanguageModel.AiLanguageModel,
  OllamaAiLanguageModel
).pipe(
  Layer.provide(OllamaService.Default)
)
