# Document Export Service

A comprehensive microservice for exporting documents from the Storyline platform into multiple formats including DOCX, PDF, EPUB, Markdown, HTML, and plain text. Built with Node.js, TypeScript, and featuring async job processing, template system, and cloud storage integration.

## Features

### 📄 Multiple Export Formats
- **DOCX**: Microsoft Word documents with full formatting support
- **PDF**: High-quality PDF with customizable templates and styling
- **EPUB**: E-book format for digital publishing
- **Markdown**: Clean markdown with metadata support
- **HTML**: Web-ready HTML with responsive design
- **TXT**: Plain text with configurable formatting

### 🎨 Template System
- **Manuscript**: Standard manuscript format with proper spacing
- **Book**: Publishing-ready book layout with chapters
- **Screenplay**: Industry-standard screenplay format
- **Academic**: Formal academic paper structure
- **Blog**: Modern web-friendly blog post format
- **Custom**: Support for custom templates and CSS

### 🚀 Advanced Features
- **Async Processing**: Bull/Redis queue system for scalable export processing
- **Batch Exports**: Export multiple documents in a single operation
- **Progress Tracking**: Real-time progress updates for long-running exports
- **Webhook Notifications**: HTTP callbacks when exports complete
- **Cloud Storage**: S3/MinIO integration with presigned download URLs
- **Template Engine**: Handlebars-based template system with helpers
- **Memory Integration**: Direct integration with Storyline's memory service

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Redis (for job queues)
- S3/MinIO (for file storage)
- Access to Storyline Memory Service

### Installation

```bash
# Clone and install dependencies
cd services/document-export
npm install

# Copy environment configuration
cp .env.example .env

# Edit configuration (see Configuration section)
nano .env

# Build the service
npm run build

# Start the service
npm start
```

### Development Mode

```bash
# Start with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

## API Reference

### Export Single Document

```http
POST /export/document/:documentId
Content-Type: application/json

{
  "userId": "user-123",
  "format": "pdf",
  "template": "manuscript",
  "options": {
    "fontSize": 12,
    "fontFamily": "Times New Roman",
    "margins": {
      "top": 25,
      "right": 25,
      "bottom": 25,
      "left": 25
    }
  },
  "authorInfo": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "webhookUrl": "https://your-app.com/webhook/export",
  "async": true
}
```

**Response:**
```json
{
  "exportId": "exp-abc123",
  "status": "queued",
  "jobId": "job-456",
  "estimatedDuration": 30000,
  "message": "Export job has been queued for processing",
  "statusUrl": "/export/status/exp-abc123"
}
```

### Export Multiple Documents (Batch)

```http
POST /export/batch
Content-Type: application/json

{
  "documentIds": ["doc-123", "doc-456", "doc-789"],
  "userId": "user-123",
  "format": "epub",
  "template": "book",
  "options": {
    "epubOptions": {
      "author": "Jane Smith",
      "publisher": "My Publisher",
      "isbn": "978-0123456789"
    }
  },
  "async": true
}
```

### Check Export Status

```http
GET /export/status/:exportId
```

**Response:**
```json
{
  "exportId": "exp-abc123",
  "status": "completed",
  "downloadUrl": "https://storage.com/download/file.pdf",
  "downloadExpiresAt": "2024-01-02T12:00:00Z",
  "fileSize": 2048576,
  "metadata": {
    "pageCount": 150,
    "wordCount": 50000
  }
}
```

### Get Available Formats and Templates

```http
GET /export/formats
GET /export/templates
```

### Validate Export Options

```http
POST /export/validate
Content-Type: application/json

{
  "format": "pdf",
  "options": {
    "pdfOptions": {
      "scale": 1.5
    }
  }
}
```

## Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3004
NODE_ENV=production

# Redis Configuration (required)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Storage Configuration (choose S3 or MinIO)
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=storyline-exports

# MinIO (alternative to S3)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=storyline-exports
MINIO_USE_SSL=false

# Export Limits
MAX_EXPORT_SIZE_MB=500
EXPORT_TIMEOUT_MINUTES=30
DOWNLOAD_LINK_EXPIRY_HOURS=24
MAX_CONCURRENT_EXPORTS=10

# Memory Service
MEMORY_SERVICE_URL=http://localhost:3002

# Webhook Configuration
WEBHOOK_TIMEOUT_MS=10000
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_SECRET=your_webhook_secret

# Logging
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.com
```

### Export Options

#### General Options
```typescript
{
  // Document structure
  includeOutline?: boolean;
  includeCharacters?: boolean;
  includeMetadata?: boolean;
  chapterBreaks?: boolean;
  
  // Formatting
  fontSize?: number;           // 8-72 points
  fontFamily?: string;         // e.g., "Times New Roman"
  lineSpacing?: number;        // 0.5-3.0
  margins?: {                  // in millimeters
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  pageSize?: "A4" | "A5" | "Letter" | "Legal";
  
  // Content options
  includeImages?: boolean;
  imageQuality?: "low" | "medium" | "high";
  includeComments?: boolean;
  includeRevisionHistory?: boolean;
  
  // Headers and footers
  header?: string;
  footer?: string;
  pageNumbers?: boolean;
  pageNumberStyle?: "numeric" | "roman" | "alphabetic";
  
  // Custom styling
  customCSS?: string;
  customTemplate?: string;
}
```

#### Format-Specific Options

**PDF Options:**
```typescript
{
  pdfOptions: {
    orientation?: "portrait" | "landscape";
    quality?: number;          // 0-100
    printBackground?: boolean;
    scale?: number;            // 0.1-2.0
    headerTemplate?: string;
    footerTemplate?: string;
  }
}
```

**EPUB Options:**
```typescript
{
  epubOptions: {
    author?: string;
    publisher?: string;
    language?: string;         // e.g., "en"
    coverImage?: string;       // URL to cover image
    description?: string;
    isbn?: string;            // Valid ISBN-10 or ISBN-13
    subject?: string[];       // Categories/genres
    rights?: string;          // Copyright notice
  }
}
```

**DOCX Options:**
```typescript
{
  docxOptions: {
    creator?: string;
    description?: string;
    subject?: string;
    keywords?: string[];
    category?: string;
    comments?: string;
    trackRevisions?: boolean;
  }
}
```

## Template System

### Built-in Templates

#### Manuscript Template
Standard manuscript format with:
- Double-spaced lines
- 1-inch margins
- Times New Roman font
- Chapter breaks
- Author/title page

#### Book Template
Publishing-ready format with:
- Professional typography
- Chapter numbering
- Table of contents
- Copyright page (for EPUB)

#### Screenplay Template
Industry-standard format with:
- Courier New font
- Specific margin requirements
- Scene formatting
- Character/dialogue structure

#### Academic Template
Formal academic structure with:
- Citation support
- Abstract section
- Formal headings
- Bibliography formatting

#### Blog Template
Web-friendly format with:
- Modern typography
- Responsive design
- Social media optimization
- SEO-friendly structure

### Custom Templates

Create custom Handlebars templates:

```handlebars
<!DOCTYPE html>
<html>
<head>
    <title>{{document.title}}</title>
</head>
<body>
    <h1>{{document.title}}</h1>
    {{#if author.name}}
    <p class="author">by {{author.name}}</p>
    {{/if}}
    
    {{#each chapters}}
    <div class="chapter">
        <h2>{{title}}</h2>
        <div class="content">{{{content}}}</div>
    </div>
    {{/each}}
</body>
</html>
```

### Template Helpers

Available Handlebars helpers:
- `{{formatDate date "long"}}` - Format dates
- `{{wordCount text}}` - Count words in text
- `{{chapterNumber @index "roman"}}` - Format chapter numbers
- `{{if_eq a b}}` - Conditional equality
- `{{truncate text 100}}` - Truncate text
- `{{join array ", "}}` - Join arrays

## Architecture

### Service Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REST API      │    │  Export Service │    │  Job Processors │
│                 │    │                 │    │                 │
│ - Routes        │───▶│ - Orchestration │───▶│ - Export Jobs   │
│ - Validation    │    │ - Format Router │    │ - Webhook Jobs  │
│ - Rate Limiting │    │ - Options Val.  │    │ - Cleanup Jobs  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Queue System   │    │  Template Sys.  │    │   Exporters     │
│                 │    │                 │    │                 │
│ - Bull/Redis    │    │ - Handlebars    │    │ - DOCX Export   │
│ - Job Priority  │    │ - CSS Processor │    │ - PDF Export    │
│ - Progress      │    │ - Helpers       │    │ - EPUB Export   │
└─────────────────┘    └─────────────────┘    │ - MD/HTML/TXT   │
         │                       │             └─────────────────┘
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐              ▼
│ Storage Service │    │ Memory Service  │    ┌─────────────────┐
│                 │    │                 │    │   Monitoring    │
│ - S3/MinIO      │    │ - Doc Retrieval │    │                 │
│ - Presigned URLs│    │ - Content Fetch │    │ - Health Checks │
│ - File Cleanup  │    │ - User Auth     │    │ - Metrics       │
└─────────────────┘    └─────────────────┘    │ - Error Tracking│
                                              └─────────────────┘
```

### Data Flow

1. **Request Receipt**: API validates request and queues export job
2. **Job Processing**: Worker picks up job and retrieves document
3. **Content Processing**: Template system renders content with options
4. **Format Generation**: Specific exporter creates final file
5. **Storage Upload**: File uploaded to S3/MinIO with metadata
6. **Notification**: Webhook sent (if configured)
7. **Cleanup**: Expired files cleaned up automatically

## Monitoring & Observability

### Health Checks

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "service": "document-export",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "memory": true,
    "storage": true,
    "template": true
  },
  "exporters": {
    "docx": true,
    "pdf": true,
    "epub": true,
    "markdown": true,
    "html": true,
    "txt": true
  },
  "queues": {
    "export": 5,
    "batchExport": 2,
    "webhook": 0
  }
}
```

### Queue Statistics

```http
GET /queues/stats
```

### Error Handling

The service implements comprehensive error handling:

- **Validation Errors**: 400 with detailed error messages
- **Not Found**: 404 for missing documents/exports
- **Rate Limiting**: 429 with retry information
- **Server Errors**: 500 with sanitized error details
- **Timeout Handling**: Automatic job timeout and cleanup

### Logging

Structured JSON logs with Winston:
- Request/response logging
- Export job lifecycle
- Error tracking with stack traces
- Performance metrics
- Security events

## Performance & Scaling

### Optimization Strategies

1. **Concurrent Processing**: Configurable worker concurrency
2. **Queue Prioritization**: Fast formats get higher priority
3. **Template Caching**: Compiled templates cached for reuse
4. **Progress Tracking**: Real-time job progress updates
5. **Resource Limits**: Memory and file size constraints
6. **Connection Pooling**: Optimized database connections

### Scaling Considerations

- **Horizontal Scaling**: Multiple service instances share Redis queue
- **Storage Scaling**: S3/MinIO handles large file volumes
- **Queue Scaling**: Redis cluster for high-throughput scenarios
- **Memory Management**: Automatic cleanup and garbage collection
- **Rate Limiting**: Prevent abuse and ensure fair usage

## Security

### Data Protection
- **Encryption**: All files encrypted in transit and at rest
- **Access Control**: Presigned URLs with expiration
- **Data Isolation**: User-specific storage isolation
- **Audit Logging**: Complete audit trail of export operations

### API Security
- **Rate Limiting**: Prevents abuse and ensures availability
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Controlled cross-origin access
- **Webhook Security**: HMAC signature verification

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check Redis connection
redis-cli ping

# Check environment variables
npm run typecheck

# Check logs
tail -f logs/combined.log
```

#### Exports Failing
```bash
# Check queue status
curl http://localhost:3004/queues/stats

# Check specific export status
curl http://localhost:3004/export/status/your-export-id

# Check storage connectivity
aws s3 ls s3://your-bucket-name
```

#### Memory Issues
```bash
# Monitor memory usage
curl http://localhost:3004/health

# Check for memory leaks
npm run test -- --detectLeaks

# Restart service
npm run dev
```

#### Template Issues
```bash
# Validate template syntax
npm run validate-templates

# Check custom CSS
curl -X POST http://localhost:3004/export/validate \
  -H "Content-Type: application/json" \
  -d '{"format":"pdf","options":{"customCSS":"your-css"}}'
```

### Performance Issues

#### Slow Exports
1. Check Redis queue backlog
2. Increase worker concurrency
3. Optimize templates (remove heavy CSS)
4. Monitor storage upload times

#### High Memory Usage
1. Reduce concurrent exports
2. Check for template memory leaks
3. Implement more aggressive cleanup
4. Monitor large document processing

### Configuration Issues

#### Storage Problems
- Verify AWS/MinIO credentials
- Check bucket permissions
- Test connectivity manually
- Review CORS settings

#### Queue Issues
- Verify Redis connectivity
- Check Redis memory usage
- Monitor queue depth
- Review job failure rates

## Development

### Adding New Export Formats

1. Create exporter class implementing the interface
2. Add format validation
3. Update service router
4. Add comprehensive tests
5. Update documentation

```typescript
// Example: JSON exporter
export class JSONExporter {
  public async export(
    documentContent: DocumentContent,
    options: ExportOptions
  ): Promise<JSONExportResult> {
    // Implementation
  }
}
```

### Custom Templates

1. Create Handlebars template file
2. Add CSS styling
3. Register with template service
4. Add tests for rendering
5. Document template variables

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testNamePattern="ExportService"

# Run with coverage
npm test -- --coverage

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance
```

## Support

For issues and support:

1. Check this documentation
2. Review error logs
3. Check service health endpoints
4. Consult troubleshooting guide
5. Create GitHub issue with details

## License

This service is part of the Storyline platform and subject to its licensing terms.