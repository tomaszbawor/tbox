import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

// Definition
export class HealthGroup extends HttpApiGroup.make("health.api")
  .add(
    HttpApiEndpoint.get("get", "/")
      .addSuccess(Schema.String)
  )
{}
