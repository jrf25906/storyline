Check for sensitive data exposure and encryption compliance across Storyline systems.

!cd tests/security && npm run test:privacy
!cd tests/security/data-protection && npm run test:encryption
!cd tests/security/privacy && npm run test:data-handling

Audit privacy and security compliance:
- **Data Encryption**: Voice recordings and memoir content encrypted
- **Sensitive Data**: No API keys, secrets, or personal info in logs
- **HIPAA-Level Privacy**: Medical-grade privacy for emotional content  
- **Data Retention**: Appropriate data lifecycle management
- **Access Controls**: Proper user data access restrictions

@docs/security/privacy-spec.md
@docs/security/compliance/

Scan for privacy violations:
- Unencrypted sensitive data storage
- API keys or secrets in code/logs
- Excessive data collection
- Improper data sharing or access
- Missing consent mechanisms

Provide remediation steps for any privacy violations found. Storyline handles deeply personal memoir content requiring maximum privacy protection.