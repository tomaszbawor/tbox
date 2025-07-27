import { Schema } from "@effect/schema"
import { Config, Context, Effect, Layer } from "effect"

export const AppConfigSchema = Schema.Struct({
  port: Schema.Number.pipe(
    Schema.int(),
    Schema.positive(),
    Schema.annotations({
      title: "Port",
      description: "The port number the application will listen on",
      examples: [3000, 8080]
    })
  ),
  telemetry: Schema.Struct({
    serviceName: Schema.String.pipe(
      Schema.minLength(1),
      Schema.annotations({
        title: "Service Name",
        description: "The name of the service for telemetry",
        examples: ["tbox-api", "my-service"]
      })
    ),
    serviceVersion: Schema.String.pipe(
      Schema.minLength(1),
      Schema.annotations({
        title: "Service Version",
        description: "The version of the service",
        examples: ["1.0.0", "2.1.3"]
      })
    ),
    jaegerEndpoint: Schema.String.pipe(
      Schema.pattern(/^https?:\/\/.+/),
      Schema.annotations({
        title: "Jaeger Endpoint",
        description: "The URL of the Jaeger endpoint for sending traces",
        examples: ["http://localhost:4317", "https://jaeger.example.com:4317"]
      })
    )
  }).pipe(
    Schema.annotations({
      title: "Telemetry Configuration",
      description: "Configuration for OpenTelemetry tracing"
    })
  )
})

export type AppConfig = Schema.Schema.Type<typeof AppConfigSchema>

export const AppConfig = Context.GenericTag<AppConfig>("AppConfig")

export const AppConfigLive = Layer.effect(
  AppConfig,
  Config.all({
    port: Config.number("PORT").pipe(Config.withDefault(3000)),
    telemetry: Config.all({
      serviceName: Config.string("SERVICE_NAME").pipe(Config.withDefault("tbox-api")),
      serviceVersion: Config.string("SERVICE_VERSION").pipe(Config.withDefault("1.0.0")),
      jaegerEndpoint: Config.string("JAEGER_ENDPOINT").pipe(Config.withDefault("http://localhost:4317"))
    })
  }).pipe(
    Effect.map((config) => Schema.decodeSync(AppConfigSchema)(config))
  )
)
