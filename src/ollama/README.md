# Ollama AI Language Model Provider for @effect/ai

This module provides an implementation of the `@effect/ai` `AiLanguageModel` interface for Ollama.

## API Overview

The `@effect/ai` package uses the following main methods for the `AiLanguageModel`:

### Core Methods

1. **`generateText`** - Generate text synchronously (returns complete response)
   - Takes `GenerateTextOptions` with:
     - `prompt`: An `AiInput.Raw` (string, Message, or AiInput)
     - `system`: Optional system message
     - `toolkit`: Optional tools for function calling
     - `toolChoice`: How the model should use tools
   - Returns `AiResponse` with text and metadata

2. **`streamText`** - Generate text with streaming (returns chunks as they arrive)
   - Same parameters as `generateText`
   - Returns a `Stream` of `AiResponse` objects

3. **`generateObject`** - Generate structured output matching a schema
   - Takes `GenerateObjectOptions` with:
     - `prompt`: An `AiInput.Raw`
     - `system`: Optional system message
     - `schema`: Effect Schema for the output structure
   - Returns `AiResponse.WithStructuredOutput<A>`

### Message Types

Messages in `@effect/ai` are structured with specific types:

- **`UserMessage`** - Messages from the user
- **`AssistantMessage`** - Messages from the assistant
- **`ToolMessage`** - Results from tool calls

Each message contains `parts` which can be:
- **`TextPart`** - Text content
- **`ImagePart`** - Image data
- **`ToolCallPart`** - Tool invocation (in assistant messages)
- **`ToolCallResultPart`** - Tool results (in tool messages)

### Response Structure

The `AiResponse` contains:
- `parts`: Array of response parts
  - `TextPart`: Generated text
  - `ToolCallPart`: Tool calls made by the model
  - `FinishPart`: Completion metadata (reason, usage stats)
- Helper properties:
  - `text`: Concatenated text from all TextParts
  - `finishReason`: Why generation stopped
  - `toolCalls`: Array of tool calls

## Usage Examples

```typescript
import { AiLanguageModel, AiInput } from "@effect/ai"
import * as Effect from "effect/Effect"

// Simple text generation
const result = yield* AiLanguageModel.generateText({
  prompt: "What is the capital of France?",
  system: "Answer concisely."
})

// Using structured messages
const messages = [
  new AiInput.UserMessage({
    parts: [new AiInput.TextPart({ text: "Hello!" })]
  })
]
const conversation = yield* AiLanguageModel.generateText({
  prompt: new AiInput.AiInput({ messages })
})

// Streaming
yield* AiLanguageModel.streamText({
  prompt: "Tell me a story"
}).pipe(
  Stream.tap(response => 
    Effect.log(response.text)
  ),
  Stream.runDrain
)
```

## Implementation Notes

The Ollama provider converts between:
- `@effect/ai` message format → Ollama's chat format
- Ollama's responses → `AiResponse` with proper parts

Key differences from old API:
- No `complete`/`completeStreaming` - use `generateText`/`streamText`
- No `chat`/`chatStreaming` - use messages in the prompt
- Messages use typed classes, not plain objects with roles
- Responses are structured with parts, not plain text