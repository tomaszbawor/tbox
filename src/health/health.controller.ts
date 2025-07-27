import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { Api } from "../api.js"

export const HealthGroupLive = HttpApiBuilder.group(Api, "health.api", (handlers) =>
  Effect.gen(
    function*() {
      yield* Effect.logInfo("Health Group is Live")

      return handlers.handle("get", getHealth)
    }
  ))

const getHealth = () => Effect.succeed("OK")
