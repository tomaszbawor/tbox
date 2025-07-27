# Ollama Integration Tests

## Prerequisites

1. Install Ollama: https://ollama.com/download
2. Pull the small test model: `ollama pull qwen2.5:0.5b`
3. Ensure Ollama is running on `http://localhost:11434`

## Running Tests

```bash
npm test -- src/ollama/ollama.service.test.ts
```

## Test Configuration

The tests use a small model (`qwen2.5:0.5b`) to ensure fast test execution. You can override this by setting environment variables:

- `OLLAMA_URL`: Ollama server URL (default: `http://localhost:11434`)
- `OLLAMA_MODEL`: Model to use for tests (default: `qwen2.5:0.5b`)

## Test Coverage

The test suite covers:

- Configuration management (environment variables and defaults)
- Text generation with string prompts
- Text generation with AiInput messages
- Conversation handling with multiple messages
- Tool call and tool result message handling
- Streaming text generation
- Error handling for both regular and streaming operations
- Message conversion logic

## Known Limitations

- `generateObject` is not implemented and returns an error
- Tool messages are converted to assistant messages with text representations
- Some tests that depend on model behavior may be flaky