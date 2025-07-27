import { AiInput, AiLanguageModel, AiTool, AiToolkit } from "@effect/ai"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import { OllamaAiLanguageModelLive } from "../ollama/index.js"

// Simple calculator tools example
const CalculatorParams = Schema.Struct({
  a: Schema.Number,
  b: Schema.Number
})

// Addition tool
const addTool = AiTool.make(
  "add",
  {
    description: "Add two numbers together",
    parameters: CalculatorParams.fields,
    success: Schema.Number
  }
)

// Multiplication tool
const multiplyTool = AiTool.make(
  "multiply",
  {
    description: "Multiply two numbers",
    parameters: CalculatorParams.fields,
    success: Schema.Number
  }
)

// String manipulation tool
const StringParams = Schema.Struct({
  text: Schema.String,
  operation: Schema.Literal("uppercase", "lowercase", "reverse")
})

const stringTool = AiTool.make(
  "manipulateString",
  {
    description: "Perform string operations like uppercase, lowercase, or reverse",
    parameters: StringParams.fields,
    success: Schema.String
  }
)

// Create toolkit with all tools
const toolkit = AiToolkit.make(
  addTool,
  multiplyTool,
  stringTool
)

// Define tool handlers
const toolHandlers = toolkit.toLayer({
  add: ({ a, b }) => Effect.succeed(a + b),
  multiply: ({ a, b }) => Effect.succeed(a * b),
  manipulateString: ({ operation, text }) =>
    Effect.succeed(
      operation === "uppercase" ?
        text.toUpperCase() :
        operation === "lowercase" ?
        text.toLowerCase() :
        text.split("").reverse().join("")
    )
})

// Example program
const program = Effect.gen(function*() {
  const model = yield* AiLanguageModel.AiLanguageModel

  // Example 1: Math operations
  console.log("=== Math Operations ===")
  const mathResponse = yield* model.generateText({
    prompt: AiInput.make("What is 25 + 17, and what is 6 * 8?"),
    toolkit,
    system: "You are a helpful assistant. Use the available tools to perform calculations."
  })
  console.log("Math Response:", mathResponse.text)

  // Example 2: String manipulation
  console.log("\n=== String Operations ===")
  const stringResponse = yield* model.generateText({
    prompt: AiInput.make("Please convert 'Hello World' to uppercase and reverse the string 'Effect'"),
    toolkit,
    system: "You are a helpful assistant. Use the string manipulation tool to process text."
  })
  console.log("String Response:", stringResponse.text)

  // Example 3: Combined operations
  console.log("\n=== Combined Operations ===")
  const combinedResponse = yield* model.generateText({
    prompt: AiInput.make(
      "Calculate 12 + 8, then multiply the result by 3. " +
        "Also, make the word 'typescript' uppercase."
    ),
    toolkit,
    system: "You are a helpful assistant. Use the available tools to complete all requested operations."
  })
  console.log("Combined Response:", combinedResponse.text)
})

// Run the program
const main = program.pipe(
  Effect.provide(Layer.mergeAll(
    toolHandlers,
    OllamaAiLanguageModelLive
  )),
  Effect.tapError((error) => Effect.log(`Error: ${error}`))
)

Effect.runPromise(main)
