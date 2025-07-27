import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { Api } from "../api.js"

export const HealthGroupLive = HttpApiBuilder.group(Api, "health.api", (handlers) => handlers.handle("get", getHealth))

const getHealth = () => Effect.succeed("OK")
