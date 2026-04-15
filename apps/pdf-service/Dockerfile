FROM python:3.11-slim
RUN apt-get update && apt-get install -y qpdf --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY python/ python/
# Flatten blank PDFs to remove complex compression
RUN for f in python/blank_*.pdf; do qpdf --decrypt --object-streams=disable "$f" "${f%.pdf}_flat.pdf" && mv "${f%.pdf}_flat.pdf" "$f" || true; done
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
