import { Config, Context, Layer } from "effect"

export interface AppConfig {
  readonly port: number
}

export const AppConfig = Context.GenericTag<AppConfig>("AppConfig")

export const AppConfigLive = Layer.effect(
  AppConfig,
  Config.number("PORT").pipe(
    Config.withDefault(3000),
    Config.map((port) => ({ port }))
  )
)
