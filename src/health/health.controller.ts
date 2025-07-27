import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { Api } from "../api.js"

export const HealthGroupLive = HttpApiBuilder.group(Api, "health.api", (handlers) => handlers.handle("get", getHealth))

const getHealth = () =>
  Effect.withSpan("health.check", {
    attributes: {
      "health.status": "checking",
      "health.endpoint": "/api/health"
    }
  })(
    Effect.gen(function*() {
      yield* Effect.sleep("10 millis")
      yield* Effect.logInfo("Health check performed")
      return "OK"
    })
  )
