# Contributing to YT-NINJA

Thank you for your interest in contributing to YT-NINJA! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Areas Needing Contribution](#areas-needing-contribution)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/yt-ninja.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your GEMINI_API_KEY

# Run in development mode
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Project Structure

```
yt-ninja/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup and tool registration
│   ├── managers/             # Business logic layer
│   │   ├── PlaybackManager.ts
│   │   ├── DownloadManager.ts
│   │   ├── TranscriptManager.ts
│   │   ├── DataManager.ts
│   │   ├── AIAnalyzer.ts
│   │   ├── MediaProcessor.ts
│   │   └── AdvancedFeaturesManager.ts
│   ├── integrations/         # External service wrappers
│   │   ├── youtube.ts        # YouTubeI.js wrapper
│   │   ├── genai.ts          # Google GenAI wrapper
│   │   ├── ffmpeg.ts         # FFmpeg wrapper
│   │   └── process.ts        # Process management
│   ├── utils/                # Utility functions
│   │   ├── validation.ts     # Input validation
│   │   ├── formatting.ts     # Data formatting
│   │   ├── errors.ts         # Error handling
│   │   └── index.ts          # Utility exports
│   └── types/                # TypeScript type definitions
│       ├── tools.ts
│       ├── youtube.ts
│       ├── media.ts
│       └── ai.ts
├── tests/
│   ├── unit/                 # Unit tests
│   ├── property/             # Property-based tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
└── docs/                     # Documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Provide type annotations for function parameters and return values
- Avoid `any` types - use proper types or `unknown`

### Code Style

- Use ESLint and Prettier (configured in project)
- Run `npm run format` before committing
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Example

```typescript
/**
 * Download a YouTube video with specified options
 * @param url - YouTube video URL
 * @param options - Download options (format, quality)
 * @returns Download result with file path and metadata
 * @throws YTNinjaError if URL is invalid or download fails
 */
async downloadVideo(
  url: string,
  options: VideoDownloadOptions
): Promise<DownloadResult> {
  // Validate inputs
  if (!YouTubeURLValidator.isValidVideoURL(url)) {
    throw new YTNinjaError(ErrorCode.INVALID_URL, 'Invalid YouTube video URL');
  }

  // Implementation...
}
```

### Error Handling

- Use the `YTNinjaError` class for all errors
- Provide descriptive error messages
- Include error codes from `ErrorCode` enum
- Add suggestions for error resolution

```typescript
throw new YTNinjaError(
  ErrorCode.INVALID_URL,
  'Invalid YouTube video URL',
  { url },
  [
    'Provide a valid YouTube video URL',
    'Example: https://www.youtube.com/watch?v=VIDEO_ID'
  ]
);
```

## Testing

### Test Structure

- **Unit tests**: Test individual functions and classes
- **Property tests**: Test properties that should hold for all inputs
- **Integration tests**: Test component interactions
- **E2E tests**: Test complete workflows

### Writing Tests

```typescript
// Unit test example
describe('TimestampParser', () => {
  it('should parse seconds format', () => {
    expect(TimestampParser.parse('90')).toBe(90);
  });

  it('should parse MM:SS format', () => {
    expect(TimestampParser.parse('01:30')).toBe(90);
  });
});

// Property test example
import fc from 'fast-check';

describe('TimestampParser properties', () => {
  it('should parse all valid formats consistently', () => {
    fc.assert(
      fc.property(fc.nat(86400), (seconds) => {
        const formats = [
          seconds.toString(),
          formatAsMMSS(seconds),
          formatAsHHMMSS(seconds)
        ];
        return formats.every(format => 
          TimestampParser.parse(format) === seconds
        );
      })
    );
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- timestamp.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Pull Request Process

1. **Update documentation** if you're adding/changing features
2. **Add tests** for new functionality
3. **Run all checks** before submitting:
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```
4. **Write clear commit messages**:
   - Use present tense: "Add feature" not "Added feature"
   - Reference issues: "Fix #123: Add video download"
   - Keep first line under 72 characters
5. **Update CHANGELOG.md** if applicable
6. **Request review** from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] No new warnings
```

## Areas Needing Contribution

### High Priority

1. **Whisper API Integration** (Task 8.3)
   - Implement automatic transcript generation
   - Integrate with Google GenAI Whisper model
   - Add progress tracking for long transcriptions
   - Files: `src/integrations/genai.ts`, `src/managers/TranscriptManager.ts`

2. **Channel Video Listing** (Task 7.9)
   - Implement channel video fetching
   - Add filtering by date range
   - Support pagination for large channels
   - Files: `src/integrations/youtube.ts`, `src/managers/DownloadManager.ts`

3. **Property-Based Tests**
   - Implement ~40 property tests from design document
   - Use fast-check library
   - Cover all correctness properties
   - Files: `tests/property/*.property.test.ts`

### Medium Priority

4. **Caption Burning Implementation**
   - Implement FFmpeg subtitle filter
   - Support multiple caption styles
   - Add font customization
   - Files: `src/integrations/ffmpeg.ts`, `src/managers/AdvancedFeaturesManager.ts`

5. **Unit Tests**
   - Add tests for utility functions
   - Test manager classes
   - Test error handling
   - Files: `tests/unit/*.test.ts`

6. **Integration Tests**
   - Test manager coordination
   - Test file system operations
   - Test process management
   - Files: `tests/integration/*.test.ts`

### Low Priority

7. **Performance Optimizations**
   - Parallel download segments
   - Caching improvements
   - Memory usage optimization

8. **Additional Features**
   - YouTube Shorts support
   - Live stream recording
   - Comment extraction
   - Multi-language subtitle generation

## Code Review Guidelines

### For Contributors

- Be open to feedback
- Respond to review comments promptly
- Make requested changes or explain why not
- Keep PRs focused and reasonably sized

### For Reviewers

- Be respectful and constructive
- Explain the "why" behind suggestions
- Approve when ready, request changes when needed
- Test the changes locally if possible

## Development Tips

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev

# Use Node.js debugger
node --inspect dist/index.js

# Check TypeScript compilation
npm run type-check
```

### Testing with Kiro

1. Build the project: `npm run build`
2. Update MCP config with local path
3. Restart Kiro
4. Test commands in Kiro chat
5. Check logs for errors

### Common Pitfalls

- **Circular dependencies**: Avoid importing managers from each other
- **Async/await**: Always handle promise rejections
- **Error handling**: Use YTNinjaError consistently
- **Type safety**: Don't use `any` - use proper types
- **Resource cleanup**: Always close streams and processes

## Questions?

- Open an issue for questions
- Check existing issues and PRs
- Review documentation first
- Be specific about your question

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions make YT-NINJA better for everyone. We appreciate your time and effort! 🙏
