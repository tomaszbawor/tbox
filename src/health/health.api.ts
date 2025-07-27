import { HttpApiBuilder, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Effect, Schema } from "effect"
import { Api } from "../api.js"

// Definition
export class HealthGroup extends HttpApiGroup.make("Health")
  .add(
    HttpApiEndpoint.get("get", "/")
      .addSuccess(Schema.String)
  )
{}

export const HealthGroupLive = HttpApiBuilder.group(Api, "Health", (handlers) =>
  Effect.gen(
    function*() {
      yield* Effect.logInfo("Health Group is Live")

      return handlers.handle("get", getHealth)
    }
  ))

const getHealth = () => Effect.succeed("OK")
