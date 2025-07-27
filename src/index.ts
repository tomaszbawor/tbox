import { HttpApiBuilder, HttpApiSwagger, HttpMiddleware, HttpServer } from "@effect/platform"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Layer } from "effect"
import { Api } from "./api.js"
import { HealthGroupLive } from "./health/health.controller.js"
import { TelemetryLive } from "./telemetry.js"

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(HealthGroupLive) // Health Endpoints
)

const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  HttpServer.withLogAddress, // Logs on what port we are listening too
  Layer.provide(HttpApiSwagger.layer()), // Swagger docs on {url}/docs endpoint
  Layer.provide(ApiLive),
  Layer.provide(BunHttpServer.layer({
    development: {
      console: true
    },
    port: 3030
  })),
  Layer.provide(TelemetryLive) // OpenTelemetry layer
)

BunRuntime.runMain(Layer.launch(HttpLive))
