import { AiLanguageModel } from "@effect/ai"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { OllamaAiLanguageModel } from "./ai-language-model.js"
import { OllamaConfig } from "./ollama.config.js"

export class OllamaService extends Effect.Service<OllamaService>()("OllamaService", {
  dependencies: [OllamaConfig.Default],
  effect: Effect.gen(function*() {
    const config = yield* OllamaConfig

    return {
      config
    }
  })
}) {}

export const OllamaAiLanguageModelLive = Layer.effect(
  AiLanguageModel.AiLanguageModel,
  OllamaAiLanguageModel
).pipe(
  Layer.provide(OllamaConfig.Default)
)
