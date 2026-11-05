#!/usr/bin/env python3
"""
Cadence Tracker Server - Multi-User IBM SSO Enabled
A robust backend for tracking sales cadences, targeted states, roles, and ZoomInfo tags.
Supports IBM w3id OpenID Connect (OIDC) SSO, session management, and user data isolation.
Binds strictly to localhost (127.0.0.1) or specified container host according to security guidelines.
"""

import http.cookies
import http.server
import json
import os
import secrets
import sqlite3
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "127.0.0.1")  # Default to localhost
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = BASE_DIR / "data" / "cadence_tracker.db"

# Authentication & OIDC Settings
DEV_MOCK_AUTH = os.environ.get("DEV_MOCK_AUTH", "true").lower() in ("true", "1", "yes")
OIDC_CLIENT_ID = os.environ.get("OIDC_CLIENT_ID", "")
OIDC_CLIENT_SECRET = os.environ.get("OIDC_CLIENT_SECRET", "")
OIDC_DISCOVERY_URL = os.environ.get("OIDC_DISCOVERY_URL", "https://iam.cloud.ibm.com/identity/.well-known/openid-configuration")
OIDC_REDIRECT_URI = os.environ.get("OIDC_REDIRECT_URI", f"http://{HOST}:{PORT}/api/auth/callback")
ALLOWED_DOMAINS = [d.strip().lower() for d in os.environ.get("ALLOWED_EMAIL_DOMAINS", "ibm.com,kyndryl.com,redhat.com").split(",")]

# Ensure data directory exists
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                ibm_id TEXT,
                avatar_url TEXT,
                department TEXT DEFAULT 'IBM Sales & Marketing',
                role TEXT DEFAULT 'Enterprise Account Executive',
                created_at TEXT NOT NULL,
                last_login_at TEXT NOT NULL
            )
        """)

        # 2. Sessions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_token TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )
        """)

        # 3. Cadences Table (with user_id and is_shared)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cadences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE,
                created_by_name TEXT NOT NULL DEFAULT 'IBM User',
                created_by_email TEXT NOT NULL DEFAULT 'user@ibm.com',
                is_shared INTEGER DEFAULT 1,
                name TEXT NOT NULL,
                cadence_type TEXT NOT NULL,
                platform TEXT DEFAULT 'Salesloft',
                status TEXT DEFAULT 'Active',
                states TEXT NOT NULL DEFAULT '[]',
                roles TEXT NOT NULL DEFAULT '[]',
                zoominfo_tags TEXT NOT NULL DEFAULT '[]',
                enrolled_accounts INTEGER DEFAULT 0,
                enrolled_contacts INTEGER DEFAULT 0,
                step_count INTEGER DEFAULT 5,
                duration_days INTEGER DEFAULT 14,
                industry TEXT DEFAULT '',
                sequence_steps TEXT DEFAULT '[]',
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.commit()


def seed_sample_users_and_cadences():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM users")
        user_count = cursor.fetchone()["count"]
        
        now = datetime.now().isoformat()
        
        if user_count == 0:
            # Seed default IBM demo users
            sample_users = [
                {
                    "email": "nathaniel.pranata@ibm.com",
                    "name": "Nathaniel Pranata",
                    "ibm_id": "IBM-91642254",
                    "department": "IBM Security & Cloud Sales",
                    "role": "Senior Enterprise SDR Lead",
                    "avatar_url": ""
                },
                {
                    "email": "sarah.chen@ibm.com",
                    "name": "Sarah Chen",
                    "ibm_id": "IBM-88341920",
                    "department": "IBM watsonx & AI Solutions",
                    "role": "Strategic Account Executive",
                    "avatar_url": ""
                },
                {
                    "email": "marcus.vance@ibm.com",
                    "name": "Marcus Vance",
                    "ibm_id": "IBM-77124901",
                    "department": "IBM Red Hat Synergy",
                    "role": "BDR Specialist",
                    "avatar_url": ""
                }
            ]
            
            for u in sample_users:
                cursor.execute("""
                    INSERT INTO users (email, name, ibm_id, department, role, avatar_url, created_at, last_login_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (u["email"], u["name"], u["ibm_id"], u["department"], u["role"], u["avatar_url"], now, now))
            
            conn.commit()

        # Seed sample cadences if empty
        cursor.execute("SELECT COUNT(*) as count FROM cadences")
        if cursor.fetchone()["count"] == 0:
            # Retrieve user 1 (Nathaniel) and user 2 (Sarah)
            cursor.execute("SELECT id, name, email FROM users ORDER BY id ASC")
            users = cursor.fetchall()
            u1 = users[0]
            u2 = users[1] if len(users) > 1 else users[0]

            sample_cadences = [
                {
                    "user_id": u1["id"],
                    "created_by_name": u1["name"],
                    "created_by_email": u1["email"],
                    "is_shared": 1,
                    "name": "Q4 Enterprise Security Outbound",
                    "cadence_type": "Cold Outbound",
                    "platform": "Salesloft",
                    "status": "Active",
                    "states": json.dumps(["CA", "NY", "TX", "WA", "IL", "MA"]),
                    "roles": json.dumps([
                        "Chief Information Security Officer (CISO)",
                        "VP of Information Security",
                        "Director of Security Operations",
                        "Head of Cloud Security"
                    ]),
                    "zoominfo_tags": json.dumps([
                        "ZI:Tier1-Enterprise",
                        "ZI:Cybersecurity-Install-CrowdStrike",
                        "ZI:High-Intent-Cloud-Sec",
                        "ZI:Revenue-100M-Plus"
                    ]),
                    "enrolled_accounts": 142,
                    "enrolled_contacts": 420,
                    "step_count": 7,
                    "duration_days": 18,
                    "industry": "Financial Services, Technology, Healthcare",
                    "sequence_steps": json.dumps([
                        {"day": 1, "channel": "Email", "title": "Initial Value Prop: Cloud Exposure Risk"},
                        {"day": 2, "channel": "Phone", "title": "Cold Call 1 - Security Audit Trigger"},
                        {"day": 4, "channel": "LinkedIn", "title": "Connect & Share Threat Briefing"},
                        {"day": 7, "channel": "Email", "title": "Case Study: How FinTech Saved 30% SecOps"},
                        {"day": 10, "channel": "Phone", "title": "Cold Call 2 - Follow up on Case Study"},
                        {"day": 14, "channel": "Video", "title": "Personalized 45s Loom Walkthrough"},
                        {"day": 18, "channel": "Email", "title": "Graceful Breakup & Resource Kit"}
                    ]),
                    "notes": "Targeting high-intent accounts showing ZoomInfo spikes for zero-trust cloud migration.",
                    "created_at": now,
                    "updated_at": now
                },
                {
                    "user_id": u1["id"],
                    "created_by_name": u1["name"],
                    "created_by_email": u1["email"],
                    "is_shared": 1,
                    "name": "Mid-Market SaaS - VP Sales & RevOps",
                    "cadence_type": "Account-Based Marketing (ABM)",
                    "platform": "Outreach",
                    "status": "Active",
                    "states": json.dumps(["CO", "UT", "GA", "NC", "FL", "AZ", "TX"]),
                    "roles": json.dumps([
                        "VP of Sales",
                        "Director of Revenue Operations",
                        "Head of Sales Enablement",
                        "Chief Revenue Officer (CRO)"
                    ]),
                    "zoominfo_tags": json.dumps([
                        "ZI:Growth-SaaS-Series-B-C",
                        "ZI:CRM-Salesforce-User",
                        "ZI:Sales-Headcount-Growth-20+",
                        "ZI:ABM-Target-List-2026"
                    ]),
                    "enrolled_accounts": 88,
                    "enrolled_contacts": 210,
                    "step_count": 6,
                    "duration_days": 14,
                    "industry": "Software & Internet",
                    "sequence_steps": json.dumps([
                        {"day": 1, "channel": "Email", "title": "Pipeline Velocity Benchmark"},
                        {"day": 3, "channel": "Phone", "title": "Call: Pipeline conversion leakages"},
                        {"day": 5, "channel": "LinkedIn", "title": "Engage on recent post + connect"},
                        {"day": 8, "channel": "Email", "title": "ROI Calculator for RevOps"},
                        {"day": 11, "channel": "Phone", "title": "Call: Quick alignment check"},
                        {"day": 14, "channel": "Email", "title": "Permission to close file"}
                    ]),
                    "notes": "Fast growing tech accounts identified with ZoomInfo Sales Department expansion signals.",
                    "created_at": now,
                    "updated_at": now
                },
                {
                    "user_id": u2["id"],
                    "created_by_name": u2["name"],
                    "created_by_email": u2["email"],
                    "is_shared": 1,
                    "name": "watsonx GenAI Enterprise Inbound Follow-up",
                    "cadence_type": "Inbound Follow-up",
                    "platform": "HubSpot",
                    "status": "Active",
                    "states": json.dumps(["CA", "NY", "IL", "TX", "MA", "WA"]),
                    "roles": json.dumps([
                        "Chief Technology Officer (CTO)",
                        "Head of AI / Data Science",
                        "VP of Engineering",
                        "Chief Data Officer (CDO)"
                    ]),
                    "zoominfo_tags": json.dumps([
                        "ZI:AI-Evaluation-Intent",
                        "ZI:Cloud-Hyperscaler-User",
                        "ZI:Tier1-Enterprise",
                        "ZI:High-Priority-Inbound"
                    ]),
                    "enrolled_accounts": 95,
                    "enrolled_contacts": 240,
                    "step_count": 5,
                    "duration_days": 10,
                    "industry": "Enterprise IT & Financial",
                    "sequence_steps": json.dumps([
                        {"day": 1, "channel": "Email", "title": "watsonx.governance trial access & sandbox"},
                        {"day": 2, "channel": "Phone", "title": "Call: Architecture discovery & model guardrails"},
                        {"day": 4, "channel": "LinkedIn", "title": "Share IBM Research GenAI benchmark paper"},
                        {"day": 7, "channel": "Email", "title": "Enterprise ROI Calculator & Case Studies"},
                        {"day": 10, "channel": "Meeting", "title": "Executive AI strategy session scheduled"}
                    ]),
                    "notes": "Rapid response cadence for IBM watsonx inbound trial signups and demo requests.",
                    "created_at": now,
                    "updated_at": now
                },
                {
                    "user_id": u1["id"],
                    "created_by_name": u1["name"],
                    "created_by_email": u1["email"],
                    "is_shared": 1,
                    "name": "Lost Opportunity Re-Engagement (Closed-Lost > 6mo)",
                    "cadence_type": "Lost Opp Re-engagement",
                    "platform": "Apollo",
                    "status": "Active",
                    "states": json.dumps(["NY", "NJ", "PA", "CT", "MA", "IL", "OH"]),
                    "roles": json.dumps([
                        "VP of IT",
                        "Chief Information Officer (CIO)",
                        "Director of Enterprise Applications",
                        "VP of Procurement"
                    ]),
                    "zoominfo_tags": json.dumps([
                        "ZI:Closed-Lost-Revisit",
                        "ZI:Executive-Leadership-Change",
                        "ZI:Vendor-Renewal-Window-Q4"
                    ]),
                    "enrolled_accounts": 45,
                    "enrolled_contacts": 89,
                    "step_count": 4,
                    "duration_days": 12,
                    "industry": "Manufacturing, Retail, Financial",
                    "sequence_steps": json.dumps([
                        {"day": 1, "channel": "Email", "title": "Major platform updates since we last spoke"},
                        {"day": 4, "channel": "Phone", "title": "Call: Quick feedback catch-up"},
                        {"day": 8, "channel": "LinkedIn", "title": "Content share: 2026 Industry Report"},
                        {"day": 12, "channel": "Email", "title": "Open door note for next budget cycle"}
                    ]),
                    "notes": "Triggered when ZoomInfo detects executive transitions or contract renewal periods on past deals.",
                    "created_at": now,
                    "updated_at": now
                },
                {
                    "user_id": u2["id"],
                    "created_by_name": u2["name"],
                    "created_by_email": u2["email"],
                    "is_shared": 1,
                    "name": "Annual Tier 1 Renewal & Expansion",
                    "cadence_type": "Renewal / Expansion",
                    "platform": "Gong",
                    "status": "Active",
                    "states": json.dumps(["CA", "NY", "TX", "MA", "WA", "IL", "VA", "NC"]),
                    "roles": json.dumps([
                        "Chief Executive Officer (CEO)",
                        "Chief Information Officer (CIO)",
                        "VP of Procurement",
                        "Executive Sponsor"
                    ]),
                    "zoominfo_tags": json.dumps([
                        "ZI:Key-Customer-Tier1",
                        "ZI:Expansion-Candidate-CrossSell",
                        "ZI:Contract-Renewal-90-Days"
                    ]),
                    "enrolled_accounts": 30,
                    "enrolled_contacts": 75,
                    "step_count": 5,
                    "duration_days": 21,
                    "industry": "Enterprise Accounts",
                    "sequence_steps": json.dumps([
                        {"day": 1, "channel": "Email", "title": "Annual Executive Value Review & Metrics"},
                        {"day": 5, "channel": "Phone", "title": "Call: Align on Q1 strategic roadmap"},
                        {"day": 10, "channel": "LinkedIn", "title": "Executive congratulatory note"},
                        {"day": 15, "channel": "Email", "title": "Expansion Proposal & Multi-year Savings"},
                        {"day": 21, "channel": "Meeting", "title": "Quarterly Business Review scheduled"}
                    ]),
                    "notes": "Cadence for high-value client renewals 90 days prior to contract expiration.",
                    "created_at": now,
                    "updated_at": now
                }
            ]

            for c in sample_cadences:
                cursor.execute("""
                    INSERT INTO cadences (
                        user_id, created_by_name, created_by_email, is_shared,
                        name, cadence_type, platform, status, states, roles,
                        zoominfo_tags, enrolled_accounts, enrolled_contacts,
                        step_count, duration_days, industry, sequence_steps, notes,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    c["user_id"], c["created_by_name"], c["created_by_email"], c["is_shared"],
                    c["name"], c["cadence_type"], c["platform"], c["status"],
                    c["states"], c["roles"], c["zoominfo_tags"],
                    c["enrolled_accounts"], c["enrolled_contacts"],
                    c["step_count"], c["duration_days"], c["industry"],
                    c["sequence_steps"], c["notes"], c["created_at"], c["updated_at"]
                ))
            conn.commit()


# Session & User Helpers
def get_user_from_request(headers):
    cookie_header = headers.get("Cookie", "")
    if not cookie_header:
        return None
    
    cookies = http.cookies.SimpleCookie()
    try:
        cookies.load(cookie_header)
    except Exception:
        return None
    
    if "cadence_session" not in cookies:
        return None
    
    session_token = cookies["cadence_session"].value
    if not session_token:
        return None
    
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.*, s.expires_at 
            FROM sessions s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.session_token = ? AND s.expires_at > ?
        """, (session_token, now))
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None


def create_user_session(user_id):
    session_token = secrets.token_urlsafe(32)
    now = datetime.now()
    expires_at = (now + timedelta(days=7)).isoformat()
    created_at = now.isoformat()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sessions (session_token, user_id, created_at, expires_at)
            VALUES (?, ?, ?, ?)
        """, (session_token, user_id, created_at, expires_at))
        cursor.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (created_at, user_id))
        conn.commit()
    
    return session_token, expires_at


class CadenceHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def _send_json(self, data, status_code=200, set_cookie_header=None):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Cookie")
        self.send_header("Access-Control-Allow-Credentials", "true")
        if set_cookie_header:
            self.send_header("Set-Cookie", set_cookie_header)
        self.end_headers()
        self.wfile.write(body)

    def _send_error_json(self, message, status_code=400):
        self._send_json({"error": str(message)}, status_code=status_code)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Cookie")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path.startswith("/api/"):
            return self.handle_api_get(path, query)

        # Serve static files
        if path == "/" or path == "":
            self.path = "/index.html"
        return super().do_GET()

    def handle_api_get(self, path, query):
        try:
            # Public endpoint: Health check
            if path == "/api/health":
                return self._send_json({"status": "healthy", "service": "cadence-tracker", "timestamp": datetime.now().isoformat()})

            # Public endpoint: Auth configuration
            if path == "/api/auth/config":
                return self._send_json({
                    "dev_mock_auth": DEV_MOCK_AUTH,
                    "allowed_domains": ALLOWED_DOMAINS,
                    "app_name": "Cadence Tracker (IBM RevOps)"
                })

            # Check authenticated user for all other endpoints
            current_user = get_user_from_request(self.headers)

            if path == "/api/auth/me":
                if not current_user:
                    return self._send_error_json("Unauthenticated", 401)
                # Omit sensitive fields
                return self._send_json({
                    "authenticated": True,
                    "user": {
                        "id": current_user["id"],
                        "name": current_user["name"],
                        "email": current_user["email"],
                        "ibm_id": current_user.get("ibm_id", ""),
                        "department": current_user.get("department", "IBM Sales"),
                        "role": current_user.get("role", "Sales Representative"),
                        "avatar_url": current_user.get("avatar_url", "")
                    }
                })

            # Public list of available demo users (useful for testing multi-user separation)
            if path == "/api/auth/users":
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT id, name, email, department, role FROM users ORDER BY id ASC")
                    users = [dict(r) for r in cursor.fetchall()]
                    return self._send_json({"users": users})

            # If unauthenticated, reject API calls
            if not current_user:
                return self._send_error_json("Authentication required. Please sign in with your IBM credentials.", 401)

            with get_db() as conn:
                cursor = conn.cursor()

                if path == "/api/cadences":
                    # Filter parameters
                    scope = query.get("scope", ["all"])[0]  # 'my', 'team', or 'all'
                    type_filter = query.get("type", [None])[0]
                    status_filter = query.get("status", [None])[0]
                    state_filter = query.get("state", [None])[0]
                    role_filter = query.get("role", [None])[0]
                    tag_filter = query.get("tag", [None])[0]
                    search = query.get("q", [None])[0]

                    sql = "SELECT * FROM cadences WHERE 1=1"
                    params = []

                    # Multi-user scope filtering
                    if scope == "my":
                        sql += " AND user_id = ?"
                        params.append(current_user["id"])
                    elif scope == "team":
                        sql += " AND user_id != ? AND is_shared = 1"
                        params.append(current_user["id"])
                    else: # 'all'
                        sql += " AND (user_id = ? OR is_shared = 1)"
                        params.append(current_user["id"])

                    if type_filter and type_filter != "all":
                        sql += " AND cadence_type = ?"
                        params.append(type_filter)

                    if status_filter and status_filter != "all":
                        sql += " AND status = ?"
                        params.append(status_filter)

                    if search:
                        search_pattern = f"%{search}%"
                        sql += """ AND (
                            name LIKE ? OR 
                            cadence_type LIKE ? OR 
                            platform LIKE ? OR 
                            industry LIKE ? OR 
                            notes LIKE ? OR 
                            states LIKE ? OR 
                            roles LIKE ? OR 
                            zoominfo_tags LIKE ? OR
                            created_by_name LIKE ?
                        )"""
                        params.extend([search_pattern] * 9)

                    sql += " ORDER BY updated_at DESC"
                    cursor.execute(sql, params)
                    rows = cursor.fetchall()

                    cadences = []
                    for row in rows:
                        item = dict(row)
                        item["states"] = json.loads(item["states"]) if item["states"] else []
                        item["roles"] = json.loads(item["roles"]) if item["roles"] else []
                        item["zoominfo_tags"] = json.loads(item["zoominfo_tags"]) if item["zoominfo_tags"] else []
                        item["sequence_steps"] = json.loads(item["sequence_steps"]) if item["sequence_steps"] else []
                        item["is_owner"] = (item["user_id"] == current_user["id"])

                        # Post-filter for JSON arrays if requested
                        if state_filter and state_filter != "all":
                            if state_filter.upper() not in [s.upper() for s in item["states"]]:
                                continue

                        if role_filter and role_filter != "all":
                            if not any(role_filter.lower() in r.lower() for r in item["roles"]):
                                continue

                        if tag_filter and tag_filter != "all":
                            if not any(tag_filter.lower() in t.lower() for t in item["zoominfo_tags"]):
                                continue

                        cadences.append(item)

                    return self._send_json({"cadences": cadences, "total": len(cadences)})

                elif path.startswith("/api/cadences/"):
                    cadence_id_str = path.replace("/api/cadences/", "")
                    if not cadence_id_str.isdigit():
                        return self._send_error_json("Invalid cadence ID", 400)
                    cadence_id = int(cadence_id_str)
                    cursor.execute("SELECT * FROM cadences WHERE id = ? AND (user_id = ? OR is_shared = 1)", (cadence_id, current_user["id"]))
                    row = cursor.fetchone()
                    if not row:
                        return self._send_error_json("Cadence not found or access restricted", 404)
                    item = dict(row)
                    item["states"] = json.loads(item["states"]) if item["states"] else []
                    item["roles"] = json.loads(item["roles"]) if item["roles"] else []
                    item["zoominfo_tags"] = json.loads(item["zoominfo_tags"]) if item["zoominfo_tags"] else []
                    item["sequence_steps"] = json.loads(item["sequence_steps"]) if item["sequence_steps"] else []
                    item["is_owner"] = (item["user_id"] == current_user["id"])
                    return self._send_json(item)

                elif path == "/api/stats":
                    scope = query.get("scope", ["all"])[0]
                    if scope == "my":
                        cursor.execute("SELECT * FROM cadences WHERE user_id = ?", (current_user["id"],))
                    else:
                        cursor.execute("SELECT * FROM cadences WHERE (user_id = ? OR is_shared = 1)", (current_user["id"],))
                    
                    rows = cursor.fetchall()
                    total_cadences = len(rows)
                    active_cadences = 0
                    total_accounts = 0
                    total_contacts = 0
                    my_cadences_count = 0
                    team_cadences_count = 0
                    cadence_types = {}
                    states_distribution = {}
                    roles_distribution = {}
                    tags_distribution = {}
                    platforms_distribution = {}

                    for r in rows:
                        if r["user_id"] == current_user["id"]:
                            my_cadences_count += 1
                        else:
                            team_cadences_count += 1

                        st = r["status"]
                        if st == "Active":
                            active_cadences += 1
                        total_accounts += r["enrolled_accounts"] or 0
                        total_contacts += r["enrolled_contacts"] or 0

                        ct = r["cadence_type"]
                        cadence_types[ct] = cadence_types.get(ct, 0) + 1

                        pf = r["platform"] or "Other"
                        platforms_distribution[pf] = platforms_distribution.get(pf, 0) + 1

                        states = json.loads(r["states"]) if r["states"] else []
                        for s in states:
                            states_distribution[s] = states_distribution.get(s, 0) + 1

                        roles = json.loads(r["roles"]) if r["roles"] else []
                        for role in roles:
                            roles_distribution[role] = roles_distribution.get(role, 0) + 1

                        tags = json.loads(r["zoominfo_tags"]) if r["zoominfo_tags"] else []
                        for tag in tags:
                            tags_distribution[tag] = tags_distribution.get(tag, 0) + 1

                    return self._send_json({
                        "total_cadences": total_cadences,
                        "my_cadences_count": my_cadences_count,
                        "team_cadences_count": team_cadences_count,
                        "active_cadences": active_cadences,
                        "total_accounts": total_accounts,
                        "total_contacts": total_contacts,
                        "cadence_types": cadence_types,
                        "states_distribution": states_distribution,
                        "roles_distribution": roles_distribution,
                        "tags_distribution": tags_distribution,
                        "platforms_distribution": platforms_distribution,
                        "unique_states_count": len(states_distribution),
                        "unique_roles_count": len(roles_distribution),
                        "unique_tags_count": len(tags_distribution)
                    })

                elif path == "/api/options":
                    cursor.execute("SELECT cadence_type, platform, states, roles, zoominfo_tags FROM cadences WHERE (user_id = ? OR is_shared = 1)", (current_user["id"],))
                    rows = cursor.fetchall()

                    types_set = set(["Cold Outbound", "Account-Based Marketing (ABM)", "Inbound Follow-up", "Event Follow-up", "Renewal / Expansion", "Executive Outreach", "Lost Opp Re-engagement", "Partner Nurture"])
                    platforms_set = set(["Salesloft", "Outreach", "HubSpot", "Apollo", "Gong", "Lemlist", "Salesforce High Velocity", "Custom"])
                    states_set = set()
                    roles_set = set([
                        "Chief Information Security Officer (CISO)", "Chief Technology Officer (CTO)",
                        "Chief Information Officer (CIO)", "VP of Sales", "VP of Engineering",
                        "VP of Information Security", "Director of IT", "Director of Security Operations",
                        "Director of Revenue Operations", "Head of Sales Enablement", "Chief Revenue Officer (CRO)",
                        "VP of Operations", "Cloud Architect Lead", "Procurement Lead"
                    ])
                    tags_set = set([
                        "ZI:Tier1-Enterprise", "ZI:High-Intent-Cloud-Sec", "ZI:Revenue-100M-Plus",
                        "ZI:Growth-SaaS-Series-B-C", "ZI:CRM-Salesforce-User", "ZI:Sales-Headcount-Growth-20+",
                        "ZI:Closed-Lost-Revisit", "ZI:Executive-Leadership-Change", "ZI:Vendor-Renewal-Window-Q4",
                        "ZI:AWS-Summit-2026-Booth-Badge"
                    ])

                    for r in rows:
                        if r["cadence_type"]:
                            types_set.add(r["cadence_type"])
                        if r["platform"]:
                            platforms_set.add(r["platform"])
                        states = json.loads(r["states"]) if r["states"] else []
                        states_set.update(states)
                        roles = json.loads(r["roles"]) if r["roles"] else []
                        roles_set.update(roles)
                        tags = json.loads(r["zoominfo_tags"]) if r["zoominfo_tags"] else []
                        tags_set.update(tags)

                    return self._send_json({
                        "cadence_types": sorted(list(types_set)),
                        "platforms": sorted(list(platforms_set)),
                        "existing_states": sorted(list(states_set)),
                        "existing_roles": sorted(list(roles_set)),
                        "existing_tags": sorted(list(tags_set))
                    })

                elif path == "/api/export":
                    cursor.execute("SELECT * FROM cadences WHERE user_id = ? ORDER BY id ASC", (current_user["id"],))
                    rows = cursor.fetchall()
                    cadences = []
                    for row in rows:
                        item = dict(row)
                        item["states"] = json.loads(item["states"]) if item["states"] else []
                        item["roles"] = json.loads(item["roles"]) if item["roles"] else []
                        item["zoominfo_tags"] = json.loads(item["zoominfo_tags"]) if item["zoominfo_tags"] else []
                        item["sequence_steps"] = json.loads(item["sequence_steps"]) if item["sequence_steps"] else []
                        cadences.append(item)
                    return self._send_json({
                        "export_date": datetime.now().isoformat(),
                        "exported_by": current_user["email"],
                        "version": "2.0",
                        "cadences": cadences
                    })

                else:
                    return self._send_error_json("Endpoint not found", 404)

        except Exception as e:
            return self._send_error_json(f"Server error: {str(e)}", 500)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not path.startswith("/api/"):
            return self._send_error_json("Invalid API path", 404)

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8")) if body else {}

            # Auth POST endpoints: Login & Logout
            if path == "/api/auth/login":
                # Handle IBM credentials login / simulation
                email = str(data.get("email", "")).strip().lower()
                name = str(data.get("name", "")).strip()
                department = str(data.get("department", "IBM Sales")).strip()
                role = str(data.get("role", "Sales Representative")).strip()

                if not email:
                    return self._send_error_json("IBM email address is required", 400)

                # Validate email domain for IBM compliance
                domain = email.split("@")[-1] if "@" in email else ""
                if not any(domain.endswith(allowed) for allowed in ALLOWED_DOMAINS):
                    return self._send_error_json(f"Access restricted to IBM employees (@ibm.com, @kyndryl.com, @redhat.com)", 403)

                if not name:
                    # Generate human name from email prefix (e.g. nathaniel.pranata -> Nathaniel Pranata)
                    user_part = email.split("@")[0].replace(".", " ").replace("_", " ")
                    name = " ".join([word.capitalize() for word in user_part.split()])

                now = datetime.now().isoformat()
                with get_db() as conn:
                    cursor = conn.cursor()
                    # Find or create user
                    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
                    row = cursor.fetchone()
                    if row:
                        user_id = row["id"]
                        cursor.execute("UPDATE users SET name = ?, department = ?, role = ?, last_login_at = ? WHERE id = ?", (name, department, role, now, user_id))
                    else:
                        cursor.execute("""
                            INSERT INTO users (email, name, ibm_id, department, role, created_at, last_login_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (email, name, f"IBM-{secrets.randbelow(89999999)+10000000}", department, role, now, now))
                        user_id = cursor.lastrowid
                    conn.commit()

                # Issue secure session cookie
                session_token, expires_at = create_user_session(user_id)
                cookie_str = f"cadence_session={session_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800"

                return self._send_json({
                    "message": "Successfully logged in with IBM credentials",
                    "user": {
                        "id": user_id,
                        "email": email,
                        "name": name,
                        "department": department,
                        "role": role
                    }
                }, 200, set_cookie_header=cookie_str)

            elif path == "/api/auth/logout":
                cookie_str = "cadence_session=deleted; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0"
                return self._send_json({"message": "Successfully logged out"}, 200, set_cookie_header=cookie_str)

            # Protected POST endpoints
            current_user = get_user_from_request(self.headers)
            if not current_user:
                return self._send_error_json("Authentication required", 401)

            with get_db() as conn:
                cursor = conn.cursor()

                if path == "/api/cadences":
                    name = str(data.get("name", "")).strip()
                    cadence_type = str(data.get("cadence_type", "")).strip()
                    if not name or not cadence_type:
                        return self._send_error_json("Cadence Name and Cadence Type are required", 400)

                    platform = str(data.get("platform", "Salesloft")).strip()
                    status = str(data.get("status", "Active")).strip()
                    is_shared = 1 if data.get("is_shared", True) else 0
                    states = json.dumps(data.get("states", []))
                    roles = json.dumps(data.get("roles", []))
                    zoominfo_tags = json.dumps(data.get("zoominfo_tags", []))
                    enrolled_accounts = int(data.get("enrolled_accounts", 0) or 0)
                    enrolled_contacts = int(data.get("enrolled_contacts", 0) or 0)
                    step_count = int(data.get("step_count", 5) or 5)
                    duration_days = int(data.get("duration_days", 14) or 14)
                    industry = str(data.get("industry", "")).strip()
                    sequence_steps = json.dumps(data.get("sequence_steps", []))
                    notes = str(data.get("notes", "")).strip()
                    now = datetime.now().isoformat()

                    cursor.execute("""
                        INSERT INTO cadences (
                            user_id, created_by_name, created_by_email, is_shared,
                            name, cadence_type, platform, status, states, roles,
                            zoominfo_tags, enrolled_accounts, enrolled_contacts,
                            step_count, duration_days, industry, sequence_steps, notes,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        current_user["id"], current_user["name"], current_user["email"], is_shared,
                        name, cadence_type, platform, status, states, roles,
                        zoominfo_tags, enrolled_accounts, enrolled_contacts,
                        step_count, duration_days, industry, sequence_steps, notes,
                        now, now
                    ))
                    conn.commit()
                    new_id = cursor.lastrowid
                    return self._send_json({"id": new_id, "message": "Cadence created successfully"}, 201)

                elif path == "/api/import":
                    cadences_to_import = data.get("cadences", [])
                    if not isinstance(cadences_to_import, list):
                        return self._send_error_json("Invalid import payload: expected cadences array", 400)

                    imported_count = 0
                    now = datetime.now().isoformat()
                    for item in cadences_to_import:
                        name = str(item.get("name", "")).strip()
                        cadence_type = str(item.get("cadence_type", "")).strip()
                        if not name or not cadence_type:
                            continue

                        platform = str(item.get("platform", "Salesloft")).strip()
                        status = str(item.get("status", "Active")).strip()
                        is_shared = 1 if item.get("is_shared", True) else 0
                        states = json.dumps(item.get("states", []))
                        roles = json.dumps(item.get("roles", []))
                        zoominfo_tags = json.dumps(item.get("zoominfo_tags", []))
                        enrolled_accounts = int(item.get("enrolled_accounts", 0) or 0)
                        enrolled_contacts = int(item.get("enrolled_contacts", 0) or 0)
                        step_count = int(item.get("step_count", 5) or 5)
                        duration_days = int(item.get("duration_days", 14) or 14)
                        industry = str(item.get("industry", "")).strip()
                        sequence_steps = json.dumps(item.get("sequence_steps", []))
                        notes = str(item.get("notes", "")).strip()

                        cursor.execute("""
                            INSERT INTO cadences (
                                user_id, created_by_name, created_by_email, is_shared,
                                name, cadence_type, platform, status, states, roles,
                                zoominfo_tags, enrolled_accounts, enrolled_contacts,
                                step_count, duration_days, industry, sequence_steps, notes,
                                created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            current_user["id"], current_user["name"], current_user["email"], is_shared,
                            name, cadence_type, platform, status, states, roles,
                            zoominfo_tags, enrolled_accounts, enrolled_contacts,
                            step_count, duration_days, industry, sequence_steps, notes,
                            item.get("created_at", now), now
                        ))
                        imported_count += 1

                    conn.commit()
                    return self._send_json({"imported": imported_count, "message": f"Imported {imported_count} cadences"})

                elif path == "/api/reset-samples":
                    cursor.execute("DELETE FROM cadences WHERE user_id = ?", (current_user["id"],))
                    conn.commit()
                    seed_sample_users_and_cadences()
                    return self._send_json({"message": "Sample data reset successfully"})

                else:
                    return self._send_error_json("Endpoint not found", 404)

        except Exception as e:
            return self._send_error_json(f"Server error: {str(e)}", 500)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not path.startswith("/api/cadences/"):
            return self._send_error_json("Invalid API path", 404)

        try:
            current_user = get_user_from_request(self.headers)
            if not current_user:
                return self._send_error_json("Authentication required", 401)

            cadence_id_str = path.replace("/api/cadences/", "")
            if not cadence_id_str.isdigit():
                return self._send_error_json("Invalid cadence ID", 400)
            cadence_id = int(cadence_id_str)

            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8")) if body else {}

            with get_db() as conn:
                cursor = conn.cursor()
                # Check ownership
                cursor.execute("SELECT id, user_id FROM cadences WHERE id = ?", (cadence_id,))
                existing = cursor.fetchone()
                if not existing:
                    return self._send_error_json("Cadence not found", 404)
                if existing["user_id"] != current_user["id"]:
                    return self._send_error_json("Permission denied: you can only edit cadences you created", 403)

                name = str(data.get("name", "")).strip()
                cadence_type = str(data.get("cadence_type", "")).strip()
                if not name or not cadence_type:
                    return self._send_error_json("Cadence Name and Cadence Type are required", 400)

                platform = str(data.get("platform", "Salesloft")).strip()
                status = str(data.get("status", "Active")).strip()
                is_shared = 1 if data.get("is_shared", True) else 0
                states = json.dumps(data.get("states", []))
                roles = json.dumps(data.get("roles", []))
                zoominfo_tags = json.dumps(data.get("zoominfo_tags", []))
                enrolled_accounts = int(data.get("enrolled_accounts", 0) or 0)
                enrolled_contacts = int(data.get("enrolled_contacts", 0) or 0)
                step_count = int(data.get("step_count", 5) or 5)
                duration_days = int(data.get("duration_days", 14) or 14)
                industry = str(data.get("industry", "")).strip()
                sequence_steps = json.dumps(data.get("sequence_steps", []))
                notes = str(data.get("notes", "")).strip()
                now = datetime.now().isoformat()

                cursor.execute("""
                    UPDATE cadences SET
                        name = ?,
                        cadence_type = ?,
                        platform = ?,
                        status = ?,
                        is_shared = ?,
                        states = ?,
                        roles = ?,
                        zoominfo_tags = ?,
                        enrolled_accounts = ?,
                        enrolled_contacts = ?,
                        step_count = ?,
                        duration_days = ?,
                        industry = ?,
                        sequence_steps = ?,
                        notes = ?,
                        updated_at = ?
                    WHERE id = ? AND user_id = ?
                """, (
                    name, cadence_type, platform, status, is_shared, states, roles,
                    zoominfo_tags, enrolled_accounts, enrolled_contacts,
                    step_count, duration_days, industry, sequence_steps, notes,
                    now, cadence_id, current_user["id"]
                ))
                conn.commit()
                return self._send_json({"message": "Cadence updated successfully", "id": cadence_id})

        except Exception as e:
            return self._send_error_json(f"Server error: {str(e)}", 500)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not path.startswith("/api/cadences/"):
            return self._send_error_json("Invalid API path", 404)

        try:
            current_user = get_user_from_request(self.headers)
            if not current_user:
                return self._send_error_json("Authentication required", 401)

            cadence_id_str = path.replace("/api/cadences/", "")
            if not cadence_id_str.isdigit():
                return self._send_error_json("Invalid cadence ID", 400)
            cadence_id = int(cadence_id_str)

            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id, user_id FROM cadences WHERE id = ?", (cadence_id,))
                existing = cursor.fetchone()
                if not existing:
                    return self._send_error_json("Cadence not found", 404)
                if existing["user_id"] != current_user["id"]:
                    return self._send_error_json("Permission denied: you can only delete cadences you created", 403)

                cursor.execute("DELETE FROM cadences WHERE id = ? AND user_id = ?", (cadence_id, current_user["id"]))
                conn.commit()
                return self._send_json({"message": f"Cadence {cadence_id} deleted successfully"})

        except Exception as e:
            return self._send_error_json(f"Server error: {str(e)}", 500)


def run_server():
    init_db()
    seed_sample_users_and_cadences()
    server_address = (HOST, PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, CadenceHandler)
    print(f"============================================================")
    print(f"  Cadence Tracker Server (IBM SSO Enabled)")
    print(f"  URL: http://{HOST}:{PORT}/")
    print(f"  Auth Mode: {'Mock IBM SSO (Development)' if DEV_MOCK_AUTH else 'Live OIDC IBM SSO'}")
    print(f"============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
