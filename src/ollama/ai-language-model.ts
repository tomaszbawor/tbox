import type { AiInput } from "@effect/ai"
import { AiError, AiLanguageModel, AiResponse } from "@effect/ai"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Stream from "effect/Stream"
import { Ollama } from "ollama"
import { OllamaConfig } from "./ollama.config.js"

export const OllamaAiLanguageModel = Effect.gen(function*() {
  const config = yield* OllamaConfig
  const ollama = new Ollama({ host: config.url })

  const makeError = (method: string, error: unknown) =>
    new AiError.AiError({
      module: "OllamaAiLanguageModel",
      method,
      description: String(error)
    })

  // Convert AiInput messages to Ollama chat format
  const convertToOllamaMessages = (input: AiInput.AiInput, system: string | undefined) => {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = []

    // Add system message if provided
    if (system) {
      messages.push({ role: "system", content: system })
    }

    // Convert each message
    for (const message of input.messages) {
      let content = ""
      let role: "system" | "user" | "assistant" = "user"

      if (message._tag === "UserMessage") {
        role = "user"
        // Extract text from parts
        for (const part of message.parts) {
          if (part._tag === "TextPart") {
            content += part.text
          }
        }
      } else if (message._tag === "AssistantMessage") {
        role = "assistant"
        // Extract text from parts
        for (const part of message.parts) {
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
          if (part._tag === "ToolCallResultPart") {
            content += `[Tool Result: ${JSON.stringify(part.result)}]`
          }
        }
      }

      if (content) {
        messages.push({ role, content })
      }
    }

    return messages
  }

  return yield* AiLanguageModel.make({
    generateText: (options) =>
      Effect.tryPromise({
        try: async () => {
          const messages = convertToOllamaMessages(options.prompt, Option.getOrUndefined(options.system))

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
        },
        catch: (error) => makeError("generateText", error)
      }),

    streamText: (options) =>
      Stream.fromAsyncIterable(
        (async function*() {
          try {
            const messages = convertToOllamaMessages(options.prompt, Option.getOrUndefined(options.system))

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
  })
})
