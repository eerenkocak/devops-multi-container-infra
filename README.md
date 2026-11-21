# 🐳 Production-Grade Multi-Container Architecture (Node.js & PostgreSQL)

[🌍 English Documentation](#english-version) | [🇹🇷 Türkçe Dökümantasyon](#türkçe-versiyon)

---

## <a name="english-version"></a>🇺🇸 English Version

This repository demonstrates a secure, high-performance, and fully isolated multi-container microservice infrastructure utilizing **Docker** and **Docker Compose**. The architecture encapsulates a Node.js REST API with statistical anomaly detection and CloudWatch-compatible structured logging interacting with an isolated PostgreSQL database instance.

### 🚀 Key Engineering & Optimization Practices

* **Smart Pre-Flight Entrypoint (`entrypoint.sh`):** Validates critical environment variables and verifies database TCP socket reachability before handing over PID 1 execution (`exec "$@"`) to preserve graceful `SIGTERM` shutdown signals.
* **Test & Production Environment Isolation:** Separates environments via dedicated `.env.prod` and `.env.test` profiles, dynamically scoping bridge networks (`prod_backend_network` vs `test_backend_network`), persistent volumes, and host ports (`3000` vs `3001`) without collision.
* **CloudWatch-Compatible JSON Structured Logging:** Emits machine-parseable JSON telemetry logs (`timestamp`, `level`, `environment`, `latency_ms`, `status_code`) configured with Docker log rotation ready for AWS CloudWatch Logs / FluentBit ingestion.
* **Statistical API Anomaly Detection (Z-Score):** Tracks a sliding window of recent HTTP request latencies in memory and calculates standard deviation (`Z-Score > 3.0`) to flag sudden performance degradations (`ANOMALY` logs) and expose live metrics via `/metrics`.
* **Multi-Stage Build Architecture:** Segregates build-time dependencies from the final runtime workspace using `node:20-alpine`, reducing the final container image size from **~900MB to ~65MB**.
* **Network Isolation & Non-Root Execution:** Keeps PostgreSQL unexposed to the host (`expose` only) and runs the Node.js runtime under the unprivileged `USER node` directive.

### 📐 Project Architecture
```text
devops-multi-container-infra/
├── app/
│   ├── package.json     # Node.js production manifests
│   └── server.js        # REST API, CloudWatch JSON logger & Z-Score anomaly engine
├── Dockerfile           # Optimized multi-stage build manifest
├── entrypoint.sh        # Pre-flight validation & PID 1 handover script
├── docker-compose.yml   # Dynamic multi-environment network & storage orchestrator
├── .env.example         # Environment variable template (committed)
├── .env.prod            # Production environment secrets (gitignored)
├── .env.test            # Test environment secrets (gitignored)
└── .dockerignore        # Build context security & optimization filter
```

### ⚙️ Orchestration & Deployment

#### 1. Configure Environment Profiles
Create your local environment profiles from the template:
```bash
cp .env.example .env.prod
cp .env.example .env.test
```

#### 2. Deploy Isolated Environments (Prod & Test)
Run Production (Port `3000`) and Test (Port `3001`) stacks side-by-side with complete network and volume isolation:
```bash
# Start Production Stack
docker compose -p prod --env-file .env.prod up -d --build

# Start Isolated Test Stack
docker compose -p test --env-file .env.test up -d --build
```

#### 3. Verify Telemetry & Anomaly Metrics
```bash
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

---

## <a name="türkçe-versiyon"></a>🇹🇷 Türkçe Versiyon

Bu depo, **Docker** ve **Docker Compose** kullanılarak yapılandırılmış, yüksek performanslı, ortam izolasyonlu ve gözlemlenebilirlik (observability) odaklı kurumsal bir multi-container mikroservis altyapısıdır. Sistem, istatistiksel anomali tespiti ve CloudWatch uyumlu JSON loglama yeteneğine sahip bir Node.js REST API ile izole PostgreSQL veritabanı katmanından oluşmaktadır.

### 🚀 Öne Çıkan Mühendislik Pratikleri

* **Akıllı Başlangıç Betiği (`entrypoint.sh`):** Konteyner ayağa kalkmadan önce kritik çevre değişkenlerini ve veritabanı ağ erişimini doğrular; ardından `exec "$@"` ile PID 1 kontrolünü devrederek `SIGTERM` sinyallerinin güvenli kapanışı bozmasını engeller.
* **Test ve Prod Ortam İzolasyonu:** `.env.prod` ve `.env.test` profilleri sayesinde Test ve Production ortamları aynı makinede dahi birbirinden tamamen bağımsız ağlar (`prod_backend_network` / `test_backend_network`), ayrı veri hacimleri (volumes) ve çakışmayan portlar (`3000` / `3001`) üzerinde çalışır.
* **CloudWatch Uyumlu Yapısal JSON Loglama:** Düz metin yerine AWS CloudWatch Logs Insights ve log toplayıcılar (FluentBit) tarafından doğrudan indekslenebilen yapısal JSON logları üretir.
* **İstatistiksel API Anomali Tespiti (Z-Score):** Son 50 isteğin yanıt sürelerini (latency) hafızada tutarak standart sapma hesabı yapar; normal ortalamadan `3 standart sapma` (`Z-Score > 3.0`) daha yavaş yanıtları otomatik olarak `ANOMALY` seviyesinde loglar ve `/metrics` adresinden canlı sunar.
* **Çok Aşamalı İnşa (Multi-Stage Build) ve Güvenlik:** `node:20-alpine` tabanında imaj boyutu **~900MB'tan ~65MB seviyesine** indirilmiş, veritabanı dış dünyaya kapatılmış (`expose`) ve uygulama yetkisiz `USER node` kullanıcısı ile izole edilmiştir.

### ⚙️ Canlıya Alma ve Çalıştırma

#### 1. Ortam Dosyalarını Hazırlayın
```bash
cp .env.example .env.prod
cp .env.example .env.test
```

#### 2. İzole Ortamları Ayağa Kaldırın (Prod ve Test)
```bash
# Production Ortamını Başlat (Port 3000)
docker compose -p prod --env-file .env.prod up -d --build

# İzole Test Ortamını Başlat (Port 3001)
docker compose -p test --env-file .env.test up -d --build
```

#### 3. Sağlık ve Anomali Metriklerini Kontrol Edin
```bash
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```
