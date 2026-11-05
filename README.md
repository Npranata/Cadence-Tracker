# 🎯 Cadence Tracker (IBM RevOps & Sales Hub)

A secure, multi-tenant web application designed for IBM Sales, SDR, BDR, and Revenue Operations teams to systematically track, organize, and analyze multi-channel outreach cadences, targeted geographic states, buyer persona roles, and ZoomInfo account tags.

---

## 🔐 Multi-User IBM Single Sign-On (SSO) & Data Isolation

- **IBM Authentication**: Users sign in with their IBM credentials (`@ibm.com`, `@kyndryl.com`, `@redhat.com`).
- **User-Scoped Workspaces**:
  - **My Cadences**: Manage your personal active cadences, targeting parameters, and performance.
  - **Team Shared**: View and clone high-performing cadence templates created by your IBM peers.
  - **Role-Based Access Control (RBAC)**: Only the cadence creator can edit or delete their cadence; teammates can view and 1-click clone targeting setups.
- **Session Management**: Cryptographically secure HTTP-only cookies (`SameSite=Lax`, 7-day expiration).

---

## 🚀 Key Features

### 1. 📋 Cadence Type & Sequence Tracking
- **Cadence Types**: Cold Outbound, Account-Based Marketing (ABM), Inbound Follow-up, Event Follow-up, Renewal / Expansion, Executive Outreach, Lost Opp Re-engagement, Partner Nurture, and Custom Types.
- **Platforms**: Salesloft, Outreach, HubSpot, Apollo.io, Gong Engage, Lemlist, Salesforce High Velocity, etc.
- **Metrics**: Enrolled target accounts, enrolled contact leads, touchpoint step count, and duration in days.

### 2. 🗺️ Geographic State Targeting & Coverage Matrix
- **Interactive 50-State Multi-Selector** with regional bulk presets (*West*, *Northeast*, *Midwest*, *South*, *All 50*, *Clear*).
- **US States Coverage Matrix View**: Real-time visual territory heatmap across all 50 states + DC, showing cadence concentration.

### 3. 👤 Targeted Roles & Buyer Personas
- Persona tagging system for B2B buyer titles (*CISO*, *VP of Sales*, *CTO*, *Director of IT*, *Head of RevOps*, *Director of Security Operations*, *VP Engineering*).
- Quick role suggestion chips + custom role creator.

### 4. 🏷️ ZoomInfo Account Tagging Command Center
- Systematic tracking of **ZoomInfo tags** stamped onto accounts inside each cadence (e.g., `ZI:Tier1-Enterprise`, `ZI:High-Intent-Cloud-Sec`, `ZI:Growth-SaaS-Series-B-C`, `ZI:AWS-Summit-2026-Booth-Badge`, `ZI:Contract-Renewal-90-Days`).
- **ZoomInfo Tag Catalog**: Cross-cadence directory showing account coverage, cadence frequency, and tag drill-down.

### 5. 📊 Analytics, Export & Collaboration
- **View Modes**: Visual Cadence Cards, Spreadsheet Data Table, US States Matrix, and ZoomInfo Tag Catalog.
- **Data Export & Backup**: One-click export to **CSV** and **JSON Backup** with import restore.
- **1-Click Cadence Cloning**: Duplicate targeting settings into a new campaign in seconds.

---

## 🏃 Running the Application

### Local Development / Quick Start:
```bash
cd ~/.bob/playground/cadence-tracker
./start.sh
```
*(Or run `python3 server.py` directly)*

Then open your browser to **http://127.0.0.1:8000** and select your IBM profile or enter your `@ibm.com` email address.

---

## 🐳 Container & Cloud Deployment (Red Hat UBI Minimal)

The application includes a production-ready, security-compliant Dockerfile based on Red Hat's container registry:

```bash
# Build the container image
podman build -t cadence-tracker:latest .

# Run with non-root user and custom port
podman run -d -p 8000:8000 -e DEV_MOCK_AUTH=false cadence-tracker:latest
```

### Production Environment Variables (`.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Listening server port | `8000` |
| `HOST` | Binding address | `127.0.0.1` |
| `DEV_MOCK_AUTH` | Enable local development IBM auth | `true` |
| `OIDC_CLIENT_ID` | IBM Cloud App ID / w3id OIDC Client ID | `""` |
| `OIDC_CLIENT_SECRET` | IBM Cloud App ID / w3id Client Secret | `""` |
| `OIDC_DISCOVERY_URL` | OpenID Connect discovery endpoint | IBM IAM Discovery |
| `ALLOWED_EMAIL_DOMAINS` | Allowed corporate domains | `ibm.com,kyndryl.com,redhat.com` |

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Current authenticated IBM user profile |
| `POST` | `/api/auth/login` | IBM Single Sign-On / w3id authentication |
| `POST` | `/api/auth/logout` | Invalidate session and clear cookies |
| `GET` | `/api/cadences` | List cadences (`?scope=my|team|all`, `?type=`, `?state=`, `?role=`, `?tag=`, `?q=`) |
| `GET` | `/api/cadences/:id` | Get single cadence details |
| `POST` | `/api/cadences` | Create a new user-scoped cadence |
| `PUT` | `/api/cadences/:id` | Update cadence (owner-restricted) |
| `DELETE` | `/api/cadences/:id` | Delete cadence (owner-restricted) |
| `GET` | `/api/stats` | KPI aggregates and territory distributions |
| `GET` | `/api/options` | Unique metadata options for filters |
| `GET` | `/api/export` | Export user cadences to JSON |
| `POST` | `/api/import` | Import cadences backup |
| `GET` | `/api/health` | Container healthcheck endpoint |
