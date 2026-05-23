const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'market-secret-change-in-production';
const SALT_ROUNDS = 10;
const JWT_EXPIRY = '7d';

const USERS_FILE = path.join(__dirname, 'users.json');
const REPORTS_FILE = path.join(__dirname, 'reports.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readReports() {
  if (!fs.existsSync(REPORTS_FILE)) {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
}

function writeReports(reports) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeConfidence(report) {
  const total = report.upvotes.length + report.debunks.length;
  if (total === 0) return null;
  return Math.round((report.upvotes.length / total) * 100);
}

function enrichReport(report) {
  const { deviceHash, ...publicReport } = report;
  return {
    ...publicReport,
    upvoteCount: report.upvotes.length,
    debunkCount: report.debunks.length,
    totalVotes: report.upvotes.length + report.debunks.length,
    confidence: computeConfidence(report),
    measurement: report.measurement || '',
    sellerPlace: report.sellerPlace || '',
    sellerContact: report.sellerContact || '',
    state: report.state || '',
    lga: report.lga || '',
    media: report.media || [],
    comments: report.comments || [],
  };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeProfile(profile = {}) {
  return {
    name: profile.name ? String(profile.name).trim().slice(0, 80) : '',
    location: profile.location ? String(profile.location).trim().slice(0, 120) : '',
    state: profile.state ? String(profile.state).trim().slice(0, 80) : '',
    lga: profile.lga ? String(profile.lga).trim().slice(0, 80) : '',
  };
}

function publicUser(user) {
  const profile = sanitizeProfile(user.profile || user);
  return {
    id: user.id,
    email: user.email,
    profile: {
      name: profile.name || user.email.split('@')[0],
      location: profile.location,
      state: profile.state,
      lga: profile.lga,
    },
  };
}

function normalizeDeviceHash(hash) {
  return hash && typeof hash === 'string' ? hash.trim().toLowerCase() : '';
}

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, location, state: stateName, lga, deviceHash } = req.body;
    const normalizedDeviceHash = normalizeDeviceHash(deviceHash);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const users = readUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    if (normalizedDeviceHash) {
      const sameDeviceUser = users.find((u) => Array.isArray(u.deviceHashes) && u.deviceHashes.includes(normalizedDeviceHash));
      if (sameDeviceUser) {
        return res.status(409).json({ error: 'This device is already linked to another account. Please sign in instead.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = {
      id: generateId(),
      email: email.toLowerCase().trim(),
      hashedPassword,
      deviceHashes: normalizedDeviceHash ? [normalizedDeviceHash] : [],
      profile: sanitizeProfile({ name, location, state: stateName, lga }),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    return res.status(201).json({ token, email: newUser.email, userId: newUser.id, profile: publicUser(newUser).profile });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, deviceHash } = req.body;
    const normalizedDeviceHash = normalizeDeviceHash(deviceHash);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.hashedPassword);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (normalizedDeviceHash) {
      user.deviceHashes = Array.isArray(user.deviceHashes) ? user.deviceHashes : [];
      if (!user.deviceHashes.includes(normalizedDeviceHash)) {
        user.deviceHashes.push(normalizedDeviceHash);
        writeUsers(users);
      }
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    return res.status(200).json({ token, email: user.email, userId: user.id, profile: publicUser(user).profile });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/verify', authMiddleware, (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.userId);
  return res.status(200).json({
    valid: true,
    userId: req.userId,
    email: req.userEmail,
    profile: user ? publicUser(user).profile : null,
  });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.status(200).json(publicUser(user));
});

app.put('/api/profile', authMiddleware, (req, res) => {
  const users = readUsers();
  const userIndex = users.findIndex((u) => u.id === req.userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const profile = sanitizeProfile(req.body);
  if (!profile.name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  users[userIndex].profile = profile;
  users[userIndex].updatedAt = new Date().toISOString();
  writeUsers(users);

  return res.status(200).json(publicUser(users[userIndex]));
});

app.get('/api/reports', (req, res) => {
  try {
    const { lat, lng, radius, search } = req.query;
    let reports = readReports();

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      reports = reports.filter((r) => {
        return (
          r.itemName.toLowerCase().includes(term) ||
          (r.locationName || '').toLowerCase().includes(term) ||
          (r.sellerPlace || '').toLowerCase().includes(term) ||
          (r.state || '').toLowerCase().includes(term) ||
          (r.lga || '').toLowerCase().includes(term)
        );
      });
    }

    if (lat && lng && radius) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      if (!isNaN(userLat) && !isNaN(userLng) && !isNaN(radiusKm)) {
        reports = reports.filter((r) => {
          const dist = haversineDistance(userLat, userLng, r.lat, r.lng);
          return dist <= radiusKm;
        });
      }
    }

    reports = reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json(reports.map(enrichReport));
  } catch (err) {
    console.error('Get reports error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/reports', authMiddleware, (req, res) => {
  try {
    const {
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
      deviceHash,
    } = req.body;

    if (!itemName || itemName.trim().length === 0) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    if (!['in_stock', 'limited', 'out_of_stock'].includes(availability)) {
      return res.status(400).json({ error: 'Availability must be in_stock, limited, or out_of_stock' });
    }
    if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({ error: 'Valid GPS coordinates are required' });
    }

    const reports = readReports();
    const newReport = {
      id: generateId(),
      userId: req.userId,
      itemName: itemName.trim(),
      price: Number(price),
      measurement: measurement ? measurement.trim() : '',
      availability,
      lat: Number(lat),
      lng: Number(lng),
      locationName: locationName ? locationName.trim() : '',
      state: stateName ? stateName.trim() : '',
      lga: lga ? lga.trim() : '',
      sellerPlace: sellerPlace ? sellerPlace.trim() : '',
      sellerContact: sellerContact ? sellerContact.trim() : '',
      deviceHash: normalizeDeviceHash(deviceHash),
      media: Array.isArray(media) ? media : [],
      comments: [],
      timestamp: new Date().toISOString(),
      upvotes: [],
      debunks: [],
    };

    reports.push(newReport);
    writeReports(reports);

    return res.status(201).json(enrichReport(newReport));
  } catch (err) {
    console.error('Post report error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/vote', authMiddleware, (req, res) => {
  try {
    const { reportId, voteType } = req.body;

    if (!reportId) {
      return res.status(400).json({ error: 'reportId is required' });
    }
    if (!['upvote', 'debunk'].includes(voteType)) {
      return res.status(400).json({ error: 'voteType must be upvote or debunk' });
    }

    const reports = readReports();
    const reportIndex = reports.findIndex((r) => r.id === reportId);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[reportIndex];

    if (report.userId === req.userId) {
      return res.status(403).json({ error: 'You cannot vote on your own report' });
    }

    if (report.upvotes.includes(req.userId) || report.debunks.includes(req.userId)) {
      return res.status(409).json({ error: 'You have already voted on this report' });
    }

    if (voteType === 'upvote') {
      report.upvotes.push(req.userId);
    } else {
      report.debunks.push(req.userId);
    }

    reports[reportIndex] = report;
    writeReports(reports);

    return res.status(200).json(enrichReport(report));
  } catch (err) {
    console.error('Vote error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/reports/:reportId/comments', authMiddleware, (req, res) => {
  try {
    const { reportId } = req.params;
    const { text, parentId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const reports = readReports();
    const reportIndex = reports.findIndex((r) => r.id === reportId);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[reportIndex];
    if (!Array.isArray(report.comments)) {
      report.comments = [];
    }

    const users = readUsers();
    const user = users.find((u) => u.id === req.userId);
    const newComment = {
      id: generateId(),
      userId: req.userId,
      userEmail: user ? user.email : 'User',
      text: text.trim(),
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
    };

    report.comments.push(newComment);
    reports[reportIndex] = report;
    writeReports(reports);

    return res.status(201).json(enrichReport(report));
  } catch (err) {
    console.error('Comment save error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Market server running on port ${PORT}`);
});
