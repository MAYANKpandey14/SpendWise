
# Authentication System Documentation

This project uses **Supabase Auth** for handling user authentication, including Email/Password and Google OAuth flows.

## Features

*   **Email & Password Login/Signup**: Standard email and password authentication.
*   **Google OAuth**: Sign in with Google.
*   **Session Persistence**: Sessions are persisted across page refreshes using Supabase's default storage mechanism (localStorage).
*   **Password Reset**: Users can request a password reset link via email and set a new password.
*   **Audit Logging**: Key authentication events (login, signup, logout, failures) are logged to the console (extensible to a remote service).
*   **Protected Routes**: Routes like `/dashboard`, `/expenses`, etc., are protected and require authentication.

## Setup & Configuration

### Environment Variables

Ensure the following variables are set in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Google OAuth Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.
3.  Navigate to **APIs & Services > Credentials**.
4.  Create **OAuth 2.0 Client IDs**.
5.  Add your Supabase project's callback URL to **Authorized redirect URIs**:
    *   `https://<your-project-ref>.supabase.co/auth/v1/callback`
6.  Copy the **Client ID** and **Client Secret**.
7.  Go to your Supabase Dashboard > **Authentication > Providers > Google**.
8.  Enable Google and paste the Client ID and Client Secret.

### Email Templates

Configure your email templates in the Supabase Dashboard > **Authentication > Email Templates**.
*   **Reset Password**: Ensure the link points to your app's update password page if using a custom flow, or use the default Supabase magic link handler. For this app, the reset link should redirect to `{{ .SiteURL }}/update-password`.

## Architecture

*   **`AuthContext.tsx`**: Manages the global authentication state (`user`, `isLoading`) and provides methods for `login`, `signup`, `logout`, `resetPassword`, etc.
*   **`auditService.ts`**: Handles logging of security-related events.
*   **`ProtectedRoute` (in `App.tsx`)**: A wrapper component that checks for a valid user session before rendering child components.

## Testing

Run the authentication tests with:

```bash
npm test test/auth.test.tsx
```
