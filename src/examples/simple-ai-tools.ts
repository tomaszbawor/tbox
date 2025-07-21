import { AiInput, AiToolkit } from "@effect/ai"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { OllamaAiLanguageModel } from "../ollama/ai-language-model.js"
import { OllamaConfig } from "../ollama/ollama.config.js"

// Simple calculator tools example
const CalculatorParams = Schema.Struct({
  a: Schema.Number,
  b: Schema.Number
})

// Addition tool
const addTool = AiToolkit.makeToolSingle(
  "add",
  {
    description: "Add two numbers together",
    parameters: CalculatorParams
  },
  ({ a, b }) => Effect.succeed(a + b)
)

// Multiplication tool
const multiplyTool = AiToolkit.makeToolSingle(
  "multiply",
  {
    description: "Multiply two numbers",
    parameters: CalculatorParams
  },
  ({ a, b }) => Effect.succeed(a * b)
)

// String manipulation tool
const StringParams = Schema.Struct({
  text: Schema.String,
  operation: Schema.Literal("uppercase", "lowercase", "reverse")
})

const stringTool = AiToolkit.makeToolSingle(
  "manipulateString",
  {
    description: "Perform string operations like uppercase, lowercase, or reverse",
    parameters: StringParams
  },
  ({ operation, text }) =>
    Effect.succeed(
      operation === "uppercase" ?
        text.toUpperCase() :
        operation === "lowercase" ?
        text.toLowerCase() :
        text.split("").reverse().join("")
    )
)

// Create toolkit with all tools
const toolkit = AiToolkit.makeToolkit(
  addTool,
  multiplyTool,
  stringTool
)

// Example program
const program = Effect.gen(function*() {
  const model = yield* OllamaAiLanguageModel

  // Example 1: Math operations
  console.log("=== Math Operations ===")
  const mathResponse = yield* model.generateText({
    prompt: AiInput.text("What is 25 + 17, and what is 6 * 8?"),
    toolChoice: AiInput.autoToolChoice(toolkit),
    system: "You are a helpful assistant. Use the available tools to perform calculations."
  })
  console.log("Math Response:", AiInput.formatResponse(mathResponse))

  // Example 2: String manipulation
  console.log("\n=== String Operations ===")
  const stringResponse = yield* model.generateText({
    prompt: AiInput.text("Please convert 'Hello World' to uppercase and reverse the string 'Effect'"),
    toolChoice: AiInput.autoToolChoice(toolkit),
    system: "You are a helpful assistant. Use the string manipulation tool to process text."
  })
  console.log("String Response:", AiInput.formatResponse(stringResponse))

  // Example 3: Combined operations
  console.log("\n=== Combined Operations ===")
  const combinedResponse = yield* model.generateText({
    prompt: AiInput.text(
      "Calculate 12 + 8, then multiply the result by 3. " +
        "Also, make the word 'typescript' uppercase."
    ),
    toolChoice: AiInput.autoToolChoice(toolkit),
    system: "You are a helpful assistant. Use the available tools to complete all requested operations."
  })
  console.log("Combined Response:", AiInput.formatResponse(combinedResponse))
})

// Run the program
const main = program.pipe(
  Effect.provide(OllamaConfig.Default),
  Effect.tapError((error) => Effect.log(`Error: ${error}`))
)

Effect.runPromise(main)
