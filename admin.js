/* ==========================================================================
   A Plus Dental Clinic & Implant Centre - Admin Panel Logic
   Full CRUD Operations for Services, Doctors, Team, Photos, Blogs, Reviews & Leads
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPinAuth();

  // Real-time auto sync when forms are filled on index.html in another tab
  window.addEventListener('storage', () => {
    loadDashboardData();
  });

  // Polling fallback to keep dashboard fresh every 2 seconds
  setInterval(() => {
    const layout = document.getElementById('adminDashboardLayout');
    if (layout && layout.style.display !== 'none') {
      loadDashboardData();
    }
  }, 2000);
});

// Admin Authentication PIN (Default: 1234)
function initPinAuth() {
  const isAuth = sessionStorage.getItem('aplus_admin_auth');
  const pinModal = document.getElementById('pinModal');
  const layout = document.getElementById('adminDashboardLayout');

  if (isAuth === 'true') {
    pinModal.style.display = 'none';
    layout.style.display = 'grid';
    loadDashboardData();
  }

  const pinForm = document.getElementById('pinForm');
  if (pinForm) {
    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = document.getElementById('adminPinInput').value;
      if (pin === '1234') {
        sessionStorage.setItem('aplus_admin_auth', 'true');
        pinModal.style.display = 'none';
        layout.style.display = 'grid';
        loadDashboardData();
        showToast('Admin Dashboard Unlocked!');
      } else {
        showToast('Incorrect Passcode PIN! Try 1234.', true);
      }
    });
  }
}

function lockAdmin() {
  sessionStorage.removeItem('aplus_admin_auth');
  window.location.reload();
}

// Tab Switching
function switchAdminTab(tabKey, btn) {
  const tabs = document.querySelectorAll('.admin-tab-content');
  tabs.forEach(t => t.style.display = 'none');

  const btns = document.querySelectorAll('.admin-menu-btn');
  btns.forEach(b => b.classList.remove('active'));

  const targetTab = document.getElementById(`tab-${tabKey}`);
  if (targetTab) {
    targetTab.style.display = 'block';
  }
  if (btn) {
    btn.classList.add('active');
  }

  const titles = {
    dashboard: 'Dashboard Overview',
    appointments: 'Patient Leads & Bookings',
    treatments: 'Manage Dental Treatments & Services',
    doctors: 'Manage Doctors & Dental Team',
    gallery: 'Manage Clinic Photos',
    blogs: 'Manage Oral Health Blogs & Articles',
    reviews: 'Manage Patient Reviews'
  };
  document.getElementById('tabTitle').textContent = titles[tabKey] || 'Admin Dashboard';

  // Immediately refresh and sync all data tables on tab switch
  loadDashboardData();
}

// Load All Dashboard Data
function loadDashboardData() {
  renderStats();
  renderAppointmentsTables();
  renderTreatmentsTable();
  renderDoctorsTable();
  renderTeamTable();
  renderGalleryTable();
  renderBlogsTable();
  renderReviewsTable();
}

// Merge Appointments and Corporate Camp Leads (100% Real Live Form Submissions Only)
function getAllMergedLeads() {
  let apts = [];
  try {
    const rawApts = localStorage.getItem('aplus_appointments');
    apts = rawApts ? JSON.parse(rawApts) : [];
    if (!Array.isArray(apts)) apts = [];
  } catch (e) {
    apts = [];
  }

  // Filter out invalid items and legacy seed items
  const defaultNames = ['Amit Sharma', 'Pooja Verma', 'Rajesh Kumar', 'Sunita Malhotra', 'Vikram Singh', 'Rahul Sharma', 'Pooja Tyagi', 'Anil Verma', 'Kavita Gupta'];
  const defaultIds = ['apt_101', 'apt_102', 'apt_103', 'apt_104', 'apt_105', 'apt_1', 'apt_2', 'apt_3', 'apt_4'];
  
  apts = apts.filter(a => a && typeof a === 'object' && a.name && !defaultNames.includes(a.name) && !defaultIds.includes(a.id));

  let camps = [];
  try {
    const rawCamps = localStorage.getItem('aplus_corporate_camps');
    camps = rawCamps ? JSON.parse(rawCamps) : [];
    if (!Array.isArray(camps)) camps = [];
  } catch (e) {
    camps = [];
  }
  camps = camps.filter(c => c && typeof c === 'object');

  const campLeadsFormatted = camps.map((c, idx) => ({
    id: (c && c.id) ? String(c.id) : ('camp_' + idx + '_' + Date.now()),
    name: `[CAMP] ${(c && c.company) ? String(c.company) : 'Corporate Client'}`,
    phone: (c && c.phone) ? String(c.phone) : 'N/A',
    treatment: 'Workplace Dental Camp',
    branch: 'Corporate On-Site',
    date: (c && c.email) ? String(c.email) : 'N/A',
    timestamp: (c && c.timestamp) ? String(c.timestamp) : new Date().toLocaleString(),
    source: 'Workplace Dental Camp Form',
    status: (c && c.status) ? String(c.status) : 'New'
  }));

  const combined = [];
  apts.forEach((a, idx) => {
    if (a && typeof a === 'object') {
      combined.push({
        id: (a.id) ? String(a.id) : ('apt_' + idx + '_' + Date.now()),
        name: String(a.name || 'Anonymous Patient'),
        phone: String(a.phone || 'N/A'),
        treatment: String(a.treatment || 'General Consultation'),
        branch: String(a.branch || 'Rajender Nagar'),
        date: String(a.date || 'N/A'),
        timestamp: String(a.timestamp || 'N/A'),
        source: String(a.source || 'Website'),
        status: String(a.status || 'New')
      });
    }
  });

  campLeadsFormatted.forEach(c => {
    if (!combined.some(x => x && x.id === c.id)) {
      combined.push(c);
    }
  });

  return combined;
}

// Render Stats Counters
function renderStats() {
  try {
    const apts = getAllMergedLeads();
    const treats = JSON.parse(localStorage.getItem('aplus_treatments') || '[]');
    const docs = JSON.parse(localStorage.getItem('aplus_doctors') || '[]');
    const blogs = JSON.parse(localStorage.getItem('aplus_blogs') || '[]');
    const revs = JSON.parse(localStorage.getItem('aplus_reviews') || '[]');

    document.getElementById('statAppointments').textContent = apts.length;
    document.getElementById('statTreatments').textContent = treats.length;
    document.getElementById('statDoctors').textContent = docs.length;
    document.getElementById('statBlogs').textContent = blogs.length;
    document.getElementById('statReviews').textContent = revs.length;
  } catch (e) {
    console.error('Error rendering stats:', e);
  }
}

// Appointments Tables Render (Guaranteed Execution with Try-Catch & Safe Escaping)
function renderAppointmentsTables() {
  try {
    const apts = getAllMergedLeads();
    const dashBody = document.getElementById('dashAppointmentsTable');
    const allBody = document.getElementById('allAppointmentsTable');

    const renderRow = (a) => {
      if (!a) return '';
      const safeId = String(a.id || '').replace(/'/g, "\\'");
      const safeName = String(a.name || 'Anonymous Patient');
      const safePhone = String(a.phone || 'N/A');
      const safeTreatment = String(a.treatment || 'General Consultation');
      const safeBranch = String(a.branch || 'Rajender Nagar');
      const safeDate = String(a.date || 'N/A');
      const safeSource = String(a.source || 'Website');
      const safeStatus = String(a.status || 'New');

      return `
        <tr>
          <td><strong>${safeName}</strong></td>
          <td><a href="tel:${safePhone}" style="color: var(--primary); font-weight: 700;"><i class="fa-solid fa-phone"></i> ${safePhone}</a></td>
          <td>${safeTreatment}</td>
          <td><span class="badge badge-primary">${safeBranch}</span></td>
          <td>${safeDate}</td>
          <td><span style="font-size: 0.78rem; color: var(--text-muted);">${safeSource}</span></td>
          <td>
            <button onclick="toggleAppointmentStatus('${safeId}')" class="badge ${safeStatus === 'Contacted' ? 'badge-cghs' : 'badge-gold'}" style="cursor: pointer; border: none;">
              ${safeStatus}
            </button>
          </td>
          <td>
            <button onclick="deleteAppointment('${safeId}')" style="background: transparent; border: none; color: #be123c; font-size: 1.1rem; cursor: pointer;" title="Delete Lead"><i class="fa-solid fa-trash-can"></i></button>
          </td>
        </tr>
      `;
    };

    if (dashBody) {
      if (apts.length === 0) {
        dashBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No patient booking leads received yet. Website form submissions will appear here live.</td></tr>`;
      } else {
        dashBody.innerHTML = apts.slice(0, 10).map(renderRow).join('');
      }
    }

    if (allBody) {
      if (apts.length === 0) {
        allBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No patient booking leads found. Website form submissions will appear here live.</td></tr>`;
      } else {
        allBody.innerHTML = apts.map(renderRow).join('');
      }
    }
  } catch (err) {
    console.error('Error rendering appointments tables:', err);
  }
}

function toggleAppointmentStatus(id) {
  let apts = JSON.parse(localStorage.getItem('aplus_appointments') || '[]');
  apts = apts.map(a => {
    if (a && a.id === id) {
      a.status = a.status === 'Contacted' ? 'New' : 'Contacted';
    }
    return a;
  });
  localStorage.setItem('aplus_appointments', JSON.stringify(apts));
  renderAppointmentsTables();
  showToast('Lead Status Updated');
}

function deleteAppointment(id) {
  let apts = JSON.parse(localStorage.getItem('aplus_appointments') || '[]');
  apts = apts.filter(a => a && a.id !== id);
  localStorage.setItem('aplus_appointments', JSON.stringify(apts));

  let camps = JSON.parse(localStorage.getItem('aplus_corporate_camps') || '[]');
  camps = camps.filter(c => c && c.id !== id);
  localStorage.setItem('aplus_corporate_camps', JSON.stringify(camps));

  renderAppointmentsTables();
  renderStats();
  showToast('Appointment Lead Deleted');
}

function clearAllAppointments() {
  if (confirm('Are you sure you want to delete all patient leads?')) {
    localStorage.removeItem('aplus_appointments');
    localStorage.removeItem('aplus_corporate_camps');
    localStorage.setItem('aplus_appointments', JSON.stringify([]));
    localStorage.setItem('aplus_corporate_camps', JSON.stringify([]));
    renderAppointmentsTables();
    renderStats();
    showToast('All Patient Leads Deleted Successfully');
  }
}

// Treatments CRUD
const treatForm = document.getElementById('treatmentForm');
if (treatForm) {
  treatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let treats = JSON.parse(localStorage.getItem('aplus_treatments') || '[]');
    const editId = document.getElementById('editTreatmentId').value;

    const newTreat = {
      id: editId || 'treat_' + Date.now(),
      title: document.getElementById('treatTitle').value.trim(),
      price: document.getElementById('treatPrice').value.trim(),
      badge: document.getElementById('treatBadge').value.trim() || 'Specialty',
      img: document.getElementById('treatImg').value.trim(),
      desc: document.getElementById('treatDesc').value.trim(),
      features: ['100% Sterilized Procedure', 'CGHS & PM-JAY Benefit', 'Painless Dentistry Tech']
    };

    if (editId) {
      treats = treats.map(t => t.id === editId ? newTreat : t);
      showToast('Treatment Updated Successfully');
    } else {
      treats.unshift(newTreat);
      showToast('New Treatment Added');
    }

    localStorage.setItem('aplus_treatments', JSON.stringify(treats));
    resetTreatmentForm();
    renderTreatmentsTable();
    renderStats();
  });
}

function resetTreatmentForm() {
  document.getElementById('editTreatmentId').value = '';
  document.getElementById('treatmentForm').reset();
  document.getElementById('treatmentFormHeading').textContent = 'Add New Dental Treatment';
  document.getElementById('saveTreatBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Save Treatment';
}

function editTreatment(id) {
  const treats = JSON.parse(localStorage.getItem('aplus_treatments') || '[]');
  const t = treats.find(x => x.id === id);
  if (!t) return;

  document.getElementById('editTreatmentId').value = t.id;
  document.getElementById('treatTitle').value = t.title;
  document.getElementById('treatPrice').value = t.price;
  document.getElementById('treatBadge').value = t.badge || '';
  document.getElementById('treatImg').value = t.img;
  document.getElementById('treatDesc').value = t.desc;

  document.getElementById('treatmentFormHeading').textContent = 'Edit Dental Treatment';
  document.getElementById('saveTreatBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Treatment';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteTreatment(id) {
  if (confirm('Delete this treatment service?')) {
    let treats = JSON.parse(localStorage.getItem('aplus_treatments') || '[]');
    treats = treats.filter(t => t.id !== id);
    localStorage.setItem('aplus_treatments', JSON.stringify(treats));
    renderTreatmentsTable();
    renderStats();
    showToast('Treatment Deleted');
  }
}

function renderTreatmentsTable() {
  const treats = JSON.parse(localStorage.getItem('aplus_treatments') || '[]');
  const tbody = document.getElementById('treatmentsAdminTable');
  if (!tbody) return;

  tbody.innerHTML = treats.map(t => `
    <tr>
      <td><img src="${t.img}" style="width: 50px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
      <td><strong>${t.title}</strong></td>
      <td><span class="badge badge-primary">${t.badge}</span></td>
      <td>${t.price}</td>
      <td>
        <button onclick="editTreatment('${t.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem;"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteTreatment('${t.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem;"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

// Doctor & Team CRUD (With Native File Upload & Role Type Selector)
const docForm = document.getElementById('doctorForm');
if (docForm) {
  docForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roleType = document.getElementById('docRoleType').value;
    const fileInput = document.getElementById('docFileInput');
    const textImgInput = document.getElementById('docImg').value.trim();
    const name = document.getElementById('docName').value.trim();
    const degree = document.getElementById('docDegree').value.trim();
    const badge = document.getElementById('docBadge').value.trim() || 'Specialist';
    const exp = document.getElementById('docExp').value.trim() || '5+ Years Exp';
    const patients = document.getElementById('docPatients').value.trim() || '5,000+';
    const implants = document.getElementById('docImplants').value.trim() || '1,000+';
    const bio = document.getElementById('docBio').value.trim();

    const saveDoctorObj = (photoUrl) => {
      if (roleType === 'senior') {
        let docs = JSON.parse(localStorage.getItem('aplus_doctors') || '[]');
        const newDoc = {
          id: 'doc_' + Date.now(),
          name: name,
          degree: degree,
          badge: badge,
          img: photoUrl,
          exp: exp,
          patients: patients,
          implants: implants,
          bio: bio || 'Senior Specialist Dental Surgeon at A Plus Dental Clinic.'
        };
        docs.unshift(newDoc);
        localStorage.setItem('aplus_doctors', JSON.stringify(docs));
        renderDoctorsTable();
        showToast('Senior Doctor Profile Saved!');
      } else {
        let team = JSON.parse(localStorage.getItem('aplus_team') || '[]');
        const newTeamMember = {
          id: 'tm_' + Date.now(),
          name: name,
          title: degree,
          exp: exp,
          img: photoUrl
        };
        team.unshift(newTeamMember);
        localStorage.setItem('aplus_team', JSON.stringify(team));
        renderTeamTable();
        showToast('Associate Team Member Saved!');
      }

      docForm.reset();
      renderStats();
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        saveDoctorObj(evt.target.result);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else if (textImgInput) {
      saveDoctorObj(textImgInput);
    } else {
      saveDoctorObj('assets/doctor_vishal.jpg');
    }
  });
}

function deleteDoctor(id) {
  if (confirm('Delete doctor profile?')) {
    let docs = JSON.parse(localStorage.getItem('aplus_doctors') || '[]');
    docs = docs.filter(d => d.id !== id);
    localStorage.setItem('aplus_doctors', JSON.stringify(docs));
    renderDoctorsTable();
    renderStats();
    showToast('Doctor Profile Deleted');
  }
}

function deleteTeamMember(id) {
  if (confirm('Delete associate team member?')) {
    let team = JSON.parse(localStorage.getItem('aplus_team') || '[]');
    team = team.filter(t => t.id !== id);
    localStorage.setItem('aplus_team', JSON.stringify(team));
    renderTeamTable();
    showToast('Team Member Removed');
  }
}

function renderDoctorsTable() {
  const docs = JSON.parse(localStorage.getItem('aplus_doctors') || '[]');
  const tbody = document.getElementById('doctorsAdminTable');
  if (!tbody) return;

  tbody.innerHTML = docs.map(d => `
    <tr>
      <td><img src="${d.img}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 50%;"></td>
      <td><strong>${d.name}</strong></td>
      <td>${d.degree}</td>
      <td>${d.exp} Years</td>
      <td>
        <button onclick="deleteDoctor('${d.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem;"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

function renderTeamTable() {
  const team = JSON.parse(localStorage.getItem('aplus_team') || '[]');
  const tbody = document.getElementById('teamAdminTable');
  if (!tbody) return;

  tbody.innerHTML = team.map(t => `
    <tr>
      <td><img src="${t.img}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 50%;"></td>
      <td><strong>${t.name}</strong></td>
      <td>${t.title}</td>
      <td>${t.exp}</td>
      <td>
        <button onclick="deleteTeamMember('${t.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem;"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

// Gallery CRUD with Native File Upload Support
const galForm = document.getElementById('galleryForm');
if (galForm) {
  galForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let gal = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
    const fileInput = document.getElementById('galFileInput');
    const textImgInput = document.getElementById('galImg').value.trim();
    const caption = document.getElementById('galCaption').value.trim();

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        const base64Img = evt.target.result;
        const item = {
          id: 'gal_' + Date.now(),
          img: base64Img,
          caption: caption
        };
        gal.unshift(item);
        localStorage.setItem('aplus_gallery', JSON.stringify(gal));
        galForm.reset();
        renderGalleryTable();
        showToast('Photo Uploaded Successfully!');
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else if (textImgInput) {
      const item = {
        id: 'gal_' + Date.now(),
        img: textImgInput,
        caption: caption
      };
      gal.unshift(item);
      localStorage.setItem('aplus_gallery', JSON.stringify(gal));
      galForm.reset();
      renderGalleryTable();
      showToast('Gallery Photo Added!');
    } else {
      showToast('Please select a photo file or enter an image URL!', true);
    }
  });
}

function deleteGalleryItem(id) {
  let gal = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
  gal = gal.filter(g => g.id !== id);
  localStorage.setItem('aplus_gallery', JSON.stringify(gal));
  renderGalleryTable();
  showToast('Photo Removed');
}

function renderGalleryTable() {
  const gal = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
  const tbody = document.getElementById('galleryAdminTable');
  if (!tbody) return;

  tbody.innerHTML = gal.map(g => `
    <tr>
      <td><img src="${g.img}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 6px;"></td>
      <td>${g.caption}</td>
      <td>
        <button onclick="deleteGalleryItem('${g.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem;"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

// Blog File Upload Handler (Native Computer Gallery Picker)
const blogFileInput = document.getElementById('blogFileInput');
if (blogFileInput) {
  blogFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        document.getElementById('blogImg').value = evt.target.result;
        showToast('Blog cover photo selected from gallery!');
      };
      reader.readAsDataURL(file);
    }
  });
}

// Dental Blogs CRUD
const blogForm = document.getElementById('blogForm');
if (blogForm) {
  blogForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const saveBlogProcess = (imageSrc) => {
      let blogs = JSON.parse(localStorage.getItem('aplus_blogs') || '[]');
      const editId = document.getElementById('editBlogId').value;

      const newBlog = {
        id: editId || 'blog_' + Date.now(),
        title: document.getElementById('blogTitle').value.trim(),
        category: document.getElementById('blogCategory').value.trim() || 'General Dentistry',
        author: document.getElementById('blogAuthor').value.trim() || 'Dr. Vishal Verma',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        img: imageSrc || 'assets/hero_clinic.jpg',
        excerpt: document.getElementById('blogExcerpt').value.trim(),
        content: document.getElementById('blogContent').value.trim()
      };

      if (editId) {
        blogs = blogs.map(b => b.id === editId ? newBlog : b);
        showToast('Article Updated');
      } else {
        blogs.unshift(newBlog);
        showToast('New Article Published');
      }

      localStorage.setItem('aplus_blogs', JSON.stringify(blogs));
      resetBlogForm();
      renderBlogsTable();
      renderStats();
    };

    const fileInput = document.getElementById('blogFileInput');
    const textImg = document.getElementById('blogImg').value.trim();

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        saveBlogProcess(evt.target.result);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      saveBlogProcess(textImg);
    }
  });
}

function resetBlogForm() {
  document.getElementById('editBlogId').value = '';
  document.getElementById('blogForm').reset();
  document.getElementById('blogAuthor').value = 'Dr. Vishal Verma';
  document.getElementById('blogFormHeading').textContent = 'Add Dental Article / Blog Post';
  document.getElementById('saveBlogBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Publish Article';
}

function editBlog(id) {
  const blogs = JSON.parse(localStorage.getItem('aplus_blogs') || '[]');
  const b = blogs.find(x => x.id === id);
  if (!b) return;

  document.getElementById('editBlogId').value = b.id;
  document.getElementById('blogTitle').value = b.title;
  document.getElementById('blogCategory').value = b.category;
  document.getElementById('blogAuthor').value = b.author;
  document.getElementById('blogImg').value = b.img;
  document.getElementById('blogExcerpt').value = b.excerpt;
  document.getElementById('blogContent').value = b.content;

  document.getElementById('blogFormHeading').textContent = 'Edit Dental Article';
  document.getElementById('saveBlogBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Article';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteBlog(id) {
  if (confirm('Delete this article?')) {
    let blogs = JSON.parse(localStorage.getItem('aplus_blogs') || '[]');
    blogs = blogs.filter(b => b.id !== id);
    localStorage.setItem('aplus_blogs', JSON.stringify(blogs));
    renderBlogsTable();
    renderStats();
    showToast('Article Deleted');
  }
}

function renderBlogsTable() {
  const blogs = JSON.parse(localStorage.getItem('aplus_blogs') || '[]');
  const tbody = document.getElementById('blogsAdminTable');
  if (!tbody) return;

  tbody.innerHTML = blogs.map(b => `
    <tr>
      <td><img src="${b.img}" style="width: 50px; height: 36px; object-fit: cover; border-radius: 4px;"></td>
      <td><strong>${b.title}</strong></td>
      <td><span class="badge badge-primary">${b.category}</span></td>
      <td>${b.author}</td>
      <td>${b.date}</td>
      <td>
        <button onclick="editBlog('${b.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem;"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteBlog('${b.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem;"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

// Reviews CRUD
const revForm = document.getElementById('reviewForm');
if (revForm) {
  revForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let revs = JSON.parse(localStorage.getItem('aplus_reviews') || '[]');

    const item = {
      id: 'rev_' + Date.now(),
      name: document.getElementById('revName').value.trim(),
      loc: document.getElementById('revLoc').value.trim(),
      rating: parseInt(document.getElementById('revRating').value, 10) || 5,
      text: document.getElementById('revText').value.trim()
    };

    revs.unshift(item);
    localStorage.setItem('aplus_reviews', JSON.stringify(revs));
    revForm.reset();
    renderReviewsTable();
    renderStats();
    showToast('Patient Review Added!');
  });
}

function deleteReview(id) {
  let revs = JSON.parse(localStorage.getItem('aplus_reviews') || '[]');
  revs = revs.filter(r => r.id !== id);
  localStorage.setItem('aplus_reviews', JSON.stringify(revs));
  renderReviewsTable();
  renderStats();
  showToast('Review Deleted');
}

function renderReviewsTable() {
  const revs = JSON.parse(localStorage.getItem('aplus_reviews') || '[]');
  const tbody = document.getElementById('reviewsAdminTable');
  if (!tbody) return;

  tbody.innerHTML = revs.map(r => `
    <tr>
      <td><strong>${r.name}</strong></td>
      <td>${r.loc}</td>
      <td>${r.rating} ★</td>
      <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${r.text}"</td>
      <td>
        <button onclick="deleteReview('${r.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem;"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

// Toast Trigger (Top Right Position)
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.style.background = isError ? '#be123c' : 'linear-gradient(135deg, #0f172a 0%, #0d9488 100%)';
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), 3500);
}
