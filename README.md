# 🐳 Production-Grade Multi-Container Architecture (Node.js & PostgreSQL)

[🌍 English Documentation](#english-version) | [🇹🇷 Türkçe Dökümantasyon](#türkçe-versiyon)

---

## <a name="english-version"></a>🇺🇸 English Version

This repository demonstrates a secure, high-performance, and fully optimized multi-container microservice infrastructure utilizing **Docker** and **Docker Compose**. The architecture encapsulates a Node.js REST API interacting with an isolated PostgreSQL database instance.

### 🚀 Key Engineering & Optimization Practices

* **Multi-Stage Build Architecture:** Segregates build-time dependencies from the final runtime workspace using `node:20-alpine`. This approach effectively reduced the final container image size from **~900MB to ~65MB**, significantly accelerating CI/CD deployment pipelines.
* **Network Isolation & Security Hardening:** Implements a strict private bridge network (`backend-network`). The PostgreSQL layer explicitly avoids port mapping to the host system (`ports`), using `expose` instead to guarantee it is only reachable by the web application layer.
* **Secured Non-Root Execution:** The application process abandons root privileges inside the container by utilizing the unprivileged `USER node` directive to minimize potential attack surfaces.
* **Resilient Orchestration & Healthchecks:** Configured with advanced health probing (`pg_isready`). The web application delivery waits specifically for the database to achieve a `service_healthy` status before initializing to eliminate race conditions during boot.
* **Persistent Data Infrastructure:** Implements named Docker volumes (`postgres_data`) linked to the database directory, ensuring telemetry logs and application states persist across container lifecycles.

### 📐 Project Architecture
```text
devops-multi-container/
├── app/
│   ├── package.json     # Node.js production manifests
│   └── server.js        # REST API & connection orchestration
├── Dockerfile           # Optimized multi-stage build manifest
├── .dockerignore        # Context optimization filter
└── docker-compose.yml   # Multi-service network & storage orchestrator
```

### ⚙️ Orchestration & Deployment

#### 1. Provision the Environment
Deploy the complete decoupled stack in detached background mode:
```bash
docker-compose up -d
```

#### 2. Verify Fleet Infrastructure Status
Inspect health states and network distribution:
```bash
docker ps
```

---

## <a name="türkçe-versiyon"></a>🇹🇷 Türkçe Versiyon

Bu depo, **Docker** ve **Docker Compose** kullanılarak yapılandırılmış, yüksek performanslı ve güvenlik öncelikli bir multi-container mikroservis altyapısı mimarisidir. Sistem, dış dünyaya kapalı izole bir ağ üzerinde haberleşen bir Node.js REST API ve PostgreSQL veritabanı katmanından oluşmaktadır.

### 🚀 Öne Çıkan Mühendislik Pratikleri

* **Çok Aşamalı İnşa (Multi-Stage Build):** Geliştirme bağımlılıklarını çalışma zamanından ayırarak `node:20-alpine` tabanında imaj boyutu **~900MB'tan ~65MB seviyesine** düşürülmüştür.
* **Ağ İzolasyonu (Network Isolation):** Oluşturulan özel köprü ağ (`backend-network`) sayesinde veritabanı dış dünyaya tamamen kapatılmış (`expose`), yalnızca API konteynerinin erişebileceği şekilde izole edilmiştir.
* **Yetkisiz Kullanıcı Güvenliği (Non-Root Execution):** Konteyner içi güvenlik standartları gereği işlemler en yetkili (root) kullanıcı yerine kısıtlı `USER node` yetkileri ile çalıştırılmaktadır.
* **Akıllı Başlangıç Senaryosu (Healthchecks):** Veritabanına entegre edilen `pg_isready` denetimi sayesinde, API katmanı veritabanı tamamen hazır (`service_healthy`) hale gelmeden ayağa kalkmaz ve çökme risklerini sıfıra indirir.
* **Veri Kalıcılığı (Data Persistence):** Tanımlanan `postgres_data` hacmi (volume) sayesinde konteynerler silinse dahi veritabanı kayıtları güvenle korunur.

### ⚙️ Canlıya Alma ve Çalıştırma

#### 1. Sistemi Başlatın
Tüm altyapıyı arka planda tek komutla ayağa kaldırın:
```bash
docker-compose up -d
```

#### 2. Altyapı Sağlık Durumunu Kontrol Edin
```bash
docker ps
```
