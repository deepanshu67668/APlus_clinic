/* ==========================================================================
   A Plus Dental Clinic & Implant Centre - Master Interactive Script
   Includes LocalStorage Data Manager, Auto Lead Popup, Hero Slideshow, Full Gallery Modal & Corporate Camp Handler
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initStorageSeed();
  renderDynamicTreatments();
  renderDynamicDoctors();
  renderDynamicGallery();
  renderDynamicBlogs();
  renderDynamicReviews();
  
  initDateInput();
  initMobileNav();
  initFormHandlers();
  initScrollNav();
  initAutoLeadPopup();
  initHeroSlideshow();
  initCloudRealtimeListeners();
});

// Real-Time Firebase Cloud Firestore Synchronization Listener
function initCloudRealtimeListeners() {
  if (typeof db === 'undefined' || !db) return;

  try {
    db.collection('treatments').onSnapshot(snapshot => {
      if (snapshot && !snapshot.empty) {
        const cloudData = [];
        snapshot.forEach(doc => cloudData.push(doc.data()));
        localStorage.setItem('aplus_treatments', JSON.stringify(cloudData));
        renderDynamicTreatments();
      }
    });

    db.collection('doctors').onSnapshot(snapshot => {
      if (snapshot && !snapshot.empty) {
        const cloudData = [];
        snapshot.forEach(doc => cloudData.push(doc.data()));
        localStorage.setItem('aplus_doctors', JSON.stringify(cloudData));
        renderDynamicDoctors();
      }
    });

    db.collection('gallery').onSnapshot(snapshot => {
      if (snapshot && !snapshot.empty) {
        const cloudData = [];
        snapshot.forEach(doc => cloudData.push(doc.data()));
        localStorage.setItem('aplus_gallery', JSON.stringify(cloudData));
        renderDynamicGallery();
      }
    });

    db.collection('blogs').onSnapshot(snapshot => {
      if (snapshot && !snapshot.empty) {
        const cloudData = [];
        snapshot.forEach(doc => cloudData.push(doc.data()));
        localStorage.setItem('aplus_blogs', JSON.stringify(cloudData));
        renderDynamicBlogs();
      }
    });

    db.collection('reviews').onSnapshot(snapshot => {
      if (snapshot && !snapshot.empty) {
        const cloudData = [];
        snapshot.forEach(doc => cloudData.push(doc.data()));
        localStorage.setItem('aplus_reviews', JSON.stringify(cloudData));
        renderDynamicReviews();
      }
    });
  } catch (e) {
    console.warn('Realtime cloud sync initialized in fallback mode.', e);
  }
}

// Fullscreen Clinic Gallery Modal Controls
function openFullGalleryModal() {
  const modal = document.getElementById('fullGalleryModal');
  const container = document.getElementById('fullGalleryModalContent');
  if (!modal || !container) return;

  const gallery = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
  container.innerHTML = gallery.map(g => `
    <div class="gallery-item" style="height: 220px;">
      <img src="${g.img}" alt="${g.caption}">
      <div class="gallery-caption">${g.caption}</div>
    </div>
  `).join('');

  modal.classList.add('active');
}

function closeFullGalleryModal() {
  const modal = document.getElementById('fullGalleryModal');
  if (modal) modal.classList.remove('active');
}

// Corporate Dental Camp Form Handler
function initCorporateCampForm() {
  const campForm = document.getElementById('corporateCampForm');
  if (campForm) {
    campForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const company = document.getElementById('campCompanyName').value.trim();
      const email = document.getElementById('campEmail').value.trim();
      const phone = document.getElementById('campPhone').value.trim();
      const captcha = document.getElementById('campCaptchaInput').value.trim();

      if (captcha !== '8812') {
        showToast('Incorrect Security Captcha Code! Please enter 8812.', true);
        return;
      }

      const campLead = {
        id: 'camp_' + Date.now(),
        company,
        email,
        phone,
        timestamp: new Date().toLocaleString(),
        source: 'Workplace Dental Camp Form'
      };

      const existingCamps = JSON.parse(localStorage.getItem('aplus_corporate_camps') || '[]');
      existingCamps.unshift(campLead);
      localStorage.setItem('aplus_corporate_camps', JSON.stringify(existingCamps));

      // Also record in general leads
      saveAppointment({
        name: `[CAMP] ${company}`,
        phone,
        branch: 'Corporate On-Site',
        treatment: 'Workplace Dental Checkup Camp',
        date: new Date().toISOString().split('T')[0],
        source: 'Workplace Dental Camp Form'
      });

      showToast(`Thank you! Corporate Dental Camp request received for ${company}.`);
      campForm.reset();

      setTimeout(() => {
        const message = `Hello A Plus Dental Clinic! We would like to organize a Workplace Dental Checkup Camp:%0A%0A- *Company*: ${encodeURIComponent(company)}%0A- *Work Email*: ${encodeURIComponent(email)}%0A- *Contact Phone*: ${phone}`;
        window.open(`https://wa.me/917838697614?text=${message}`, '_blank');
      }, 1500);
    });
  }
}

// FAQ Accordion Toggle (Clove Dental Style)
function toggleFaq(btn) {
  const isAlreadyActive = btn.classList.contains('active');
  
  // Close all other active FAQ answers
  document.querySelectorAll('.faq-question').forEach(q => {
    q.classList.remove('active');
    const answer = q.nextElementSibling;
    if (answer) answer.style.maxHeight = null;
  });

  // If clicked button was not active, expand it
  if (!isAlreadyActive) {
    btn.classList.add('active');
    const answer = btn.nextElementSibling;
    if (answer) {
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  }
}

// Trigger Discount Offer Modal
function triggerDiscountOffer() {
  const popup = document.getElementById('autoLeadModal');
  if (popup) {
    popup.classList.add('active');
  }
}

// Auto-rotating Hero Background Multi-Image Slideshow (Cross-fade every 4 seconds)
function initHeroSlideshow() {
  const slides = document.querySelectorAll('.hero-slideshow-bg .slide-item');
  if (slides.length <= 1) return;

  let currentIndex = 0;
  setInterval(() => {
    slides[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % slides.length;
    slides[currentIndex].classList.add('active');
  }, 4000);
}

// Default Initial Data Seed for LocalStorage
function initStorageSeed() {
  const getStoredLen = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]').length;
    } catch (e) {
      return 0;
    }
  };

  if (!localStorage.getItem('aplus_treatments') || getStoredLen('aplus_treatments') === 0) {
    const defaultTreatments = [
      {
        id: 'implants',
        title: 'Dental Implants',
        badge: '30% OFF Special',
        img: 'assets/dental_implants.jpg',
        desc: 'Permanent, natural-looking tooth replacement solution using titanium implants & porcelain crowns.',
        price: '₹18,000',
        features: [
          'Lifetime Warranty on Titanium Implants',
          'Preserves adjacent natural teeth',
          'Restores 100% chewing efficiency',
          'Single & Full Mouth All-on-4'
        ]
      },
      {
        id: 'rct',
        title: 'Painless Root Canal (RCT)',
        badge: 'Single Sitting',
        img: 'assets/hero_clinic.jpg',
        desc: 'Save infected or damaged natural teeth with painless rotary microscopic endodontic treatment.',
        price: '₹3,500',
        features: [
          'Rotary apex locators & painless anesthesia',
          'Done in 30-45 minutes',
          'Save your natural tooth',
          'CGHS & insurance empanelled'
        ]
      },
      {
        id: 'aligners',
        title: 'Invisible Aligners & Braces',
        badge: '30% OFF Special',
        img: 'assets/clear_aligners.jpg',
        desc: 'Straighten crooked teeth discreetly with 3D custom transparent aligners or ceramic braces.',
        price: '₹35,000',
        features: [
          'Nearly invisible clear trays',
          'Removable for easy eating & brushing',
          '3D Digital intraoral preview',
          'Flexible monthly EMI options'
        ]
      },
      {
        id: 'whitening',
        title: 'Teeth Whitening & Veneers',
        badge: 'Cosmetic',
        img: 'assets/clinic_reception.jpg',
        desc: 'Instant 8-shade brighter smile enhancement with laser whitening & custom porcelain veneers.',
        price: '₹4,500',
        features: [
          'Instant 8-shade whitening',
          'Enamel-safe peroxide laser LED',
          'Includes desensitizing care',
          'Porcelain & composite veneers'
        ]
      },
      {
        id: 'crowns',
        title: 'Crowns & Fixed Bridges',
        badge: 'Zirconia',
        img: 'assets/dental_implants.jpg',
        desc: 'High-strength Zirconia & CAD-CAM ceramic crowns for ultimate tooth protection & aesthetics.',
        price: '₹4,000',
        features: [
          'Translucent natural aesthetic',
          '10-15 Year warranty against chipping',
          'Metal-free biocompatible material',
          'Fixed bridges for missing teeth'
        ]
      },
      {
        id: 'surgery',
        title: 'Wisdom Tooth & Surgery',
        badge: 'Painless',
        img: 'assets/hero_clinic.jpg',
        desc: 'Surgical removal of impacted wisdom teeth by experienced oral & maxillofacial surgeons.',
        price: '₹2,500',
        features: [
          'Localized painless procedure',
          'Minimizes post-op swelling',
          'Full medication & post-op care',
          'CGHS surgical empanelment'
        ]
      }
    ];
    localStorage.setItem('aplus_treatments', JSON.stringify(defaultTreatments));
  }

  if (!localStorage.getItem('aplus_doctors') || getStoredLen('aplus_doctors') === 0) {
    const defaultDoctors = [
      {
        id: 'dr_vishal',
        name: 'Dr. Vishal Verma',
        degree: 'BDS, MDS - Implantologist & Oral Surgeon',
        badge: 'Chief Dental Surgeon',
        img: 'assets/doctor_vishal.jpg',
        bio: 'Dr. Vishal Verma is a renowned Senior Dental Surgeon & Implant Specialist with over 12+ years of clinical excellence. Specializing in advanced implantology, microscopic root canal treatments, and complex oral reconstructive surgeries.',
        exp: '12+',
        patients: '10,000+',
        implants: '3,500+'
      }
    ];
    localStorage.setItem('aplus_doctors', JSON.stringify(defaultDoctors));
  } else {
    // Force update existing localStorage doctor img path
    const docs = JSON.parse(localStorage.getItem('aplus_doctors') || '[]');
    if (docs.length > 0 && docs[0].id === 'dr_vishal') {
      docs[0].img = 'assets/doctor_vishal.jpg';
      localStorage.setItem('aplus_doctors', JSON.stringify(docs));
    }
  }

  if (!localStorage.getItem('aplus_team') || getStoredLen('aplus_team') === 0) {
    const defaultTeam = [
      { id: 'tm_1', name: 'Dr. Meenakshi Sharma', title: 'Senior Endodontist (Root Canal Specialist)', exp: '8+ Years Exp', img: 'assets/gallery_5.jpg' },
      { id: 'tm_2', name: 'Dr. Anuj Singh', title: 'Consultant Orthodontist (Aligners & Braces)', exp: '7+ Years Exp', img: 'assets/gallery_8.jpg' },
      { id: 'tm_3', name: 'Dr. Ritu Kapoor', title: 'Pediatric Dental Care Specialist', exp: '6+ Years Exp', img: 'assets/gallery_9.jpg' },
      { id: 'tm_4', name: 'Dr. Amit Malik', title: 'Periodontist & Gum Care Specialist', exp: '9+ Years Exp', img: 'assets/gallery_12.jpg' }
    ];
    localStorage.setItem('aplus_team', JSON.stringify(defaultTeam));
  }

  if (!localStorage.getItem('aplus_gallery') || getStoredLen('aplus_gallery') < 12) {
    const defaultGallery = [
      { id: 'gal_1', img: 'assets/gallery_1.jpg', caption: 'A+ Dental Operatory Suite' },
      { id: 'gal_2', img: 'assets/gallery_2.jpg', caption: '3D Digital Dental Implant Studio' },
      { id: 'gal_3', img: 'assets/gallery_3.jpg', caption: 'Sterilization & Hygiene Bay' },
      { id: 'gal_4', img: 'assets/gallery_4.jpg', caption: 'Invisible Clear Aligners Facility' },
      { id: 'gal_5', img: 'assets/gallery_5.jpg', caption: 'Patient Care & Consultation Room' },
      { id: 'gal_6', img: 'assets/gallery_6.jpg', caption: 'Reception & Welcoming Lounge' },
      { id: 'gal_7', img: 'assets/gallery_7.jpg', caption: 'Advanced Rotary RCT Station' },
      { id: 'gal_8', img: 'assets/gallery_8.jpg', caption: 'Laser Teeth Whitening Operatory' },
      { id: 'gal_9', img: 'assets/gallery_9.jpg', caption: 'Intraoral 3D Scanning Suite' },
      { id: 'gal_10', img: 'assets/gallery_10.jpg', caption: 'Sterile Surgical Operatory' },
      { id: 'gal_11', img: 'assets/gallery_11.jpg', caption: 'CGHS & PM-JAY Patient Lounge' },
      { id: 'gal_12', img: 'assets/gallery_12.jpg', caption: 'Happy Patient Smile Transformation' }
    ];
    localStorage.setItem('aplus_gallery', JSON.stringify(defaultGallery));
  } else {
    const gal = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
    const idx = gal.findIndex(g => g.id === 'gal_12');
    if (idx !== -1) {
      gal[idx].img = 'assets/gallery_12.jpg';
      gal[idx].caption = 'Happy Patient Smile Transformation';
      localStorage.setItem('aplus_gallery', JSON.stringify(gal));
    }
  }

  if (!localStorage.getItem('aplus_blogs') || getStoredLen('aplus_blogs') === 0) {
    const defaultBlogs = [
      {
        id: 'blog_1',
        title: 'Single Sitting Root Canal vs Tooth Extraction: Which is Better?',
        category: 'Endodontics',
        author: 'Dr. Vishal Verma',
        date: 'July 18, 2026',
        img: 'assets/hero_clinic.jpg',
        excerpt: 'Learn why preserving your natural tooth through a single-sitting painless root canal is far superior to tooth extraction.',
        content: 'When facing severe tooth pain or deep decay, patients often ask whether it is better to extract the tooth or get a Root Canal Treatment (RCT). Extraction may seem like a quick fix, but losing a natural tooth leads to bone resorption, shifting adjacent teeth, and impaired chewing. With modern rotary endodontics, a single-sitting RCT removes infected nerve tissue painlessly in 30-45 minutes and protects your original tooth for a lifetime.'
      },
      {
        id: 'blog_2',
        title: 'Benefits of German Titanium Dental Implants for Missing Teeth',
        category: 'Implantology',
        author: 'Dr. Vishal Verma',
        date: 'July 10, 2026',
        img: 'assets/dental_implants.jpg',
        excerpt: 'Discover how dental implants restore 100% bite force and prevent jawbone loss compared to traditional removable dentures.',
        content: 'Dental implants are revolutionary bio-compatible titanium screws placed into the jawbone to replace missing teeth roots. Unlike traditional bridges that require shaving healthy adjacent teeth, implants stand independently. German titanium implants offer lifetime durability, high osseointegration, and look completely natural.'
      },
      {
        id: 'blog_3',
        title: 'Clear Aligners: How to Straighten Teeth Without Metal Braces',
        category: 'Orthodontics',
        author: 'Dr. Vishal Verma',
        date: 'June 28, 2026',
        img: 'assets/clear_aligners.jpg',
        excerpt: 'Everything you need to know about transparent invisible aligner trays for adults and teens.',
        content: 'Clear aligners are custom-molded 3D transparent plastic trays that gradually align crooked teeth into perfect position. They are virtually invisible, removable during meals, and eliminate mouth sores caused by traditional metallic wires.'
      }
    ];
    localStorage.setItem('aplus_blogs', JSON.stringify(defaultBlogs));
  }

  if (!localStorage.getItem('aplus_reviews') || getStoredLen('aplus_reviews') === 0) {
    const defaultReviews = [
      {
        id: 'rev_1',
        name: 'Rajesh Kumar',
        loc: 'Rajender Nagar, Sahibabad',
        stars: 5,
        text: 'Got my dental implant done by Dr. Vishal Verma. Completely painless experience! The clinic is super clean and the staff is very supportive. Highly recommended in Sahibabad!'
      },
      {
        id: 'rev_2',
        name: 'Pooja Tyagi',
        loc: 'Shyam Park Ext.',
        stars: 5,
        text: 'I was terrified of Root Canal Treatment, but Dr. Verma made it so smooth and pain-free. Also benefited from my CGHS empanelment here. Best dental clinic!'
      },
      {
        id: 'rev_3',
        name: 'Anil Sharma',
        loc: 'Indirapuram / Sahibabad',
        stars: 5,
        text: 'Got clear aligners for my daughter. Result in just 6 months is amazing! Very transparent pricing and modern equipment.'
      }
    ];
    localStorage.setItem('aplus_reviews', JSON.stringify(defaultReviews));
  }

  if (!localStorage.getItem('aplus_appointments')) {
    localStorage.setItem('aplus_appointments', JSON.stringify([]));
  }
}

// Render Treatments dynamically
function renderDynamicTreatments() {
  const container = document.getElementById('dynamicTreatmentsGrid');
  if (!container) return;

  const treatments = JSON.parse(localStorage.getItem('aplus_treatments') || '[]');
  container.innerHTML = treatments.map(t => `
    <div class="treatment-card">
      <div class="treatment-img-box">
        <img src="${t.img}" alt="${t.title}">
        <span class="treatment-badge">${t.badge || 'Featured'}</span>
      </div>
      <div class="treatment-body">
        <h3 class="treatment-title">${t.title}</h3>
        <p class="treatment-desc">${t.desc}</p>
        <div class="treatment-footer">
          <div class="treatment-price">Starts at <span>${t.price}</span></div>
          <button class="learn-more-btn" onclick="openTreatmentModalById('${t.id}')">Learn More <i class="fa-solid fa-arrow-right"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

// Render Doctors & Associate Team dynamically
function renderDynamicDoctors() {
  const container = document.getElementById('dynamicDoctorsContainer');
  const teamContainer = document.getElementById('dynamicTeamMembersContainer');
  
  if (container) {
    const doctors = JSON.parse(localStorage.getItem('aplus_doctors') || '[]');
    container.innerHTML = doctors.map(d => `
      <div class="doctor-profile-card">
        <div class="doctor-img-container">
          <img src="${d.img}" alt="${d.name}">
        </div>
        <div class="doctor-info-content">
          <h3 class="doctor-name">${d.name}</h3>
          <p class="doctor-degrees">${d.degree}</p>
          <p class="doctor-bio">${d.bio}</p>
          
          <div class="doctor-stats-grid">
            <div class="stat-item">
              <div class="stat-value">${d.exp}</div>
              <div class="stat-label">Years Experience</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${d.patients}</div>
              <div class="stat-label">Happy Patients</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${d.implants}</div>
              <div class="stat-label">Procedures</div>
            </div>
          </div>

          <a href="#book" class="btn btn-primary"><i class="fa-solid fa-calendar-check"></i> Book Consultation with ${d.name}</a>
        </div>
      </div>
    `).join('');
  }

  if (teamContainer) {
    const team = JSON.parse(localStorage.getItem('aplus_team') || '[]');
    teamContainer.innerHTML = team.map(t => `
      <div class="team-member-card">
        <img src="${t.img}" class="team-member-img" alt="${t.name}">
        <div class="team-member-name">${t.name}</div>
        <div class="team-member-title">${t.title}</div>
        <div class="team-member-exp"><i class="fa-solid fa-user-clock" style="color: var(--primary);"></i> ${t.exp}</div>
      </div>
    `).join('');
  }
}

// Render Gallery Photos dynamically
function renderDynamicGallery() {
  const container = document.getElementById('dynamicGalleryGrid');
  if (!container) return;

  const gallery = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
  container.innerHTML = gallery.map(g => `
    <div class="gallery-item">
      <img src="${g.img}" alt="${g.caption}">
      <div class="gallery-caption">${g.caption}</div>
    </div>
  `).join('');
}

// Render Blogs dynamically
function renderDynamicBlogs() {
  const container = document.getElementById('dynamicBlogsGrid');
  if (!container) return;

  const blogs = JSON.parse(localStorage.getItem('aplus_blogs') || '[]');
  container.innerHTML = blogs.map(b => `
    <div class="blog-card">
      <div class="blog-img-box">
        <img src="${b.img}" alt="${b.title}">
        <span class="blog-category">${b.category}</span>
      </div>
      <div class="blog-body">
        <div class="blog-meta">
          <span><i class="fa-regular fa-user"></i> ${b.author}</span>
          <span><i class="fa-regular fa-calendar"></i> ${b.date}</span>
        </div>
        <h3 class="blog-title">${b.title}</h3>
        <p class="blog-excerpt">${b.excerpt}</p>
        <button class="learn-more-btn" onclick="openBlogModalById('${b.id}')" style="margin-top: auto;">
          Read Article <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Open Blog Modal Reader
function openBlogModalById(id) {
  const blogs = JSON.parse(localStorage.getItem('aplus_blogs') || '[]');
  const b = blogs.find(x => x.id === id);
  if (!b) return;

  const modal = document.getElementById('blogModal');
  const content = document.getElementById('blogModalContent');

  content.innerHTML = `
    <span class="badge badge-primary" style="margin-bottom: 0.75rem;">${b.category}</span>
    <h2 style="font-size: 1.8rem; margin-bottom: 0.75rem; color: var(--secondary);">${b.title}</h2>
    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; display: flex; gap: 1.5rem;">
      <span><i class="fa-solid fa-user-doctor" style="color: var(--primary);"></i> ${b.author}</span>
      <span><i class="fa-regular fa-calendar"></i> ${b.date}</span>
    </div>
    <img src="${b.img}" alt="${b.title}" style="width: 100%; height: 260px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
    <div style="color: var(--text-secondary); line-height: 1.8; font-size: 1rem; margin-bottom: 2rem;">
      ${b.content}
    </div>
    <div style="display: flex; gap: 1rem;">
      <a href="#book" onclick="closeBlogModal();" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-calendar-check"></i> Book Consultation</a>
      <a href="tel:+917838697614" class="btn btn-outline" style="flex: 1;"><i class="fa-solid fa-phone"></i> Call +91 78386 97614</a>
    </div>
  `;

  modal.classList.add('active');
}

function closeBlogModal() {
  const modal = document.getElementById('blogModal');
  if (modal) modal.classList.remove('active');
}

// Render Reviews dynamically
function renderDynamicReviews() {
  const container = document.getElementById('dynamicReviewsGrid');
  if (!container) return;

  const reviews = JSON.parse(localStorage.getItem('aplus_reviews') || '[]');
  container.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-stars">
        ${'<i class="fa-solid fa-star"></i>'.repeat(r.rating || 5)}
      </div>
      <p class="review-text">"${r.text}"</p>
      <div class="reviewer-box">
        <div class="reviewer-avatar">${(r.name || 'P')[0]}</div>
        <div>
          <div class="reviewer-name">${r.name}</div>
          <div class="reviewer-loc">${r.loc}</div>
        </div>
        <div class="verified-g-badge"><i class="fa-brands fa-google"></i> Verified</div>
      </div>
    </div>
  `).join('');
}

// Auto Lead Welcome Popup Modal Trigger
function initAutoLeadPopup() {
  const popupDismissed = sessionStorage.getItem('aplus_lead_closed');
  if (!popupDismissed) {
    setTimeout(() => {
      const popup = document.getElementById('autoLeadModal');
      if (popup) {
        popup.classList.add('active');
      }
    }, 1500);
  }
}

function closeAutoLeadModal() {
  const popup = document.getElementById('autoLeadModal');
  if (popup) {
    popup.classList.remove('active');
    sessionStorage.setItem('aplus_lead_closed', 'true');
  }
}

// Open Treatment Modal by ID
function openTreatmentModalById(id) {
  const treatments = JSON.parse(localStorage.getItem('aplus_treatments') || '[]');
  const data = treatments.find(t => t.id === id);
  if (!data) return;

  const modal = document.getElementById('treatmentModal');
  const content = document.getElementById('modalContent');

  const featuresList = (data.features || []).map(f => `<li style="font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;"><i class="fa-solid fa-circle-check" style="color: var(--primary);"></i> ${f}</li>`).join('');

  content.innerHTML = `
    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem;">
      <span class="badge badge-primary">${data.badge || 'Specialty'}</span>
    </div>
    <h2 style="font-size: 1.75rem; margin-bottom: 1rem; color: var(--secondary);">${data.title}</h2>
    <img src="${data.img}" alt="${data.title}" style="width: 100%; height: 220px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
    <p style="color: var(--text-secondary); margin-bottom: 1.25rem; font-size: 0.98rem; line-height: 1.6;">${data.desc}</p>
    
    <h4 style="margin-bottom: 0.75rem; color: var(--secondary);">Key Benefits & Highlights:</h4>
    <ul style="list-style: none; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
      ${featuresList}
    </ul>

    <div style="background: var(--bg-main); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem; font-weight: 700; color: var(--primary-dark); font-size: 1rem;">
      <i class="fa-solid fa-tag"></i> Price: Starts at ${data.price}
    </div>

    <div style="display: flex; gap: 1rem;">
      <a href="#book" onclick="closeTreatmentModal();" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-calendar-check"></i> Book Consultation</a>
      <a href="tel:+917838697614" class="btn btn-outline" style="flex: 1;"><i class="fa-solid fa-phone"></i> Call +91 78386 97614</a>
    </div>
  `;

  modal.classList.add('active');
}

function closeTreatmentModal() {
  const modal = document.getElementById('treatmentModal');
  if (modal) modal.classList.remove('active');
}

// Interactive Calendar & Time Slot Availability Checking Guard
function checkTimeSlotAvailability() {
  const dateInput = document.getElementById('appointmentDate');
  const slotSelect = document.getElementById('appointmentTimeSlot');
  const branchSelect = document.getElementById('preferredBranch');
  const indicator = document.getElementById('slotStatusIndicator');
  const btn = document.getElementById('confirmConsultationBtn');

  if (!dateInput || !slotSelect || !indicator) return true;

  const date = dateInput.value;
  const slot = slotSelect.value;
  const branch = branchSelect ? branchSelect.value : 'Rajender Nagar';

  const list = JSON.parse(localStorage.getItem('aplus_appointments') || '[]');

  // Disable options in slot dropdown that are already booked for this date and branch
  Array.from(slotSelect.options).forEach(opt => {
    const optVal = opt.value;
    const isOptBooked = list.some(a => a && a.date === date && a.branch === branch && (a.timeSlot === optVal || a.time === optVal));
    if (isOptBooked) {
      opt.disabled = true;
      if (!opt.textContent.includes('ALREADY BOOKED')) {
        opt.textContent = `${optVal} — (BOOKED ❌)`;
      }
    } else {
      opt.disabled = false;
      opt.textContent = optVal;
    }
  });

  const isBooked = list.some(a => a && a.date === date && a.branch === branch && (a.timeSlot === slot || a.time === slot));

  if (isBooked) {
    indicator.style.color = '#dc2626';
    indicator.style.background = 'rgba(220, 38, 38, 0.1)';
    indicator.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>Time slot <strong>${slot}</strong> is ALREADY BOOKED for ${branch} on ${date}. Please choose another slot!</span>`;
    if (btn) btn.disabled = true;
    return false;
  } else {
    indicator.style.color = '#16a34a';
    indicator.style.background = 'rgba(34, 197, 94, 0.1)';
    indicator.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Time slot <strong>${slot}</strong> is AVAILABLE for ${branch} on ${date}!</span>`;
    if (btn) btn.disabled = false;
    return true;
  }
}

// Form Handlers
function initFormHandlers() {
  initCorporateCampForm();

  const heroForm = document.getElementById('appointmentForm');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('patientName').value.trim();
      const phone = document.getElementById('patientPhone').value.trim();
      const branch = document.getElementById('preferredBranch').value;
      const treatment = document.getElementById('selectedTreatment').value;
      const date = document.getElementById('appointmentDate').value;
      const timeSlotSelect = document.getElementById('appointmentTimeSlot');
      const timeSlot = timeSlotSelect ? timeSlotSelect.value : '09:00 AM - 10:00 AM';

      if (!checkTimeSlotAvailability()) {
        showToast('Selected time slot is already booked! Please select an available slot.', true);
        return;
      }

      saveAppointment({
        name,
        phone,
        branch,
        treatment,
        date,
        timeSlot,
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        source: 'Hero Booking Form'
      });

      showToast(`Thank you ${name}! Appointment booked for ${date} (${timeSlot}) at ${branch} branch.`);
      heroForm.reset();
      initDateInput();
      checkTimeSlotAvailability();

      setTimeout(() => {
        const message = `Hello A Plus Dental Clinic! I would like to confirm my appointment booking:%0A%0A- *Name*: ${encodeURIComponent(name)}%0A- *Phone*: ${phone}%0A- *Branch*: ${branch}%0A- *Treatment*: ${encodeURIComponent(treatment)}%0A- *Date*: ${date}%0A- *Time Slot*: ${encodeURIComponent(timeSlot)}`;
        window.open(`https://wa.me/917838697614?text=${message}`, '_blank');
      }, 1500);
    });
  }

  const autoLeadForm = document.getElementById('autoLeadForm');
  if (autoLeadForm) {
    autoLeadForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('popName').value.trim();
      const phone = document.getElementById('popPhone').value.trim();
      const treatment = document.getElementById('popTreatment').value;
      const branch = document.getElementById('popBranch').value;
      const date = new Date().toISOString().split('T')[0];

      saveAppointment({
        name,
        phone,
        branch,
        treatment,
        date,
        timeSlot: '04:00 PM - 05:00 PM',
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        source: 'Auto Lead Popup (30% OFF)'
      });

      closeAutoLeadModal();
      showToast(`Welcome ${name}! Your 30% discount consultation request is received.`);

      setTimeout(() => {
        const message = `Hello A Plus Dental Clinic! I claimed the 30% OFF Discount Offer:%0A%0A- *Name*: ${encodeURIComponent(name)}%0A- *Phone*: ${phone}%0A- *Branch*: ${branch}%0A- *Treatment*: ${encodeURIComponent(treatment)}`;
        window.open(`https://wa.me/917838697614?text=${message}`, '_blank');
      }, 1500);
    });
  }
}

function saveAppointment(apt) {
  apt.id = apt.id || Date.now().toString();
  apt.timestamp = apt.timestamp || new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  apt.timeSlot = apt.timeSlot || '09:00 AM - 10:00 AM';
  apt.status = 'New';

  // Cloud Firestore Real-Time Write
  if (typeof db !== 'undefined' && db) {
    db.collection('appointments').doc(apt.id).set(apt).catch(e => console.log('Cloud Firestore write note:', e));
  }

  let list = JSON.parse(localStorage.getItem('aplus_appointments') || '[]');
  list = Array.isArray(list) ? list.filter(a => a && typeof a === 'object' && a.id !== apt.id && a.name && !['Rahul Sharma', 'Pooja Tyagi', 'Anil Verma', 'Kavita Gupta'].includes(a.name)) : [];
  list.unshift(apt);
  localStorage.setItem('aplus_appointments', JSON.stringify(list));
  window.dispatchEvent(new Event('storage'));
}

function initDateInput() {
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
    checkTimeSlotAvailability();
  }
}

function initMobileNav() {
  const openBtn = document.getElementById('openMobileNav');
  const closeBtn = document.getElementById('closeMobileNav');
  const mobileNav = document.getElementById('mobileNav');

  if (openBtn && mobileNav) {
    openBtn.addEventListener('click', () => mobileNav.classList.add('open'));
  }
  if (closeBtn && mobileNav) {
    closeBtn.addEventListener('click', () => mobileNav.classList.remove('open'));
  }
}

function closeMobileMenu() {
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) mobileNav.classList.remove('open');
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.style.background = isError ? '#be123c' : 'var(--secondary)';
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), 4000);
}

// Cost Calculator Logic
let currentCostState = { key: 'implants', baseCost: 22000, procName: 'Dental Implant', units: 1, multiplier: 1 };

function calculateCost(key, baseCost, element) {
  const cards = document.querySelectorAll('.calc-select-card');
  cards.forEach(c => c.classList.remove('selected'));
  if (element) element.classList.add('selected');

  const nameMap = { implants: 'Dental Implant', rct: 'Rotary Root Canal (RCT)', aligners: 'Invisible Aligners', whitening: 'Laser Teeth Whitening' };
  currentCostState.key = key;
  currentCostState.baseCost = baseCost;
  currentCostState.procName = nameMap[key] || 'Dental Procedure';
  recalculateCost();
}

function updateUnits(val) {
  currentCostState.units = parseInt(val, 10);
  document.getElementById('unitDisplay').textContent = val;
  recalculateCost();
}

function recalculateCost() {
  const materialSelect = document.getElementById('materialSelect');
  if (materialSelect) currentCostState.multiplier = parseFloat(materialSelect.value);

  const finalTotal = Math.round(currentCostState.baseCost * currentCostState.units * currentCostState.multiplier);
  const emiVal = Math.round(finalTotal / 12);

  document.getElementById('summaryProcName').textContent = currentCostState.procName;
  document.getElementById('summaryBasePrice').textContent = `₹${currentCostState.baseCost.toLocaleString('en-IN')}`;
  document.getElementById('totalPriceDisplay').textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
  document.getElementById('emiDisplay').textContent = `₹${emiVal.toLocaleString('en-IN')} / month`;
}

// Sticky Header & Active Nav Scroll Listener
function initScrollNav() {
  const header = document.getElementById('mainHeader');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let scrollY = window.pageYOffset;

    if (header) {
      if (scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) link.classList.add('active');
        });
      }
    });
  });
}
