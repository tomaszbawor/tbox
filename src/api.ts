import { HttpApi } from "@effect/platform"
import { HealthGroup } from "./health/health.api.js"

export const Api = HttpApi.make("Api").add(HealthGroup)
