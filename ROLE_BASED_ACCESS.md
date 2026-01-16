# Role-Based Access Control Implementation

## Overview
Implemented role-based access control in `src/app.jsx` to verify user roles before displaying the dashboard.

## Changes Made

### 1. New State Variable
```javascript
const [accessError, setAccessError] = useState(null);
```
Stores error messages when access is denied.

### 2. Role Validation Function
```javascript
const checkUserRole = (profile) => {
  // Checks if profile exists
  // Checks if role is defined
  // Verifies role is in allowed list
  // Returns { hasAccess: boolean, error: string }
}
```

**Allowed Roles:**
- `master` - Master admin with full access
- `brand_admin` - Brand owner with dashboard access
- `influencer` - Influencer with analytics access

**Blocked Roles:**
- `user` - Regular users cannot access dashboard (future implementation)
- Any undefined or null role

### 3. Role Check in fetchUserData
```javascript
const roleCheck = checkUserRole(prof);

if (!roleCheck.hasAccess) {
  setAccessError(roleCheck.error);
  setView('access-denied');
  return;
}
```

This runs BEFORE fetching brands, preventing unauthorized data access.

### 4. Access Denied Component
New `AccessDenied` component displays when:
- User profile is not found
- User role is not defined
- User role is not in allowed list

Shows:
- Error message from role check
- List of allowed roles
- Logout button to return to landing page

### 5. Updated View Logic
```javascript
{view === 'landing' ? (
  <LandingPage ... />
) : view === 'access-denied' ? (
  <AccessDenied ... />
) : (
  <Dashboard ... />
)}
```

## Database Setup Required

Make sure your `profiles` table has the `role` column with one of these values:

```sql
-- Update profile role
UPDATE public.profiles 
SET role = 'brand_admin' 
WHERE id = 'user-uuid-here';

-- Valid roles
-- 'master'
-- 'brand_admin'
-- 'influencer'
-- 'user' (currently blocked from dashboard)
```

## Error Messages (Portuguese)

| Error | Cause |
|-------|-------|
| "Perfil não encontrado..." | No profile record in database |
| "Função de usuário não definida..." | Profile exists but role is NULL |
| "Acesso negado. Sua função (...) não tem permissão..." | Role not in allowed list |

## Testing

### Test 1: Valid Access
1. Login with user who has role = 'brand_admin'
2. Should see Dashboard
3. Brands should load properly

### Test 2: Access Denied
1. Manually set profile.role = 'user' in database
2. Login with that user
3. Should see AccessDenied page with message
4. Button to logout should work

### Test 3: Missing Role
1. Manually set profile.role = NULL in database
2. Login with that user
3. Should see AccessDenied page with "não definida" message

## Production Deployment

1. Make sure all test users have proper roles assigned
2. Run RLS policies with `RLS_PROFILES_FINAL.sql`
3. Push changes to GitHub: `git add -A && git commit -m "Add role-based access control"`
4. Vercel will auto-deploy

## Future Enhancements

- [ ] Role-specific dashboard layouts
- [ ] Different features for master vs brand_admin vs influencer
- [ ] User role management UI for masters
- [ ] Audit logging of access attempts
- [ ] Role upgrade workflow
