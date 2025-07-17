import * as Effect from "effect/Effect"
import { OllamaConfigurationProvider } from "./ollama.config.js"

export class OllamaService extends Effect.Service<OllamaService>()("OllamaService", {
  dependencies: [OllamaConfigurationProvider.Default],
  effect: Effect.gen(function*() {
    const config = yield* OllamaConfigurationProvider
    return {
      cof: config
    }
  })
}) {}
