import { NodeSdk } from "@effect/opentelemetry"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { Effect } from "effect"
import { AppConfig } from "./config.js"

export const TelemetryLive = NodeSdk.layer(
  Effect.gen(function* () {
    const config = yield* AppConfig
    yield* Effect.logInfo("Get Telemetry config: ", config.telemetry)

    const traceExporter = new OTLPTraceExporter({
      url: config.telemetry.jaegerEndpoint,
      headers: {}
    })

    return {
      resource: {
        serviceName: config.telemetry.serviceName,
        serviceVersion: config.telemetry.serviceVersion
      },
      spanProcessor: [new BatchSpanProcessor(traceExporter)]
    }
  })
)
