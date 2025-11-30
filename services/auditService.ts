
export type AuditEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'SIGNUP_SUCCESS'
  | 'SIGNUP_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_UPDATE_SUCCESS'
  | 'PASSWORD_UPDATE_FAILURE'
  | 'GOOGLE_LOGIN_SUCCESS'
  | 'GOOGLE_LOGIN_FAILURE';

interface AuditLogEntry {
  event: AuditEventType;
  userId?: string;
  email?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const logAuthEvent = async (
  event: AuditEventType, 
  data: { userId?: string; email?: string; metadata?: Record<string, any> }
) => {
  const entry: AuditLogEntry = {
    event,
    userId: data.userId,
    email: data.email,
    timestamp: new Date().toISOString(),
    metadata: data.metadata,
  };

  // In a real production app, this would send data to a logging service 
  // like Datadog, Sentry, or a dedicated 'audit_logs' table in Supabase.
  // For now, we log to console with a specific prefix for easy filtering.
  
  if (event.includes('FAILURE')) {
    console.error(`[AUTH_AUDIT_FAILURE] ${event}:`, entry);
  } else {
    console.info(`[AUTH_AUDIT_SUCCESS] ${event}:`, entry);
  }

  // TODO: Implement persistent storage for audit logs if required by compliance.
};
