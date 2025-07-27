import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup, HttpServer } from "@effect/platform"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer, Schema } from "effect"

// api.heath
class HealthGroup extends HttpApiGroup.make("Health")
  .add(
    HttpApiEndpoint.get("get", "/")
      .addSuccess(Schema.String)
  )
{}

const Api = HttpApi.make("Api").add(HealthGroup)

const HealthGroupLive = HttpApiBuilder.group(Api, "Health", (handlers) =>
  Effect.gen(
    function*() {
      yield* Effect.logInfo("Health Group is Live")

      return handlers.handle("get", () => Effect.succeed("OK"))
    }
  ))

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(HealthGroupLive)
)

const HttpLive = HttpApiBuilder.serve().pipe(
  HttpServer.withLogAddress, // Logs on what port we are listening too
  Layer.provide(ApiLive),
  Layer.provide(BunHttpServer.layer({
    development: {
      console: true
    },
    port: 3333
  }))
)

BunRuntime.runMain(Layer.launch(HttpLive))
