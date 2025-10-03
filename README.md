# Trashinova - NASA Space Apps Challenge 2024 Portfolio

A high-performance, responsive portfolio website showcasing 3D models, datasets, research papers, and interactive demos for the NASA Space Apps Challenge.

## 🚀 Features

- **Interactive 3D Model Viewer** - Built with Three.js and React Three Fiber
- **Admin Panel** - Team-only access for content management
- **Firebase Integration** - Authentication, Firestore, and Storage
- **Responsive Design** - Mobile-first approach with dark orange/red theme
- **SEO Optimized** - Meta tags and Open Graph support
- **Fast Performance** - Optimized assets and lazy loading

## 📁 Project Structure

```
trashinova-portfolio/
├── public/
│   ├── assets/
│   │   ├── models/     # 3D model files (.glb, .gltf)
│   │   ├── images/     # Team photos and images
│   │   ├── data/       # Datasets (.csv, .json)
│   │   └── papers/     # Research PDFs
│   └── logo.svg
├── src/
│   ├── components/
│   │   ├── ModelViewer3D.jsx
│   │   ├── AdminAuth.jsx
│   │   └── AdminPanel.jsx
│   ├── config/
│   │   └── firebase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── firebase.json
├── firestore.rules
├── storage.rules
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Git

### Step 1: Clone and Install

```bash
git clone https://github.com/your-username/trashinova-portfolio.git
cd trashinova-portfolio
npm install
```

### Step 2: Firebase Configuration

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Enable Storage
5. Get your Firebase config from Project Settings

6. Update `src/config/firebase.js` with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### Step 3: Initialize Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore
# - Storage
# - Hosting
```

### Step 4: Set Up Team Members

1. Go to Firebase Console → Authentication
2. Add team member emails manually
3. Go to Firestore Database
4. Create collection `teamMembers`
5. Add documents with team member UIDs:

```json
{
  "uid": "user-uid-from-authentication",
  "email": "team@trashinova.space",
  "name": "Team Member Name",
  "role": "Admin"
}
```

## 🏃 Running the Project

### Development Mode

```bash
npm run dev
```

Visit http://localhost:3000

### Build for Production

```bash
npm run build
```

### Deploy to Firebase

```bash
npm run deploy
```

Or manually:

```bash
npm run build
firebase deploy
```

## 📝 Content Management

### Adding a New Project

#### Option 1: Using Admin Panel (Recommended)

1. Go to https://your-site.web.app/admin
2. Sign in with your team credentials
3. Click "Projects" tab
4. Fill in project details
5. Upload 3D model, dataset, and PDF
6. Click "Save Project"

#### Option 2: Manual Firebase Upload

1. Upload files to Firebase Storage:
   - Models: `/models/`
   - Datasets: `/datasets/`
   - Papers: `/papers/`

2. Add project to Firestore `projects` collection:

```json
{
  "title": "Mars Terrain Analysis",
  "description": "High-resolution 3D reconstruction...",
  "tags": ["3D", "dataset", "research"],
  "modelUrl": "https://storage.googleapis.com/.../model.glb",
  "dataUrl": "https://storage.googleapis.com/.../data.csv",
  "pdfUrl": "https://storage.googleapis.com/.../paper.pdf",
  "metrics": {
    "polygons": "2.5M",
    "resolution": "10cm/px"
  },
  "createdAt": "2024-10-02T10:00:00Z"
}
```

### Uploading Team Photos

1. Go to Admin Panel → Team tab
2. Upload individual photos
3. Photos will be stored in `/team/` in Firebase Storage

### Updating Site Settings

1. Go to Admin Panel → Settings tab
2. Upload new logo
3. Update tagline
4. Click "Save Settings"

## 🎨 Customization

### Changing Colors

Edit `tailwind.config.js` and `src/index.css`:

```javascript
// tailwind.config.js
colors: {
  'orange': {...},
  'red': {...},
  // Add your colors
}
```

### Adding New Sections

1. Create component in `src/components/`
2. Import in `src/App.jsx`
3. Add to navigation

## 🔒 Security Rules

The Firebase security rules ensure only team members can upload/edit content:

- **Firestore**: Public read, team write
- **Storage**: Public read, team upload with file size limits
  - Models: 100MB max
  - Photos: 5MB max
  - Datasets: 50MB max
  - PDFs: 20MB max

## ♿ Accessibility

- Semantic HTML5 elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast ratios meet WCAG AA standards
- Alt text for images

## ⚡ Performance Optimizations

- Lazy loading for 3D models and images
- Code splitting with Vite
- Compressed assets (WebP, AVIF)
- CDN delivery via Firebase Hosting
- Optimized Three.js bundle

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### 3D Models Not Loading

- Check file format (.glb or .gltf only)
- Ensure file size < 100MB
- Verify CORS settings in Firebase Storage
- Check browser console for errors

### Admin Panel Access Denied

- Verify email is added to Firebase Authentication
- Check Firestore `teamMembers` collection
- Ensure UID matches Authentication UID

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

## 📦 Deployment Checklist

- [ ] Update Firebase config
- [ ] Add team members to Firestore
- [ ] Upload logo and assets
- [ ] Test admin panel access
- [ ] Test 3D model viewer
- [ ] Check mobile responsiveness
- [ ] Run accessibility audit
- [ ] Test all download links
- [ ] Verify SEO meta tags
- [ ] Deploy to Firebase

## 📄 License

MIT License - See LICENSE file for details

## 👥 Team

**Trashinova** - NASA Space Apps Challenge 2025

## 🔗 Links

- Live Site: https://trashinova.web.app
- GitHub: https://github.com/trashinova
- Admin Panel: https://trashinova.web.app/admin

---

Built with ❤️ for NASA Space Apps Challenge 2025