# Development Guidelines

## Code Quality Checks

After making any code changes, always run the following commands to ensure code quality:

1. **Type checking**: Run `bun check` to verify TypeScript types are correct
2. **Linting**: Run `bun lint-fix` to automatically fix linting issues
3. **Runtime test**: Run `bun run src/index.ts` to ensure the application starts without errors

These checks help maintain code consistency and catch errors early in the development process.

## Environment Variables

When adding new environment variables to the application:

1. **Document in .env.example**: Always add any new environment variables to the `.env.example` file with appropriate default values or placeholders
2. **Use descriptive names**: Environment variable names should be clear and follow the UPPER_SNAKE_CASE convention
3. **Add comments**: Include comments in `.env.example` to explain the purpose of each variable

This ensures that other developers can easily set up the application with the correct configuration.