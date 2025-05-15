# Chat Service Documentation

## Overview

The Chat Service is a robust implementation of a conversational AI system using LangGraph. It provides a flexible and efficient way to handle chat interactions with context retrieval and response generation capabilities.

## Architecture

### Core Components

1. **State Management**
   - Uses TypedDict for type-safe state management
   - Implements proper reducers for state updates
   - Tracks errors and context throughout the conversation

```python
class GraphState(TypedDict):
    messages: Annotated[List[BaseMessage], add]  # Message history with add reducer
    session_id: str
    project_id: str
    retrieved_context: Optional[str]
    assistant_response: Optional[str]
    error: Optional[str]
```

2. **Configuration**
   - Flexible configuration schema
   - Support for different streaming modes
   - Debug and temperature controls

```python
class ConfigSchema(TypedDict):
    checkpoint_id: str
    thread_id: str
    stream_mode: Literal["values", "updates", "custom", "messages", "debug"]
    debug: bool
    temperature: float
```

### Graph Structure

The service implements a two-node graph:

1. **Context Retrieval Node**
   - Retrieves relevant context from vector store
   - Filters and formats search results
   - Handles errors gracefully

2. **Response Generation Node**
   - Generates responses using LLM
   - Incorporates context and conversation history
   - Manages streaming and error states

## Features

### 1. Streaming Support

Multiple streaming modes are supported:

- `values`: Emit all state values
- `updates`: Emit node updates
- `messages`: Emit LLM messages
- `debug`: Emit detailed debug info
- `custom`: Support for custom streaming

Example usage:
```python
async for event in graph.astream_events(state, config=config):
    if stream_mode == "values":
        if "assistant_response" in event:
            yield event["assistant_response"]
    elif stream_mode == "messages":
        if isinstance(event, tuple):
            message, metadata = event
            yield message.content
```

### 2. Error Handling

Comprehensive error handling with:
- Error state tracking
- Proper error propagation
- Detailed error logging
- Retry policies

Example:
```python
try:
    # Operation
except Exception as e:
    if writer:
        writer({
            "node": "node_name",
            "status": "error",
            "error": str(e)
        })
    return {"error": str(e)}
```

### 3. Context Retrieval

Intelligent context retrieval with:
- Vector search
- Relevance filtering
- Source attribution
- Error handling

Example:
```python
search_results = await vector_service.search_by_embedding(
    embedding=query_embedding,
    top_k=VECTOR_SEARCH_TOP_K,
    namespace=namespace,
    filter=query_filter
)
```

### 4. Response Generation

Flexible response generation with:
- Context-aware responses
- Temperature control
- Streaming support
- Error handling

Example:
```python
llm = self.llm.with_config({"temperature": temperature})
chain = prompt_template | llm | StrOutputParser()
response = await chain.ainvoke({"history": history_for_chain})
```

## Best Practices

1. **State Management**
   - Always use TypedDict for state
   - Implement proper reducers
   - Track errors in state
   - Use proper type hints

2. **Error Handling**
   - Use try-except blocks
   - Log errors properly
   - Propagate errors up
   - Use retry policies

3. **Streaming**
   - Support multiple modes
   - Handle events properly
   - Buffer responses
   - Clean up resources

4. **Configuration**
   - Use proper schema
   - Validate inputs
   - Provide defaults
   - Document options

5. **Logging**
   - Log important events
   - Include context
   - Use proper levels
   - Handle sensitive data

## Usage Examples

### Basic Usage

```python
chat_service = get_chat_service()
response = await chat_service.process_user_message(
    db_service=db_service,
    session_id="session_123",
    user_id="user_456",
    user_message="Hello, how can you help me?"
)
```

### Streaming Usage

```python
async for chunk in chat_service.process_user_message(
    db_service=db_service,
    session_id="session_123",
    user_id="user_456",
    user_message="Hello, how can you help me?",
    stream_mode="messages",
    temperature=0.7,
    debug=True
):
    print(chunk)
```

### Custom Configuration

```python
config = {
    "configurable": {
        "checkpoint_id": "session_123",
        "thread_id": "thread_123",
        "stream_mode": "custom",
        "debug": True,
        "temperature": 0.8
    }
}
```

## Future Improvements

1. **Agent Integration**
   - Add support for LangGraph agents
   - Implement tool calling
   - Add memory management
   - Support multi-agent conversations

2. **Performance**
   - Add caching
   - Optimize vector search
   - Implement batching
   - Add rate limiting

3. **Monitoring**
   - Add metrics
   - Implement tracing
   - Add health checks
   - Monitor resource usage

4. **Security**
   - Add input validation
   - Implement rate limiting
   - Add authentication
   - Handle sensitive data

## Dependencies

- LangGraph
- LangChain
- OpenAI
- FastAPI
- Pinecone (for vector store)

## Configuration

Environment variables:
- `OPENAI_API_KEY`
- `DEFAULT_CHAT_MODEL`
- `DEFAULT_EMBEDDING_MODEL`
- `STREAMING_ENABLED`
- `PINECONE_API_KEY`
- `PINECONE_ENVIRONMENT`
- `VECTOR_SEARCH_TOP_K`

## Contributing

1. Follow the code style
2. Add proper documentation
3. Include tests
4. Update this documentation

## License

[Your License Here] 