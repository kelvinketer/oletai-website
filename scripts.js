// =========================================================
// GLOBAL & HOMEPAGE LOGIC
// =========================================================

// 1. Scroll Animations (Fades elements in as you scroll down)
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      const delay = parseFloat(e.target.style.transitionDelay || 0);
      setTimeout(() => e.target.classList.add('in'), delay * 1000);
    }
  });
}, { threshold: 0.08 });
revealEls.forEach(el => obs.observe(el));

// 2. Navbar Scroll Effect (Adds shadow when scrolling)
const nb = document.getElementById('navbar');
if (nb) {
  window.addEventListener('scroll', () => {
    nb.classList.toggle('scrolled', window.scrollY > 12);
  });
}

// 3. Digital Cooperatives Visual Grid Generator
const grid = document.getElementById('coop-pixels');
if (grid) {
  for (let i = 0; i < 48; i++) {
    const d = document.createElement('div');
    d.className = 'coop-pixel';
    d.style.opacity = (Math.random() * 0.6 + 0.1).toFixed(2);
    grid.appendChild(d);
  }
}

// 4. Contact Form Submit Simulation
const btn = document.getElementById('form-btn');
if (btn) {
  btn.addEventListener('click', () => {
    btn.textContent = '✓ Message Sent — We\'ll be in touch!';
    btn.style.background = 'var(--green-800)';
    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.background = '';
    }, 3000);
  });
}

// =========================================================
// INSIGHTS MAP LOGIC
// =========================================================

// This 'if' statement ensures the map code only runs if the user is actually on the Insights page
if (document.getElementById('map')) {
  
  // Initialize the Leaflet Map
  const map = L.map('map').setView([-0.6, 37.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Custom UI for map pins
  function makeIcon(color) {
    return L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }

  const COLORS = { disease: '#F59E0B', pest: '#EF4444', healthy: '#3D9A54', monitoring: '#0D9488', hub: '#3D9A54' };

  // Local fallback data if the cloud backend is asleep
  const POINTS = [
    { lat: -1.2921, lng: 36.8219, type: 'hub', title: 'Nairobi HQ', desc: 'Oletai Agro Group Headquarters · Nairobi, Kenya', county: 'Nairobi' },
    { lat: 0.0528, lng: 37.6494, type: 'disease', title: 'Maize Lethal Necrosis', desc: 'MLN confirmed across 3 sub-counties. 9 farmer reports.', county: 'Meru' },
    { lat: -1.0455, lng: 35.8718, type: 'pest', title: 'Fall Armyworm Outbreak', desc: 'High-density FAW infestation. 14 farmer confirmations.', county: 'Narok' },
    { lat: 0.5143, lng: 37.2693, type: 'monitoring', title: 'Coffee Rust Monitoring', desc: 'Low-level Hemileia vastatrix detected. Preventive measures advised.', county: 'Nyeri' },
    { lat: -0.3031, lng: 36.0800, type: 'healthy', title: 'Nakuru — 82 Scans', desc: 'Active scanning region. Mostly healthy crop reports.', county: 'Nakuru' },
    { lat: -1.0500, lng: 37.0833, type: 'monitoring', title: 'Embu Monitoring Station', desc: 'Bean rust under watch. 6 reports this month.', county: 'Embu' },
    { lat: 0.2839, lng: 34.7519, type: 'healthy', title: 'Bungoma Scans', desc: 'Healthy sugarcane crop reports. 22 scans this month.', county: 'Bungoma' },
  ];

  let allMarkers = [];
  let activeFilter = 'all';

  // Function to render markers based on user filters
  function plotMarkers(filterType) {
    allMarkers.forEach(m => map.removeLayer(m));
    allMarkers = [];
    POINTS.forEach(pt => {
      if (filterType !== 'all' && pt.type !== filterType && !(filterType === 'healthy' && pt.type === 'hub')) return;
      const color = COLORS[pt.type] || '#888';
      const marker = L.marker([pt.lat, pt.lng], { icon: makeIcon(color) })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;min-width:200px">
            <div style="font-weight:700;font-size:14px;color:#111;margin-bottom:4px">${pt.title}</div>
            <div style="font-size:12px;color:#666;margin-bottom:6px">${pt.county} County</div>
            <div style="font-size:12px;color:#444;line-height:1.5">${pt.desc}</div>
          </div>
        `);
      allMarkers.push(marker);
    });
  }

  // Handle map filter button clicks
  window.filterMap = function(type, btn) {
    activeFilter = type;
    document.querySelectorAll('.map-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    plotMarkers(type);
  };

  // Connect to the live FastAPI backend
  async function loadData() {
    try {
      const res = await fetch('https://rahisipay-api.onrender.com/api/v1/research/map-data', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      
      document.getElementById('totalScans').textContent = data.length.toLocaleString();
      document.getElementById('monthlyScans').textContent = Math.round(data.length * 0.18).toLocaleString();
      
      // Plot real dynamic data if available
      data.forEach(pt => {
        if (!pt.lat || !pt.lng) return;
        const marker = L.marker([pt.lat, pt.lng], { icon: makeIcon(COLORS.monitoring) })
          .addTo(map)
          .bindPopup(`<div style="font-family:'DM Sans',sans-serif"><strong>${pt.date}</strong><br>${pt.diagnosis}</div>`);
        allMarkers.push(marker);
      });
    } catch {
      // If the cloud server is asleep, seamlessly fall back to static data
      document.getElementById('totalScans').textContent = '1,247';
      document.getElementById('monthlyScans').textContent = '224';
      plotMarkers('all');
    } finally {
      document.getElementById('map-loading').classList.add('hidden');
    }
  }

  // Execute on load
  loadData();
  plotMarkers('all');
  setTimeout(() => document.getElementById('map-loading').classList.add('hidden'), 1200);
}

// =========================================================
// KNOWLEDGE HUB / BLOG LOGIC
// =========================================================

// This ensures the blog logic only runs on the blog page
if (document.querySelector('.hub-hero')) {
  
  // Topic filtering
  window.filterPosts = function(topic, btn) {
    const cards = document.querySelectorAll('.article-card');
    cards.forEach(c => {
      c.style.display = (topic === 'all' || c.dataset.topic === topic) ? 'block' : 'none';
    });
    
    document.querySelectorAll('.topic-pill').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
  };

  // Article overlay modals
  window.openArticle = function(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevents background scrolling
  };
  
  window.closeArticle = function(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
  };
  
  // Close overlay by clicking outside the article box
  document.querySelectorAll('.article-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) closeArticle(this.id);
    });
  });

  // Newsletter subscription simulation
  const subBtn = document.getElementById('subscribe-btn');
  if (subBtn) {
    subBtn.addEventListener('click', function() {
      this.textContent = '✓ You\'re subscribed!';
      this.style.background = 'var(--green-800)';
      setTimeout(() => {
        this.textContent = 'Subscribe to Knowledge Hub';
        this.style.background = '';
      }, 3000);
    });
  }

  // Close overlays on ESC key press
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.article-overlay.open').forEach(o => {
        o.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  });
}