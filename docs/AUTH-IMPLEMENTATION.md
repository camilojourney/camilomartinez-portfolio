# Authentication Implementation Guide

## Current State

The backend uses **mock authentication** via `get_user_id()` in `backend/app/routers/ai.py`.

Current behavior:
- Any request with an `Authorization: Bearer <token>` header returns `mock_user_123`
- Requests without auth headers return `None` (anonymous)

This is **NOT production-ready**.

## Required Changes for Production

### 1. Environment Variables

Add to `.env`:

```bash
# JWT Configuration
JWT_SECRET=your-256-bit-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Optional: Auth provider settings
AUTH_PROVIDER=jwt  # or "nextauth", "auth0", "clerk"
```

### 2. JWT Validation Implementation

Replace the `get_user_id()` function in `backend/app/routers/ai.py`:

```python
from jose import jwt, JWTError
from app.config.settings import settings

async def get_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """Extract and validate user ID from JWT token."""
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Validate expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            raise HTTPException(status_code=401, detail="Token expired")
        
        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        return user_id
        
    except JWTError as e:
        logger.warning(f"JWT validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 3. Settings Configuration

Add to `backend/app/config/settings.py`:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # JWT Authentication
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    @property
    def jwt_configured(self) -> bool:
        return bool(self.JWT_SECRET)
```

### 4. Integration with Next.js NextAuth

If using NextAuth on the frontend, the backend needs to:

1. Share the same JWT secret as NextAuth
2. Validate tokens issued by NextAuth
3. Extract user info from NextAuth session token

Example NextAuth configuration alignment:

```typescript
// next-auth config
export const authOptions = {
  secret: process.env.JWT_SECRET,
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.user_id = user.id;
      }
      return token;
    },
  },
};
```

### 5. Testing Authentication

Add to backend tests:

```python
def test_authenticated_endpoint_requires_token(client):
    response = client.get("/api/ai/chat/history")
    assert response.status_code == 401

def test_authenticated_endpoint_with_valid_token(client, auth_headers):
    response = client.get("/api/ai/chat/history", headers=auth_headers)
    assert response.status_code == 200
```

## Migration Path

1. **Phase 1 (Current):** Mock auth - all users are `mock_user_123`
2. **Phase 2:** Add JWT_SECRET env var, implement validation
3. **Phase 3:** Integrate with NextAuth session tokens
4. **Phase 4:** Add role-based access control (RBAC)

## Security Checklist

- [ ] JWT_SECRET is at least 256 bits
- [ ] JWT_SECRET is not in version control
- [ ] Token expiration is enforced
- [ ] HTTPS is required for all auth endpoints
- [ ] Failed auth attempts are logged
- [ ] Rate limiting is applied to auth endpoints

## Files to Modify

1. `backend/app/routers/ai.py` - Replace `get_user_id()` function
2. `backend/app/config/settings.py` - Add JWT settings
3. `backend/.env` - Add JWT_SECRET
4. `backend/tests/conftest.py` - Add JWT token fixtures

## Dependencies

Already installed:
- `python-jose[cryptography]` - JWT encoding/decoding

No additional packages needed.
