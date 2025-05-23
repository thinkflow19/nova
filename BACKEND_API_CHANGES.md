# Backend API Changes Required for Nova Workspace Enhancements

## Overview
This document outlines the backend API modifications needed to support the enhanced workspace features including multi-tab chat, advanced analytics, bulk operations, and improved knowledge management.

## 1. Enhanced Dashboard Analytics

### New Endpoints Required:

#### GET `/api/dashboard/analytics`
```json
{
  "time_range": "7d|30d|90d",
  "metrics": {
    "total_agents": 12,
    "active_chats": 89,
    "messages_today": 2847,
    "avg_response_time": 1.2,
    "user_satisfaction": 4.7,
    "top_performing_agent": {
      "id": "agent_123",
      "name": "Customer Support Bot",
      "success_rate": 0.95
    }
  },
  "trends": {
    "messages": [
      {"date": "2024-01-01", "count": 450},
      {"date": "2024-01-02", "count": 523}
    ],
    "satisfaction": [
      {"date": "2024-01-01", "score": 4.6},
      {"date": "2024-01-02", "score": 4.8}
    ]
  }
}
```

#### GET `/api/dashboard/recommendations`
```json
{
  "recommendations": [
    {
      "type": "optimization",
      "title": "Optimize Agent X",
      "description": "Response time is 20% above average",
      "priority": "medium",
      "action_url": "/dashboard/agents/agent_x/settings"
    }
  ]
}
```

## 2. Multi-Tab Chat Interface

### New Endpoints Required:

#### GET `/api/chat/sessions/active`
- Returns all active chat sessions for the current user
- Supports pagination and filtering

#### POST `/api/chat/sessions/{session_id}/join`
- Allows multiple users to join the same chat session
- Returns WebSocket connection details for real-time collaboration

#### GET `/api/chat/templates`
- Returns conversation templates/starters
- Supports categorization (customer_support, sales, general)

#### POST `/api/chat/voice/transcribe`
- Handles voice input transcription
- Returns text output for chat input

#### POST `/api/chat/voice/synthesize`
- Handles text-to-speech conversion
- Returns audio file or stream

## 3. Enhanced Agent Management

### Enhanced Existing Endpoints:

#### GET `/api/projects` (Enhanced)
```json
{
  "projects": [...],
  "filters": {
    "available_tags": ["customer-support", "sales", "hr"],
    "performance_metrics": ["success_rate", "response_time", "satisfaction"],
    "status_options": ["active", "paused", "training", "error"]
  },
  "bulk_actions": ["archive", "duplicate", "update_settings", "delete"]
}
```

#### POST `/api/projects/bulk`
```json
{
  "action": "archive|duplicate|delete|update_settings",
  "project_ids": ["id1", "id2", "id3"],
  "settings": {} // Only for update_settings action
}
```

#### GET `/api/projects/{id}/performance`
```json
{
  "metrics": {
    "success_rate": 0.95,
    "avg_response_time": 1.2,
    "total_conversations": 1500,
    "user_satisfaction": 4.7,
    "most_asked_questions": [...],
    "error_rate": 0.02
  },
  "historical_data": [...]
}
```

### New Endpoints:

#### GET `/api/agent-templates`
- Returns pre-built agent templates
- Categories: customer_support, sales, hr, general

#### POST `/api/projects/{id}/duplicate`
- Creates a copy of an existing agent
- Allows name and configuration modifications

#### GET `/api/projects/comparison`
- Accepts multiple project IDs
- Returns side-by-side performance comparison

## 4. Knowledge Management Hub

### New Endpoints Required:

#### POST `/api/knowledge/upload/bulk`
- Handles multiple file uploads with progress tracking
- Returns upload status for each file

#### GET `/api/knowledge/analytics`
```json
{
  "total_documents": 245,
  "most_referenced": [
    {
      "document_id": "doc_123",
      "title": "Product FAQ",
      "reference_count": 89
    }
  ],
  "knowledge_gaps": [
    {
      "topic": "Billing Issues",
      "confidence": 0.3,
      "suggested_documents": ["billing_guide.pdf"]
    }
  ]
}
```

#### POST `/api/knowledge/auto-tag`
- AI-powered document categorization and tagging
- Returns suggested tags and categories

#### GET `/api/knowledge/search`
- Enhanced search with filters, categories, and relevance scoring
- Supports full-text search across all documents

#### POST `/api/knowledge/documents/{id}/versions`
- Version control for document updates
- Tracks changes and their impact on agent responses

## 5. Advanced Workflow Features

### New Endpoints Required:

#### GET `/api/workflows`
#### POST `/api/workflows`
#### PUT `/api/workflows/{id}`
#### DELETE `/api/workflows/{id}`
- CRUD operations for agent orchestration workflows

#### GET `/api/integrations/marketplace`
- Returns available integrations (Slack, Teams, CRM systems)
- Includes installation and configuration details

#### POST `/api/automations/rules`
```json
{
  "trigger": {
    "type": "keyword_detected|sentiment_negative|response_time_high",
    "conditions": {...}
  },
  "actions": [
    {
      "type": "escalate_to_human|send_notification|update_priority",
      "parameters": {...}
    }
  ]
}
```

## 6. Collaboration & Team Features

### New Endpoints Required:

#### GET `/api/team/workspaces`
#### POST `/api/team/workspaces`
- Team workspace management

#### POST `/api/projects/{id}/share`
```json
{
  "user_email": "user@example.com",
  "permission": "view|edit|admin",
  "expiry_date": "2024-12-31"
}
```

#### GET `/api/team/activity-feed`
- Real-time activity updates for team members
- Supports WebSocket for live updates

#### POST `/api/projects/{id}/collaborate`
- Enable collaborative editing on agents
- Returns conflict resolution mechanisms

## 7. Advanced Analytics & Insights

### New Endpoints Required:

#### GET `/api/analytics/conversations`
```json
{
  "sentiment_analysis": {
    "positive": 0.7,
    "neutral": 0.25,
    "negative": 0.05
  },
  "topics": [
    {"topic": "billing", "frequency": 0.3},
    {"topic": "support", "frequency": 0.5}
  ],
  "intent_recognition": [...]
}
```

#### GET `/api/analytics/performance/comparison`
- A/B testing results for different agent configurations
- Performance metrics comparison

#### POST `/api/analytics/export`
- Generate custom reports for business stakeholders
- Supports various formats (PDF, CSV, JSON)

## 8. Real-time Notifications

### WebSocket Endpoints Required:

#### WS `/ws/notifications/{user_id}`
- Real-time notifications for agent errors, performance drops
- User activity updates

#### WS `/ws/chat/{session_id}`
- Real-time chat collaboration
- Multi-user chat sessions

## 9. Integration & Automation

### New Endpoints Required:

#### POST `/api/webhooks`
#### GET `/api/webhooks`
#### DELETE `/api/webhooks/{id}`
- Webhook management for external integrations

#### GET `/api/usage/metrics`
- API usage tracking and cost optimization insights
- Token usage, response times, error rates

## 10. Enhanced User Interface Support

### New Endpoints Required:

#### GET `/api/user/preferences`
#### PUT `/api/user/preferences`
```json
{
  "theme": "light|dark|auto",
  "dashboard_layout": [...],
  "notification_settings": {...},
  "default_view_mode": "grid|list"
}
```

#### POST `/api/shortcuts/custom`
- Custom keyboard shortcuts and quick actions
- User-defined automation shortcuts

## Implementation Priority

### Phase 1 (High Priority)
1. Enhanced Dashboard Analytics
2. Multi-Tab Chat Interface
3. Enhanced Agent Management (bulk operations)

### Phase 2 (Medium Priority)
1. Knowledge Management Hub
2. Advanced Analytics
3. Real-time Notifications

### Phase 3 (Lower Priority)
1. Advanced Workflow Features
2. Team Collaboration
3. Integration Marketplace

## Database Schema Changes

### New Tables Required:

```sql
-- Chat Sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES projects(id),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent Performance Metrics
CREATE TABLE agent_metrics (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES projects(id),
  date DATE,
  success_rate DECIMAL(3,2),
  avg_response_time DECIMAL(8,2),
  total_conversations INTEGER,
  user_satisfaction DECIMAL(3,2)
);

-- Knowledge Base Analytics
CREATE TABLE knowledge_analytics (
  id UUID PRIMARY KEY,
  document_id UUID,
  reference_count INTEGER DEFAULT 0,
  last_referenced TIMESTAMP,
  effectiveness_score DECIMAL(3,2)
);

-- Team Workspaces
CREATE TABLE team_workspaces (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Definitions
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  definition JSONB,
  user_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true
);
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for bulk operations
2. **Permission Checks**: Ensure proper authorization for team features
3. **Data Privacy**: Implement data encryption for sensitive analytics
4. **Audit Logging**: Track all bulk operations and configuration changes

## Performance Considerations

1. **Caching**: Implement Redis caching for frequently accessed analytics
2. **Database Indexing**: Add indexes for performance-critical queries
3. **Pagination**: Ensure all list endpoints support proper pagination
4. **Background Jobs**: Use job queues for heavy operations (bulk actions, exports)

---

*Last Updated: January 2025*
*Version: 1.0* 