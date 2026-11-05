# ==============================================================================
# Compliant Red Hat Minimal Container for Cadence Tracker
# Sourced from Red Hat UBI minimal Python 3.11 registry
# ==============================================================================
FROM registry.access.redhat.com/ubi9/python-311:latest

# Create non-root user and group
USER root
RUN useradd -m -u 1001 appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app

# Set working directory
WORKDIR /app

# Copy application source code
COPY --chown=appuser:appuser . /app

# Switch to non-root user
USER 1001

# Expose internal port
EXPOSE 8000

# Set environment defaults
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=127.0.0.1

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')" || exit 1

# Start server
CMD ["python3", "server.py"]
