import { BunRuntime } from "@effect/platform-bun"
import * as Effect from "effect/Effect"

const program = Effect.gen(function*() {
  yield* Effect.logInfo("Starting program ...")

  // Do magic

  yield* Effect.logInfo("Finishing program ...")
})

BunRuntime.runMain(program)
