import { BunRuntime } from "@effect/platform-bun"
import * as Effect from "effect/Effect"
import { OllamaService } from "./ollama/ollama.service.js"

const program = Effect.gen(function*() {
  yield* Effect.logInfo("Starting program ...")

  const os = yield* OllamaService
  yield* Effect.logInfo("Just got configuration", os)

  // Do magic
  yield* Effect.logInfo("Finishing program ...")
})

const application = program.pipe(
  Effect.provide(OllamaService.Default)
)

BunRuntime.runMain(application)
