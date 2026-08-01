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
  renderDynamicServicesTicker();
  updateAboutImage(localStorage.getItem('aplus_about_image'));
  
  initDateInput();
  initMobileNav();
  initFormHandlers();
  initScrollNav();
  initAutoLeadPopup();
  initHeroSlideshow();
  initCloudRealtimeListeners();
});

// Real-Time Firebase Realtime Database Synchronization Listener
function initCloudRealtimeListeners() {
  if (typeof db === 'undefined' || !db) return;

  try {
    db.ref('treatments').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_treatments', JSON.stringify(list));
        renderDynamicTreatments();
      }
    });

    db.ref('doctors').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_doctors', JSON.stringify(list));
        renderDynamicDoctors();
      }
    });

    db.ref('gallery').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_gallery', JSON.stringify(list));
        renderDynamicGallery();
      }
    });

    db.ref('blogs').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_blogs', JSON.stringify(list));
        renderDynamicBlogs();
      }
    });

    db.ref('reviews').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_reviews', JSON.stringify(list));
        renderDynamicReviews();
      }
    });

    db.ref('services_ticker').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_services_ticker', JSON.stringify(list));
        renderDynamicServicesTicker();
      } else {
        const defaultServices = [
          { id: '1', title: 'DENTAL IMPLANTS', img: 'assets/treatment_implants.jpg' },
          { id: '2', title: 'ROOT CANAL TREATMENT', img: 'assets/treatment_root_canal.jpg' },
          { id: '3', title: 'ORTHODONTIC TREATMENT', img: 'assets/treatment_orthodontic.jpg' },
          { id: '4', title: 'IMPACTION', img: 'assets/treatment_impaction.jpg' },
          { id: '5', title: 'PEDIATRIC DENTISTRY', img: 'assets/treatment_pediatric.jpg' },
          { id: '6', title: 'PERIODONTAL TREATMENT', img: 'assets/treatment_periodontal.jpg' },
          { id: '7', title: 'FULL MOUTH REHABILITATION', img: 'assets/treatment_full_mouth.jpg' },
          { id: '8', title: 'SMILE DESIGN', img: 'assets/treatment_smile_design.jpg' },
          { id: '9', title: 'OPG SCAN AVAILABLE', img: 'assets/treatment_opg_scan.jpg' },
          { id: '10', title: 'DIGITAL INTRAORAL SCAN', img: 'assets/treatment_digital_scan.jpg' },
          { id: '11', title: 'JAW FRACTURE', img: 'assets/treatment_jaw_fracture.jpg' },
          { id: '12', title: 'ORAL CANCER DIAGNOSIS', img: 'assets/treatment_oral_cancer.jpg' },
          { id: '13', title: 'LASER TREATMENT', img: 'assets/treatment_laser.jpg' },
          { id: '14', title: 'ZIRCONIA CROWN', img: 'assets/treatment_zirconia_crown.jpg' }
        ];
        db.ref('services_ticker').set(defaultServices);
        localStorage.setItem('aplus_services_ticker', JSON.stringify(defaultServices));
        renderDynamicServicesTicker();
      }
    });

    db.ref('about_image').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        localStorage.setItem('aplus_about_image', data);
        updateAboutImage(data);
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

// Dedicated Booking Form Modal Controls
function openBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.add('active');
  initModalDateInput();
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.remove('active');
}

function initModalDateInput() {
  const dateInput = document.getElementById('modalAppointmentDate');
  if (!dateInput) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
  if (!dateInput.value) {
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

function checkModalTimeSlotAvailability() {
  const date = document.getElementById('modalAppointmentDate').value;
  const slot = document.getElementById('modalAppointmentTimeSlot').value;
  const status = document.getElementById('modalSlotStatusIndicator');
  if (!status) return;
  
  if (date && slot) {
    status.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Slot Available for ${slot}</span>`;
    status.style.color = '#16a34a';
    status.style.background = 'rgba(34, 197, 94, 0.08)';
  }
}

window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.checkModalTimeSlotAvailability = checkModalTimeSlotAvailability;

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

  if (!localStorage.getItem('aplus_treatments') || getStoredLen('aplus_treatments') !== 8) {
    const defaultTreatments = [
      {
        id: 'implants',
        title: 'Dental Implants',
        badge: '30% OFF Special',
        img: 'assets/dental_implants.jpg',
        desc: 'Permanent, natural-looking tooth replacement solution using titanium implants & porcelain crowns.',
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
        features: [
          'Translucent natural aesthetic',
          '10-15 Year warranty against chipping',
          'Metal-free biocompatible material',
          'Fixed bridges for missing teeth'
        ]
      },
      {
        id: 'minor_surgery',
        title: 'Minor Oral Surgeries',
        badge: 'Painless',
        img: 'assets/hero_clinic.jpg',
        desc: 'Routine minor oral surgical procedures including standard/surgical extractions, cyst removals, and frenectomy under local anesthesia.',
        features: [
          'Painless laser & suture-less options',
          'Surgical & simple tooth extractions',
          'Cyst, operculum, & fibroma removals',
          'Fast healing with laser biostimulation'
        ]
      },
      {
        id: 'major_surgery',
        title: 'Major Oral Surgeries',
        badge: 'Specialized',
        img: 'assets/dental_implants.jpg',
        desc: 'Complex reconstructive maxillofacial surgeries, jaw pathology management, and corrective jaw alignments (orthognathic surgery).',
        features: [
          'Performed by senior Maxillofacial Surgeons',
          'Jaw fracture treatments & trauma care',
          'Advanced cyst & tumor pathologies',
          'General anesthesia & hospital facility support'
        ]
      },
      {
        id: 'wisdom_surgery',
        title: 'Wisdom Tooth & Surgery',
        badge: 'Painless',
        img: 'assets/hero_clinic.jpg',
        desc: 'Surgical removal of impacted or painful wisdom teeth by experienced oral & maxillofacial surgeons.',
        features: [
          'Localized computerized painless anesthesia',
          'Minimizes post-op swelling & discomfort',
          'Suture-less or soluble suture options',
          'Complete post-operative medication guidelines'
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
        degree: 'BDS, MDS - Implantologist',
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
    // Force update existing localStorage doctor details
    const docs = JSON.parse(localStorage.getItem('aplus_doctors') || '[]');
    if (docs.length > 0 && docs[0].id === 'dr_vishal') {
      docs[0].img = 'assets/doctor_vishal.jpg';
      docs[0].degree = 'BDS, MDS - Implantologist';
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

  if (!localStorage.getItem('aplus_gallery') || getStoredLen('aplus_gallery') < 15) {
    const defaultGallery = [
      { id: 'gal_1', img: 'assets/gallery_1.jpg', caption: 'A+ Dental Operatory Suite', category: 'infrastructure' },
      { id: 'gal_2', img: 'assets/gallery_2.jpg', caption: '3D Digital Dental Implant Studio', category: 'infrastructure' },
      { id: 'gal_3', img: 'assets/gallery_3.jpg', caption: 'Sterilization & Hygiene Bay', category: 'infrastructure' },
      { id: 'gal_4', img: 'assets/gallery_4.jpg', caption: 'Invisible Clear Aligners Facility', category: 'infrastructure' },
      { id: 'gal_5', img: 'assets/gallery_5.jpg', caption: 'Patient Care & Consultation Room', category: 'infrastructure' },
      { id: 'gal_6', img: 'assets/gallery_6.jpg', caption: 'Reception & Welcoming Lounge', category: 'infrastructure' },
      { id: 'gal_7', img: 'assets/gallery_7.jpg', caption: 'Advanced Rotary RCT Station', category: 'infrastructure' },
      { id: 'gal_8', img: 'assets/gallery_8.jpg', caption: 'Laser Teeth Whitening Operatory', category: 'infrastructure' },
      { id: 'gal_9', img: 'assets/gallery_9.jpg', caption: 'Intraoral 3D Scanning Suite', category: 'infrastructure' },
      { id: 'gal_10', img: 'assets/gallery_10.jpg', caption: 'Sterile Surgical Operatory', category: 'infrastructure' },
      { id: 'gal_11', img: 'assets/gallery_11.jpg', caption: 'CGHS & PM-JAY Patient Lounge', category: 'infrastructure' },
      { id: 'gal_12', img: 'assets/gallery_12.jpg', caption: 'Happy Patient Smile Transformation', category: 'patients' },
      { id: 'gal_13', img: 'assets/dental_implants.jpg', caption: 'Dental Implant: Missing Tooth to Natural Smile Restoration', category: 'patients' },
      { id: 'gal_14', img: 'assets/clear_aligners.jpg', caption: 'Clear Aligners: Crooked Teeth Alignment Transformation', category: 'patients' },
      { id: 'gal_15', img: 'assets/hero_clinic.jpg', caption: 'Full Mouth Rehabilitation Case: Smile Restoration & Alignment', category: 'patients' }
    ];
    localStorage.setItem('aplus_gallery', JSON.stringify(defaultGallery));
  }

  if (!localStorage.getItem('aplus_blogs') || getStoredLen('aplus_blogs') !== 6) {
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
      },
      {
        id: 'blog_4',
        title: 'How to Maintain Your Dental Implants for a Lifetime',
        category: 'Implantology',
        author: 'Dr. Vishal Verma',
        date: 'July 22, 2026',
        img: 'assets/dental_implants.jpg',
        excerpt: 'Expert guidelines on oral hygiene, cleaning tips, and follow-ups to ensure your dental implants last a lifetime.',
        content: 'Maintaining dental implants is simple but crucial. Treat them like your natural teeth—brush twice a day, floss daily, and visit your dentist regularly. Using a soft-bristled toothbrush and non-abrasive toothpaste is recommended to protect the implant crown and avoid scratching the porcelain surface.'
      },
      {
        id: 'blog_5',
        title: 'Understanding Wisdom Tooth Pain: When is Extraction Necessary?',
        category: 'Oral Surgery',
        author: 'Dr. Vishal Verma',
        date: 'July 20, 2026',
        img: 'assets/hero_clinic.jpg',
        excerpt: 'Learn the common signs of impacted wisdom teeth and why timely surgical removal prevents gum infection and tooth crowding.',
        content: 'Impacted wisdom teeth can cause severe pain, swelling, and infection in the surrounding gums. If left untreated, they can damage adjacent healthy teeth or lead to cysts. Modern oral surgery makes wisdom tooth extraction a comfortable, painless procedure completed under local anesthesia.'
      },
      {
        id: 'blog_6',
        title: 'Laser Teeth Whitening: Is It Safe for Your Enamel?',
        category: 'Cosmetic Dentistry',
        author: 'Dr. Vishal Verma',
        date: 'July 15, 2026',
        img: 'assets/clinic_reception.jpg',
        excerpt: 'An expert guide to professional laser whitening, highlighting its safety, immediate results, and sensitivity tips.',
        content: 'Laser teeth whitening is a highly safe, FDA-approved cosmetic procedure when performed by qualified dental professionals. The laser accelerates the whitening gel, breaking down deep stains without stripping your enamel, giving you an instantly brighter smile.'
      }
    ];
    localStorage.setItem('aplus_blogs', JSON.stringify(defaultBlogs));
  }

  if (!localStorage.getItem('aplus_reviews') || getStoredLen('aplus_reviews') !== 6) {
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
      },
      {
        id: 'rev_4',
        name: 'Amit Verma',
        loc: 'Sahibabad, Ghaziabad',
        stars: 5,
        text: 'Excellent doctor! Dr. Vishal Verma explained the wisdom tooth surgery very well. The procedure was fast, suture-less, and painless. Post-op care instructions were very detailed.'
      },
      {
        id: 'rev_5',
        name: 'Sneha Gupta',
        loc: 'Indirapuram, Ghaziabad',
        stars: 5,
        text: 'Highly professional setup. Got my laser teeth whitening done and got instant 8 shades brighter teeth. The staff is polite, and the clinic follows strict sterilization guidelines.'
      },
      {
        id: 'rev_6',
        name: 'Karan Malhotra',
        loc: 'Rajender Nagar, Sahibabad',
        stars: 5,
        text: 'A Plus Dental Clinic is empanelled with CGHS which helped me save costs for my fixed zirconia bridge treatment. Dr. Verma is extremely knowledgeable and patient-friendly.'
      }
    ];
    localStorage.setItem('aplus_reviews', JSON.stringify(defaultReviews));
  }

  if (!localStorage.getItem('aplus_appointments')) {
    localStorage.setItem('aplus_appointments', JSON.stringify([]));
  }

  if (!localStorage.getItem('aplus_services_ticker') || getStoredLen('aplus_services_ticker') === 0) {
    const defaultServices = [
      { id: '1', title: 'DENTAL IMPLANTS', img: 'assets/treatment_implants.jpg' },
      { id: '2', title: 'ROOT CANAL TREATMENT', img: 'assets/treatment_root_canal.jpg' },
      { id: '3', title: 'ORTHODONTIC TREATMENT', img: 'assets/treatment_orthodontic.jpg' },
      { id: '4', title: 'IMPACTION', img: 'assets/treatment_impaction.jpg' },
      { id: '5', title: 'PEDIATRIC DENTISTRY', img: 'assets/treatment_pediatric.jpg' },
      { id: '6', title: 'PERIODONTAL TREATMENT', img: 'assets/treatment_periodontal.jpg' },
      { id: '7', title: 'FULL MOUTH REHABILITATION', img: 'assets/treatment_full_mouth.jpg' },
      { id: '8', title: 'SMILE DESIGN', img: 'assets/treatment_smile_design.jpg' },
      { id: '9', title: 'OPG SCAN AVAILABLE', img: 'assets/treatment_opg_scan.jpg' },
      { id: '10', title: 'DIGITAL INTRAORAL SCAN', img: 'assets/treatment_digital_scan.jpg' },
      { id: '11', title: 'JAW FRACTURE', img: 'assets/treatment_jaw_fracture.jpg' },
      { id: '12', title: 'ORAL CANCER DIAGNOSIS', img: 'assets/treatment_oral_cancer.jpg' },
      { id: '13', title: 'LASER TREATMENT', img: 'assets/treatment_laser.jpg' },
      { id: '14', title: 'ZIRCONIA CROWN', img: 'assets/treatment_zirconia_crown.jpg' }
    ];
    localStorage.setItem('aplus_services_ticker', JSON.stringify(defaultServices));
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
        <div class="treatment-footer" style="justify-content: flex-end;">
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

          <div style="font-family: 'Outfit', sans-serif; font-style: italic; font-size: 0.95rem; color: var(--primary-dark); padding: 0.85rem 1rem; border-left: 3px solid var(--primary); background: var(--primary-light); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; margin-top: 1.25rem; line-height: 1.5; font-weight: 500;">
            <i class="fa-solid fa-quote-left" style="opacity: 0.3; margin-right: 0.35rem; font-size: 1.1rem; color: var(--primary);"></i>
            "Our goal is to deliver painless, premium, and lifelong dental care for every smile." 
            <span style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--secondary); margin-top: 0.4rem; text-transform: uppercase; letter-spacing: 0.05em; font-style: normal;">— ${d.name}</span>
          </div>
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
function renderDynamicGallery(filterCategory = 'all') {
  const container = document.getElementById('dynamicGalleryGrid');
  if (!container) return;

  let gallery = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
  if (filterCategory !== 'all') {
    gallery = gallery.filter(g => g.category === filterCategory);
  }

  container.innerHTML = gallery.map(g => `
    <div class="gallery-item">
      <img src="${g.img}" alt="${g.caption}">
      <div class="gallery-caption">
        ${g.category === 'patients' ? '<span style="font-size: 0.65rem; margin-bottom: 0.35rem; display: inline-block; padding: 0.15rem 0.5rem; background: #fef3c7; color: #d97706; border-radius: 9999px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;"><i class="fa-solid fa-right-left"></i> Before & After</span><br>' : ''}
        ${g.caption}
      </div>
    </div>
  `).join('');
}

// Filter Gallery Tab Handler
window.filterGallery = function(category, btnElement) {
  const btns = document.querySelectorAll('.gallery-tab-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  }
  renderDynamicGallery(category);
};

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
      
      const branchEl = document.getElementById('preferredBranch');
      const branch = branchEl ? branchEl.value : 'Rajender Nagar';
      
      const treatmentEl = document.getElementById('selectedTreatment');
      const treatment = treatmentEl ? treatmentEl.value : 'General Consultation';
      
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

  const modalForm = document.getElementById('appointmentModalForm');
  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('modalPatientName').value.trim();
      const phone = document.getElementById('modalPatientPhone').value.trim();
      const date = document.getElementById('modalAppointmentDate').value;
      const timeSlotSelect = document.getElementById('modalAppointmentTimeSlot');
      const timeSlot = timeSlotSelect ? timeSlotSelect.value : '10:00 AM - 11:00 AM';

      saveAppointment({
        name,
        phone,
        branch: 'Rajender Nagar',
        treatment: 'General Consultation',
        date,
        timeSlot,
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        source: 'Website Modal Form'
      });

      showToast(`Thank you ${name}! Appointment booked for ${date} (${timeSlot}) at Rajender Nagar branch.`);
      closeBookingModal();
      modalForm.reset();

      setTimeout(() => {
        const message = `Hello A Plus Dental Clinic! I would like to confirm my appointment booking:%0A%0A- *Name*: ${encodeURIComponent(name)}%0A- *Phone*: ${phone}%0A- *Branch*: Rajender Nagar%0A- *Treatment*: General Consultation%0A- *Date*: ${date}%0A- *Time Slot*: ${encodeURIComponent(timeSlot)}`;
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
      
      const treatmentEl = document.getElementById('popTreatment');
      const treatment = treatmentEl ? treatmentEl.value : 'Full Mouth Implant (30% OFF)';
      
      const branchEl = document.getElementById('popBranch');
      const branch = branchEl ? branchEl.value : 'Rajender Nagar';
      
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

  // Firebase Realtime Database Write
  if (typeof db !== 'undefined' && db) {
    db.ref('appointments/' + apt.id).set(apt).catch(e => console.log('Firebase Realtime DB write note:', e));
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

// Render Services Ticker dynamically
function renderDynamicServicesTicker() {
  const container = document.getElementById('dynamicServicesTicker');
  if (!container) return;

  const services = JSON.parse(localStorage.getItem('aplus_services_ticker') || '[]');
  if (services.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Generate Set 1 and Set 2 for a seamless horizontal loop
  const htmlSet = services.map(s => `
    <a href="#treatments" class="ribbon-card">
      <img src="${s.img}" class="ribbon-card-img" alt="${s.title}">
      <div class="ribbon-label">${s.title}</div>
    </a>
  `).join('');

  container.innerHTML = `
    <!-- Set 1 -->
    ${htmlSet}
    <!-- Set 2 -->
    ${htmlSet}
  `;
}

function updateAboutImage(imgSrc) {
  const aboutImg = document.getElementById('aboutReceptionImg');
  if (aboutImg) {
    aboutImg.src = imgSrc || 'assets/clinic_reception.jpg';
  }
}
