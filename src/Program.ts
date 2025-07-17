import { BunRuntime } from "@effect/platform-bun"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

const program = Effect.gen(function*() {
  yield* Effect.logInfo("Starting program ...")
  // Implement content
  const repo = yield* ExampleService
  yield* repo.getZiombel().pipe(
    Effect.flatMap((x) => Effect.logInfo("Got data: ", x))
  )

  yield* Effect.logInfo("Finishing program ...")
})

export class ExampleRepository extends Effect.Service<ExampleRepository>()(
  "ExampleRepository",
  {
    effect: Effect.gen(function*() {
      return {
        getAll: () => Effect.succeed(12)
      }
    })
  }
) {
}

export class ExampleService extends Effect.Service<ExampleService>()("MenelService", {
  dependencies: [ExampleRepository.Default],
  effect: Effect.fn(function*() {
    const repo = yield* ExampleRepository

    return {
      getZiombel: () => {
        // @ts-ignore
        // @ts-ignore
        return repo.getAll().pipe(
          Effect.tap(
            (x) => {
              Effect.runSync(Effect.logInfo("I just got: ", x))
            }
          )
        )
      }
    }
  })
}) {}

const AppLayer = Layer.merge(
  ExampleService.Default(),
  ExampleRepository.Default
)

const r = program.pipe(
  Effect.provide(AppLayer)
)

BunRuntime.runMain(r)
