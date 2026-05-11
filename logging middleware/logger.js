const winston = require('winston');
const morgan = require('morgan');

// Configure Winston logger for structured logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Write all logs with level `info` and below to `app.log`
    new winston.transports.File({ filename: 'logs/app.log' }),
    // Write all errors to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

// If we're not in production then log to the console with a readable format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create a stream object with a write function that will be used by Morgan
logger.stream = {
  write: function(message, encoding) {
    // Morgan adds a newline at the end of each message, so we remove it
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

/**
 * Middleware wrapper combining Morgan HTTP logging with Winston's structured logging.
 * Logs method, URL, status, response time, and content length.
 */
const loggingMiddleware = morgan(
  ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms',
  { stream: logger.stream }
);

module.exports = {
  logger,
  loggingMiddleware
};
