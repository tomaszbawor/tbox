import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"

const OllamaConfig = Schema.Struct({
  url: Schema.String,
  model: Schema.String
})

type OllamaConfig = Schema.Schema.Type<typeof OllamaConfig>

export class OllamaConfigurationProvider
  extends Effect.Service<OllamaConfigurationProvider>()("OllamaConfigurationProvider", {
    effect: Effect.gen(function*() {
      const url = yield* Config.string("OLLAMA_URL").pipe(
        Config.withDefault("http://localhost:11434")
      )
      const model = yield* Config.string("OLLAMA_MODEL").pipe(
        Config.withDefault("qwen3:32b")
      )

      const config: OllamaConfig = {
        url,
        model
      }
      return config
    })
  })
{}
