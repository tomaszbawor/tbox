import { AiInput, AiToolkit } from "@effect/ai"
import * as Effect from "effect/Effect"
import * as Random from "effect/Random"
import * as Schema from "effect/Schema"
import { OllamaAiLanguageModel, OllamaConfig } from "../ollama/index.js"

// Define a schema for the random number tool parameters
const RandomNumberParams = Schema.Struct({
  min: Schema.Number.pipe(
    Schema.annotations({ description: "Minimum value (inclusive)" })
  ),
  max: Schema.Number.pipe(
    Schema.annotations({ description: "Maximum value (inclusive)" })
  )
})

// Create a random number generation tool
const randomNumberTool = AiToolkit.makeToolSingle(
  "generateRandomNumber",
  {
    description: "Generate a random integer between min and max (inclusive)",
    parameters: RandomNumberParams
  },
  ({ max, min }) => Random.randomIntBetween(min, max + 1)
)

// Define another tool for rolling dice
const DiceRollParams = Schema.Struct({
  numberOfDice: Schema.Number.pipe(
    Schema.annotations({
      description: "Number of dice to roll",
      default: 1
    })
  ),
  sides: Schema.Number.pipe(
    Schema.annotations({
      description: "Number of sides on each die",
      default: 6
    })
  )
})

const diceRollTool = AiToolkit.makeToolSingle(
  "rollDice",
  {
    description: "Roll one or more dice with a specified number of sides",
    parameters: DiceRollParams
  },
  ({ numberOfDice, sides }) =>
    Effect.gen(function*() {
      const rolls: Array<number> = []
      for (let i = 0; i < numberOfDice; i++) {
        const roll = yield* Random.randomIntBetween(1, sides + 1)
        rolls.push(roll)
      }
      return {
        rolls,
        total: rolls.reduce((sum, roll) => sum + roll, 0),
        description: `Rolled ${numberOfDice}d${sides}: [${rolls.join(", ")}] = ${
          rolls.reduce((sum, roll) => sum + roll, 0)
        }`
      }
    })
)

// Create the toolkit with both tools
const toolkit = AiToolkit.makeToolkit(
  randomNumberTool,
  diceRollTool
)

// Example usage
const program = Effect.gen(function*() {
  const model = yield* OllamaAiLanguageModel

  // Example 1: Generate random numbers
  console.log("=== Example 1: Random Number Generation ===")
  const response1 = yield* model.generateText({
    prompt: AiInput.text("Generate 3 random numbers between 1 and 100 for me"),
    toolChoice: AiInput.autoToolChoice(toolkit),
    system: "You are a helpful assistant that can generate random numbers using the available tools."
  })
  console.log("Response:", AiInput.formatResponse(response1))

  // Example 2: Roll dice
  console.log("\n=== Example 2: Dice Rolling ===")
  const response2 = yield* model.generateText({
    prompt: AiInput.text("Roll 2 six-sided dice and 3 twenty-sided dice for a D&D game"),
    toolChoice: AiInput.autoToolChoice(toolkit),
    system: "You are a helpful game master assistant that can roll dice for tabletop games."
  })
  console.log("Response:", AiInput.formatResponse(response2))

  // Example 3: Complex scenario
  console.log("\n=== Example 3: Game Scenario ===")
  const response3 = yield* model.generateText({
    prompt: AiInput.text(
      "I'm playing a game where I need to:\n" +
        "1. Roll 3d6 for my character's strength\n" +
        "2. Generate a random encounter number between 1 and 20\n" +
        "3. Roll 1d100 for loot chance\n" +
        "Please help me with all of these."
    ),
    toolChoice: AiInput.autoToolChoice(toolkit),
    system: "You are a helpful game master assistant. Use the available tools to generate random values as requested."
  })
  console.log("Response:", AiInput.formatResponse(response3))
})

// Run the program
const main = program.pipe(
  Effect.provide(OllamaConfig.Default),
  Effect.tapError((error) => Effect.log(`Error: ${error}`))
)

Effect.runPromise(main)
