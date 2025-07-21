import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"

const _OllamaConfigSchema = Schema.Struct({
  url: Schema.String,
  model: Schema.String
})

export type OllamaConfig = Schema.Schema.Type<typeof _OllamaConfigSchema>

export class OllamaConfig extends Effect.Service<OllamaConfig>()("OllamaConfig", {
  effect: Effect.gen(function*() {
    const url = yield* Config.string("OLLAMA_URL").pipe(
      Config.withDefault("http://localhost:11434")
    )
    const model = yield* Config.string("OLLAMA_MODEL").pipe(
      Config.withDefault("qwen3:8b")
    )

    const config: OllamaConfig = {
      url,
      model
    }
    return config
  })
}) {}
