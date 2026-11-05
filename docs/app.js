/**
 * Cadence Tracker Frontend Application Logic (IBM SSO & Multi-Tenant Enabled)
 * Manages Cadence Types, Targeted States, Roles, ZoomInfo Tags & Multi-User Workspaces
 */

// All 50 US States + DC with metadata
const US_STATES = [
  { code: 'AL', name: 'Alabama', region: 'south' },
  { code: 'AK', name: 'Alaska', region: 'west' },
  { code: 'AZ', name: 'Arizona', region: 'west' },
  { code: 'AR', name: 'Arkansas', region: 'south' },
  { code: 'CA', name: 'California', region: 'west' },
  { code: 'CO', name: 'Colorado', region: 'west' },
  { code: 'CT', name: 'Connecticut', region: 'northeast' },
  { code: 'DE', name: 'Delaware', region: 'south' },
  { code: 'FL', name: 'Florida', region: 'south' },
  { code: 'GA', name: 'Georgia', region: 'south' },
  { code: 'HI', name: 'Hawaii', region: 'west' },
  { code: 'ID', name: 'Idaho', region: 'west' },
  { code: 'IL', name: 'Illinois', region: 'midwest' },
  { code: 'IN', name: 'Indiana', region: 'midwest' },
  { code: 'IA', name: 'Iowa', region: 'midwest' },
  { code: 'KS', name: 'Kansas', region: 'midwest' },
  { code: 'KY', name: 'Kentucky', region: 'south' },
  { code: 'LA', name: 'Louisiana', region: 'south' },
  { code: 'ME', name: 'Maine', region: 'northeast' },
  { code: 'MD', name: 'Maryland', region: 'south' },
  { code: 'MA', name: 'Massachusetts', region: 'northeast' },
  { code: 'MI', name: 'Michigan', region: 'midwest' },
  { code: 'MN', name: 'Minnesota', region: 'midwest' },
  { code: 'MS', name: 'Mississippi', region: 'south' },
  { code: 'MO', name: 'Missouri', region: 'midwest' },
  { code: 'MT', name: 'Montana', region: 'west' },
  { code: 'NE', name: 'Nebraska', region: 'midwest' },
  { code: 'NV', name: 'Nevada', region: 'west' },
  { code: 'NH', name: 'New Hampshire', region: 'northeast' },
  { code: 'NJ', name: 'New Jersey', region: 'northeast' },
  { code: 'NM', name: 'New Mexico', region: 'west' },
  { code: 'NY', name: 'New York', region: 'northeast' },
  { code: 'NC', name: 'North Carolina', region: 'south' },
  { code: 'ND', name: 'North Dakota', region: 'midwest' },
  { code: 'OH', name: 'Ohio', region: 'midwest' },
  { code: 'OK', name: 'Oklahoma', region: 'south' },
  { code: 'OR', name: 'Oregon', region: 'west' },
  { code: 'PA', name: 'Pennsylvania', region: 'northeast' },
  { code: 'RI', name: 'Rhode Island', region: 'northeast' },
  { code: 'SC', name: 'South Carolina', region: 'south' },
  { code: 'SD', name: 'South Dakota', region: 'midwest' },
  { code: 'TN', name: 'Tennessee', region: 'south' },
  { code: 'TX', name: 'Texas', region: 'south' },
  { code: 'UT', name: 'Utah', region: 'west' },
  { code: 'VT', name: 'Vermont', region: 'northeast' },
  { code: 'VA', name: 'Virginia', region: 'south' },
  { code: 'WA', name: 'Washington', region: 'west' },
  { code: 'WV', name: 'West Virginia', region: 'south' },
  { code: 'WI', name: 'Wisconsin', region: 'midwest' },
  { code: 'WY', name: 'Wyoming', region: 'west' },
  { code: 'DC', name: 'District of Columbia', region: 'south' }
];

// App State
const state = {
  currentUser: null,
  cadences: [],
  filteredCadences: [],
  stats: null,
  options: null,
  currentView: 'grid',
  currentScope: 'all', // 'all', 'my', 'team'
  activeFilters: {
    type: 'all',
    status: 'all',
    state: 'all',
    search: '',
    role: 'all',
    tag: 'all'
  },
  formData: {
    selectedStates: new Set(),
    roles: new Set(),
    ziTags: new Set()
  }
};

// DOM Elements
const elements = {
  // Auth & User Profile
  authOverlay: document.getElementById('authOverlay'),
  loginForm: document.getElementById('loginForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginName: document.getElementById('loginName'),
  demoUserList: document.getElementById('demoUserList'),
  userAvatar: document.getElementById('userAvatar'),
  userName: document.getElementById('userName'),
  btnUserMenu: document.getElementById('btnUserMenu'),
  userMenu: document.getElementById('userMenu'),
  menuUserFullName: document.getElementById('menuUserFullName'),
  menuUserEmail: document.getElementById('menuUserEmail'),
  menuUserRole: document.getElementById('menuUserRole'),
  btnSwitchUser: document.getElementById('btnSwitchUser'),
  btnLogout: document.getElementById('btnLogout'),
  // Views
  cadencesGridContainer: document.getElementById('cadencesGridContainer'),
  cadencesTableBody: document.getElementById('cadencesTableBody'),
  noResultsGrid: document.getElementById('noResultsGrid'),
  statesMatrixGrid: document.getElementById('statesMatrixGrid'),
  ziTagsCatalogContainer: document.getElementById('ziTagsCatalogContainer'),
  viewGrid: document.getElementById('viewGrid'),
  viewTable: document.getElementById('viewTable'),
  viewGeo: document.getElementById('viewGeo'),
  viewZITags: document.getElementById('viewZITags'),
  globalSearchInput: document.getElementById('globalSearchInput'),
  mobileSearchInput: document.getElementById('mobileSearchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  filterType: document.getElementById('filterType'),
  filterStatus: document.getElementById('filterStatus'),
  filterState: document.getElementById('filterState'),
  btnResetFilters: document.getElementById('btnResetFilters'),
  activeFilterPills: document.getElementById('activeFilterPills'),
  pillsContainer: document.getElementById('pillsContainer'),
  tagSearchInput: document.getElementById('tagSearchInput'),
  // Stats
  statTotalCadences: document.getElementById('statTotalCadences'),
  statActiveCadences: document.getElementById('statActiveCadences'),
  statTotalAccounts: document.getElementById('statTotalAccounts'),
  statTotalContacts: document.getElementById('statTotalContacts'),
  statStatesCovered: document.getElementById('statStatesCovered'),
  statUniqueRoles: document.getElementById('statUniqueRoles'),
  statUniqueTags: document.getElementById('statUniqueTags'),
  // Modal Elements
  cadenceModal: document.getElementById('cadenceModal'),
  modalTitle: document.getElementById('modalTitle'),
  cadenceForm: document.getElementById('cadenceForm'),
  formCadenceId: document.getElementById('formCadenceId'),
  formName: document.getElementById('formName'),
  formStatus: document.getElementById('formStatus'),
  formTypeSelect: document.getElementById('formTypeSelect'),
  formCustomType: document.getElementById('formCustomType'),
  formPlatform: document.getElementById('formPlatform'),
  formIndustry: document.getElementById('formIndustry'),
  formStepCount: document.getElementById('formStepCount'),
  formDurationDays: document.getElementById('formDurationDays'),
  formAccounts: document.getElementById('formAccounts'),
  formContacts: document.getElementById('formContacts'),
  formIsShared: document.getElementById('formIsShared'),
  formStatesSelector: document.getElementById('formStatesSelector'),
  selectedStateCount: document.getElementById('selectedStateCount'),
  formRoleInput: document.getElementById('formRoleInput'),
  btnAddRole: document.getElementById('btnAddRole'),
  formRolesContainer: document.getElementById('formRolesContainer'),
  formZITagInput: document.getElementById('formZITagInput'),
  btnAddZITag: document.getElementById('btnAddZITag'),
  formZITagsContainer: document.getElementById('formZITagsContainer'),
  formNotes: document.getElementById('formNotes'),
  btnSaveCadence: document.getElementById('btnSaveCadence'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnCancelModal: document.getElementById('btnCancelModal'),
  btnNewCadence: document.getElementById('btnNewCadence'),
  // Detail Modal
  detailModal: document.getElementById('detailModal'),
  detailName: document.getElementById('detailName'),
  detailCreator: document.getElementById('detailCreator'),
  detailTypeBadge: document.getElementById('detailTypeBadge'),
  detailStatusBadge: document.getElementById('detailStatusBadge'),
  detailPlatformBadge: document.getElementById('detailPlatformBadge'),
  detailAccounts: document.getElementById('detailAccounts'),
  detailContacts: document.getElementById('detailContacts'),
  detailDuration: document.getElementById('detailDuration'),
  detailIndustry: document.getElementById('detailIndustry'),
  detailStatesContainer: document.getElementById('detailStatesContainer'),
  detailRolesContainer: document.getElementById('detailRolesContainer'),
  detailZITagsContainer: document.getElementById('detailZITagsContainer'),
  detailSequenceTimeline: document.getElementById('detailSequenceTimeline'),
  detailNotes: document.getElementById('detailNotes'),
  btnCloseDetailModal: document.getElementById('btnCloseDetailModal'),
  btnDetailEdit: document.getElementById('btnDetailEdit'),
  btnDetailClone: document.getElementById('btnDetailClone'),
  btnDetailDelete: document.getElementById('btnDetailDelete'),
  // Export & Utilities
  btnExportMenu: document.getElementById('btnExportMenu'),
  exportMenu: document.getElementById('exportMenu'),
  btnExportCSV: document.getElementById('btnExportCSV'),
  btnExportJSON: document.getElementById('btnExportJSON'),
  importFileInput: document.getElementById('importFileInput'),
  btnResetSamples: document.getElementById('btnResetSamples'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  toastContainer: document.getElementById('toastContainer'),
  cardStatesCovered: document.getElementById('cardStatesCovered'),
  cardZoomInfoTags: document.getElementById('cardZoomInfoTags')
};

let currentDetailCadence = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  populateStateDropdown();
  renderFormStateChips();
  checkAuthAndInit();
});

// Theme Management
function initTheme() {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }
}

// Toast Notifications
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-blue-600';
  const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
  
  toast.className = `toast-item flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg text-white text-xs font-medium ${bg} transform transition-all duration-300`;
  toast.innerHTML = `<i class="fa-solid ${icon} text-sm"></i><span>${escapeHtml(message)}</span>`;
  
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Dual-Mode Support: Cloud Server API + Zero-Setup Standalone Static Hosting
let isStaticMode = false;

// LocalStorage Persistence Keys
const LS_USER_KEY = 'cadence_tracker_current_user';
const LS_CADENCES_KEY = 'cadence_tracker_cadences_v2';
const LS_USERS_KEY = 'cadence_tracker_users_v2';

// Seed demo data for static mode
function initStaticStorageIfEmpty() {
  if (!localStorage.getItem(LS_USERS_KEY)) {
    const demoUsers = [
      { id: 1, email: 'nathaniel.pranata@ibm.com', name: 'Nathaniel Pranata', department: 'IBM Security & Cloud Sales', role: 'Senior Enterprise SDR Lead' },
      { id: 2, email: 'sarah.chen@ibm.com', name: 'Sarah Chen', department: 'IBM watsonx & AI Solutions', role: 'Strategic Account Executive' },
      { id: 3, email: 'marcus.vance@ibm.com', name: 'Marcus Vance', department: 'IBM Red Hat Synergy', role: 'BDR Specialist' }
    ];
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(demoUsers));
  }

  if (!localStorage.getItem(LS_CADENCES_KEY)) {
    const demoCadences = [
      {
        id: 1,
        user_id: 1,
        created_by_name: 'Nathaniel Pranata',
        created_by_email: 'nathaniel.pranata@ibm.com',
        is_shared: 1,
        name: 'Q4 Enterprise Security Outbound',
        cadence_type: 'Cold Outbound',
        platform: 'Salesloft',
        status: 'Active',
        states: ['CA', 'NY', 'TX', 'WA', 'IL', 'MA'],
        roles: ['Chief Information Security Officer (CISO)', 'VP of Information Security', 'Director of Security Operations', 'Head of Cloud Security'],
        zoominfo_tags: ['ZI:Tier1-Enterprise', 'ZI:Cybersecurity-Install-CrowdStrike', 'ZI:High-Intent-Cloud-Sec', 'ZI:Revenue-100M-Plus'],
        enrolled_accounts: 142,
        enrolled_contacts: 420,
        step_count: 7,
        duration_days: 18,
        industry: 'Financial Services, Technology, Healthcare',
        sequence_steps: [
          { day: 1, channel: 'Email', title: 'Initial Value Prop: Cloud Exposure Risk' },
          { day: 2, channel: 'Phone', title: 'Cold Call 1 - Security Audit Trigger' },
          { day: 4, channel: 'LinkedIn', title: 'Connect & Share Threat Briefing' },
          { day: 7, channel: 'Email', title: 'Case Study: How FinTech Saved 30% SecOps' },
          { day: 10, channel: 'Phone', title: 'Cold Call 2 - Follow up on Case Study' },
          { day: 14, channel: 'Video', title: 'Personalized 45s Loom Walkthrough' },
          { day: 18, channel: 'Email', title: 'Graceful Breakup & Resource Kit' }
        ],
        notes: 'Targeting high-intent accounts showing ZoomInfo spikes for zero-trust cloud migration.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 1,
        created_by_name: 'Nathaniel Pranata',
        created_by_email: 'nathaniel.pranata@ibm.com',
        is_shared: 1,
        name: 'Mid-Market SaaS - VP Sales & RevOps',
        cadence_type: 'Account-Based Marketing (ABM)',
        platform: 'Outreach',
        status: 'Active',
        states: ['CO', 'UT', 'GA', 'NC', 'FL', 'AZ', 'TX'],
        roles: ['VP of Sales', 'Director of Revenue Operations', 'Head of Sales Enablement', 'Chief Revenue Officer (CRO)'],
        zoominfo_tags: ['ZI:Growth-SaaS-Series-B-C', 'ZI:CRM-Salesforce-User', 'ZI:Sales-Headcount-Growth-20+', 'ZI:ABM-Target-List-2026'],
        enrolled_accounts: 88,
        enrolled_contacts: 210,
        step_count: 6,
        duration_days: 14,
        industry: 'Software & Internet',
        sequence_steps: [
          { day: 1, channel: 'Email', title: 'Pipeline Velocity Benchmark' },
          { day: 3, channel: 'Phone', title: 'Call: Pipeline conversion leakages' },
          { day: 5, channel: 'LinkedIn', title: 'Engage on recent post + connect' },
          { day: 8, channel: 'Email', title: 'ROI Calculator for RevOps' },
          { day: 11, channel: 'Phone', title: 'Call: Quick alignment check' },
          { day: 14, channel: 'Email', title: 'Permission to close file' }
        ],
        notes: 'Fast growing tech accounts identified with ZoomInfo Sales Department expansion signals.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        user_id: 2,
        created_by_name: 'Sarah Chen',
        created_by_email: 'sarah.chen@ibm.com',
        is_shared: 1,
        name: 'watsonx GenAI Enterprise Inbound Follow-up',
        cadence_type: 'Inbound Follow-up',
        platform: 'HubSpot',
        status: 'Active',
        states: ['CA', 'NY', 'IL', 'TX', 'MA', 'WA'],
        roles: ['Chief Technology Officer (CTO)', 'Head of AI / Data Science', 'VP of Engineering', 'Chief Data Officer (CDO)'],
        zoominfo_tags: ['ZI:AI-Evaluation-Intent', 'ZI:Cloud-Hyperscaler-User', 'ZI:Tier1-Enterprise', 'ZI:High-Priority-Inbound'],
        enrolled_accounts: 95,
        enrolled_contacts: 240,
        step_count: 5,
        duration_days: 10,
        industry: 'Enterprise IT & Financial',
        sequence_steps: [
          { day: 1, channel: 'Email', title: 'watsonx.governance trial access & sandbox' },
          { day: 2, channel: 'Phone', title: 'Call: Architecture discovery & model guardrails' },
          { day: 4, channel: 'LinkedIn', title: 'Share IBM Research GenAI benchmark paper' },
          { day: 7, channel: 'Email', title: 'Enterprise ROI Calculator & Case Studies' },
          { day: 10, channel: 'Meeting', title: 'Executive AI strategy session scheduled' }
        ],
        notes: 'Rapid response cadence for IBM watsonx inbound trial signups and demo requests.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        user_id: 1,
        created_by_name: 'Nathaniel Pranata',
        created_by_email: 'nathaniel.pranata@ibm.com',
        is_shared: 1,
        name: 'Lost Opportunity Re-Engagement (Closed-Lost > 6mo)',
        cadence_type: 'Lost Opp Re-engagement',
        platform: 'Apollo',
        status: 'Active',
        states: ['NY', 'NJ', 'PA', 'CT', 'MA', 'IL', 'OH'],
        roles: ['VP of IT', 'Chief Information Officer (CIO)', 'Director of Enterprise Applications', 'VP of Procurement'],
        zoominfo_tags: ['ZI:Closed-Lost-Revisit', 'ZI:Executive-Leadership-Change', 'ZI:Vendor-Renewal-Window-Q4'],
        enrolled_accounts: 45,
        enrolled_contacts: 89,
        step_count: 4,
        duration_days: 12,
        industry: 'Manufacturing, Retail, Financial',
        sequence_steps: [
          { day: 1, channel: 'Email', title: 'Major platform updates since we last spoke' },
          { day: 4, channel: 'Phone', title: 'Call: Quick feedback catch-up' },
          { day: 8, channel: 'LinkedIn', title: 'Content share: 2026 Industry Report' },
          { day: 12, channel: 'Email', title: 'Open door note for next budget cycle' }
        ],
        notes: 'Triggered when ZoomInfo detects executive transitions or contract renewal periods on past deals.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 5,
        user_id: 2,
        created_by_name: 'Sarah Chen',
        created_by_email: 'sarah.chen@ibm.com',
        is_shared: 1,
        name: 'Annual Tier 1 Renewal & Expansion',
        cadence_type: 'Renewal / Expansion',
        platform: 'Gong',
        status: 'Active',
        states: ['CA', 'NY', 'TX', 'MA', 'WA', 'IL', 'VA', 'NC'],
        roles: ['Chief Executive Officer (CEO)', 'Chief Information Officer (CIO)', 'VP of Procurement', 'Executive Sponsor'],
        zoominfo_tags: ['ZI:Key-Customer-Tier1', 'ZI:Expansion-Candidate-CrossSell', 'ZI:Contract-Renewal-90-Days'],
        enrolled_accounts: 30,
        enrolled_contacts: 75,
        step_count: 5,
        duration_days: 21,
        industry: 'Enterprise Accounts',
        sequence_steps: [
          { day: 1, channel: 'Email', title: 'Annual Executive Value Review & Metrics' },
          { day: 5, channel: 'Phone', title: 'Call: Align on Q1 strategic roadmap' },
          { day: 10, channel: 'LinkedIn', title: 'Executive congratulatory note' },
          { day: 15, channel: 'Email', title: 'Expansion Proposal & Multi-year Savings' },
          { day: 21, channel: 'Meeting', title: 'Quarterly Business Review scheduled' }
        ],
        notes: 'Cadence for high-value client renewals 90 days prior to contract expiration.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(LS_CADENCES_KEY, JSON.stringify(demoCadences));
  }
}

// Authentication & Session
async function checkAuthAndInit() {
  initStaticStorageIfEmpty();

  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      state.currentUser = data.user;
      renderUserProfile();
      elements.authOverlay.classList.add('hidden');
      fetchOptions();
      loadCadences();
      loadStats();
      return;
    }
  } catch (err) {
    // Backend API unavailable: running in Standalone Static Web mode
    isStaticMode = true;
    console.info('Running in Standalone Web Mode (Instant Browser Deployment)');
  }

  // Check saved user in LocalStorage
  const savedUser = localStorage.getItem(LS_USER_KEY);
  if (savedUser) {
    try {
      state.currentUser = JSON.parse(savedUser);
      renderUserProfile();
      elements.authOverlay.classList.add('hidden');
      fetchOptions();
      loadCadences();
      loadStats();
      return;
    } catch (e) {}
  }

  showLoginOverlay();
}

async function showLoginOverlay() {
  elements.authOverlay.classList.remove('hidden');
  try {
    const res = await fetch('/api/auth/users');
    if (res.ok) {
      const data = await res.json();
      renderDemoUsers(data.users);
      return;
    }
  } catch (e) {
    isStaticMode = true;
  }

  // Fallback to static stored users
  const usersJson = localStorage.getItem(LS_USERS_KEY);
  if (usersJson) {
    try {
      renderDemoUsers(JSON.parse(usersJson));
    } catch (e) {}
  }
}

function renderDemoUsers(users) {
  const list = elements.demoUserList;
  list.innerHTML = '';
  if (!users) return;

  users.forEach(u => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'w-full text-left p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition flex items-center justify-between text-xs';
    
    const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    btn.innerHTML = `
      <div class="flex items-center space-x-2.5 min-w-0">
        <div class="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
          ${initials}
        </div>
        <div class="min-w-0">
          <p class="font-bold text-slate-800 dark:text-slate-200 truncate">${escapeHtml(u.name)}</p>
          <p class="text-[10px] text-slate-400 truncate">${escapeHtml(u.email)}</p>
        </div>
      </div>
      <span class="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold flex-shrink-0">Sign In</span>
    `;

    btn.addEventListener('click', () => {
      loginWithIBM(u.email, u.name, u.department, u.role);
    });

    list.appendChild(btn);
  });
}

async function loginWithIBM(email, name = '', department = 'IBM Sales', role = 'Sales Representative') {
  try {
    if (!isStaticMode) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, department, role })
      });

      if (res.ok) {
        const data = await res.json();
        state.currentUser = data.user;
        localStorage.setItem(LS_USER_KEY, JSON.stringify(data.user));
        renderUserProfile();
        elements.authOverlay.classList.add('hidden');
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        fetchOptions();
        loadCadences();
        loadStats();
        return;
      }
    }
  } catch (err) {
    isStaticMode = true;
  }

  // Static LocalStorage Fallback Login
  if (!name) {
    const userPart = email.split('@')[0].replace(/[._]/g, ' ');
    name = userPart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  const userObj = {
    id: email === 'nathaniel.pranata@ibm.com' ? 1 : (email === 'sarah.chen@ibm.com' ? 2 : Math.floor(Math.random() * 9000) + 100),
    email,
    name,
    department,
    role
  };

  state.currentUser = userObj;
  localStorage.setItem(LS_USER_KEY, JSON.stringify(userObj));

  // Add to known users if not present
  const usersList = JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]');
  if (!usersList.some(u => u.email === email)) {
    usersList.push(userObj);
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(usersList));
  }

  renderUserProfile();
  elements.authOverlay.classList.add('hidden');
  showToast(`Signed in as ${userObj.name} (IBM w3id)`, 'success');
  fetchOptions();
  loadCadences();
  loadStats();
}

async function logout() {
  try {
    if (!isStaticMode) {
      await fetch('/api/auth/logout', { method: 'POST' });
    }
  } catch (err) {}

  localStorage.removeItem(LS_USER_KEY);
  state.currentUser = null;
  elements.userMenu.classList.add('hidden');
  showToast('Signed out of IBM SSO', 'info');
  showLoginOverlay();
}

function renderUserProfile() {
  if (!state.currentUser) return;
  const u = state.currentUser;
  const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  elements.userAvatar.textContent = initials;
  elements.userName.textContent = u.name;
  elements.menuUserFullName.textContent = u.name;
  elements.menuUserEmail.textContent = u.email;
  elements.menuUserRole.textContent = `${u.role} (${u.department || 'IBM'})`;
}

// API & Storage Operations
async function loadCadences() {
  try {
    if (!isStaticMode) {
      const params = new URLSearchParams();
      params.append('scope', state.currentScope);
      if (state.activeFilters.type !== 'all') params.append('type', state.activeFilters.type);
      if (state.activeFilters.status !== 'all') params.append('status', state.activeFilters.status);
      if (state.activeFilters.state !== 'all') params.append('state', state.activeFilters.state);
      if (state.activeFilters.role !== 'all') params.append('role', state.activeFilters.role);
      if (state.activeFilters.tag !== 'all') params.append('tag', state.activeFilters.tag);
      if (state.activeFilters.search) params.append('q', state.activeFilters.search);

      const res = await fetch(`/api/cadences?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        state.cadences = data.cadences;
        state.filteredCadences = data.cadences;
        renderCurrentView();
        renderActiveFilterPills();
        return;
      }
    }
  } catch (err) {
    isStaticMode = true;
  }

  // Static LocalStorage Query Engine
  const allCadences = JSON.parse(localStorage.getItem(LS_CADENCES_KEY) || '[]');
  const uid = state.currentUser ? state.currentUser.id : 1;

  let filtered = allCadences.filter(c => {
    // Scope filter
    if (state.currentScope === 'my') {
      if (c.user_id !== uid) return false;
    } else if (state.currentScope === 'team') {
      if (c.user_id === uid || (!c.is_shared && c.is_shared !== 1)) return false;
    } else { // 'all'
      if (c.user_id !== uid && (!c.is_shared && c.is_shared !== 1)) return false;
    }

    // Type filter
    if (state.activeFilters.type !== 'all' && c.cadence_type !== state.activeFilters.type) return false;
    // Status filter
    if (state.activeFilters.status !== 'all' && c.status !== state.activeFilters.status) return false;
    // State filter
    if (state.activeFilters.state !== 'all' && !(c.states || []).map(s => s.toUpperCase()).includes(state.activeFilters.state.toUpperCase())) return false;
    // Role filter
    if (state.activeFilters.role !== 'all' && !(c.roles || []).some(r => r.toLowerCase().includes(state.activeFilters.role.toLowerCase()))) return false;
    // Tag filter
    if (state.activeFilters.tag !== 'all' && !(c.zoominfo_tags || []).some(t => t.toLowerCase().includes(state.activeFilters.tag.toLowerCase()))) return false;

    // Search query
    if (state.activeFilters.search) {
      const q = state.activeFilters.search.toLowerCase();
      const searchable = [
        c.name, c.cadence_type, c.platform, c.industry, c.notes, c.created_by_name,
        ...(c.states || []), ...(c.roles || []), ...(c.zoominfo_tags || [])
      ].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });

  filtered = filtered.map(item => ({
    ...item,
    is_owner: (item.user_id === uid)
  }));

  state.cadences = filtered;
  state.filteredCadences = filtered;
  renderCurrentView();
  renderActiveFilterPills();
}

async function loadStats() {
  try {
    if (!isStaticMode) {
      const params = new URLSearchParams();
      params.append('scope', state.currentScope);
      const res = await fetch(`/api/stats?${params.toString()}`);
      if (res.ok) {
        state.stats = await res.json();
        renderStats();
        if (state.currentView === 'geo') renderStatesMatrix();
        if (state.currentView === 'zitags') renderZITagsCatalog();
        return;
      }
    }
  } catch (err) {
    isStaticMode = true;
  }

  // Static LocalStorage Aggregates Calculation
  const allCadences = JSON.parse(localStorage.getItem(LS_CADENCES_KEY) || '[]');
  const uid = state.currentUser ? state.currentUser.id : 1;

  const accessible = allCadences.filter(c => (c.user_id === uid || c.is_shared === 1 || c.is_shared === true));
  const scoped = (state.currentScope === 'my') ? allCadences.filter(c => c.user_id === uid) : accessible;

  const statesDist = {};
  const rolesDist = {};
  const tagsDist = {};
  let totalAccounts = 0;
  let totalContacts = 0;
  let activeCount = 0;

  scoped.forEach(c => {
    if (c.status === 'Active') activeCount++;
    totalAccounts += parseInt(c.enrolled_accounts) || 0;
    totalContacts += parseInt(c.enrolled_contacts) || 0;
    (c.states || []).forEach(s => statesDist[s] = (statesDist[s] || 0) + 1);
    (c.roles || []).forEach(r => rolesDist[r] = (rolesDist[r] || 0) + 1);
    (c.zoominfo_tags || []).forEach(t => tagsDist[t] = (tagsDist[t] || 0) + 1);
  });

  state.stats = {
    total_cadences: scoped.length,
    active_cadences: activeCount,
    total_accounts: totalAccounts,
    total_contacts: totalContacts,
    states_distribution: statesDist,
    roles_distribution: rolesDist,
    tags_distribution: tagsDist,
    unique_states_count: Object.keys(statesDist).length,
    unique_roles_count: Object.keys(rolesDist).length,
    unique_tags_count: Object.keys(tagsDist).length
  };

  renderStats();
  if (state.currentView === 'geo') renderStatesMatrix();
  if (state.currentView === 'zitags') renderZITagsCatalog();
}

async function fetchOptions() {
  try {
    if (!isStaticMode) {
      const res = await fetch('/api/options');
      if (res.ok) {
        state.options = await res.json();
        return;
      }
    }
  } catch (err) {
    isStaticMode = true;
  }
}

// Render Stats & KPIs
function renderStats() {
  if (!state.stats) return;
  const s = state.stats;
  elements.statTotalCadences.textContent = s.total_cadences;
  elements.statActiveCadences.textContent = `${s.active_cadences} Active`;
  elements.statTotalAccounts.textContent = Number(s.total_accounts).toLocaleString();
  elements.statTotalContacts.textContent = `(${Number(s.total_contacts).toLocaleString()} Contacts)`;
  elements.statStatesCovered.textContent = s.unique_states_count;
  elements.statUniqueRoles.textContent = s.unique_roles_count;
  elements.statUniqueTags.textContent = s.unique_tags_count;
}

// Render Main Views
function renderCurrentView() {
  switch (state.currentView) {
    case 'grid':
      elements.viewGrid.classList.remove('hidden');
      elements.viewTable.classList.add('hidden');
      elements.viewGeo.classList.add('hidden');
      elements.viewZITags.classList.add('hidden');
      renderCadenceCards();
      break;
    case 'table':
      elements.viewGrid.classList.add('hidden');
      elements.viewTable.classList.remove('hidden');
      elements.viewGeo.classList.add('hidden');
      elements.viewZITags.classList.add('hidden');
      renderCadenceTable();
      break;
    case 'geo':
      elements.viewGrid.classList.add('hidden');
      elements.viewTable.classList.add('hidden');
      elements.viewGeo.classList.remove('hidden');
      elements.viewZITags.classList.add('hidden');
      renderStatesMatrix();
      break;
    case 'zitags':
      elements.viewGrid.classList.add('hidden');
      elements.viewTable.classList.add('hidden');
      elements.viewGeo.classList.add('hidden');
      elements.viewZITags.classList.remove('hidden');
      renderZITagsCatalog();
      break;
  }
}

// Render Cards View
function renderCadenceCards() {
  const container = elements.cadencesGridContainer;
  container.innerHTML = '';

  if (!state.filteredCadences || state.filteredCadences.length === 0) {
    elements.noResultsGrid.classList.remove('hidden');
    return;
  }
  elements.noResultsGrid.classList.add('hidden');

  state.filteredCadences.forEach(c => {
    const card = document.createElement('div');
    card.className = 'cadence-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between space-y-4';

    const typeBadgeClass = getTypeBadgeClass(c.cadence_type);
    const statusBadgeClass = getStatusBadgeClass(c.status);
    const isOwner = c.is_owner;

    // States Pills
    const statesHtml = (c.states || []).map(s => `
      <span class="inline-block px-2 py-0.5 text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800 cursor-pointer hover:bg-amber-100" onclick="filterByState('${escapeHtml(s)}', event)">
        ${escapeHtml(s)}
      </span>
    `).slice(0, 5).join(' ') + (c.states && c.states.length > 5 ? `<span class="text-[11px] text-slate-400 font-medium self-center">+${c.states.length - 5}</span>` : '');

    // Roles Badges
    const rolesHtml = (c.roles || []).map(r => `
      <span class="role-badge" title="${escapeHtml(r)}">
        <i class="fa-solid fa-user-check text-[9px] mr-1 opacity-70"></i>${escapeHtml(r)}
      </span>
    `).slice(0, 3).join(' ') + (c.roles && c.roles.length > 3 ? `<span class="text-[11px] text-slate-400 font-medium self-center">+${c.roles.length - 3}</span>` : '');

    // ZoomInfo Tags Badges
    const tagsHtml = (c.zoominfo_tags || []).map(t => `
      <span class="zi-tag-badge cursor-pointer hover:opacity-80" title="ZoomInfo Tag: ${escapeHtml(t)}" onclick="filterByTag('${escapeHtml(t)}', event)">
        <i class="fa-solid fa-tag text-[9px] mr-1 text-cyan-600 dark:text-cyan-400"></i>${escapeHtml(t)}
      </span>
    `).slice(0, 3).join(' ') + (c.zoominfo_tags && c.zoominfo_tags.length > 3 ? `<span class="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium self-center">+${c.zoominfo_tags.length - 3}</span>` : '');

    card.innerHTML = `
      <div class="space-y-3">
        <!-- Top Status & Creator -->
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-1.5 flex-wrap gap-1">
            <span class="px-2.5 py-0.5 rounded-full font-bold text-xs border ${typeBadgeClass}">${escapeHtml(c.cadence_type)}</span>
            <span class="px-2 py-0.5 rounded-full font-semibold text-[11px] ${statusBadgeClass}">${escapeHtml(c.status)}</span>
          </div>
          <span class="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">${escapeHtml(c.platform || 'Salesloft')}</span>
        </div>

        <!-- Cadence Title & Owner -->
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition" onclick="openDetailModal(${c.id})">
            ${escapeHtml(c.name)}
          </h3>
          <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
            <span title="Owner"><i class="fa-solid fa-user-circle text-[10px] mr-1 text-blue-500"></i>${escapeHtml(c.created_by_name || 'IBM Colleague')} ${isOwner ? '<strong class="text-blue-600 dark:text-blue-400">(You)</strong>' : ''}</span>
            ${c.industry ? `<span>•</span><span class="truncate"><i class="fa-solid fa-industry mr-1 text-[10px]"></i>${escapeHtml(c.industry)}</span>` : ''}
          </div>
        </div>

        <!-- Targeted States Section -->
        <div class="space-y-1">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span><i class="fa-solid fa-map-pin text-amber-500 mr-1"></i>States Targeted (${(c.states || []).length})</span>
          </div>
          <div class="flex flex-wrap gap-1">
            ${statesHtml || '<span class="text-[11px] text-slate-400 italic">None specified</span>'}
          </div>
        </div>

        <!-- Targeted Roles Section -->
        <div class="space-y-1">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <i class="fa-solid fa-id-card-clip text-emerald-500 mr-1"></i>Target Roles (${(c.roles || []).length})
          </div>
          <div class="flex flex-wrap gap-1">
            ${rolesHtml || '<span class="text-[11px] text-slate-400 italic">No roles specified</span>'}
          </div>
        </div>

        <!-- ZoomInfo Account Tags Section -->
        <div class="space-y-1">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span><i class="fa-solid fa-tags text-cyan-500 mr-1"></i>ZoomInfo Tags (${(c.zoominfo_tags || []).length})</span>
          </div>
          <div class="flex flex-wrap gap-1">
            ${tagsHtml || '<span class="text-[11px] text-slate-400 italic">No ZoomInfo tags</span>'}
          </div>
        </div>
      </div>

      <!-- Card Bottom Stats & Actions -->
      <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
        <div class="text-slate-500 dark:text-slate-400 flex items-center space-x-3 text-[11px]">
          <span title="Enrolled Accounts"><i class="fa-solid fa-building mr-1 text-slate-400"></i><strong class="text-slate-700 dark:text-slate-300">${c.enrolled_accounts || 0}</strong> accts</span>
          <span title="Sequence Length"><i class="fa-solid fa-clock mr-1 text-slate-400"></i>${c.duration_days || 14}d / ${c.step_count || 5} steps</span>
        </div>
        <div class="flex items-center space-x-1">
          <button onclick="openDetailModal(${c.id})" class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition" title="View details">
            <i class="fa-solid fa-eye"></i>
          </button>
          ${isOwner ? `
            <button onclick="openEditModal(${c.id})" class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition" title="Edit cadence">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteCadence(${c.id})" class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition" title="Delete cadence">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : `
            <button onclick="cloneCadenceDirectly(${c.id})" class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition" title="Clone template for my use">
              <i class="fa-solid fa-copy"></i>
            </button>
          `}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Render Table View
function renderCadenceTable() {
  const tbody = elements.cadencesTableBody;
  tbody.innerHTML = '';

  if (!state.filteredCadences || state.filteredCadences.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-12 text-slate-400">No cadences match your search criteria.</td></tr>`;
    return;
  }

  state.filteredCadences.forEach(c => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-700/40 transition cursor-pointer';

    const statesList = (c.states || []).map(s => `<span class="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded font-bold text-[10px] mr-1 mb-1 inline-block">${escapeHtml(s)}</span>`).join('');
    const rolesList = (c.roles || []).map(r => `<span class="role-badge text-[10px] mr-1 mb-1 inline-block">${escapeHtml(r)}</span>`).slice(0, 2).join('') + (c.roles && c.roles.length > 2 ? `<span class="text-[10px] text-slate-400">+${c.roles.length - 2}</span>` : '');
    const tagsList = (c.zoominfo_tags || []).map(t => `<span class="zi-tag-badge text-[10px] mr-1 mb-1 inline-block">${escapeHtml(t)}</span>`).slice(0, 2).join('') + (c.zoominfo_tags && c.zoominfo_tags.length > 2 ? `<span class="text-[10px] text-cyan-600 font-medium">+${c.zoominfo_tags.length - 2}</span>` : '');
    const isOwner = c.is_owner;

    tr.innerHTML = `
      <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white" onclick="openDetailModal(${c.id})">
        <div>${escapeHtml(c.name)}</div>
        ${c.industry ? `<div class="text-[10px] text-slate-400">${escapeHtml(c.industry)}</div>` : ''}
      </td>
      <td class="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
        <div class="font-medium text-[11px]">${escapeHtml(c.created_by_name || 'IBM User')}</div>
        ${isOwner ? '<span class="text-[10px] text-blue-600 dark:text-blue-400 font-bold">You</span>' : '<span class="text-[10px] text-slate-400">Team</span>'}
      </td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getTypeBadgeClass(c.cadence_type)}">${escapeHtml(c.cadence_type)}</span>
        <div class="text-[10px] text-slate-400 mt-0.5">${escapeHtml(c.platform || 'Salesloft')}</div>
      </td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span>
      </td>
      <td class="px-4 py-3 max-w-[180px]">
        <div class="flex flex-wrap">${statesList || '<span class="text-slate-400 italic text-[11px]">None</span>'}</div>
      </td>
      <td class="px-4 py-3 max-w-[200px]">
        <div class="flex flex-wrap">${rolesList || '<span class="text-slate-400 italic text-[11px]">None</span>'}</div>
      </td>
      <td class="px-4 py-3 max-w-[200px]">
        <div class="flex flex-wrap">${tagsList || '<span class="text-slate-400 italic text-[11px]">None</span>'}</div>
      </td>
      <td class="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
        <div>${c.enrolled_accounts || 0} accts</div>
        <div class="text-[10px] text-slate-400">${c.enrolled_contacts || 0} leads</div>
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <button onclick="openDetailModal(${c.id})" class="p-1.5 text-slate-400 hover:text-blue-600" title="Details"><i class="fa-solid fa-eye"></i></button>
        ${isOwner ? `
          <button onclick="openEditModal(${c.id})" class="p-1.5 text-slate-400 hover:text-blue-600" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button onclick="deleteCadence(${c.id})" class="p-1.5 text-slate-400 hover:text-rose-600" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
        ` : `
          <button onclick="cloneCadenceDirectly(${c.id})" class="p-1.5 text-slate-400 hover:text-blue-600" title="Clone"><i class="fa-solid fa-copy"></i></button>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Geographic States Coverage Matrix
function renderStatesMatrix() {
  const container = elements.statesMatrixGrid;
  container.innerHTML = '';
  const dist = (state.stats && state.stats.states_distribution) || {};

  US_STATES.forEach(st => {
    const count = dist[st.code] || 0;
    const card = document.createElement('div');
    
    let bgStyle = 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 text-slate-400';
    if (count >= 3) {
      bgStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold';
    } else if (count > 0) {
      bgStyle = 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold';
    }

    card.className = `p-2.5 rounded-xl border text-center cursor-pointer transition transform hover:-translate-y-1 hover:shadow-md ${bgStyle}`;
    card.innerHTML = `
      <div class="text-sm font-extrabold">${st.code}</div>
      <div class="text-[10px] truncate opacity-80">${st.name}</div>
      <div class="mt-1 text-[11px] font-bold">
        ${count > 0 ? `<span class="px-1.5 py-0.2 rounded-full ${count >= 3 ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-blue-200 dark:bg-blue-800'} text-xs">${count} cad</span>` : '<span class="text-[10px] opacity-40">0</span>'}
      </div>
    `;

    card.addEventListener('click', () => {
      filterByState(st.code);
    });

    container.appendChild(card);
  });
}

// Render ZoomInfo Tags Catalog
function renderZITagsCatalog() {
  const container = elements.ziTagsCatalogContainer;
  container.innerHTML = '';
  const dist = (state.stats && state.stats.tags_distribution) || {};
  const filterQuery = (elements.tagSearchInput ? elements.tagSearchInput.value : '').toLowerCase().trim();

  const tagKeys = Object.keys(dist).filter(tag => !filterQuery || tag.toLowerCase().includes(filterQuery));

  if (tagKeys.length === 0) {
    container.innerHTML = `<div class="col-span-3 text-center py-12 text-slate-400">No ZoomInfo tags match "${escapeHtml(filterQuery)}"</div>`;
    return;
  }

  tagKeys.sort((a, b) => dist[b] - dist[a]).forEach(tag => {
    const count = dist[tag];
    const matchingCadences = state.cadences.filter(c => (c.zoominfo_tags || []).includes(tag));
    
    const card = document.createElement('div');
    card.className = 'bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-cyan-200 dark:border-cyan-900/60 p-4 space-y-3';
    
    const cadencesList = matchingCadences.map(c => `
      <div class="text-xs flex items-center justify-between text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer" onclick="openDetailModal(${c.id})">
        <span class="truncate pr-2 font-medium"><i class="fa-solid fa-bullseye text-[10px] text-blue-500 mr-1.5"></i>${escapeHtml(c.name)}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded ${getStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="flex items-center justify-between border-b border-cyan-100 dark:border-cyan-900/40 pb-2.5">
        <div class="flex items-center space-x-2 min-w-0">
          <i class="fa-solid fa-tag text-cyan-600 dark:text-cyan-400 text-sm"></i>
          <span class="text-xs font-bold text-slate-900 dark:text-white truncate">${escapeHtml(tag)}</span>
        </div>
        <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold flex-shrink-0">
          ${count} ${count === 1 ? 'Cadence' : 'Cadences'}
        </span>
      </div>

      <div class="space-y-1.5">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Utilized in Cadences:</div>
        <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
          ${cadencesList || '<div class="text-xs text-slate-400">None</div>'}
        </div>
      </div>

      <div class="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
        <button onclick="filterByTag('${escapeHtml(tag)}')" class="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center space-x-1">
          <span>Filter all cadences by this tag</span>
          <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// Helpers for Badges
function getTypeBadgeClass(type) {
  switch (type) {
    case 'Cold Outbound': return 'cadence-type-cold';
    case 'Account-Based Marketing (ABM)': return 'cadence-type-abm';
    case 'Event Follow-up': return 'cadence-type-event';
    case 'Renewal / Expansion': return 'cadence-type-renewal';
    case 'Lost Opp Re-engagement': return 'cadence-type-reengagement';
    default: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Active': return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    case 'Paused': return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    case 'Completed': return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
    case 'Draft': return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}

// Populate State Filters & Modal State Matrix
function populateStateDropdown() {
  const sel = elements.filterState;
  sel.innerHTML = '<option value="all">All States</option>';
  US_STATES.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.code;
    opt.textContent = `${s.code} - ${s.name}`;
    sel.appendChild(opt);
  });
}

function renderFormStateChips() {
  const container = elements.formStatesSelector;
  container.innerHTML = '';

  US_STATES.forEach(st => {
    const chip = document.createElement('div');
    const isSelected = state.formData.selectedStates.has(st.code);
    chip.className = `state-chip text-center py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
      isSelected 
        ? 'selected bg-amber-500 text-white border-amber-600 dark:bg-amber-600 dark:border-amber-700' 
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;
    chip.dataset.code = st.code;
    chip.dataset.region = st.region;
    chip.innerHTML = `<span class="block font-bold">${st.code}</span><span class="block text-[9px] font-normal truncate opacity-80">${st.name}</span>`;

    chip.addEventListener('click', () => {
      if (state.formData.selectedStates.has(st.code)) {
        state.formData.selectedStates.delete(st.code);
      } else {
        state.formData.selectedStates.add(st.code);
      }
      renderFormStateChips();
      elements.selectedStateCount.textContent = state.formData.selectedStates.size;
    });

    container.appendChild(chip);
  });

  elements.selectedStateCount.textContent = state.formData.selectedStates.size;
}

// Role Tag Management in Form
function addRole(roleText) {
  const cleaned = roleText.trim();
  if (!cleaned) return;
  state.formData.roles.add(cleaned);
  renderFormRoles();
  elements.formRoleInput.value = '';
  elements.formRoleInput.focus();
}

function removeRole(roleText) {
  state.formData.roles.delete(roleText);
  renderFormRoles();
}

function renderFormRoles() {
  const container = elements.formRolesContainer;
  container.innerHTML = '';
  if (state.formData.roles.size === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400 italic self-center">No roles added yet. Type or click suggestions above.</span>`;
    return;
  }

  state.formData.roles.forEach(r => {
    const badge = document.createElement('span');
    badge.className = 'role-badge flex items-center space-x-1.5 py-1 px-2.5';
    badge.innerHTML = `
      <span>${escapeHtml(r)}</span>
      <button type="button" class="text-emerald-700 dark:text-emerald-300 hover:text-rose-600 dark:hover:text-rose-400 ml-1 transition" onclick="removeRole('${escapeHtml(r)}')">
        <i class="fa-solid fa-xmark text-xs"></i>
      </button>
    `;
    container.appendChild(badge);
  });
}

// ZoomInfo Tag Management in Form
function addZITag(tagText) {
  let cleaned = tagText.trim();
  if (!cleaned) return;
  if (!cleaned.toUpperCase().startsWith('ZI:')) {
    cleaned = `ZI:${cleaned}`;
  }
  state.formData.ziTags.add(cleaned);
  renderFormZITags();
  elements.formZITagInput.value = '';
  elements.formZITagInput.focus();
}

function removeZITag(tagText) {
  state.formData.ziTags.delete(tagText);
  renderFormZITags();
}

function renderFormZITags() {
  const container = elements.formZITagsContainer;
  container.innerHTML = '';
  if (state.formData.ziTags.size === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400 italic self-center">No ZoomInfo tags added yet. Type tag or click presets above.</span>`;
    return;
  }

  state.formData.ziTags.forEach(t => {
    const badge = document.createElement('span');
    badge.className = 'zi-tag-badge flex items-center space-x-1.5 py-1 px-2.5';
    badge.innerHTML = `
      <i class="fa-solid fa-tag text-[10px]"></i>
      <span>${escapeHtml(t)}</span>
      <button type="button" class="text-cyan-700 dark:text-cyan-300 hover:text-rose-600 dark:hover:text-rose-400 ml-1 transition" onclick="removeZITag('${escapeHtml(t)}')">
        <i class="fa-solid fa-xmark text-xs"></i>
      </button>
    `;
    container.appendChild(badge);
  });
}

// Modals: Create / Edit / Detail
function openCreateModal() {
  elements.formCadenceId.value = '';
  elements.modalTitle.textContent = 'New Cadence Configuration';
  elements.formName.value = '';
  elements.formStatus.value = 'Active';
  elements.formTypeSelect.value = 'Cold Outbound';
  elements.formCustomType.value = '';
  elements.formCustomType.classList.add('hidden');
  elements.formPlatform.value = 'Salesloft';
  elements.formIndustry.value = '';
  elements.formStepCount.value = 6;
  elements.formDurationDays.value = 14;
  elements.formAccounts.value = 0;
  elements.formContacts.value = 0;
  elements.formIsShared.checked = true;
  elements.formNotes.value = '';

  state.formData.selectedStates.clear();
  state.formData.roles.clear();
  state.formData.ziTags.clear();

  renderFormStateChips();
  renderFormRoles();
  renderFormZITags();

  elements.cadenceModal.classList.remove('hidden');
}

function openEditModal(cadenceId) {
  const c = state.cadences.find(item => item.id === cadenceId);
  if (!c) return;

  elements.formCadenceId.value = c.id;
  elements.modalTitle.textContent = `Edit Cadence: ${c.name}`;
  elements.formName.value = c.name;
  elements.formStatus.value = c.status || 'Active';
  
  const standardTypes = ['Cold Outbound', 'Account-Based Marketing (ABM)', 'Inbound Follow-up', 'Event Follow-up', 'Renewal / Expansion', 'Executive Outreach', 'Lost Opp Re-engagement', 'Partner Nurture'];
  if (standardTypes.includes(c.cadence_type)) {
    elements.formTypeSelect.value = c.cadence_type;
    elements.formCustomType.classList.add('hidden');
    elements.formCustomType.value = '';
  } else {
    elements.formTypeSelect.value = '__custom__';
    elements.formCustomType.classList.remove('hidden');
    elements.formCustomType.value = c.cadence_type;
  }

  elements.formPlatform.value = c.platform || 'Salesloft';
  elements.formIndustry.value = c.industry || '';
  elements.formStepCount.value = c.step_count || 6;
  elements.formDurationDays.value = c.duration_days || 14;
  elements.formAccounts.value = c.enrolled_accounts || 0;
  elements.formContacts.value = c.enrolled_contacts || 0;
  elements.formIsShared.checked = (c.is_shared === 1 || c.is_shared === true);
  elements.formNotes.value = c.notes || '';

  state.formData.selectedStates = new Set(c.states || []);
  state.formData.roles = new Set(c.roles || []);
  state.formData.ziTags = new Set(c.zoominfo_tags || []);

  renderFormStateChips();
  renderFormRoles();
  renderFormZITags();

  elements.cadenceModal.classList.remove('hidden');
}

async function saveCadence() {
  const name = elements.formName.value.trim();
  let cadence_type = elements.formTypeSelect.value;
  if (cadence_type === '__custom__') {
    cadence_type = elements.formCustomType.value.trim();
  }

  if (!name) {
    showToast('Cadence name is required', 'error');
    elements.formName.focus();
    return;
  }
  if (!cadence_type) {
    showToast('Cadence type is required', 'error');
    return;
  }

  const payload = {
    name,
    cadence_type,
    status: elements.formStatus.value,
    platform: elements.formPlatform.value,
    industry: elements.formIndustry.value.trim(),
    step_count: parseInt(elements.formStepCount.value) || 5,
    duration_days: parseInt(elements.formDurationDays.value) || 14,
    enrolled_accounts: parseInt(elements.formAccounts.value) || 0,
    enrolled_contacts: parseInt(elements.formContacts.value) || 0,
    is_shared: elements.formIsShared.checked,
    states: Array.from(state.formData.selectedStates),
    roles: Array.from(state.formData.roles),
    zoominfo_tags: Array.from(state.formData.ziTags),
    notes: elements.formNotes.value.trim()
  };

  const id = elements.formCadenceId.value ? parseInt(elements.formCadenceId.value) : null;

  try {
    if (!isStaticMode) {
      const url = id ? `/api/cadences/${id}` : '/api/cadences';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        elements.cadenceModal.classList.add('hidden');
        showToast(id ? 'Cadence updated successfully!' : 'Cadence created successfully!', 'success');
        loadCadences();
        loadStats();
        return;
      }
    }
  } catch (err) {
    isStaticMode = true;
  }

  // Static LocalStorage Save
  const allCadences = JSON.parse(localStorage.getItem(LS_CADENCES_KEY) || '[]');
  const now = new Date().toISOString();
  const u = state.currentUser || { id: 1, name: 'Nathaniel Pranata', email: 'nathaniel.pranata@ibm.com' };

  if (id) {
    const idx = allCadences.findIndex(c => c.id === id);
    if (idx !== -1) {
      allCadences[idx] = {
        ...allCadences[idx],
        ...payload,
        updated_at: now
      };
    }
  } else {
    const newId = (allCadences.reduce((max, c) => Math.max(max, c.id || 0), 0) || 0) + 1;
    allCadences.unshift({
      id: newId,
      user_id: u.id,
      created_by_name: u.name,
      created_by_email: u.email,
      ...payload,
      created_at: now,
      updated_at: now
    });
  }

  localStorage.setItem(LS_CADENCES_KEY, JSON.stringify(allCadences));
  elements.cadenceModal.classList.add('hidden');
  showToast(id ? 'Cadence updated successfully!' : 'Cadence created successfully!', 'success');
  loadCadences();
  loadStats();
}

async function deleteCadence(cadenceId) {
  if (!confirm('Are you sure you want to delete this cadence?')) return;
  const id = parseInt(cadenceId);

  try {
    if (!isStaticMode) {
      const res = await fetch(`/api/cadences/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Cadence deleted successfully', 'success');
        if (elements.detailModal && !elements.detailModal.classList.contains('hidden')) {
          elements.detailModal.classList.add('hidden');
        }
        loadCadences();
        loadStats();
        return;
      }
    }
  } catch (err) {
    isStaticMode = true;
  }

  // Static LocalStorage Delete
  let allCadences = JSON.parse(localStorage.getItem(LS_CADENCES_KEY) || '[]');
  allCadences = allCadences.filter(c => c.id !== id);
  localStorage.setItem(LS_CADENCES_KEY, JSON.stringify(allCadences));

  showToast('Cadence deleted successfully', 'success');
  if (elements.detailModal && !elements.detailModal.classList.contains('hidden')) {
    elements.detailModal.classList.add('hidden');
  }
  loadCadences();
  loadStats();
}

function openDetailModal(cadenceId) {
  const c = state.cadences.find(item => item.id === cadenceId);
  if (!c) return;
  currentDetailCadence = c;

  elements.detailName.textContent = c.name;
  elements.detailCreator.textContent = `Created by: ${c.created_by_name || 'IBM Colleague'}${c.is_owner ? ' (You)' : ''}`;
  elements.detailTypeBadge.textContent = c.cadence_type;
  elements.detailTypeBadge.className = `text-xs px-2.5 py-0.5 rounded-full font-bold border ${getTypeBadgeClass(c.cadence_type)}`;
  elements.detailStatusBadge.textContent = c.status;
  elements.detailStatusBadge.className = `text-xs px-2.5 py-0.5 rounded-full font-bold ${getStatusBadgeClass(c.status)}`;
  elements.detailPlatformBadge.textContent = c.platform || 'Salesloft';

  elements.detailAccounts.textContent = Number(c.enrolled_accounts || 0).toLocaleString();
  elements.detailContacts.textContent = Number(c.enrolled_contacts || 0).toLocaleString();
  elements.detailDuration.textContent = `${c.duration_days || 14} Days (${c.step_count || 5} Steps)`;
  elements.detailIndustry.textContent = c.industry || 'All Verticals';

  // Toggle edit/delete buttons based on ownership
  if (c.is_owner) {
    elements.btnDetailEdit.classList.remove('hidden');
    elements.btnDetailDelete.classList.remove('hidden');
  } else {
    elements.btnDetailEdit.classList.add('hidden');
    elements.btnDetailDelete.classList.add('hidden');
  }

  // States
  const statesContainer = elements.detailStatesContainer;
  statesContainer.innerHTML = '';
  if (c.states && c.states.length > 0) {
    c.states.forEach(st => {
      const stObj = US_STATES.find(s => s.code === st);
      const span = document.createElement('span');
      span.className = 'px-2.5 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg';
      span.innerHTML = `<i class="fa-solid fa-location-dot mr-1"></i>${st} ${stObj ? `(${stObj.name})` : ''}`;
      statesContainer.appendChild(span);
    });
  } else {
    statesContainer.innerHTML = '<span class="text-xs text-slate-400 italic">No specific states targeted (Nationwide)</span>';
  }

  // Roles
  const rolesContainer = elements.detailRolesContainer;
  rolesContainer.innerHTML = '';
  if (c.roles && c.roles.length > 0) {
    c.roles.forEach(r => {
      const span = document.createElement('span');
      span.className = 'role-badge px-3 py-1 text-xs';
      span.innerHTML = `<i class="fa-solid fa-user-tag mr-1.5 opacity-80"></i>${escapeHtml(r)}`;
      rolesContainer.appendChild(span);
    });
  } else {
    rolesContainer.innerHTML = '<span class="text-xs text-slate-400 italic">No roles targeted</span>';
  }

  // ZoomInfo Tags
  const ziContainer = elements.detailZITagsContainer;
  ziContainer.innerHTML = '';
  if (c.zoominfo_tags && c.zoominfo_tags.length > 0) {
    c.zoominfo_tags.forEach(t => {
      const span = document.createElement('span');
      span.className = 'zi-tag-badge px-3 py-1 text-xs';
      span.innerHTML = `<i class="fa-solid fa-tag mr-1.5"></i>${escapeHtml(t)}`;
      ziContainer.appendChild(span);
    });
  } else {
    ziContainer.innerHTML = '<span class="text-xs text-slate-400 italic">No ZoomInfo tags applied</span>';
  }

  // Sequence Flow
  const seqContainer = elements.detailSequenceTimeline;
  seqContainer.innerHTML = '';
  if (c.sequence_steps && c.sequence_steps.length > 0) {
    c.sequence_steps.forEach((step, idx) => {
      const div = document.createElement('div');
      div.className = 'flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs';
      
      let icon = 'fa-envelope';
      if (step.channel === 'Phone') icon = 'fa-phone';
      if (step.channel === 'LinkedIn') icon = 'fa-brands fa-linkedin';
      if (step.channel === 'Video') icon = 'fa-video';
      if (step.channel === 'Meeting') icon = 'fa-handshake';

      div.innerHTML = `
        <span class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">${idx + 1}</span>
        <span class="font-bold text-slate-500 w-12 flex-shrink-0">Day ${step.day || (idx * 3 + 1)}</span>
        <span class="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px]"><i class="fa-solid ${icon} mr-1"></i>${escapeHtml(step.channel)}</span>
        <span class="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">${escapeHtml(step.title || 'Outreach step')}</span>
      `;
      seqContainer.appendChild(div);
    });
    document.getElementById('detailSequenceSection').classList.remove('hidden');
  } else {
    document.getElementById('detailSequenceSection').classList.add('hidden');
  }

  // Notes
  if (c.notes) {
    elements.detailNotes.textContent = c.notes;
    document.getElementById('detailNotesSection').classList.remove('hidden');
  } else {
    document.getElementById('detailNotesSection').classList.add('hidden');
  }

  elements.detailModal.classList.remove('hidden');
}

// Clone Cadence
function cloneCurrentCadence() {
  if (!currentDetailCadence) return;
  cloneCadenceDirectly(currentDetailCadence.id);
  elements.detailModal.classList.add('hidden');
}

function cloneCadenceDirectly(cadenceId) {
  const c = state.cadences.find(item => item.id === cadenceId);
  if (!c) return;

  elements.formCadenceId.value = '';
  elements.modalTitle.textContent = `New Cadence (Cloned from ${c.name})`;
  elements.formName.value = `${c.name} (My Copy)`;
  elements.formStatus.value = 'Draft';
  elements.formTypeSelect.value = c.cadence_type;
  elements.formPlatform.value = c.platform || 'Salesloft';
  elements.formIndustry.value = c.industry || '';
  elements.formStepCount.value = c.step_count || 6;
  elements.formDurationDays.value = c.duration_days || 14;
  elements.formAccounts.value = 0;
  elements.formContacts.value = 0;
  elements.formIsShared.checked = true;
  elements.formNotes.value = c.notes || '';

  state.formData.selectedStates = new Set(c.states || []);
  state.formData.roles = new Set(c.roles || []);
  state.formData.ziTags = new Set(c.zoominfo_tags || []);

  renderFormStateChips();
  renderFormRoles();
  renderFormZITags();

  elements.cadenceModal.classList.remove('hidden');
  showToast('Cadence targeting settings copied to new form', 'info');
}

// Filter triggers
function filterByState(stateCode, e) {
  if (e) e.stopPropagation();
  state.activeFilters.state = stateCode;
  elements.filterState.value = stateCode;
  switchView('grid');
  loadCadences();
}

function filterByTag(tagName, e) {
  if (e) e.stopPropagation();
  state.activeFilters.tag = tagName;
  state.activeFilters.search = tagName;
  elements.globalSearchInput.value = tagName;
  switchView('grid');
  loadCadences();
}

function renderActiveFilterPills() {
  const container = elements.pillsContainer;
  container.innerHTML = '';
  let count = 0;

  if (state.activeFilters.type !== 'all') {
    addFilterPill(`Type: ${state.activeFilters.type}`, () => {
      state.activeFilters.type = 'all';
      elements.filterType.value = 'all';
      loadCadences();
    });
    count++;
  }

  if (state.activeFilters.status !== 'all') {
    addFilterPill(`Status: ${state.activeFilters.status}`, () => {
      state.activeFilters.status = 'all';
      elements.filterStatus.value = 'all';
      loadCadences();
    });
    count++;
  }

  if (state.activeFilters.state !== 'all') {
    addFilterPill(`State: ${state.activeFilters.state}`, () => {
      state.activeFilters.state = 'all';
      elements.filterState.value = 'all';
      loadCadences();
    });
    count++;
  }

  if (state.activeFilters.search) {
    addFilterPill(`Search: "${state.activeFilters.search}"`, () => {
      state.activeFilters.search = '';
      elements.globalSearchInput.value = '';
      elements.mobileSearchInput.value = '';
      elements.clearSearchBtn.classList.add('hidden');
      loadCadences();
    });
    count++;
  }

  if (count > 0) {
    elements.activeFilterPills.classList.remove('hidden');
  } else {
    elements.activeFilterPills.classList.add('hidden');
  }
}

function addFilterPill(text, onRemove) {
  const pill = document.createElement('span');
  pill.className = 'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium';
  pill.innerHTML = `<span>${escapeHtml(text)}</span><button class="hover:text-rose-600"><i class="fa-solid fa-xmark text-[10px]"></i></button>`;
  pill.querySelector('button').addEventListener('click', onRemove);
  elements.pillsContainer.appendChild(pill);
}

function resetAllFilters() {
  state.activeFilters = {
    type: 'all',
    status: 'all',
    state: 'all',
    search: '',
    role: 'all',
    tag: 'all'
  };
  elements.filterType.value = 'all';
  elements.filterStatus.value = 'all';
  elements.filterState.value = 'all';
  elements.globalSearchInput.value = '';
  elements.mobileSearchInput.value = '';
  elements.clearSearchBtn.classList.add('hidden');
  loadCadences();
}

// Switch View Mode & Scope
function switchView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll('.view-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  renderCurrentView();
}

function switchScope(scopeName) {
  state.currentScope = scopeName;
  document.querySelectorAll('.scope-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scope === scopeName);
  });
  loadCadences();
  loadStats();
}

// Export to CSV
function exportToCSV() {
  if (!state.cadences || state.cadences.length === 0) {
    showToast('No cadences available to export', 'error');
    return;
  }

  const headers = ['ID', 'Cadence Name', 'Owner', 'Type', 'Status', 'Platform', 'Enrolled Accounts', 'Contacts', 'States Target', 'Roles Target', 'ZoomInfo Tags', 'Steps', 'Duration Days', 'Industry', 'Notes', 'Created At'];
  const rows = state.cadences.map(c => [
    c.id,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.created_by_name || '').replace(/"/g, '""')}"`,
    `"${(c.cadence_type || '').replace(/"/g, '""')}"`,
    c.status || 'Active',
    c.platform || 'Salesloft',
    c.enrolled_accounts || 0,
    c.enrolled_contacts || 0,
    `"${(c.states || []).join(', ')}"`,
    `"${(c.roles || []).join('; ')}"`,
    `"${(c.zoominfo_tags || []).join('; ')}"`,
    c.step_count || 5,
    c.duration_days || 14,
    `"${(c.industry || '').replace(/"/g, '""')}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
    c.created_at || ''
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ibm_cadence_tracker_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Exported to CSV successfully', 'success');
}

// Export to JSON
function exportToJSON() {
  if (!state.cadences || state.cadences.length === 0) {
    showToast('No cadences available to export', 'error');
    return;
  }
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ version: '2.0', export_date: new Date().toISOString(), user: state.currentUser ? state.currentUser.email : 'ibm-user', cadences: state.cadences }, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `ibm_cadence_backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Exported to JSON successfully', 'success');
}

// Import JSON Backup
async function handleImportFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const cadences = Array.isArray(data) ? data : data.cadences;
    if (!cadences || !Array.isArray(cadences)) {
      throw new Error('Invalid JSON format: expected array of cadences');
    }

    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cadences })
    });

    if (!res.ok) throw new Error('Failed to import backup');
    const result = await res.json();
    showToast(result.message || 'Imported cadences successfully', 'success');
    loadCadences();
    loadStats();
    fetchOptions();
  } catch (err) {
    showToast(`Import error: ${err.message}`, 'error');
  }
}

// Reset Demo Data
async function resetDemoData() {
  if (!confirm('This will reset your cadences to the default demo set. Continue?')) return;
  try {
    const res = await fetch('/api/reset-samples', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
    showToast('Reset to demo cadences successfully', 'success');
    loadCadences();
    loadStats();
    fetchOptions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Login Form
  elements.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginWithIBM(elements.loginEmail.value.trim(), elements.loginName.value.trim());
  });

  // User Profile Menu
  elements.btnUserMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.userMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => {
    if (!elements.userMenu.classList.contains('hidden')) {
      elements.userMenu.classList.add('hidden');
    }
  });
  elements.btnSwitchUser.addEventListener('click', () => {
    elements.userMenu.classList.add('hidden');
    showLoginOverlay();
  });
  elements.btnLogout.addEventListener('click', logout);

  // Scope Switcher (My vs Team vs All)
  document.querySelectorAll('.scope-btn').forEach(btn => {
    btn.addEventListener('click', () => switchScope(btn.dataset.scope));
  });

  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // New Cadence Button
  elements.btnNewCadence.addEventListener('click', openCreateModal);

  // Modal Close / Cancel
  elements.btnCloseModal.addEventListener('click', () => elements.cadenceModal.classList.add('hidden'));
  elements.btnCancelModal.addEventListener('click', () => elements.cadenceModal.classList.add('hidden'));
  elements.btnSaveCadence.addEventListener('click', saveCadence);

  // Detail Modal Actions
  elements.btnCloseDetailModal.addEventListener('click', () => elements.detailModal.classList.add('hidden'));
  elements.btnDetailEdit.addEventListener('click', () => {
    if (currentDetailCadence) {
      elements.detailModal.classList.add('hidden');
      openEditModal(currentDetailCadence.id);
    }
  });
  elements.btnDetailClone.addEventListener('click', cloneCurrentCadence);
  elements.btnDetailDelete.addEventListener('click', () => {
    if (currentDetailCadence) deleteCadence(currentDetailCadence.id);
  });

  // Export Menu
  elements.btnExportMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.exportMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => {
    if (!elements.exportMenu.classList.contains('hidden')) {
      elements.exportMenu.classList.add('hidden');
    }
  });
  elements.btnExportCSV.addEventListener('click', exportToCSV);
  elements.btnExportJSON.addEventListener('click', exportToJSON);
  elements.importFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImportFile(e.target.files[0]);
      e.target.value = '';
    }
  });
  elements.btnResetSamples.addEventListener('click', resetDemoData);

  // View Tab Switcher
  document.querySelectorAll('.view-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Search Inputs
  const handleSearch = (val) => {
    state.activeFilters.search = val.trim();
    if (val.trim()) {
      elements.clearSearchBtn.classList.remove('hidden');
    } else {
      elements.clearSearchBtn.classList.add('hidden');
    }
    loadCadences();
  };

  elements.globalSearchInput.addEventListener('input', (e) => {
    elements.mobileSearchInput.value = e.target.value;
    handleSearch(e.target.value);
  });
  elements.mobileSearchInput.addEventListener('input', (e) => {
    elements.globalSearchInput.value = e.target.value;
    handleSearch(e.target.value);
  });
  elements.clearSearchBtn.addEventListener('click', () => {
    elements.globalSearchInput.value = '';
    elements.mobileSearchInput.value = '';
    elements.clearSearchBtn.classList.add('hidden');
    handleSearch('');
  });

  // Filters
  elements.filterType.addEventListener('change', (e) => {
    state.activeFilters.type = e.target.value;
    loadCadences();
  });
  elements.filterStatus.addEventListener('change', (e) => {
    state.activeFilters.status = e.target.value;
    loadCadences();
  });
  elements.filterState.addEventListener('change', (e) => {
    state.activeFilters.state = e.target.value;
    loadCadences();
  });
  elements.btnResetFilters.addEventListener('click', resetAllFilters);

  // Tag Search inside ZI Tags view
  if (elements.tagSearchInput) {
    elements.tagSearchInput.addEventListener('input', () => renderZITagsCatalog());
  }

  // Header quick clicks on cards
  elements.cardStatesCovered.addEventListener('click', () => switchView('geo'));
  elements.cardZoomInfoTags.addEventListener('click', () => switchView('zitags'));

  // Custom Cadence Type Dropdown handler in Form
  elements.formTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === '__custom__') {
      elements.formCustomType.classList.remove('hidden');
      elements.formCustomType.focus();
    } else {
      elements.formCustomType.classList.add('hidden');
    }
  });

  // Form State Region Preset Buttons
  document.querySelectorAll('.region-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const region = btn.dataset.region;
      if (region === 'all') {
        US_STATES.forEach(s => state.formData.selectedStates.add(s.code));
      } else if (region === 'clear') {
        state.formData.selectedStates.clear();
      } else {
        US_STATES.filter(s => s.region === region).forEach(s => state.formData.selectedStates.add(s.code));
      }
      renderFormStateChips();
    });
  });

  // Role Add Input & Enter Key
  elements.btnAddRole.addEventListener('click', () => addRole(elements.formRoleInput.value));
  elements.formRoleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRole(elements.formRoleInput.value);
    }
  });
  document.querySelectorAll('.role-sugg-btn').forEach(btn => {
    btn.addEventListener('click', () => addRole(btn.textContent));
  });

  // ZoomInfo Tag Add Input & Enter Key
  elements.btnAddZITag.addEventListener('click', () => addZITag(elements.formZITagInput.value));
  elements.formZITagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addZITag(elements.formZITagInput.value);
    }
  });
  document.querySelectorAll('.zi-sugg-btn').forEach(btn => {
    btn.addEventListener('click', () => addZITag(btn.textContent));
  });

  // Close modals on backdrop click or ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      elements.cadenceModal.classList.add('hidden');
      elements.detailModal.classList.add('hidden');
    }
  });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
