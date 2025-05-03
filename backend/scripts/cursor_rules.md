# Cursor Rules for Python App Development

## Code Style & Structure

1. **No Hardcoded Values**
   - All configuration values, API endpoints, and credentials MUST be loaded from environment variables.
   - Use `.env` for local development and proper environment variables in production.

2. **No Mock Services in Production Code**
   - Do not include any mock or fake implementations in production code.
   - For testing purposes, use proper test files and fixtures.

3. **Error Handling**
   - Every external API call must include proper error handling.
   - Use appropriate HTTP status codes in responses.
   - Log errors with context for debugging.

4. **Performance**
   - Implement pagination for all list endpoints.
   - Use async/await for I/O-bound operations.
   - Optimize database queries with proper indexes.

## API Design

1. **Consistent Response Format**
   - All API responses should follow the same structure.
   - Include status, data, and error fields as appropriate.

2. **Documentation**
   - Use docstrings for all functions, classes, and modules.
   - Include type hints for all function parameters and return values.

3. **Security**
   - All endpoints must have proper authentication checks.
   - Sanitize all user inputs.
   - Use parameterized queries for database operations.

## Database

1. **Schema Management**
   - All schema changes must be applied through migration scripts.
   - Use the `optimized_schema.sql` as the source of truth.
   - Row Level Security must be implemented for all tables.

2. **Queries**
   - Use prepared statements for all database queries.
   - Implement proper error handling for database operations.

## Frontend Integration

1. **API Contracts**
   - Backend and frontend must agree on API contracts.
   - Use type definitions to ensure consistency.

2. **Environment Configuration**
   - Frontend must use environment variables for backend URLs.
   - Use .env.local for local development.

## Testing

1. **Unit Tests**
   - Write tests for all business logic.
   - Mock external dependencies in tests.

2. **Integration Tests**
   - Test API endpoints with real-world scenarios.
   - Use test databases for integration tests.

## Deployment

1. **Environment Validation**
   - Validate required environment variables on startup.
   - Fail fast if critical configuration is missing.

2. **Versioning**
   - Use semantic versioning for all releases.
   - Document changes in CHANGELOG.md.

## This specific project - Nova

1. **API Integration**
   - All OpenAI API endpoints MUST be loaded from environment variables.
   - Default fallbacks should be used only if environment variables are not set.

2. **Embedding Service**
   - Use proper environment variables for all model names and endpoints.
   - Ensure consistent embedding dimensions with vector databases.
   - Implement proper error handling for API failures.

3. **Vector Database**
   - Configure all vector database parameters via environment variables.
   - Validate connection to vector database on startup.

## Server Configuration

1. **Port Specifications**
   - Backend must run on port 8000 for local development.
   - Frontend must run on port 3000 for local development.
   - Use `--port` flag when starting services to ensure correct ports.
   - Kill conflicting processes before restarting servers.

2. **Server Management**
   - Always check logs after restarting services to verify successful startup.
   - Resolve any startup errors before proceeding with development.
   - Set appropriate environment variables before starting servers. 