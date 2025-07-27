import * as Effect from "effect/Effect"
import * as Random from "effect/Random"
import { OllamaAiLanguageModel, OllamaService } from "../ollama/index.js"

// Example showing AI integration with simple tool-like functions

// Random number generation function
const generateRandomNumber = (min: number, max: number) => Random.nextIntBetween(min, max + 1)

// Dice rolling function
const rollDice = (numberOfDice: number, sides: number) =>
  Effect.gen(function*() {
    const rolls: Array<number> = []
    for (let i = 0; i < numberOfDice; i++) {
      const roll = yield* Random.nextIntBetween(1, sides + 1)
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

// Calculator functions
const add = (a: number, b: number) => Effect.succeed(a + b)
const multiply = (a: number, b: number) => Effect.succeed(a * b)
const subtract = (a: number, b: number) => Effect.succeed(a - b)
const divide = (a: number, b: number) => b === 0 ? Effect.fail("Division by zero") : Effect.succeed(a / b)

// String manipulation functions
const toUpperCase = (text: string) => Effect.succeed(text.toUpperCase())
const toLowerCase = (text: string) => Effect.succeed(text.toLowerCase())
const reverse = (text: string) => Effect.succeed(text.split("").reverse().join(""))

// Example usage program
const program = Effect.gen(function*() {
  console.log("=== Random Number Examples ===")

  // Generate random numbers
  const random1 = yield* generateRandomNumber(1, 100)
  console.log(`Random number (1-100): ${random1}`)

  const random2 = yield* generateRandomNumber(50, 75)
  console.log(`Random number (50-75): ${random2}`)

  console.log("\n=== Dice Rolling Examples ===")

  // Roll dice
  const roll1 = yield* rollDice(2, 6)
  console.log(roll1.description)

  const roll2 = yield* rollDice(3, 20)
  console.log(roll2.description)

  console.log("\n=== Calculator Examples ===")

  // Calculator operations
  const sum = yield* add(25, 17)
  console.log(`25 + 17 = ${sum}`)

  const product = yield* multiply(6, 8)
  console.log(`6 * 8 = ${product}`)

  const difference = yield* subtract(100, 42)
  console.log(`100 - 42 = ${difference}`)

  const quotient = yield* divide(144, 12)
  console.log(`144 / 12 = ${quotient}`)

  console.log("\n=== String Manipulation Examples ===")

  // String operations
  const upper = yield* toUpperCase("hello world")
  console.log(`Uppercase: ${upper}`)

  const lower = yield* toLowerCase("EFFECT TS")
  console.log(`Lowercase: ${lower}`)

  const reversed = yield* reverse("typescript")
  console.log(`Reversed: ${reversed}`)

  console.log("\n=== Using with AI Model ===")

  // Example of using the Ollama AI model
  yield* OllamaAiLanguageModel

  // Note: The actual tool integration would depend on the @effect/ai API
  // This is a simplified example showing the concept
  console.log("AI model loaded and ready for use with tools")
})

// Run the program
const main = program.pipe(
  Effect.provide(OllamaService.Default),
  Effect.tapError((error) => Effect.log(`Error: ${error}`))
)

Effect.runPromise(main)
