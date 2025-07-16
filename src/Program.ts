import * as Effect from "effect/Effect"

const program = Effect.gen(function*() {
  yield* Effect.logInfo("Starting program ...")
  // Implement content

  yield* Effect.logInfo("Finishing program ...")
})

Effect.runPromise(program)
