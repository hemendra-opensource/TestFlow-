# TeamFlow API Specification (Phase 1)

Base URL: `/api/v1`

## Standard Response Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [ ... ]
  }
}
```

---

## Endpoints

### 1. Health Check
- **Path**: `GET /api/v1/health`
- **Auth**: None (Public)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "teamflow-api",
    "version": "1.0.0",
    "timestamp": "2026-10-24T12:00:00.000Z"
  },
  "message": "TeamFlow API is running smoothly"
}
```

### 2. Get Authenticated User Profile
- **Path**: `GET /api/v1/auth/me`
- **Auth**: Required (`Authorization: Bearer <access_token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "c1f7a0b3-e298-4c8d-b089-6fa78e11a34b",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "avatar_url": "https://example.com/avatar.png",
    "created_at": "2026-10-24T10:00:00.000Z",
    "updated_at": "2026-10-24T10:00:00.000Z"
  }
}
```

### 3. Update User Profile
- **Path**: `PATCH /api/v1/auth/profile`
- **Auth**: Required (`Authorization: Bearer <access_token>`)
- **Body**:
```json
{
  "full_name": "Jane Smith",
  "avatar_url": "https://example.com/new-avatar.png"
}
```
- **Response**: `200 OK`

### 4. List User Workspaces
- **Path**: `GET /api/v1/workspaces`
- **Auth**: Required (`Authorization: Bearer <access_token>`)
- **Description**: Returns only workspaces where the user has an active membership record.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "e4a2d815-3b98-4c91-95be-3c99f05a967a",
      "name": "Engineering Team",
      "slug": "engineering-team",
      "created_by": "c1f7a0b3-e298-4c8d-b089-6fa78e11a34b",
      "created_at": "2026-10-24T10:30:00.000Z",
      "updated_at": "2026-10-24T10:30:00.000Z",
      "role": "owner",
      "joined_at": "2026-10-24T10:30:00.000Z"
    }
  ]
}
```

### 5. Create Workspace
- **Path**: `POST /api/v1/workspaces`
- **Auth**: Required (`Authorization: Bearer <access_token>`)
- **Body**:
```json
{
  "name": "Design Systems",
  "slug": "design-systems"
}
```
- **Validation**:
  - `name`: String, 2 to 100 characters.
  - `slug`: String, 2 to 60 characters, lowercase alphanumeric and hyphens (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
  - Extra fields (e.g. `role`, `user_id`) are rejected with `400 Bad Request`.
- **Response**: `201 Created`
- **Conflict**: `409 Conflict` if `slug` already exists.
