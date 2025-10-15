const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TypeHero API',
      version: '1.0.0',
      description: 'API für den TypeHero 10-Finger-Schreibtrainer (powered by TenFingers)',
      contact: {
        name: 'TypeHero Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'maxmustermann' },
            email: { type: 'string', example: 'max@example.com' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        UserStats: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            total_lessons_completed: { type: 'integer', example: 5 },
            average_wpm: { type: 'number', format: 'float', example: 45.5 },
            average_accuracy: { type: 'number', format: 'float', example: 95.2 },
            total_practice_time: { type: 'integer', example: 3600 },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Lesson: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Grundreihe - ASDF JKL' },
            description: { type: 'string', example: 'Lerne die Grundposition deiner Finger' },
            level: { type: 'integer', example: 1 },
            text_content: { type: 'string', example: 'asdf jkl asdf jkl' },
            target_keys: { type: 'string', example: 'asdf jkl' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Progress: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer', nullable: true },
            lesson_id: { type: 'integer' },
            wpm: { type: 'number', format: 'float', example: 42.5 },
            accuracy: { type: 'number', format: 'float', example: 96.8 },
            completed: { type: 'boolean', example: true },
            is_anonymous: { type: 'boolean', example: false },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Fehlermeldung' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Pfad zu den Route-Dateien mit JSDoc-Kommentaren
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
