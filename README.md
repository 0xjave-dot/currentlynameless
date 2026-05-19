# Last Price 🇳🇬

**Real-time crowdsourced price and availability tracker for Nigeria.**

Report and discover prices for everyday goods — rice, fuel, tomatoes, and more — near you. Vote on reports to help the community know what's real.

---

## Quick Start

```bash
npm install
node server.js
```

Open `http://localhost:3000` in your browser.

---

## Features

- **Register / Login** — JWT-based auth, passwords hashed with bcrypt
- **Report a Price** — Submit item name, price (₦), availability, and GPS location
- **Upvote / Debunk** — Community voting with confidence scores
- **Search** — Case-insensitive item search
- **Near Me** — Filter reports within 5 km of your location
- **Map View** — Leaflet.js map with color-coded availability markers
- **List View** — Sorted by newest, with vote counts

---

## Project Structure

```
last-price/
├── server.js       # Express API server
├── index.html      # Single-page frontend
├── style.css       # Responsive stylesheet
├── script.js       # Frontend JavaScript
├── package.json    # Dependencies
├── README.md       # This file
├── users.json      # Auto-created on first run
└── reports.json    # Auto-created on first run
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/register` | ❌ | Register new user, returns JWT |
| POST | `/api/login` | ❌ | Login, returns JWT |
| GET | `/api/verify` | ✅ | Verify token validity |
| GET | `/api/profile` | ✅ | Fetch the signed-in user's profile |
| PUT | `/api/profile` | ✅ | Update name and location profile fields |
| GET | `/api/reports` | ❌ | List reports (supports `search`, `lat`, `lng`, `radius`) |
| POST | `/api/reports` | ✅ | Submit a price report |
| POST | `/api/vote` | ✅ | Upvote or debunk a report |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | `last-price-secret-change-in-production` | **Override this in production!** |

## Firebase

This project includes optional Firebase support for authentication and report storage.
Create a Firebase project and add your web config values into `firebase-config.js`.
If `firebase-config.js` is left with placeholder values, the app continues using the local Express backend.

### Firebase Authentication

- Email/password sign-in is supported via Firebase Auth.
- Google sign-in is available in the login modal when Firebase is configured.

### Firestore rules

The file `firestore.rules` contains example security rules to:
- allow open read access to `reports`
- allow authenticated users to create reports
- allow authenticated users to vote by adding their own UID to `upvotes` or `debunks`
- prevent report owners from voting on their own reports

---

## Free Hosting Guide

The best free path depends on whether you want a quick demo or real persisted data.

### Recommended: Firebase Hosting + Firebase Auth + Firestore

Use this for the most practical free deployment because the frontend already supports Firebase.

1. Create a Firebase project.
2. Enable **Authentication**:
   - Email/password
   - Google sign-in, if you want the Google buttons to work
3. Create a Firestore database.
4. Copy your web app config into `firebase-config.js`.
5. Install Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting firestore
```

6. During setup, use the project root as the public directory, keep `index.html`, and do not overwrite existing files.
7. Deploy:

```bash
firebase deploy
```

Firebase's Spark plan has no-cost quotas for Hosting, Auth, and Firestore, but usage can be shut off for the month if quotas are exceeded. See the official Firebase pricing docs: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans

### Quick Demo: Render Free Web Service

Use this if you want to host the current Express server without changing storage yet.

1. Push this folder to GitHub.
2. Create a new **Web Service** on Render.
3. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add environment variables:
   - `JWT_SECRET` — set a strong random string
5. Choose the free instance type and deploy.

Important: Render free web services spin down after idle time and have an ephemeral filesystem. That means `users.json` and `reports.json` are not reliable long-term storage on the free web service. Use Firebase/Firestore or a hosted database before sharing the app publicly. Render free docs: https://render.com/docs/free

### Static-Only Option: Render Static Sites, Vercel, or Netlify

This works only when Firebase is configured, because static hosts cannot run `server.js`.

1. Configure Firebase in `firebase-config.js`.
2. Deploy `index.html`, `style.css`, `script.js`, `design-tokens.css`, and `firebase-config.js`.
3. Deploy `firestore.rules` through Firebase, not through the static host.
4. On the host, set the publish/output directory to the project root.

Render static sites are free to deploy: https://render.com/docs/static-sites
Vercel's Hobby plan can host static frontends, but the current Express server should not be deployed there unchanged: https://vercel.com/docs/pricing

### Railway Note

Railway can run Node apps, but its free access is credit/trial based. As of the current docs, new users get a trial grant and then limited monthly free credit. Check the official docs before relying on it for ongoing free hosting: https://docs.railway.com/pricing/free-trial

---

## Security Notes

- JWT tokens expire after **7 days**.
- Passwords are hashed with bcrypt (10 salt rounds).
- All mutating endpoints require a valid JWT in `Authorization: Bearer <token>`.
- Users cannot vote on their own reports.
- Duplicate votes are rejected.
- All inputs are validated server-side.

---

## Data Storage

Data is stored in two flat JSON files in the project root:

- **`users.json`** — `{ id, email, hashedPassword, profile, createdAt }`
- **`reports.json`** — `{ id, userId, itemName, price, availability, lat, lng, locationName, timestamp, upvotes[], debunks[] }`

Confidence score is computed on the fly: `(upvotes / totalVotes) * 100`.

---

*Built for the Nigerian market. Prices in Naira (₦).*
