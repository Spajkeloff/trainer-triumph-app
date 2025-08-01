// Security utilities for authentication and session management

interface RateLimitEntry {
  count: number;
  lastAttempt: number;
  blocked: boolean;
}

class SecurityUtils {
  private rateLimitMap: Map<string, RateLimitEntry> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Check if an IP/email is rate limited
   */
  checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry) {
      // First attempt
      this.rateLimitMap.set(identifier, {
        count: 1,
        lastAttempt: now,
        blocked: false
      });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    // Check if block period has expired
    if (entry.blocked && (now - entry.lastAttempt) > this.BLOCK_DURATION_MS) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        lastAttempt: now,
        blocked: false
      });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    // If currently blocked
    if (entry.blocked) {
      const resetTime = entry.lastAttempt + this.BLOCK_DURATION_MS;
      return { allowed: false, remainingAttempts: 0, resetTime };
    }

    // Check if window has expired
    if ((now - entry.lastAttempt) > this.WINDOW_MS) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        lastAttempt: now,
        blocked: false
      });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    // Increment attempt count
    const newCount = entry.count + 1;
    const blocked = newCount >= this.MAX_ATTEMPTS;

    this.rateLimitMap.set(identifier, {
      count: newCount,
      lastAttempt: now,
      blocked
    });

    if (blocked) {
      const resetTime = now + this.BLOCK_DURATION_MS;
      return { allowed: false, remainingAttempts: 0, resetTime };
    }

    return { 
      allowed: true, 
      remainingAttempts: this.MAX_ATTEMPTS - newCount 
    };
  }

  /**
   * Clear rate limit for an identifier (successful login)
   */
  clearRateLimit(identifier: string): void {
    this.rateLimitMap.delete(identifier);
  }

  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Generate secure session ID
   */
  generateSecureId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check for common security threats in user input
   */
  detectSecurityThreats(input: string): string[] {
    const threats: string[] = [];
    
    // SQL injection patterns
    const sqlPatterns = [
      /('|(\\')|(;|\\;)|(\\))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i
    ];
    
    if (sqlPatterns.some(pattern => pattern.test(input))) {
      threats.push('Potential SQL injection attempt');
    }

    // Script injection patterns
    const scriptPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    if (scriptPatterns.some(pattern => pattern.test(input))) {
      threats.push('Potential XSS attempt');
    }

    // Path traversal
    if (input.includes('../') || input.includes('..\\')) {
      threats.push('Potential path traversal attempt');
    }

    return threats;
  }

  /**
   * Log security events (in production, send to security monitoring)
   */
  logSecurityEvent(event: {
    type: 'rate_limit_exceeded' | 'invalid_login' | 'suspicious_activity' | 'password_reset_request';
    identifier: string;
    details?: any;
    timestamp?: number;
  }): void {
    const logEntry = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    console.warn('Security Event:', logEntry);
    
    // In production, you would send this to your security monitoring service
    // Example: send to Supabase edge function for analysis
  }
}

export const securityUtils = new SecurityUtils();