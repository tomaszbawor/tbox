import { NodeSdk } from "@effect/opentelemetry"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { Config, Effect } from "effect"

const TelemetryConfig = Config.all({
  serviceName: Config.string("SERVICE_NAME").pipe(Config.withDefault("tbox-api")),
  serviceVersion: Config.string("SERVICE_VERSION").pipe(Config.withDefault("1.0.0")),
  jaegerEndpoint: Config.string("JAEGER_ENDPOINT").pipe(Config.withDefault("http://localhost:4317"))
})

export const TelemetryLive = NodeSdk.layer(
  Effect.gen(function*() {
    const config = yield* TelemetryConfig
    yield* Effect.logInfo("Get Telemetry config: ", config)

    const traceExporter = new OTLPTraceExporter({
      url: config.jaegerEndpoint,
      headers: {}
    })

    return {
      resource: {
        serviceName: config.serviceName,
        serviceVersion: config.serviceVersion
      },
      spanProcessor: [new BatchSpanProcessor(traceExporter)]
    }
  })
)
