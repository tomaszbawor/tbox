import { HttpApiBuilder, HttpApiSwagger, HttpMiddleware, HttpServer } from "@effect/platform"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer } from "effect"
import { Api } from "./api.js"
import { AppConfig, AppConfigLive } from "./config.js"
import { HealthGroupLive } from "./health/health.controller.js"
import { TelemetryLive } from "./telemetry.js"

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(HealthGroupLive) // Health Endpoints
)

const ServerLive = Layer.unwrapEffect(
  Effect.gen(function*() {
    const config = yield* AppConfig
    return BunHttpServer.layer({
      development: {
        console: true
      },
      port: config.port
    })
  })
).pipe(Layer.provide(AppConfigLive))

const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  HttpServer.withLogAddress, // Logs on what port we are listening too
  Layer.provide(HttpApiSwagger.layer()), // Swagger docs on {url}/docs endpoint
  Layer.provide(ApiLive),
  Layer.provide(ServerLive),
  Layer.provide(TelemetryLive.pipe(Layer.provide(AppConfigLive))) // OpenTelemetry layer
)

BunRuntime.runMain(Layer.launch(HttpLive))
