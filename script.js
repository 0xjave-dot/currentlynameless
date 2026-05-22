/* ================================================================
  Last Price — Frontend Script
  ================================================================ */

const firebaseConfig = window.firebaseConfig || null;
const USE_FIREBASE = !!(
  firebaseConfig &&
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes('<') &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('<')
);
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
const API = '';  // same origin

// ── State ─────────────────────────────────────────────────────────
let state = {
  token: localStorage.getItem('lp_token') || null,
  email: localStorage.getItem('lp_email') || null,
  userId: localStorage.getItem('lp_userId') || null,
  deviceHash: localStorage.getItem('lp_device_hash') || null,
  accountProfile: null,
  allReports: [],
  reports: [],
  view: 'list',
  nearMeActive: false,
  comparisonOpen: false,
  comparisonItem: '',
  comparisonLocations: [],
  userLat: null,
  userLng: null,
  searchQuery: '',
  category: 'All',
  layout: 'list', // 'list' or 'grid' for desktop/tablet
};

const DEMO_REPORTS = [
  {
    id: 'demo-1',
    itemName: 'Rice (10kg)',
    category: 'Groceries',
    price: 5500,
    availability: 'in_stock',
    locationName: 'Yaba, Lagos',
    lga: 'Yaba',
    state: 'Lagos',
    sellerPlace: 'Yaba Market',
    lat: 6.5244,
    lng: 3.3792,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1586080876-f0c6c773e8fe?w=200&q=80',
  },
  {
    id: 'demo-2',
    itemName: 'Eggs (Crate)',
    category: 'Groceries',
    price: 2800,
    availability: 'in_stock',
    locationName: 'Surulere, Lagos',
    lga: 'Surulere',
    state: 'Lagos',
    sellerPlace: 'Surulere Shopping Complex',
    lat: 6.5066,
    lng: 3.3629,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1585597022615-cd4628902d4a?w=200&q=80',
  },
  {
    id: 'demo-3',
    itemName: 'Tomatoes (Basket)',
    category: 'Food',
    price: 1200,
    availability: 'limited',
    locationName: 'Ibadan, Oyo',
    lga: 'Ibadan North',
    state: 'Oyo',
    sellerPlace: 'Bodija Market',
    lat: 7.3956,
    lng: 3.9415,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1592924357615-eec7b52e0ec9?w=200&q=80',
  },
  {
    id: 'demo-4',
    itemName: 'Fuel (1 Liter)',
    category: 'Fuel',
    price: 750,
    availability: 'in_stock',
    locationName: 'Lekki, Lagos',
    lga: 'Lekki',
    state: 'Lagos',
    sellerPlace: 'Lekki Phase 1 Filling Station',
    lat: 6.4624,
    lng: 3.5791,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-8f3c2cd83c5d?w=200&q=80',
  },
  {
    id: 'demo-5',
    itemName: 'Garri (50kg)',
    category: 'Groceries',
    price: 18000,
    availability: 'in_stock',
    locationName: 'Benin City, Edo',
    lga: 'Oredo',
    state: 'Edo',
    sellerPlace: 'Benin Central Market',
    lat: 6.4956,
    lng: 5.6271,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1599599810694-6f3ee9583a10?w=200&q=80',
  },
  {
    id: 'demo-6',
    itemName: 'Onions (1kg)',
    category: 'Groceries',
    price: 350,
    availability: 'in_stock',
    locationName: 'Kano, Kano',
    lga: 'Kano Municipal',
    state: 'Kano',
    sellerPlace: 'Kano Central Market',
    lat: 12.0022,
    lng: 8.5920,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1508737763203-cd270b57fbbb?w=200&q=80',
  },
  {
    id: 'demo-7',
    itemName: 'Beans (5kg)',
    category: 'Groceries',
    price: 3500,
    availability: 'in_stock',
    locationName: 'Ife, Osun',
    lga: 'Ife East',
    state: 'Osun',
    sellerPlace: 'Ife Market',
    lat: 7.4951,
    lng: 4.5571,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80',
  },
  {
    id: 'demo-8',
    itemName: 'Milk (500ml)',
    category: 'Groceries',
    price: 650,
    availability: 'in_stock',
    locationName: 'Abuja, FCT',
    lga: 'Garki',
    state: 'FCT',
    sellerPlace: 'Garki Shopping Complex',
    lat: 9.0765,
    lng: 7.3986,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b25a4ff?w=200&q=80',
  },
  {
    id: 'demo-9',
    itemName: 'Chicken (1kg)',
    price: 4200,
    availability: 'limited',
    locationName: 'Abeokuta, Ogun',
    lga: 'Abeokuta South',
    state: 'Ogun',
    sellerPlace: 'Abeokuta Central Market',
    lat: 6.7949,
    lng: 3.3436,
    timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=200&q=80',
  },
];

const pageType = document.body?.dataset?.page || 'home';
function isPage(page) {
  return pageType === page;
}

const CATEGORIES = ['All','Food','Groceries','Electronics','Fuel','Beverages','Household','Other'];
    category: 'Groceries',

function setActiveNav() {
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const params = new URLSearchParams(window.location.search || '');
  if (path === '' || path === 'index.html') document.getElementById('nav-home')?.classList.add('active');
  else if (path === 'prices.html') {
    if (params.get('view') === 'map') document.getElementById('nav-map')?.classList.add('active');
    else document.getElementById('nav-prices')?.classList.add('active');
  } else if (path === 'map.html') {
    document.getElementById('nav-map')?.classList.add('active');
  } else if (path === 'report.html') document.getElementById('nav-report')?.classList.add('active');
  else if (path === 'account.html') document.getElementById('nav-account')?.classList.add('active');
}

// ── Map ───────────────────────────────────────────────────────────
let map = null;
let markers = [];
let markerClusterGroup = null;

// ── Utils ─────────────────────────────────────────────────────────
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatPrice(n) {
  return '₦' + Number(n).toLocaleString('en-NG');
}

function availLabel(avail) {
  const map = { in_stock: '✅ In Stock', limited: '⚠️ Limited', out_of_stock: '❌ Out of Stock' };
  return map[avail] || avail;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hasUserLocation() {
  return state.userLat !== null && state.userLng !== null;
}

function reportLocationLabel(report) {
  return report.lga || report.state || report.locationName || 'Unspecified location';
}

function reportLocationKey(report) {
  return reportLocationLabel(report).toLowerCase();
}

function applyReportFilters(reports) {
  let filtered = reports.slice();
  if (state.searchQuery) {
    const term = state.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(r => {
      return (
        r.itemName.toLowerCase().includes(term) ||
        (r.locationName || '').toLowerCase().includes(term) ||
        (r.sellerPlace || '').toLowerCase().includes(term) ||
        (r.state || '').toLowerCase().includes(term) ||
        (r.lga || '').toLowerCase().includes(term)
      );
    });
  }
  if (state.nearMeActive && hasUserLocation()) {
    filtered = filtered.filter(r => haversine(state.userLat, state.userLng, r.lat, r.lng) <= 5);
  }
  // Category filter
  if (state.category && state.category !== 'All') {
    filtered = filtered.filter(r => (r.category || 'Other') === state.category);
  }
  return filtered;
}

function renderCategoryBar() {
  const bar = document.getElementById('category-bar');
  if (!bar) return;
  const html = CATEGORIES.map(cat => `<button class="category-chip" data-category="${escHtml(cat)}">${escHtml(cat)}</button>`).join('');
  bar.innerHTML = html;
  bar.querySelectorAll('.category-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === state.category);
    btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      bar.querySelectorAll('.category-chip').forEach(b => b.classList.toggle('active', b === btn));
      state.reports = applyReportFilters(state.allReports);
      render();
    });
  });
}

function getComparableReports() {
  const itemQuery = (state.comparisonItem || state.searchQuery || '').trim().toLowerCase();
  return state.allReports.filter(report => {
    if (!itemQuery) return true;
    return report.itemName.toLowerCase().includes(itemQuery);
  });
}

function getLocationGroups(reports) {
  const groups = reports.reduce((acc, report) => {
    const key = reportLocationKey(report);
    if (!acc[key]) {
      acc[key] = {
        key,
        label: reportLocationLabel(report),
        reports: [],
      };
    }
    acc[key].reports.push(report);
    return acc;
  }, {});

  return Object.values(groups).sort((a, b) => b.reports.length - a.reports.length || a.label.localeCompare(b.label));
}

function accountProfileKey(userId = state.userId) {
  return userId ? `lp_profile_${userId}` : null;
}

function deriveNameFromEmail(email) {
  if (!email) return 'Price tracker';
  const name = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return name ? name.replace(/\b\w/g, letter => letter.toUpperCase()) : 'Price tracker';
}

function defaultAccountProfile(email = state.email) {
  return {
    name: deriveNameFromEmail(email),
    location: '',
    state: '',
    lga: '',
    avatarUrl: '',
  };
}

function renderAvatar(id, profile) {
  const el = document.getElementById(id);
  if (!el) return;
  const avatarUrl = profile?.avatarUrl || '';
  if (avatarUrl) {
    el.style.backgroundImage = `url('${avatarUrl}')`;
    el.textContent = '';
    el.classList.add('account-avatar-image');
  } else {
    el.style.backgroundImage = '';
    el.classList.remove('account-avatar-image');
    el.textContent = (profile?.name || state.email || 'C').slice(0, 1).toUpperCase();
  }
}

function loadAccountProfile(userId = state.userId, email = state.email) {
  const key = accountProfileKey(userId);
  if (!key) return null;

  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return { ...defaultAccountProfile(email), ...saved };
  } catch {
    return defaultAccountProfile(email);
  }
}

function saveAccountProfile(profile) {
  const key = accountProfileKey();
  if (!key) return;
  state.accountProfile = {
    ...defaultAccountProfile(),
    ...profile,
  };
  localStorage.setItem(key, JSON.stringify(state.accountProfile));
}

async function persistAccountProfile(profile) {
  saveAccountProfile(profile);
  if (!USE_FIREBASE && state.token) {
    const updated = await apiFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(state.accountProfile),
    });
    saveAccountProfile(updated.profile || state.accountProfile);
  }
  return state.accountProfile;
}

function getAccountStats() {
  const myReports = state.allReports.filter(r => r.userId === state.userId);
  const totalVotes = myReports.reduce((sum, report) => sum + report.upvotes.length + report.debunks.length, 0);
  const upvotes = myReports.reduce((sum, report) => sum + report.upvotes.length, 0);
  const debunks = myReports.reduce((sum, report) => sum + report.debunks.length, 0);
  const trustScore = totalVotes ? Math.round((upvotes / totalVotes) * 100) : 0;
  const verifiedListings = myReports.filter(report => report.confidence !== null && report.confidence >= 60).length;

  return {
    myReports,
    totalVotes,
    upvotes,
    debunks,
    trustScore,
    verifiedListings,
  };
}

function accountLocationText(profile = state.accountProfile) {
  const parts = [profile?.location, profile?.lga, profile?.state].filter(Boolean);
  if (parts.length) return parts.join(', ');
  if (hasUserLocation()) return `GPS ${state.userLat.toFixed(4)}, ${state.userLng.toFixed(4)}`;
  return 'Not set';
}

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// Toast with undo button. `undoCallback` is called if user clicks Undo.
function toastWithUndo(msg, undoCallback, type = 'info', duration = 6000) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const text = document.createElement('span');
  text.className = 'toast-text';
  text.textContent = msg;
  el.appendChild(text);

  const action = document.createElement('button');
  action.className = 'toast-undo';
  action.type = 'button';
  action.textContent = 'Undo';
  action.addEventListener('click', () => {
    try { if (typeof undoCallback === 'function') undoCallback(); } catch (e) { console.warn('undo failed', e); }
    el.remove();
  });
  el.appendChild(action);

  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ── Auth header ───────────────────────────────────────────────────
function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

// ── API calls ─────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function initFirebase() {
  if (!USE_FIREBASE || typeof firebase === 'undefined') return;
  try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();

    firebaseAuth.onAuthStateChanged(user => {
      if (user) {
        setSession(user.uid, user.email, user.uid);
      } else {
        clearSession();
      }
      renderAuthArea();
    });
  } catch (err) {
    console.error('Firebase init error:', err);
    toast('Firebase setup failed. Using local backend instead.', 'error');
  }
}

function reportFromFirestore(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    itemName: data.itemName || '',
    price: Number(data.price || 0),
    availability: data.availability || 'in_stock',
    lat: Number(data.lat || 0),
    lng: Number(data.lng || 0),
    locationName: data.locationName || '',
    measurement: data.measurement || '',
    sellerPlace: data.sellerPlace || '',
    sellerContact: data.sellerContact || '',
    state: data.state || '',
    lga: data.lga || '',
    media: data.media || [],
    comments: data.comments || [],
    timestamp: data.timestamp || new Date().toISOString(),
    userId: data.userId || '',
    upvotes: data.upvotes || [],
    debunks: data.debunks || [],
  };
}

function enrichReport(report) {
  const upvotes = Array.isArray(report.upvotes) ? report.upvotes : [];
  const debunks = Array.isArray(report.debunks) ? report.debunks : [];
  const comments = Array.isArray(report.comments) ? report.comments : [];
  const media = Array.isArray(report.media) ? report.media : [];
  const totalVotes = upvotes.length + debunks.length;
  const confidence = totalVotes > 0 ? Math.round((upvotes.length / totalVotes) * 100) : null;
  // Ensure a small price history for sparklines; if real history exists, preserve it
  const priceHistory = Array.isArray(report.priceHistory) && report.priceHistory.length > 0
    ? report.priceHistory.slice(-6)
    : generatePriceHistory(report.price, 6);
  const first = priceHistory[0] || report.price || 0;
  const last = priceHistory[priceHistory.length - 1] || report.price || 0;
  const trendPercent = first ? Math.round(((last - first) / first) * 100) : 0;
  const trendLabel = (trendPercent > 0 ? '+' : '') + trendPercent + '%';
  return {
    ...report,
    upvotes,
    debunks,
    comments,
    media,
    confidence,
    locationName: report.locationName || '',
    upvoteCount: upvotes.length,
    debunkCount: debunks.length,
    priceHistory,
    trendPercent,
    trendLabel,
  };
}

function generatePriceHistory(currentPrice = 0, points = 6) {
  const arr = [];
  for (let i = points - 1; i >= 0; i--) {
    // simulate slight variation over time
    const variance = (Math.sin(i) * 0.03 + (Math.random() - 0.5) * 0.04);
    const value = Math.max(0, Math.round(currentPrice * (1 + variance)));
    arr.push(value);
  }
  return arr;
}

function sparklineSVG(values = [], width = 160, height = 36, stroke = '#7c3aed') {
  if (!values || !values.length) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(2)},${(height - ((v - min) / range) * height).toFixed(2)}`).join(' ');
  return `<svg class="grid-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><polyline fill="none" stroke="${stroke}" stroke-width="2" points="${points}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

async function firebaseLoadReports() {
  const snapshot = await firebaseDb.collection('reports').orderBy('timestamp', 'desc').get();
  let reports = snapshot.docs.map(reportFromFirestore).map(enrichReport);

  return reports;
}

async function firebaseSubmitReport({
  itemName,
  price,
  measurement,
  availability,
  lat,
  lng,
  locationName,
  state: stateName,
  lga,
  sellerPlace,
  sellerContact,
  media = [],
}) {
  const report = {
    itemName,
    price,
    measurement,
    availability,
    lat,
    lng,
    locationName,
    state: stateName,
    lga,
    sellerPlace,
    sellerContact,
    media,
    comments: [],
    timestamp: new Date().toISOString(),
    userId: state.userId,
    upvotes: [],
    debunks: [],
  };
  const docRef = await firebaseDb.collection('reports').add(report);
  const snapshot = await docRef.get();
  return enrichReport(reportFromFirestore(snapshot));
}

async function firebaseVote(reportId, voteType) {
  const reportRef = firebaseDb.collection('reports').doc(reportId);
  const snapshot = await reportRef.get();
  if (!snapshot.exists) throw new Error('Report not found');

  const report = reportFromFirestore(snapshot);
  if (report.userId === state.userId) throw new Error('You cannot vote on your own report');
  if (report.upvotes.includes(state.userId) || report.debunks.includes(state.userId)) {
    throw new Error('You have already voted on this report');
  }

  const field = voteType === 'upvote' ? 'upvotes' : 'debunks';
  await reportRef.update({ [field]: firebase.firestore.FieldValue.arrayUnion(state.userId) });
  const updatedSnap = await reportRef.get();
  return enrichReport(reportFromFirestore(updatedSnap));
}

async function firebaseLogin(email, password) {
  const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
  const user = userCredential.user;
  return { token: user.uid, email: user.email, userId: user.uid };
}

async function firebaseRegister(email, password) {
  const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;
  return { token: user.uid, email: user.email, userId: user.uid };
}

async function firebaseSignInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const userCredential = await firebaseAuth.signInWithPopup(provider);
  const user = userCredential.user;
  return {
    token: user.uid,
    email: user.email,
    userId: user.uid,
    profile: {
      ...defaultAccountProfile(user.email),
      name: user.displayName || deriveNameFromEmail(user.email),
      avatarUrl: user.photoURL || '',
    },
  };
}

async function requestUserLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) {
      toast('Geolocation is not available in your browser.', 'info');
      resolve(false);
      return;
    }

    toast('Requesting your location to show nearby listings…', 'info', 3000);
    navigator.geolocation.getCurrentPosition(
      pos => {
        state.userLat = pos.coords.latitude;
        state.userLng = pos.coords.longitude;
        state.nearMeActive = true;
        const nearBtn = document.getElementById('nearme-btn');
        if (nearBtn) {
          nearBtn.classList.add('active-nearme');
        }
        if (map) map.setView([state.userLat, state.userLng], 12);
        resolve(true);
      },
      err => {
        toast('Location access declined or unavailable. Showing wider listings.', 'info');
        resolve(false);
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  });
}

async function loadReports() {
  try {
    if (USE_FIREBASE && firebaseDb) {
      state.allReports = await firebaseLoadReports();
        // prepend demo reports (avoid duplicates by id) — ensure demo images are available in `media`
        const demoEnriched = DEMO_REPORTS.map(d => enrichReport({ ...d, media: d.media || (d.imageUrl ? [d.imageUrl] : []) }));
        state.allReports = demoEnriched.concat(state.allReports.filter(r => !demoEnriched.find(d => d.id === r.id)));
      state.reports = applyReportFilters(state.allReports);
      render();
      return;
    }

    const url = '/api/reports';
    state.allReports = await apiFetch(url, { method: 'GET', headers: {} });
    // include demo reports — ensure demo images are available in `media`
    const demoEnriched = DEMO_REPORTS.map(d => enrichReport({ ...d, media: d.media || (d.imageUrl ? [d.imageUrl] : []) }));
    state.allReports = demoEnriched.concat(state.allReports.filter(r => !demoEnriched.find(d => d.id === r.id)));
    state.reports = applyReportFilters(state.allReports);
    render();
  } catch (err) {
    toast('Failed to load reports: ' + err.message, 'error');
  }
}

// ── Auth flow ─────────────────────────────────────────────────────
function setSession(token, email, userId, profile = null) {
  state.token = token;
  state.email = email;
  state.userId = userId;
  state.accountProfile = profile ? { ...defaultAccountProfile(email), ...profile } : loadAccountProfile(userId, email);
  if (profile) {
    localStorage.setItem(`lp_profile_${userId}`, JSON.stringify(state.accountProfile));
  }
  localStorage.setItem('lp_token', token);
  localStorage.setItem('lp_email', email);
  localStorage.setItem('lp_userId', userId);
}

function clearSession() {
  state.token = null;
  state.email = null;
  state.userId = null;
  state.accountProfile = null;
  localStorage.removeItem('lp_token');
  localStorage.removeItem('lp_email');
  localStorage.removeItem('lp_userId');
}

async function verifyToken() {
  if (USE_FIREBASE && firebaseAuth) {
    const user = firebaseAuth.currentUser;
    if (user) {
      setSession(user.uid, user.email, user.uid, {
        ...defaultAccountProfile(user.email),
        name: user.displayName || deriveNameFromEmail(user.email),
        avatarUrl: user.photoURL || '',
      });
      return true;
    }
    return false;
  }

  if (!state.token) return false;
  try {
    const data = await apiFetch('/api/verify');
    if (data.profile) {
      state.accountProfile = { ...defaultAccountProfile(state.email), ...data.profile };
      localStorage.setItem(`lp_profile_${state.userId}`, JSON.stringify(state.accountProfile));
    }
    return true;
  } catch {
    clearSession();
    return false;
  }
}

async function handleLogout() {
  if (USE_FIREBASE && firebaseAuth) {
    try {
      await firebaseAuth.signOut();
    } catch (err) {
      console.error('Firebase sign out error:', err);
    }
  }
  clearSession();
  renderAuthArea();
  loadReports();
  toast('Signed out.', 'info');
}

// ── Render auth area ──────────────────────────────────────────────
function updatePageAuthButtons() {
  ['hero-login-btn', 'report-login-btn', 'report-register-btn', 'account-login-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.style.display = state.token ? 'none' : '';
  });
}

function renderAuthArea() {
  const el = document.getElementById('auth-area');
  const reportBtn = document.getElementById('report-btn');
  const heroLoginBtn = document.getElementById('hero-login-btn');
  if (state.token) {
    el.innerHTML = `
      <button class="account-menu-btn" id="open-account-btn" type="button">
        <div class="account-avatar" id="header-avatar"></div>
        <div class="account-menu-copy">
          <strong>${escHtml(deriveNameFromEmail(state.email))}</strong>
          <span>${escHtml(state.email)}</span>
        </div>
      </button>
    `;
    renderAvatar('header-avatar', state.accountProfile || loadAccountProfile());
    document.getElementById('open-account-btn').addEventListener('click', () => {
      renderAccountModal();
      openModal('account-modal');
    });
    if (reportBtn) reportBtn.style.display = 'inline-flex';
    if (heroLoginBtn) heroLoginBtn.style.display = 'none';
  } else {
    el.innerHTML = `
      <button class="btn btn-outline btn-sm" id="header-login-btn">Sign In</button>
      <button class="btn btn-primary btn-sm" id="header-register-btn">Register</button>
    `;
    document.getElementById('header-login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('header-register-btn').addEventListener('click', () => openModal('register-modal'));
    if (reportBtn) reportBtn.style.display = 'none';
    if (heroLoginBtn) heroLoginBtn.style.display = 'inline-flex';
  }

  updatePageAuthButtons();
  if (isPage('account')) renderAccountSection();
  if (isPage('report')) renderReportAccess();
}

// ── Render reports ────────────────────────────────────────────────
function render() {
  renderAuthArea();
  updateReportCount();
  updateLiveHighlights();
  renderReportAccess();
  renderComparisonPanel();
  // ensure layout class is applied
  setLayout(state.layout);
  // render category chips when present
  renderCategoryBar();
  if (state.view === 'list') renderList();
  else renderMap();
}

function renderReportAccess() {
  const reportCard = document.getElementById('report-page-card');
  const guestCard = document.getElementById('report-guest');
  if (!reportCard || !guestCard) return;
  if (state.token) {
    reportCard.style.display = '';
    guestCard.style.display = 'none';
  } else {
    reportCard.style.display = 'none';
    guestCard.style.display = 'block';
  }
}

function updateLiveHighlights() {
  const hero = document.getElementById('hero-highlights');
  if (!hero) return;

  if (!state.reports || state.reports.length === 0) {
    hero.innerHTML = isPage('home')
      ? `<div class="hero-panel-item"><span>We’re waiting for local reports near you.</span><strong>Enable location to see live local highlights.</strong></div>`
      : `<div class="hero-panel-item"><span>No live data yet</span><strong>—</strong></div>`;
    return;
  }

  if (isPage('home') && state.userLat === null) {
    hero.innerHTML = `<div class="hero-panel-item"><span>Detecting your location…</span><strong>Allow location access to show local price highlights.</strong></div>`;
    return;
  }

  const radiusKm = state.userLat !== null && state.userLng !== null ? 25 : 20000;
  let localReports = state.reports;
  let sourceLabel = 'Nigeria';
  if (state.userLat !== null && state.userLng !== null) {
    // Prefer showing everything in the same state as the nearest report so demos can surface.
    const sorted = state.reports.slice().sort((a, b) => haversine(state.userLat, state.userLng, a.lat, a.lng) - haversine(state.userLat, state.userLng, b.lat, b.lng));
    const nearest = sorted[0];
    if (nearest && nearest.state) {
      localReports = state.reports.filter(r => r.state === nearest.state);
      sourceLabel = nearest.state || (nearest.locationName || nearest.lga || 'Nearby area');
    } else {
      // Fallback to nearby radius if no state info is available
      const nearby = state.reports.filter(r => haversine(state.userLat, state.userLng, r.lat, r.lng) <= radiusKm);
      if (nearby.length > 0) {
        localReports = nearby;
        const nearest2 = nearby.slice().sort((a, b) => haversine(state.userLat, state.userLng, a.lat, a.lng) - haversine(state.userLat, state.userLng, b.lat, b.lng))[0];
        sourceLabel = nearest2.locationName || nearest2.lga || nearest2.state || 'Nearby area';
      } else {
        sourceLabel = 'Nearby radius';
      }
    }
  }

  const grouped = localReports.reduce((acc, report) => {
    const key = report.itemName.trim() || 'Unknown item';
    if (!acc[key]) acc[key] = [];
    acc[key].push(report);
    return acc;
  }, {});

  const topItems = Object.entries(grouped)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  hero.innerHTML = topItems.map(([itemName, reports]) => {
    const average = reports.reduce((sum, report) => sum + Number(report.price), 0) / reports.length;
    const unit = reports.find(report => report.measurement)?.measurement || '';
    const locationHint = reports[0].locationName || reports[0].lga || reports[0].state || sourceLabel;
    return `
      <div class="hero-panel-item">
        <span>${escHtml(itemName)} · ${escHtml(locationHint)}</span>
        <strong>${formatPrice(Math.round(average))}${unit ? `/${escHtml(unit)}` : ''}</strong>
      </div>`;
  }).join('');
}

function updateReportCount() {
  const el = document.getElementById('report-count');
  const status = document.getElementById('nearby-status');
  const n = state.reports.length;
  const nationwideCount = state.allReports.length;
  el.textContent = n === 0
    ? 'No reports found'
    : `Showing ${n} of ${nationwideCount} matching nationwide report${nationwideCount !== 1 ? 's' : ''}`;

  if (state.nearMeActive && hasUserLocation()) {
    status.textContent = 'Showing reports within 5 km of your current location. Open Nationwide to compare listings across the country.';
    status.style.display = 'block';
  } else if (hasUserLocation()) {
    status.textContent = 'Showing nationwide listings. Your location is available for comparisons and distance sorting.';
    status.style.display = 'block';
  } else {
    status.textContent = 'Showing nationwide listings. Use Near Me to add your location to the comparison.';
    status.style.display = 'block';
  }
}

function renderComparisonPanel() {
  const section = document.getElementById('comparison-section');
  const isModalOpen = document.getElementById('comparison-modal')?.style.display !== 'none';
  
  // Update section display if it exists
  if (section) {
    section.style.display = state.comparisonOpen ? 'block' : 'none';
    document.getElementById('compare-btn')?.classList.toggle('active-compare', state.comparisonOpen);
  }
  
  // Only render if modal is open or section should be displayed
  if (!isModalOpen && !state.comparisonOpen && section) return;

  const input = document.getElementById('compare-item-input');
  const inputModal = document.getElementById('compare-item-input-modal');
  if (input && document.activeElement !== input) {
    input.value = state.comparisonItem || state.searchQuery || '';
  }
  if (inputModal && document.activeElement !== inputModal) {
    inputModal.value = state.comparisonItem || state.searchQuery || '';
  }

  const reports = getComparableReports();
  const groups = getLocationGroups(reports);
  
  const select = document.getElementById('compare-location-select');
  const selectModal = document.getElementById('compare-location-select-modal');
  const grid = document.getElementById('comparison-grid');
  const gridModal = document.getElementById('comparison-grid-modal');
  const selected = document.getElementById('comparison-selected');
  const selectedModal = document.getElementById('comparison-selected-modal');
  const title = document.getElementById('comparison-title');

  const nearestGroup = hasUserLocation()
    ? groups
        .map(group => ({
          ...group,
          nearestDistance: Math.min(...group.reports.map(report => haversine(state.userLat, state.userLng, report.lat, report.lng))),
        }))
        .sort((a, b) => a.nearestDistance - b.nearestDistance)[0]
    : null;

  if (state.comparisonLocations.length === 0) {
    const starterGroups = nearestGroup
      ? [nearestGroup, ...groups.filter(group => group.key !== nearestGroup.key)]
      : groups;
    state.comparisonLocations = starterGroups.slice(0, 4).map(group => group.key);
  }

  const selectedKeys = new Set(state.comparisonLocations);
  const visibleGroups = groups.filter(group => selectedKeys.has(group.key));
  const itemLabel = (state.comparisonItem || state.searchQuery || 'all items').trim();
  if (title) title.textContent = `Compare ${itemLabel || 'all items'} by location`;

  const selectHTML = '<option value="">Select from available locations</option>' + groups
    .filter(group => !selectedKeys.has(group.key))
    .map(group => `<option value="${escHtml(group.key)}">${escHtml(group.label)} (${group.reports.length})</option>`)
    .join('');
  
  if (select) select.innerHTML = selectHTML;
  if (selectModal) selectModal.innerHTML = selectHTML;

  const selectedHTML = visibleGroups.length
    ? visibleGroups.map(group => `
        <button class="comparison-chip" type="button" data-location-key="${escHtml(group.key)}">
          ${escHtml(group.label)}
          <span>Remove</span>
        </button>
      `).join('')
    : '<span class="comparison-empty-text">Choose locations to compare.</span>';
  
  if (selected) selected.innerHTML = selectedHTML;
  if (selectedModal) selectedModal.innerHTML = selectedHTML;

  if (!reports.length) {
    const emptyHTML = `
      <div class="empty-state">
        <div class="empty-icon">No data</div>
        <h3>No matching prices</h3>
        <p>Try another item or clear the search to compare available locations.</p>
      </div>`;
    if (grid) grid.innerHTML = emptyHTML;
    if (gridModal) gridModal.innerHTML = emptyHTML;
    return;
  }

  const gridHTML = visibleGroups.map(group => {
    const prices = group.reports.map(report => Number(report.price)).filter(price => !Number.isNaN(price));
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const recent = group.reports.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    const distanceText = hasUserLocation()
      ? `${Math.min(...group.reports.map(report => haversine(state.userLat, state.userLng, report.lat, report.lng))).toFixed(1)} km from you`
      : 'Add your location for distance';
    const unit = recent?.measurement ? `/${escHtml(recent.measurement)}` : '';

    return `
      <article class="comparison-card">
        <div class="comparison-card-top">
          <strong>${escHtml(group.label)}</strong>
          <span>${group.reports.length} listing${group.reports.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="comparison-average">${formatPrice(Math.round(average))}${unit}</div>
        <div class="comparison-range">
          <span>Low ${formatPrice(lowest)}</span>
          <span>High ${formatPrice(highest)}</span>
        </div>
        <div class="comparison-card-footer">
          <span>${escHtml(distanceText)}</span>
          <span>${recent ? timeAgo(recent.timestamp) : ''}</span>
        </div>
      </article>`;
  }).join('');
  
  if (grid) grid.innerHTML = gridHTML;
  if (gridModal) gridModal.innerHTML = gridHTML;
}

function renderList() {
  const container = document.getElementById('list-view');
  const hasLocation = state.userLat !== null && state.userLng !== null;
  const reportsWithDistance = state.reports.map(r => ({
    ...r,
    distanceKm: hasLocation ? haversine(state.userLat, state.userLng, r.lat, r.lng) : null,
  }));

  if (hasLocation) {
    reportsWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  if (reportsWithDistance.length === 0) {
    const title = state.searchQuery ? 'No matches found' : 'No reports yet';
    const description = state.searchQuery
      ? `No listings match "${escHtml(state.searchQuery)}". Try broader terms or remove filters.`
      : hasLocation
        ? 'No reports were found near your current location. Try Nationwide or add a new price report.'
        : 'Be the first to report a price in your area.';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>`;
    return;
  }

  // If we're in grid layout (prices page), render compact grid cards
  if (state.layout === 'grid' || isPage('prices')) {
    container.innerHTML = reportsWithDistance.map((r, idx) => gridCardHTML(r, idx)).join('');

    // Attach vote listeners on compact cards
    container.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const { reportId, voteType } = btn.dataset;
        handleVote(reportId, voteType);
      });
    });
    // Attach detail toggle to allow deep-link highlighting
    container.querySelectorAll('details.grid-details').forEach(d => {
      d.addEventListener('toggle', e => {
        const el = e.target.closest('.report-card');
        if (!el) return;
        el.classList.toggle('highlight', e.target.open);
      });
    });
    // If URL contains ?report=ID while on prices page, open that report modal
    try {
      const params = new URLSearchParams(window.location.search || '');
      const rid = params.get('report');
      if (rid) setTimeout(() => openListingModal(rid), 250);
    } catch (e) {}
    return;
  }

  container.innerHTML = reportsWithDistance.map((r, idx) => reportCardHTML(r, idx === 0 && state.nearMeActive)).join('');

  // Attach vote listeners for list cards
  container.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { reportId, voteType } = btn.dataset;
      handleVote(reportId, voteType);
    });
  });

  // Attach comment submit listeners
  container.querySelectorAll('.comment-submit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const reportId = btn.dataset.reportId;
      const input = document.getElementById(`comment-input-${reportId}`);
      if (!input) return;
      saveReportComment(reportId, input.value);
      input.value = '';
    });
  });

  // Attach reply toggle listeners
  container.querySelectorAll('.reply-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const reportId = btn.dataset.reportId;
      const commentId = btn.dataset.commentId;
      const form = document.getElementById(`reply-form-${reportId}-${commentId}`);
      if (form) form.style.display = form.style.display === 'grid' ? 'none' : 'grid';
    });
  });

  // Attach reply submit listeners
  container.querySelectorAll('.reply-submit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const reportId = btn.dataset.reportId;
      const commentId = btn.dataset.commentId;
      const input = document.getElementById(`reply-input-${reportId}-${commentId}`);
      if (!input) return;
      saveReportComment(reportId, input.value, commentId);
      input.value = '';
      const form = document.getElementById(`reply-form-${reportId}-${commentId}`);
      if (form) form.style.display = 'none';
    });
  });
}

function openReportDetail(reportId) {
  if (!reportId) return;
  // Ensure we're in list view
  setView('list');
  // Wait briefly for DOM render
  setTimeout(() => {
    const el = document.getElementById('report-card-' + reportId) || document.querySelector(`.report-card[data-idx][data-idx][data-report-id='${reportId}']`);
    const target = el || document.getElementById('report-card-' + reportId) || document.querySelector(`[data-idx] .report-card`);
    const card = el || document.getElementById('report-card-' + reportId);
    if (!card) return;
    // If details exist, open it
    const details = card.querySelector('details') || card.querySelector('details.grid-details') || card.querySelector('.report-details');
    if (details) details.open = true;
    card.classList.add('highlight');
    card.scrollIntoView({behavior: 'smooth', block: 'center'});
    // remove highlight after a short time
    setTimeout(() => card.classList.remove('highlight'), 3500);
  }, 220);
}

function reportCardHTML(r, isNearest = false) {
  const canVote = state.token && r.userId !== state.userId;
  const alreadyVoted = state.token && (r.upvotes.includes(state.userId) || r.debunks.includes(state.userId));
  const voteDisabled = !state.token || !canVote || alreadyVoted ? 'disabled' : '';
  const voteTitle = !state.token
    ? 'Sign in to vote'
    : r.userId === state.userId
    ? 'You cannot vote on your own report'
    : alreadyVoted
    ? 'You already voted'
    : '';
  const extraClass = isNearest ? ' nearest-report' : '';
  const distanceLabel = r.distanceKm !== null
    ? `<span class="meta-dot">·</span><span class="meta-distance">📍 ${r.distanceKm.toFixed(1)} km away</span>`
    : '';
  const hasLocationDetails = !!(r.locationName || r.lga || r.state || r.sellerPlace);
  const locationLabel = hasLocationDetails ? reportLocationLabel(r) : 'Location details not provided';

  const confBar = r.confidence !== null
    ? `<div class="confidence-bar"><div class="confidence-fill" style="width:${r.confidence}%"></div></div>
       <span class="confidence-label">${r.confidence}% confidence</span>`
    : `<span class="confidence-label">No votes yet</span>`;

  const mediaMarkup = (r.media && r.media.length)
    ? `<div class="report-media">
         ${r.media.map(media => `<a href="${escHtml(media.url || media)}" target="_blank" rel="noreferrer"><img class="media-thumb" src="${escHtml(media.url || media)}" alt="Evidence preview" /></a>`).join('')}
       </div>`
    : '<div class="report-media">No evidence uploaded yet.</div>';

  const thumbMarkup = (r.media && r.media.length)
    ? `<div class="report-thumb"><a href="${escHtml(r.media[0].url || r.media[0])}" target="_blank" rel="noreferrer"><img class="report-thumb-img" src="${escHtml(r.media[0].url || r.media[0])}" alt="${escHtml(r.itemName)}"/></a></div>`
    : '';

  return `
    <div class="report-card${extraClass}">
      <div class="report-card-header">
        ${thumbMarkup}
        <div style="flex:1;min-width:0;">
          <div class="item-name">${escHtml(r.itemName)}</div>
          <div class="price-badge">${formatPrice(r.price)}${r.measurement ? `/${escHtml(r.measurement)}` : ''}</div>
        </div>
      </div>
      <div class="report-meta">
        <span class="avail-badge avail-${r.availability}">${availLabel(r.availability)}</span>
        ${locationLabel ? `<span class="meta-dot">·</span><span class="meta-location">📍 ${escHtml(locationLabel)}</span>` : ''}
        ${distanceLabel}
        <span class="meta-dot">·</span>
        <span class="meta-time">${timeAgo(r.timestamp)}</span>
      </div>
      <details class="report-details">
        <summary>Expand listing details</summary>
        <div class="report-extra">
          <div class="report-location">
            <strong>Listing location</strong>
            <p>${escHtml(locationLabel)}</p>
            ${hasLocationDetails ? '' : `<p>Coordinates are used only for mapping and verification.</p>`}
            <p><a href="https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}" target="_blank" rel="noreferrer">Get directions</a></p>
          </div>
          ${r.sellerContact ? `<div class="report-seller-contact"><strong>Seller contact</strong><p>${escHtml(r.sellerContact)}</p></div>` : ''}
          ${mediaMarkup}
          <div class="comments-panel">
            <strong>Community notes</strong>
            <div class="comment-list">${renderCommentList(r)}</div>
            <div class="comment-form">
              <textarea id="comment-input-${r.id}" placeholder="Add a comment or evidence note..."></textarea>
              <button class="btn btn-sm btn-primary comment-submit-btn" type="button" data-report-id="${r.id}">Post comment</button>
            </div>
          </div>
        </div>
      </details>
      <div class="vote-row">
        <button class="vote-btn upvote" ${voteDisabled} title="${voteTitle}"
          data-report-id="${r.id}" data-vote-type="upvote">
          👍 ${r.upvoteCount}
        </button>
        <button class="vote-btn debunk" ${voteDisabled} title="${voteTitle}"
          data-report-id="${r.id}" data-vote-type="debunk">
          👎 ${r.debunkCount}
        </button>
        ${confBar}
      </div>
    </div>`;
}

function gridCardHTML(r, idx = 0) {
  const trend = r.trend || r.trendPercent || (r.trendDelta ? String(r.trendDelta) : null) || null;
  const trendVal = trend ? String(trend).trim() : null;
  let trendHtml = '';
  if (trendVal) {
    if (trendVal.startsWith('-')) {
      trendHtml = `<span class="trend-badge trend-down">⬇ ${escHtml(trendVal.replace('-', ''))}</span>`;
    } else if (trendVal.startsWith('+')) {
      trendHtml = `<span class="trend-badge trend-up">⬆ ${escHtml(trendVal.replace('+', ''))}</span>`;
    } else {
      trendHtml = `<span class="trend-badge">${escHtml(trendVal)}</span>`;
    }
  }

  const statusClass = `avail-${(r.availability || r.status || '').toString().toLowerCase().replace(/\s+/g, '_')}`;
  const statusLabel = availLabel(r.availability || r.status);
  const location = (r.locationName || r.location || '').trim();
  const up = r.upvoteCount ?? r.upvotes ?? r.upvotes?.length ?? 0;
  const down = r.debunkCount ?? r.downvotes ?? r.downvotes?.length ?? 0;

  return `
    <article id="report-card-${escHtml(r.id)}" class="report-card grid-card" data-idx="${idx}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div class="item-name">${escHtml(r.itemName || r.name)}</div>
        <div style="text-align:right;">
          <div class="price-badge">${formatPrice(r.price || r.priceValue || r.amount)}${r.measurement ? `/${escHtml(r.measurement)}` : ''}</div>
          ${trendHtml}
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <span class="avail-badge ${escHtml(statusClass)}">${escHtml(statusLabel)}</span>
        <span class="meta-location">${escHtml(location)}</span>
      </div>
      <details class="grid-details">
        <summary>Show details</summary>
        <div style="margin-top:8px;">${sparklineSVG(r.priceHistory, 240, 36)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <div style="font-size:0.9rem;color:var(--clay-muted);">${r.locationName ? escHtml(r.locationName) : escHtml(location)}</div>
          <div style="text-align:right;font-size:0.9rem;color:var(--clay-muted);">${escHtml(r.trendLabel || '')}</div>
        </div>
        <div style="margin-top:8px;">${r.media && r.media.length ? `<img src="${escHtml(r.media[0].url||r.media[0])}" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;" />` : ''}</div>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
          <button class="vote-btn upvote" data-report-id="${escHtml(r.id)}" data-vote-type="upvote">👍 ${escHtml(String(up || 0))}</button>
          <button class="vote-btn debunk" data-report-id="${escHtml(r.id)}" data-vote-type="debunk">👎 ${escHtml(String(down || 0))}</button>
          <button class="btn btn-ghost btn-sm" onclick="openListingModal('${escHtml(r.id)}')">Open listing</button>
        </div>
      </details>
    </article>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Map ───────────────────────────────────────────────────────────
function renderMap() {
  if (!map) {
    const initialCenter = state.userLat !== null && state.userLng !== null
      ? [state.userLat, state.userLng]
      : [9.0820, 8.6753];
    const initialZoom = state.userLat !== null && state.userLng !== null ? 12 : 6;
    map = L.map('map').setView(initialCenter, initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);
  }
  // Clear existing markers and clusters
  try { if (markerClusterGroup) { markerClusterGroup.clearLayers(); markerClusterGroup = null; } } catch (e) {}
  markers.forEach(m => m.remove());
  markers = [];

  if (state.reports.length === 0) {
    map.setView([9.0820, 8.6753], 6);
    return;
  }

  const bounds = [];
  const useClustering = typeof L.markerClusterGroup === 'function' || (L && L.markerClusterGroup);
  if (useClustering) {
    try {
      markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 48,
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="cluster-icon">${count}</div>`,
            className: 'lp-cluster',
            iconSize: [46, 46],
          });
        }
      });
    } catch (e) { markerClusterGroup = null; }
  }

  state.reports.forEach(r => {
    const color = { in_stock: '#16a34a', limited: '#d97706', out_of_stock: '#dc2626' }[r.availability] || '#6b7280';

    const iconSize = 22;
    const iconBorder = 3;
    const icon = L.divIcon({
      className: 'lp-map-pin',
      html: `<div style="width:${iconSize}px;height:${iconSize}px;border-radius:50%;background:${color};border:${iconBorder}px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>`,
      iconSize: [iconSize, iconSize],
      iconAnchor: [Math.round(iconSize/2), Math.round(iconSize/2)],
    });

    const marker = L.marker([r.lat, r.lng], { icon });

    const canVote = state.token && r.userId !== state.userId;
    const alreadyVoted = state.token && (r.upvotes.includes(state.userId) || r.debunks.includes(state.userId));
    const voteDisabled = !state.token || !canVote || alreadyVoted ? 'disabled' : '';
    const voteTitle = !state.token ? 'Sign in to vote' : r.userId === state.userId ? 'Own report' : alreadyVoted ? 'Already voted' : '';

    const confText = r.confidence !== null ? `${r.confidence}% confidence` : 'No votes yet';

    marker.bindPopup(`
      <div class="map-popup">
        <h4>${escHtml(r.itemName)}</h4>
        <div class="price">${formatPrice(r.price)}</div>
        <div style="margin:6px 0;font-size:0.8rem;">
          <span class="avail-badge avail-${r.availability}">${availLabel(r.availability)}</span>
        </div>
        ${r.locationName ? `<div style="font-size:0.8rem;color:#6b7280;">📍 ${escHtml(r.locationName)}</div>` : ''}
        <div style="font-size:0.75rem;color:#9ca3af;margin-top:4px;">${timeAgo(r.timestamp)} · 👍 ${r.upvoteCount} 👎 ${r.debunkCount} · ${confText}</div>
        <div class="popup-vote-row">
          <button class="btn btn-sm btn-outline" ${voteDisabled} title="${voteTitle}"
            onclick="handleVote('${r.id}','upvote')">👍 Upvote</button>
          <button class="btn btn-sm btn-danger" ${voteDisabled} title="${voteTitle}"
            onclick="handleVote('${r.id}','debunk')">👎 Debunk</button>
        </div>
        <div style="margin-top:8px;text-align:right;"><button class="btn btn-ghost btn-sm" onclick="openListingModal('${escHtml(r.id)}')">Open listing</button></div>
      </div>
    `);

    bounds.push([r.lat, r.lng]);
    markers.push(marker);
    if (markerClusterGroup) markerClusterGroup.addLayer(marker);
    else marker.addTo(map);
  });

  if (markerClusterGroup) map.addLayer(markerClusterGroup);

  if (bounds.length > 0 && !state.nearMeActive) {
    try { map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 }); } catch {}
  }
}

// ── Vote handler ──────────────────────────────────────────────────
async function handleVote(reportId, voteType) {
  if (!state.token) {
    openModal('login-modal');
    return;
  }
  try {
    const updated = USE_FIREBASE && firebaseDb
      ? await firebaseVote(reportId, voteType)
      : await apiFetch('/api/vote', {
          method: 'POST',
          body: JSON.stringify({ reportId, voteType }),
        });
    const idx = state.reports.findIndex(r => r.id === reportId);
    if (idx !== -1) state.reports[idx] = updated;
    const allIdx = state.allReports.findIndex(r => r.id === reportId);
    if (allIdx !== -1) state.allReports[allIdx] = updated;
    render();
    toast(voteType === 'upvote' ? '👍 Upvoted!' : '👎 Debunked!', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// expose for map popup onclick
window.handleVote = handleVote;

// ── View toggle ───────────────────────────────────────────────────
function setView(v) {
  state.view = v;
  const listView = document.getElementById('list-view');
  const mapView = document.getElementById('map-view');
  if (listView) listView.style.display = v === 'list' ? '' : 'none';
  if (mapView) mapView.style.display = v === 'map' ? 'block' : 'none';
  document.getElementById('list-btn')?.classList.toggle('active', v === 'list');
  document.getElementById('map-btn')?.classList.toggle('active', v === 'map');

  if (!listView && !mapView) return;

  if (v === 'map') {
    if (!map) renderMap();
    else {
      setTimeout(() => { map.invalidateSize(); renderMap(); }, 0);
    }
  } else {
    renderList();
  }
}

function setLayout(l) {
  state.layout = l === 'grid' ? 'grid' : 'list';
  const listView = document.getElementById('list-view');
  if (listView) {
    listView.classList.toggle('layout-grid', state.layout === 'grid');
  }
  document.getElementById('grid-layout-btn')?.classList.toggle('active', state.layout === 'grid');
}

// ── Near Me ───────────────────────────────────────────────────────
function handleNearMe() {
  if (state.nearMeActive) {
    state.nearMeActive = false;
    document.getElementById('nearme-btn').classList.remove('active-nearme');
    document.getElementById('nearme-btn').textContent = '📍 Near Me';
    state.reports = applyReportFilters(state.allReports);
    render();
    return;
  }

  if (!navigator.geolocation) {
    toast('Geolocation not supported by your browser.', 'error');
    return;
  }

  toast('Requesting location…', 'info', 2000);
  navigator.geolocation.getCurrentPosition(
    pos => {
      state.userLat = pos.coords.latitude;
      state.userLng = pos.coords.longitude;
      state.nearMeActive = true;
      document.getElementById('nearme-btn').classList.add('active-nearme');
      if (map) map.setView([state.userLat, state.userLng], 13);
      state.reports = applyReportFilters(state.allReports);
      render();
      toast('Showing reports within 5 km of your location.', 'success');
    },
    err => {
      toast('Could not get location: ' + err.message, 'error');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function handleNationwide() {
  state.nearMeActive = false;
  const nearBtn = document.getElementById('nearme-btn');
  if (nearBtn) {
    nearBtn.classList.remove('active-nearme');
  }
  state.reports = applyReportFilters(state.allReports);
  render();
  if (map && state.view === 'map') renderMap();
  toast('Showing nationwide listings for comparison.', 'success');
}

// ── GPS button in report modal ────────────────────────────────────
let pendingLat = null;
let pendingLng = null;
let pendingMedia = [];

document.getElementById('get-location-btn').addEventListener('click', async () => {
  if (!navigator.geolocation) {
    toast('Geolocation not supported.', 'error');
    return;
  }
  setGpsStatus('Getting your location…', true);
  navigator.geolocation.getCurrentPosition(
    async pos => {
      pendingLat = pos.coords.latitude;
      pendingLng = pos.coords.longitude;
      const geo = await reverseGeocode(pendingLat, pendingLng);
      const label = (geo && (geo.display_name || geo.name)) || `${pendingLat.toFixed(5)}, ${pendingLng.toFixed(5)}`;
      setGpsStatus(`✅ GPS set: ${label}`, false);
      const locationInput = document.getElementById('report-location-name');
      if (locationInput && !locationInput.value.trim() && geo && geo.display_name) {
        locationInput.value = geo.display_name;
      }

      // Autofill state and LGA where possible from the address parts
      if (geo && geo.address) {
        const addr = geo.address;
        const stateVal = addr.state || addr.region || addr.county || addr.state_district || addr['province'] || '';
        const lgaVal = addr.county || addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || '';

        if (stateVal) {
          const stateField = document.getElementById('report-state');
          const stateList = document.getElementById('report-state-list');
          if (stateField) {
            if (stateList) {
              const match = Array.from(stateList.options).find(o => o.value && o.value.toLowerCase() === stateVal.toLowerCase())
                || Array.from(stateList.options).find(o => o.value.toLowerCase().includes(stateVal.toLowerCase()));
              stateField.value = match ? match.value : stateVal;
            } else {
              stateField.value = stateVal;
            }
          }
        }

        if (lgaVal) {
          const lgaInput = document.getElementById('report-lga');
          if (lgaInput && !lgaInput.value.trim()) lgaInput.value = lgaVal;
        }

        // Show a short confirmation toast if we autofilled anything
        try {
          const filledState = (document.getElementById('report-state') && document.getElementById('report-state').value) || stateVal || '';
          const filledLga = (document.getElementById('report-lga') && document.getElementById('report-lga').value) || lgaVal || '';
          if (filledState || filledLga) {
            const niceState = filledState;
            const msgParts = [];
            if (niceState) msgParts.push(`State: ${niceState}`);
            if (filledLga) msgParts.push(`LGA: ${filledLga}`);
            if (msgParts.length) {
              toastWithUndo(`Autofilled ${msgParts.join(', ')} — please confirm`, () => {
                try {
                  const stateField = document.getElementById('report-state');
                  if (stateField && stateVal) stateField.value = '';
                  const lgaInput = document.getElementById('report-lga');
                  if (lgaInput && lgaVal) lgaInput.value = '';
                } catch (e) { console.warn('undo autofill', e); }
              }, 'success', 6000);
            }
          }
        } catch (e) {
          // ignore toast failures
        }
      }
    },
    err => {
      setGpsStatus('Failed: ' + err.message, false);
      toast('Location error: ' + err.message, 'error');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

document.getElementById('report-media')?.addEventListener('change', async event => {
  const files = event.target.files;
  if (!files || !files.length) return;
  pendingMedia = await readFilesAsDataUrls(files);
  const preview = document.getElementById('report-media-preview');
  if (preview) {
    preview.innerHTML = pendingMedia
      .map(item => `<img class="media-thumb" src="${item.url}" alt="${escHtml(item.name)}" />`)
      .join('');
  }
});

// ── Modals ────────────────────────────────────────────────────────
function openModal(id) {
  if (id === 'account-modal') renderAccountModal();
  if (id === 'profile-modal') populateProfileForm();
  document.getElementById(id).style.display = 'flex';
  clearModalErrors();
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function clearModalErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('visible');
}

function readFilesAsDataUrls(files) {
  return Promise.all(Array.from(files).map(file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, url: reader.result });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }));
}

function createCommentHTML(comment, reportId, replies = []) {
  const repliesHTML = replies.length
    ? replies.map(reply => `
        <div class="comment-item reply-container">
          <div class="comment-meta">${escHtml(reply.userEmail || 'User')} · ${timeAgo(reply.timestamp)}</div>
          <div class="comment-text">${escHtml(reply.text)}</div>
        </div>
      `).join('')
    : '';

  return `
    <div class="comment-item">
      <div class="comment-meta">${escHtml(comment.userEmail || 'User')} · ${timeAgo(comment.timestamp)}</div>
      <div class="comment-text">${escHtml(comment.text)}</div>
      <div class="comment-actions">
        <button class="btn btn-ghost btn-sm reply-toggle-btn" type="button" data-report-id="${reportId}" data-comment-id="${comment.id}">Reply</button>
      </div>
      <div class="reply-form" id="reply-form-${reportId}-${comment.id}">
        <textarea id="reply-input-${reportId}-${comment.id}" placeholder="Write a reply..."></textarea>
        <div class="comment-actions">
          <button class="btn btn-sm btn-primary reply-submit-btn" type="button" data-report-id="${reportId}" data-comment-id="${comment.id}">Post reply</button>
        </div>
      </div>
      ${repliesHTML}
    </div>
  `;
}

function renderCommentList(report) {
  const comments = report.comments || [];
  if (!comments.length) {
    return '<div class="comment-item">No comments yet. Be the first to add evidence or ask a question.</div>';
  }

  const repliesByParent = comments.reduce((map, comment) => {
    if (comment.parentId) {
      map[comment.parentId] = map[comment.parentId] || [];
      map[comment.parentId].push(comment);
    }
    return map;
  }, {});

  const rootComments = comments.filter(comment => !comment.parentId);
  if (!rootComments.length) {
    return '<div class="comment-item">No top-level comments yet.</div>';
  }

  return rootComments.map(comment => createCommentHTML(comment, report.id, repliesByParent[comment.id] || [])).join('');
}

// ── Listing bottom-sheet modal ──────────────────────────────────
function openListingModal(reportId) {
  const report = (state.allReports || []).find(r => r.id === reportId) || (state.reports || []).find(r => r.id === reportId);
  if (!report) {
    toast('Listing not found.', 'error');
    return;
  }
  const body = document.getElementById('listing-modal-body');
  if (!body) return;
  const up = report.upvoteCount ?? report.upvotes?.length ?? 0;
  const down = report.debunkCount ?? report.debunks?.length ?? 0;
  body.innerHTML = `
    <div class="listing-top">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:12px;">
        <div style="flex:1;min-width:0;">
          <h3 class="item-name">${escHtml(report.itemName || report.name)}</h3>
          <div class="meta-sub">${escHtml(report.locationName || report.lga || report.state || '')} · ${timeAgo(report.timestamp)}</div>
        </div>
        <div style="text-align:right;">
          <div class="price-badge">${formatPrice(report.price)}${report.measurement ? `/${escHtml(report.measurement)}` : ''}</div>
          <div style="margin-top:6px;color:var(--clay-muted);">${availLabel(report.availability)}</div>
        </div>
      </div>
    </div>
    <div class="listing-media" style="margin-top:12px;">
      ${report.media && report.media.length ? report.media.map(m=>`<img src="${escHtml(m.url||m)}" style="width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin-bottom:8px;"/>`).join('') : '<div style="color:var(--gray-400);">No evidence uploaded.</div>'}
    </div>
    <div class="listing-actions" style="display:flex;gap:8px;margin-top:8px;">
      <button class="btn btn-outline" onclick="handleVote('${report.id}','upvote')">👍 ${escHtml(String(up))}</button>
      <button class="btn btn-danger" onclick="handleVote('${report.id}','debunk')">👎 ${escHtml(String(down))}</button>
      <div style="flex:1"></div>
      <div style="color:var(--clay-muted);font-size:0.9rem;">${report.confidence !== null ? escHtml(String(report.confidence) + '% confidence') : 'No votes yet'}</div>
    </div>
    <div class="listing-poster" style="margin-top:12px;border-top:1px solid rgba(0,0,0,0.04);padding-top:12px;">
      <div style="font-size:0.9rem;color:var(--clay-muted);">Posted by</div>
      <div style="font-weight:700">${escHtml(report.userName || report.posterName || report.userEmail || 'Anonymous')}</div>
    </div>
    <div class="listing-comments" style="margin-top:14px;">
      <h4 style="margin:0 0 8px 0;">Community notes</h4>
      <div id="listing-comments-list">${renderCommentList(report)}</div>
      <div style="margin-top:8px;">
        <textarea id="listing-comment-input" placeholder="Write a comment..." style="width:100%;min-height:64px;padding:8px;border-radius:8px;border:1px solid rgba(0,0,0,0.06);"></textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:8px;"><button class="btn btn-primary" onclick="submitListingComment('${report.id}')">Post comment</button></div>
      </div>
    </div>
  `;

  openModal('listing-modal');

  // Wire reply toggles and reply submits inside modal
  setTimeout(() => {
    document.querySelectorAll('#listing-comments-list .reply-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid = btn.dataset.reportId;
        const cid = btn.dataset.commentId;
        const form = document.getElementById(`reply-form-${rid}-${cid}`);
        if (form) form.style.display = form.style.display === 'grid' ? 'none' : 'grid';
      });
    });
    document.querySelectorAll('#listing-comments-list .reply-submit-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rid = btn.dataset.reportId;
        const cid = btn.dataset.commentId;
        const input = document.getElementById(`reply-input-${rid}-${cid}`);
        if (!input) return;
        await saveReportComment(rid, input.value, cid);
        openListingModal(rid);
      });
    });
  }, 120);
}

async function submitListingComment(reportId) {
  const input = document.getElementById('listing-comment-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  await saveReportComment(reportId, text);
  // Refresh modal content
  openListingModal(reportId);
}

function renderAccountSection() {
  const section = document.getElementById('account-section');
  const emptyState = document.getElementById('account-empty');
  if (!state.token) {
    if (section) section.style.display = 'none';
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>Sign in to access your account</h3>
          <p>Manage your uploads, view trust scores, and keep your local pricing data up to date.</p>
          <button class="btn btn-primary" id="account-login-btn">Sign In</button>
        </div>`;
      document.getElementById('account-login-btn')?.addEventListener('click', () => openModal('login-modal'));
    }
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  const profile = state.accountProfile || loadAccountProfile();
  state.accountProfile = profile;
  const { myReports, totalVotes, upvotes, debunks, trustScore, verifiedListings } = getAccountStats();
  const locationText = accountLocationText(profile);

  document.getElementById('account-owner').textContent = profile?.name || deriveNameFromEmail(state.email);
  renderAvatar('account-page-avatar', profile);
  document.getElementById('account-page-email').textContent = state.email || '';
  document.getElementById('account-page-location').textContent = locationText;
  document.getElementById('account-page-trust').textContent = `${trustScore}%`;
  document.getElementById('account-listings-count').textContent = myReports.length;
  document.getElementById('account-page-verified').textContent = verifiedListings;
  document.getElementById('account-page-total-votes').textContent = totalVotes;
  document.getElementById('account-page-upvotes').textContent = upvotes;
  document.getElementById('account-page-debunks').textContent = debunks;

  const editBtn = document.getElementById('account-page-edit-btn');
  if (editBtn) editBtn.onclick = () => openModal('profile-modal');
  const reportBtn = document.getElementById('account-page-report-btn');
  if (reportBtn) reportBtn.onclick = () => window.location.href = 'report.html';
  const logoutBtn = document.getElementById('account-page-logout-btn');
  if (logoutBtn) logoutBtn.onclick = handleLogout;

  const listings = document.getElementById('account-listings');
  if (!myReports.length) {
    listings.innerHTML = `
      <div class="account-empty">
        <strong>You haven't reported any prices yet.</strong>
        <p>Help your community — report one now.</p>
        <button class="btn btn-primary btn-sm" id="account-empty-report-btn">Report now</button>
      </div>`;
    setTimeout(() => {
      document.getElementById('account-empty-report-btn')?.addEventListener('click', () => {
        window.location.href = 'report.html';
      });
    }, 0);
  } else {
    listings.innerHTML = myReports.slice(0, 5).map(report => `
      <div class="account-listing-item">
        <strong>${escHtml(report.itemName)} - ${formatPrice(report.price)}${report.measurement ? `/${escHtml(report.measurement)}` : ''}</strong>
        <p>${escHtml(report.locationName || report.lga || report.state || 'Location details available')}</p>
        <p>${availLabel(report.availability)} · ${timeAgo(report.timestamp)} · ${report.confidence !== null ? `${report.confidence}% trust` : 'No votes yet'}</p>
      </div>
    `).join('');
  }
  section.style.display = 'block';
  updateTrustRing(trustScore, 'account-trust-ring');
}

function updateTrustRing(score, elementId) {
  const ring = document.getElementById(elementId);
  if (!ring) return;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(100, Number(score))) / 100;
  ring.style.strokeDasharray = `${circumference} ${circumference}`;
  ring.style.strokeDashoffset = `${circumference * (1 - ratio)}`;
}

function setFieldValidation(inputId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(`${inputId}-error`);
  if (input) input.classList.toggle('field-invalid', !!message);
  if (error) error.textContent = message || '';
}

function clearReportValidation() {
  ['report-item', 'report-price', 'report-location-name', 'report-state'].forEach(id => setFieldValidation(id, ''));
}

function validateReportForm() {
  clearReportValidation();
  let valid = true;
  const itemName = document.getElementById('report-item').value.trim();
  const price = document.getElementById('report-price').value;
  const locationName = document.getElementById('report-location-name').value.trim();
  const stateName = document.getElementById('report-state').value;

  if (!itemName || itemName.length < 3) {
    setFieldValidation('report-item', 'Item name must be at least 3 characters.');
    valid = false;
  }
  if (!price || isNaN(Number(price)) || Number(price) < 0) {
    setFieldValidation('report-price', 'Enter a valid price.');
    valid = false;
  }
  if (!locationName) {
    setFieldValidation('report-location-name', 'Provide the market, shop, or neighborhood.');
    valid = false;
  }
  if (!stateName) {
    setFieldValidation('report-state', 'Enter the state where this price was reported.');
    valid = false;
  }
  return valid;
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=14&addressdetails=1`);
    if (!response.ok) throw new Error('Failed to resolve location');
    const data = await response.json();
    // Return the full response so calling code can extract display name and address parts
    return data;
  } catch (err) {
    console.warn('reverseGeocode error', err);
    return null;
  }
}

function setGpsStatus(message, loading = false) {
  const status = document.getElementById('gps-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('gps-loading', loading);
}

function renderAccountModal() {
  if (!state.token) return;
  const profile = state.accountProfile || loadAccountProfile();
  state.accountProfile = profile;
  const { myReports, totalVotes, upvotes, debunks, trustScore, verifiedListings } = getAccountStats();
  const locationText = accountLocationText(profile);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('account-modal-name', profile?.name || deriveNameFromEmail(state.email));
  setText('account-modal-email', state.email || '');
  setText('account-modal-location', locationText);
  renderAvatar('account-modal-avatar', profile);
  setText('account-modal-trust', `${trustScore}%`);
  setText('account-modal-listings', myReports.length);
  setText('account-modal-verified', verifiedListings);
  setText('account-modal-votes', totalVotes);
  setText('account-modal-upvotes', upvotes);
  setText('account-modal-debunks', debunks);
  updateTrustRing(trustScore, 'account-modal-trust-ring');

  const listings = document.getElementById('account-modal-listing-list');
  if (!listings) return;

  if (!myReports.length) {
    listings.innerHTML = `
      <div class="account-empty">
        <strong>No listings yet</strong>
        <p>Report a price to start building your account history and trust score.</p>
      </div>`;
    return;
  }

  listings.innerHTML = myReports.slice(0, 5).map(report => `
    <div class="account-listing-item">
      <strong>${escHtml(report.itemName)} - ${formatPrice(report.price)}${report.measurement ? `/${escHtml(report.measurement)}` : ''}</strong>
      <p>${escHtml(report.locationName || report.lga || report.state || 'Location details available')}</p>
      <p>${availLabel(report.availability)} · ${timeAgo(report.timestamp)} · ${report.confidence !== null ? `${report.confidence}% trust` : 'No votes yet'}</p>
    </div>
  `).join('');
}

function populateProfileForm() {
  if (!state.token) return;
  const profile = state.accountProfile || loadAccountProfile();
  state.accountProfile = profile;

  document.getElementById('profile-name').value = profile?.name || '';
  document.getElementById('profile-location').value = profile?.location || '';
  document.getElementById('profile-state').value = profile?.state || '';
  document.getElementById('profile-lga').value = profile?.lga || '';
  const avatarLabel = document.getElementById('profile-avatar-filename');
  if (avatarLabel) {
    avatarLabel.textContent = profile?.avatarUrl ? 'Using selected avatar' : 'Use your device gallery';
  }
}

async function saveReportComment(reportId, text, parentId = null) {
  if (!text.trim()) return;
  if (!state.token) {
    openModal('login-modal');
    return;
  }

  const payload = { text: text.trim(), parentId };
  let updatedReport;

  if (USE_FIREBASE && firebaseDb) {
    const report = state.reports.find(r => r.id === reportId);
    if (!report) throw new Error('Report not found');
    report.comments = report.comments || [];
    const comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: state.userId,
      userEmail: state.email,
      text: payload.text,
      timestamp: new Date().toISOString(),
      replies: [],
    };
    if (parentId) {
      const parent = report.comments.find(c => c.id === parentId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      }
    } else {
      report.comments.unshift(comment);
    }
    updatedReport = report;
  } else {
    updatedReport = await apiFetch(`/api/reports/${reportId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  const idx = state.reports.findIndex(r => r.id === reportId);
  if (idx !== -1) state.reports[idx] = enrichReport(updatedReport);
  const allIdx = state.allReports.findIndex(r => r.id === reportId);
  if (allIdx !== -1) state.allReports[allIdx] = enrichReport(updatedReport);
  render();
}

// Close buttons
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

// Close on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeModal(backdrop.id);
  });
});

// Switch links
document.getElementById('switch-to-register').addEventListener('click', () => {
  closeModal('login-modal');
  openModal('register-modal');
});
document.getElementById('switch-to-login').addEventListener('click', () => {
  closeModal('register-modal');
  openModal('login-modal');
});

document.getElementById('hero-report-btn')?.addEventListener('click', () => {
  window.location.href = 'report.html';
});

document.getElementById('hero-login-btn')?.addEventListener('click', () => {
  openModal('login-modal');
});

document.getElementById('report-login-btn')?.addEventListener('click', () => {
  openModal('login-modal');
});

document.getElementById('report-register-btn')?.addEventListener('click', () => {
  openModal('register-modal');
});

// ── Login form ────────────────────────────────────────────────────
document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
  closeModal('account-modal');
  openModal('profile-modal');
});

document.getElementById('account-report-btn')?.addEventListener('click', () => {
  closeModal('account-modal');
  window.location.href = 'report.html';
});

document.getElementById('account-signout-btn')?.addEventListener('click', () => {
  closeModal('account-modal');
  handleLogout();
});

document.getElementById('profile-save-btn')?.addEventListener('click', async () => {
  const name = document.getElementById('profile-name').value.trim();
  if (!name) {
    showError('profile-error', 'Please enter the name you want shown on your account.');
    return;
  }

  const btn = document.getElementById('profile-save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  try {
    await persistAccountProfile({
      name,
      location: document.getElementById('profile-location').value.trim(),
      state: document.getElementById('profile-state').value.trim(),
      lga: document.getElementById('profile-lga').value.trim(),
      avatarUrl: state.accountProfile?.avatarUrl || '',
    });
    closeModal('profile-modal');
    renderAuthArea();
    renderAccountModal();
    openModal('account-modal');
    toast('Profile updated.', 'success');
  } catch (err) {
    showError('profile-error', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save profile';
  }
});

document.getElementById('profile-avatar-btn')?.addEventListener('click', () => {
  document.getElementById('profile-avatar-input')?.click();
});

document.getElementById('profile-avatar-input')?.addEventListener('change', event => {
  const input = event.target;
  if (!input.files || !input.files.length) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const url = reader.result;
    if (!url) return;
    state.accountProfile = {
      ...state.accountProfile,
      avatarUrl: url,
    };
    const avatarLabel = document.getElementById('profile-avatar-filename');
    if (avatarLabel) avatarLabel.textContent = file.name;
  };
  reader.readAsDataURL(file);
});

document.getElementById('login-submit').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) {
    showError('login-error', 'Please enter your email and password.');
    return;
  }
  const btn = document.getElementById('login-submit');
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    const data = USE_FIREBASE
      ? await firebaseLogin(email, password)
      : await apiFetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, deviceHash: await getDeviceHash() }),
        });
    setSession(data.token, data.email, data.userId, data.profile);
    closeModal('login-modal');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    renderAuthArea();
    loadReports();
    toast('Welcome back, ' + data.email + '!', 'success');
  } catch (err) {
    showError('login-error', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('login-submit').click();
});

document.querySelectorAll('.google-auth-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const textSpan = btn.querySelector('.btn-text') || btn;
    const errorContainer = btn.closest('.modal-body')?.querySelector('.form-error');
    const errorId = errorContainer ? errorContainer.id : 'login-error';

    btn.disabled = true;
    textSpan.textContent = 'Signing in…';
    try {
      if (!USE_FIREBASE) {
        throw new Error('Google sign-in requires Firebase configuration.');
      }
      const data = await firebaseSignInWithGoogle();
      setSession(data.token, data.email, data.userId, data.profile);
      closeModal('login-modal');
      closeModal('register-modal');
      renderAuthArea();
      await loadReports();
      toast('Welcome back, ' + data.email + '!', 'success');
    } catch (err) {
      showError(errorId, err.message);
    } finally {
      btn.disabled = false;
      textSpan.textContent = 'Continue with Google';
    }
  });
});

// ── Register form ─────────────────────────────────────────────────
document.getElementById('register-submit').addEventListener('click', async () => {
  const name = document.getElementById('register-name').value.trim();
  const location = document.getElementById('register-location').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  if (!name || !email || !password) {
    showError('register-error', 'Please fill in all fields.');
    return;
  }
  if (password.length < 6) {
    showError('register-error', 'Password must be at least 6 characters.');
    return;
  }
  const btn = document.getElementById('register-submit');
  btn.disabled = true;
  btn.textContent = 'Creating account…';
  try {
    const data = USE_FIREBASE
      ? await firebaseRegister(email, password)
      : await apiFetch('/api/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name, location, deviceHash: await getDeviceHash() }),
        });
    setSession(data.token, data.email, data.userId, data.profile);
    saveAccountProfile({ ...state.accountProfile, name, location });
    closeModal('register-modal');
    document.getElementById('register-name').value = '';
    document.getElementById('register-location').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    renderAuthArea();
    loadReports();
    toast('Account created! Welcome aboard 🎉', 'success');
  } catch (err) {
    showError('register-error', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});

document.getElementById('register-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('register-submit').click();
});

// ── Report form ───────────────────────────────────────────────────
document.getElementById('report-btn')?.addEventListener('click', () => {
  window.location.href = 'report.html';
});

document.getElementById('report-submit').addEventListener('click', async () => {
  clearReportValidation();
  if (!validateReportForm()) {
    showError('report-error', 'Please resolve the highlighted fields before submitting.');
    return;
  }

  const itemName = document.getElementById('report-item').value.trim();
  const price = document.getElementById('report-price').value;
  const availability = document.getElementById('report-avail').value;
  const locationName = document.getElementById('report-location-name').value.trim();
  const stateName = document.getElementById('report-state').value;
  const lga = document.getElementById('report-lga').value.trim();
  const measurement = document.getElementById('report-measurement').value;
  const customMeasurement = document.getElementById('report-measurement-custom').value.trim();
  const measurementLabel = measurement === 'custom' ? customMeasurement || 'Custom' : measurement;
  const sellerPlace = document.getElementById('report-seller-place').value.trim();
  const sellerContact = document.getElementById('report-seller-contact').value.trim();

  let lat = pendingLat;
  let lng = pendingLng;

  if (lat === null || lng === null) {
    if (state.userLat !== null) {
      lat = state.userLat;
      lng = state.userLng;
    } else {
      showError('report-error', 'Please tap 📍 GPS to set your location.');
      return;
    }
  }

  const btn = document.getElementById('report-submit');
  btn.disabled = true;
  btn.textContent = 'Submitting…';

  try {
    const reportPayload = {
      itemName,
      price: Number(price),
      measurement: measurementLabel,
      availability,
      lat,
      lng,
      locationName,
      state: stateName,
      lga,
      sellerPlace,
      sellerContact,
      media: pendingMedia,
      deviceHash: await getDeviceHash(),
    };

    if (USE_FIREBASE && firebaseDb) {
      await firebaseSubmitReport(reportPayload);
    } else {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify(reportPayload),
      });
    }
    closeModal('report-modal');
    pendingMedia = [];
    document.getElementById('report-media-preview').innerHTML = '';
    await loadReports();
    toast('Price report submitted! 🙌', 'success');
  } catch (err) {
    showError('report-error', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Report';
  }
});

['report-item', 'report-price', 'report-location-name', 'report-state'].forEach(id => {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener('input', () => {
    setFieldValidation(id, '');
    const reportError = document.getElementById('report-error');
    if (reportError) reportError.textContent = '';
  });
});

// ── Search ────────────────────────────────────────────────────────
let searchTimeout;
document.getElementById('search-input')?.addEventListener('input', e => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchQuery = e.target.value.trim();
    state.reports = applyReportFilters(state.allReports);
    render();
  }, 350);
});

// ── View toggle buttons ────────────────────────────────────────────
document.getElementById('list-btn')?.addEventListener('click', () => setView('list'));
document.getElementById('map-btn')?.addEventListener('click', () => setView('map'));
document.getElementById('nearme-btn')?.addEventListener('click', handleNearMe);
document.getElementById('nationwide-btn')?.addEventListener('click', handleNationwide);
document.getElementById('grid-layout-btn')?.addEventListener('click', () => setLayout(state.layout === 'grid' ? 'list' : 'grid'));
document.getElementById('map-toggle')?.addEventListener('click', () => setView(state.view === 'map' ? 'list' : 'map'));

document.getElementById('comparison-close')?.addEventListener('click', () => {
  state.comparisonOpen = false;
  render();
});
document.getElementById('compare-item-input')?.addEventListener('input', e => {
  state.comparisonItem = e.target.value.trim();
  state.comparisonLocations = [];
  renderComparisonPanel();
});
document.getElementById('compare-item-input-modal')?.addEventListener('input', e => {
  state.comparisonItem = e.target.value.trim();
  state.comparisonLocations = [];
  renderComparisonPanel();
});
document.getElementById('compare-location-select')?.addEventListener('change', e => {
  const key = e.target.value;
  if (key && !state.comparisonLocations.includes(key)) {
    state.comparisonLocations = [...state.comparisonLocations, key].slice(0, 6);
    renderComparisonPanel();
  }
  e.target.value = '';
});
document.getElementById('compare-location-select-modal')?.addEventListener('change', e => {
  const key = e.target.value;
  if (key && !state.comparisonLocations.includes(key)) {
    state.comparisonLocations = [...state.comparisonLocations, key].slice(0, 6);
    renderComparisonPanel();
  }
  e.target.value = '';
});
document.getElementById('comparison-selected')?.addEventListener('click', e => {
  const chip = e.target.closest('.comparison-chip');
  if (!chip) return;
  state.comparisonLocations = state.comparisonLocations.filter(key => key !== chip.dataset.locationKey);
  renderComparisonPanel();
});
document.getElementById('comparison-selected-modal')?.addEventListener('click', e => {
  const chip = e.target.closest('.comparison-chip');
  if (!chip) return;
  state.comparisonLocations = state.comparisonLocations.filter(key => key !== chip.dataset.locationKey);
  renderComparisonPanel();
});

// ── Bottom Navigation (Mobile) ─────────────────────────────────────
document.getElementById('nav-report')?.addEventListener('click', () => {
  window.location.href = 'report.html';
});

document.getElementById('comparison-open-btn')?.addEventListener('click', () => {
  state.comparisonItem = state.searchQuery;
  state.comparisonLocations = [];
  openModal('comparison-modal');
  renderComparisonPanel();
});

document.getElementById('compare-btn')?.addEventListener('click', () => {
  state.comparisonOpen = !state.comparisonOpen;
  renderComparisonPanel();
});

// ── Initial load ──────────────────────────────────────────────────
(async () => {
  await initFirebase();
  if (state.token && !USE_FIREBASE) {
    const valid = await verifyToken();
    if (!valid) toast('Session expired. Please sign in again.', 'info');
  }
  renderAuthArea();
  if (isPage('home')) {
    await requestUserLocation();
  }
  await loadReports();

  // set active bottom nav on load
  try { setActiveNav(); } catch (e) {}

  if (isPage('prices')) {
    // Prices page: force grid layout (grid-only list presentation) and hide the list toggle.
    setLayout('grid');
    document.getElementById('list-btn')?.style.setProperty('display', 'none');
    document.getElementById('grid-layout-btn')?.classList.add('active');
    // Prices page: always show list/grid view (map is on the dedicated map page)
    setView('list');
  } else if (isPage('map')) {
    // If we're on the dedicated map page, open the map view
    setView('map');
  } else if (isPage('account')) {
    renderAccountSection();
  }
})();

// Side-swipe navigation: supports touch, mouse drag, and arrow keys
function enableSideScroll() {
  const order = ['index.html', 'prices.html', 'report.html', 'account.html'];
  const href = window.location.pathname.split('/').pop() || 'index.html';
  const currentIndex = Math.max(0, order.indexOf(href));

  function goToIndex(idx) {
    if (idx < 0 || idx >= order.length || idx === currentIndex) return;
    const target = order[idx];
    const direction = idx > currentIndex ? 'left' : 'right';
    document.body.classList.add('swipe-transition');
    document.body.classList.add(direction === 'left' ? 'swipe-left' : 'swipe-right');
    // navigate after animation
    setTimeout(() => {
      // remove classes to avoid affecting target page if navigated fast
      window.location.href = target;
    }, 320);
  }

  // touch handlers
  let startX = 0, startY = 0, isTouch = false;
  window.addEventListener('touchstart', e => {
    if (!e.touches || e.touches.length !== 1) return;
    isTouch = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, {passive:true});
  window.addEventListener('touchend', e => {
    if (!isTouch) return;
    const endX = (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX) || 0;
    const endY = (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientY) || 0;
    const dx = endX - startX;
    const dy = endY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goToIndex(currentIndex + 1);
      else goToIndex(currentIndex - 1);
    }
    isTouch = false;
  });

  // mouse drag for desktop
  let mouseDown = false; let mouseStartX = 0;
  window.addEventListener('mousedown', e => { mouseDown = true; mouseStartX = e.clientX; });
  window.addEventListener('mouseup', e => {
    if (!mouseDown) return; mouseDown = false;
    const dx = e.clientX - mouseStartX;
    if (Math.abs(dx) > 100) {
      if (dx < 0) goToIndex(currentIndex + 1);
      else goToIndex(currentIndex - 1);
    }
  });

  // keyboard
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goToIndex(currentIndex + 1);
    if (e.key === 'ArrowLeft') goToIndex(currentIndex - 1);
  });
}
