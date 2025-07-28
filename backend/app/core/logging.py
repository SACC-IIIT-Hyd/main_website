"""
Logging configuration for the SACC Website Backend.

This module provides structured logging capabilities with JSON formatting
for production environments and human-readable formatting for development.

@module: app.core.logging
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from app.core.logging import get_logger

    logger = get_logger(__name__)
    logger.info("Application started", component="main")
    ```
"""

import logging
import sys
from typing import Any, Optional
from pathlib import Path
from functools import lru_cache
import json

from .config import get_settings


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging.

    This formatter outputs log records as JSON objects, making them
    suitable for log aggregation systems and structured analysis.
    """

    def format(self, record: logging.LogRecord) -> str:
        """
        Format the log record as a JSON string.

        Args:
            record: The log record to format

        Returns:
            str: JSON-formatted log message
        """
        log_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add any extra fields passed to the log call
        if hasattr(record, 'component'):
            log_data['component'] = getattr(record, 'component')

        if hasattr(record, 'user_id'):
            log_data['user_id'] = getattr(record, 'user_id')

        if hasattr(record, 'request_id'):
            log_data['request_id'] = getattr(record, 'request_id')

        # Add exception information if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        # Add any additional custom fields
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname',
                           'levelno', 'pathname', 'filename', 'module',
                           'lineno', 'funcName', 'created', 'msecs',
                           'relativeCreated', 'thread', 'threadName',
                           'processName', 'process', 'message', 'exc_info',
                           'exc_text', 'stack_info', 'component', 'user_id',
                           'request_id']:
                log_data[key] = value

        try:
            return json.dumps(log_data, default=str)
        except (TypeError, ValueError):
            return json.dumps(log_data, default=str)


class ColoredFormatter(logging.Formatter):
    """
    Colored formatter for development environments.

    This formatter provides colored output for different log levels,
    making it easier to read logs during development.
    """

    # Color codes for different log levels
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }

    RESET = '\033[0m'

    def format(self, record: logging.LogRecord) -> str:
        """
        Format the log record with colors.

        Args:
            record: The log record to format

        Returns:
            str: Colored log message
        """
        color = self.COLORS.get(record.levelname, '')
        reset = self.RESET

        # Format the base message
        formatted = super().format(record)

        # Add component information if available
        if hasattr(record, 'component'):
            formatted = f"[{getattr(record, 'component')}] {formatted}"

        return f"{color}{formatted}{reset}"


def configure_logging() -> None:
    """
    Configure the logging system based on application settings.

    This function sets up the root logger with appropriate handlers
    and formatters based on the current environment configuration.
    """
    settings = get_settings()

    # Get the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(
        getattr(logging, str(settings.log_level).upper(), logging.INFO))

    # Clear any existing handlers
    root_logger.handlers.clear()

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(
        getattr(logging, str(settings.log_level).upper(), logging.INFO))

    # Choose formatter based on environment
    if settings.debug:
        # Use colored formatter for development
        formatter = ColoredFormatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    else:
        # Use JSON formatter for production
        formatter = JSONFormatter(
            datefmt='%Y-%m-%dT%H:%M:%S'
        )

    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    # Add file handler for production
    if not settings.debug:
        file_handler = logging.FileHandler(logs_dir / "app.log")
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(JSONFormatter(datefmt='%Y-%m-%dT%H:%M:%S'))
        root_logger.addHandler(file_handler)

        # Add error file handler
        error_handler = logging.FileHandler(logs_dir / "error.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter(datefmt='%Y-%m-%dT%H:%M:%S'))
        root_logger.addHandler(error_handler)

    # Configure uvicorn logger to use our format
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.handlers.clear()
    uvicorn_logger.addHandler(console_handler)
    uvicorn_logger.propagate = False

    # Configure uvicorn access logger
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.handlers.clear()
    uvicorn_access_logger.addHandler(console_handler)
    uvicorn_access_logger.propagate = False


@lru_cache()
def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a configured logger instance.

    This function returns a logger instance configured with the
    application's logging settings. The logger is cached to improve
    performance.

    Args:
        name: Name for the logger (typically __name__)

    Returns:
        logging.Logger: Configured logger instance

    Example:
        ```python
        from app.core.logging import get_logger

        logger = get_logger(__name__)
        logger.info("Starting application", component="main")
        ```
    """
    # Setup logging on first call
    if not logging.getLogger().handlers:
        configure_logging()

    return logging.getLogger(name)


# Convenience function for structured logging
def log_with_context(
    logger: logging.Logger,
    level: str,
    message: str,
    **context: Any
) -> None:
    """
    Log a message with additional context fields.

    This function provides a convenient way to add structured context
    to log messages, which is especially useful for debugging and monitoring.

    Args:
        logger: The logger instance to use
        level: Log level (debug, info, warning, error, critical)
        message: The log message
        **context: Additional context fields to include

    Example:
        ```python
        log_with_context(
            logger,
            "info",
            "User logged in",
            user_id="12345",
            component="auth",
            ip_address="192.168.1.1"
        )
        ```
    """
    log_method = getattr(logger, level.lower(), logger.info)

    # Create a temporary record to add context
    if context:
        record = logging.LogRecord(
            name=logger.name,
            level=getattr(logging, level.upper(), logging.INFO),
            pathname="",
            lineno=0,
            msg=message,
            args=(),
            exc_info=None
        )

        # Add context fields to the record
        for key, value in context.items():
            setattr(record, key, value)

        logger.handle(record)
    else:
        log_method(message)


# Initialize logging when module is imported
configure_logging()
