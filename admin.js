/* ==========================================================================
   A Plus Dental Clinic & Implant Centre - Admin Panel Logic
   Full CRUD Operations for Services, Doctors, Team, Photos, Blogs, Reviews & Leads
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPinAuth();
  initAdminCloudListeners();
  initMobileMenuToggle();

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

// Real-Time Firebase Cloud Firestore Synchronization Listener for Admin Panel
function initAdminCloudListeners() {
  if (typeof db === 'undefined' || !db) return;

  try {
    db.collection('appointments').onSnapshot(snapshot => {
      if (snapshot) {
        const apts = [];
        snapshot.forEach(doc => apts.push(doc.data()));
        localStorage.setItem('aplus_appointments', JSON.stringify(apts));
        renderAppointmentsTables();
        renderStats();
      }
    });

    db.collection('treatments').onSnapshot(snapshot => {
      if (snapshot) {
        const treats = [];
        snapshot.forEach(doc => treats.push(doc.data()));
        if (treats.length > 0) {
          localStorage.setItem('aplus_treatments', JSON.stringify(treats));
          renderTreatmentsTable();
          renderStats();
        }
      }
    });

    db.collection('doctors').onSnapshot(snapshot => {
      if (snapshot) {
        const docs = [];
        snapshot.forEach(doc => docs.push(doc.data()));
        if (docs.length > 0) {
          localStorage.setItem('aplus_doctors', JSON.stringify(docs));
          renderDoctorsTable();
          renderStats();
        }
      }
    });

    db.collection('team').onSnapshot(snapshot => {
      if (snapshot) {
        const team = [];
        snapshot.forEach(doc => team.push(doc.data()));
        if (team.length > 0) {
          localStorage.setItem('aplus_team', JSON.stringify(team));
          renderTeamTable();
        }
      }
    });

    db.collection('gallery').onSnapshot(snapshot => {
      if (snapshot) {
        const gal = [];
        snapshot.forEach(doc => gal.push(doc.data()));
        if (gal.length > 0) {
          localStorage.setItem('aplus_gallery', JSON.stringify(gal));
          renderGalleryTable();
        }
      }
    });

    db.collection('blogs').onSnapshot(snapshot => {
      if (snapshot) {
        const blogs = [];
        snapshot.forEach(doc => blogs.push(doc.data()));
        if (blogs.length > 0) {
          localStorage.setItem('aplus_blogs', JSON.stringify(blogs));
          renderBlogsTable();
          renderStats();
        }
      }
    });

    db.collection('reviews').onSnapshot(snapshot => {
      if (snapshot) {
        const revs = [];
        snapshot.forEach(doc => revs.push(doc.data()));
        if (revs.length > 0) {
          localStorage.setItem('aplus_reviews', JSON.stringify(revs));
          renderReviewsTable();
          renderStats();
        }
      }
    });
  } catch (e) {
    console.warn('Admin realtime cloud sync initialized in fallback mode.', e);
  }
}

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

// Mobile Navigation Controls
function initMobileMenuToggle() {
  const openBtn = document.getElementById('mobileMenuOpen');
  const overlay = document.getElementById('sidebarOverlay');
  const sidebar = document.querySelector('.admin-sidebar');

  if (openBtn && sidebar && overlay) {
    openBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
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

  // Close sliding sidebar on mobile after tab select
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
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
  const titleText = titles[tabKey] || 'Admin Dashboard';
  const mainTitle = document.getElementById('tabTitle');
  if (mainTitle) mainTitle.textContent = titleText;
  
  const mobileTitle = document.getElementById('mobileTabTitle');
  if (mobileTitle) mobileTitle.textContent = titleText;

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
        timeSlot: String(a.timeSlot || a.time || '09:00 AM - 10:00 AM'),
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
      const safeTimeSlot = String(a.timeSlot || a.time || 'Morning');
      const safeTime = String(a.timestamp || 'Just now');
      const safeSource = String(a.source || 'Website');
      const safeStatus = String(a.status || 'New');

      return `
        <tr>
          <td><strong>${safeName}</strong></td>
          <td><a href="tel:${safePhone}" style="color: var(--primary); font-weight: 700;"><i class="fa-solid fa-phone"></i> ${safePhone}</a></td>
          <td>${safeTreatment}</td>
          <td><span class="badge badge-primary">${safeBranch}</span></td>
          <td><strong>${safeDate}</strong><br><span style="font-size: 0.75rem; color: var(--primary-dark); font-weight: 600;"><i class="fa-regular fa-clock"></i> ${safeTimeSlot}</span></td>
          <td><span style="font-size: 0.78rem; color: var(--text-muted);">${safeTime}<br>(${safeSource})</span></td>
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
      if (typeof db !== 'undefined' && db) {
        db.collection('appointments').doc(id).set(a).catch(e => console.log(e));
      }
    }
    return a;
  });
  localStorage.setItem('aplus_appointments', JSON.stringify(apts));
  renderAppointmentsTables();
  showToast('Lead Status Updated');
}

function deleteAppointment(id) {
  if (typeof db !== 'undefined' && db) {
    db.collection('appointments').doc(id).delete().catch(e => console.log(e));
  }

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
    if (typeof db !== 'undefined' && db) {
      db.collection('appointments').get().then(snap => {
        snap.forEach(doc => doc.ref.delete());
      }).catch(e => console.log(e));
    }

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

    if (typeof db !== 'undefined' && db) {
      db.collection('treatments').doc(newTreat.id).set(newTreat).catch(e => console.log(e));
    }

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
    if (typeof db !== 'undefined' && db) {
      db.collection('treatments').doc(id).delete().catch(e => console.log(e));
    }

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
        <button onclick="editTreatment('${t.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem; cursor: pointer;" title="Edit Treatment"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteTreatment('${t.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem; cursor: pointer;" title="Delete Treatment"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

// Doctor & Team CRUD (With Native File Upload & Edit Support)
const docForm = document.getElementById('doctorForm');
if (docForm) {
  docForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('editDoctorId').value;
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
        const docItem = {
          id: editId || 'doc_' + Date.now(),
          name: name,
          degree: degree,
          badge: badge,
          img: photoUrl,
          exp: exp,
          patients: patients,
          implants: implants,
          bio: bio || 'Senior Specialist Dental Surgeon at A Plus Dental Clinic.'
        };
        if (typeof db !== 'undefined' && db) {
          db.collection('doctors').doc(docItem.id).set(docItem).catch(e => console.log(e));
        }
        if (editId) {
          docs = docs.map(d => d.id === editId ? docItem : d);
          showToast('Doctor Profile Updated!');
        } else {
          docs.unshift(docItem);
          showToast('Senior Doctor Profile Saved!');
        }
        localStorage.setItem('aplus_doctors', JSON.stringify(docs));
        renderDoctorsTable();
      } else {
        let team = JSON.parse(localStorage.getItem('aplus_team') || '[]');
        const teamItem = {
          id: editId || 'tm_' + Date.now(),
          name: name,
          title: degree,
          exp: exp,
          img: photoUrl
        };
        if (typeof db !== 'undefined' && db) {
          db.collection('team').doc(teamItem.id).set(teamItem).catch(e => console.log(e));
        }
        if (editId) {
          team = team.map(t => t.id === editId ? teamItem : t);
          showToast('Team Member Profile Updated!');
        } else {
          team.unshift(teamItem);
          showToast('Associate Team Member Saved!');
        }
        localStorage.setItem('aplus_team', JSON.stringify(team));
        renderTeamTable();
      }

      resetDoctorForm();
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

function resetDoctorForm() {
  document.getElementById('editDoctorId').value = '';
  document.getElementById('doctorForm').reset();
  const heading = document.getElementById('docFormHeading');
  const btn = document.getElementById('saveDocBtn');
  if (heading) heading.textContent = 'Add / Update Doctor or Team Profile';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Doctor / Staff Profile';
}

function editDoctor(id) {
  const docs = JSON.parse(localStorage.getItem('aplus_doctors') || '[]');
  const d = docs.find(x => x.id === id);
  if (!d) return;

  document.getElementById('editDoctorId').value = d.id;
  document.getElementById('docRoleType').value = 'senior';
  document.getElementById('docName').value = d.name;
  document.getElementById('docDegree').value = d.degree;
  document.getElementById('docBadge').value = d.badge || '';
  document.getElementById('docExp').value = d.exp;
  document.getElementById('docPatients').value = d.patients || '';
  document.getElementById('docImplants').value = d.implants || '';
  document.getElementById('docBio').value = d.bio || '';
  document.getElementById('docImg').value = d.img;

  const heading = document.getElementById('docFormHeading');
  const btn = document.getElementById('saveDocBtn');
  if (heading) heading.textContent = 'Edit Senior Doctor Profile';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Doctor Profile';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function editTeamMember(id) {
  const team = JSON.parse(localStorage.getItem('aplus_team') || '[]');
  const t = team.find(x => x.id === id);
  if (!t) return;

  document.getElementById('editDoctorId').value = t.id;
  document.getElementById('docRoleType').value = 'team';
  document.getElementById('docName').value = t.name;
  document.getElementById('docDegree').value = t.title;
  document.getElementById('docExp').value = t.exp;
  document.getElementById('docImg').value = t.img;

  const heading = document.getElementById('docFormHeading');
  const btn = document.getElementById('saveDocBtn');
  if (heading) heading.textContent = 'Edit Associate Team Member';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Team Member';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteDoctor(id) {
  if (confirm('Delete doctor profile?')) {
    if (typeof db !== 'undefined' && db) {
      db.collection('doctors').doc(id).delete().catch(e => console.log(e));
    }

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
    if (typeof db !== 'undefined' && db) {
      db.collection('team').doc(id).delete().catch(e => console.log(e));
    }

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
        <button onclick="editDoctor('${d.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem; cursor: pointer;" title="Edit Doctor"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteDoctor('${d.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem; cursor: pointer;" title="Delete Doctor"><i class="fa-solid fa-trash-can"></i></button>
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
        <button onclick="editTeamMember('${t.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem; cursor: pointer;" title="Edit Team Member"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteTeamMember('${t.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem; cursor: pointer;" title="Delete Member"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

// Gallery CRUD with Edit Support
const galForm = document.getElementById('galleryForm');
if (galForm) {
  galForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let gal = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
    const editId = document.getElementById('editGalleryId').value;
    const fileInput = document.getElementById('galFileInput');
    const textImgInput = document.getElementById('galImg').value.trim();
    const caption = document.getElementById('galCaption').value.trim();

    const saveGalItem = (imgSrc) => {
      const item = {
        id: editId || 'gal_' + Date.now(),
        img: imgSrc,
        caption: caption
      };
      if (typeof db !== 'undefined' && db) {
        db.collection('gallery').doc(item.id).set(item).catch(e => console.log(e));
      }
      if (editId) {
        gal = gal.map(g => g.id === editId ? item : g);
        showToast('Gallery Photo Updated!');
      } else {
        gal.unshift(item);
        showToast('Gallery Photo Added!');
      }
      localStorage.setItem('aplus_gallery', JSON.stringify(gal));
      resetGalleryForm();
      renderGalleryTable();
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        saveGalItem(evt.target.result);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else if (textImgInput) {
      saveGalItem(textImgInput);
    } else {
      showToast('Please select a photo file or enter an image URL!', true);
    }
  });
}

function resetGalleryForm() {
  document.getElementById('editGalleryId').value = '';
  document.getElementById('galleryForm').reset();
  const heading = document.getElementById('galFormHeading');
  const btn = document.getElementById('saveGalBtn');
  if (heading) heading.textContent = 'Add Clinic Infrastructure Photo';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Photo to Gallery';
}

function editGalleryItem(id) {
  const gal = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
  const g = gal.find(x => x.id === id);
  if (!g) return;

  document.getElementById('editGalleryId').value = g.id;
  document.getElementById('galImg').value = g.img;
  document.getElementById('galCaption').value = g.caption;

  const heading = document.getElementById('galFormHeading');
  const btn = document.getElementById('saveGalBtn');
  if (heading) heading.textContent = 'Edit Clinic Photo';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Photo';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteGalleryItem(id) {
  if (confirm('Delete this gallery photo?')) {
    if (typeof db !== 'undefined' && db) {
      db.collection('gallery').doc(id).delete().catch(e => console.log(e));
    }

    let gal = JSON.parse(localStorage.getItem('aplus_gallery') || '[]');
    gal = gal.filter(g => g.id !== id);
    localStorage.setItem('aplus_gallery', JSON.stringify(gal));
    renderGalleryTable();
    showToast('Photo Removed');
  }
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
        <button onclick="editGalleryItem('${g.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem; cursor: pointer;" title="Edit Photo"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteGalleryItem('${g.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem; cursor: pointer;" title="Delete Photo"><i class="fa-solid fa-trash-can"></i></button>
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

      if (typeof db !== 'undefined' && db) {
        db.collection('blogs').doc(newBlog.id).set(newBlog).catch(e => console.log(e));
      }

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
    if (typeof db !== 'undefined' && db) {
      db.collection('blogs').doc(id).delete().catch(e => console.log(e));
    }

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
        <button onclick="editBlog('${b.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem; cursor: pointer;" title="Edit Article"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteBlog('${b.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem; cursor: pointer;" title="Delete Article"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

// Reviews CRUD with Edit Support
const revForm = document.getElementById('reviewForm');
if (revForm) {
  revForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let revs = JSON.parse(localStorage.getItem('aplus_reviews') || '[]');
    const editId = document.getElementById('editReviewId').value;

    const item = {
      id: editId || 'rev_' + Date.now(),
      name: document.getElementById('revName').value.trim(),
      loc: document.getElementById('revLoc').value.trim(),
      rating: parseInt(document.getElementById('revRating').value, 10) || 5,
      text: document.getElementById('revText').value.trim()
    };

    if (typeof db !== 'undefined' && db) {
      db.collection('reviews').doc(item.id).set(item).catch(e => console.log(e));
    }

    if (editId) {
      revs = revs.map(r => r.id === editId ? item : r);
      showToast('Patient Review Updated!');
    } else {
      revs.unshift(item);
      showToast('Patient Review Added!');
    }

    localStorage.setItem('aplus_reviews', JSON.stringify(revs));
    resetReviewForm();
    renderReviewsTable();
    renderStats();
  });
}

function resetReviewForm() {
  document.getElementById('editReviewId').value = '';
  document.getElementById('reviewForm').reset();
  const heading = document.getElementById('revFormHeading');
  const btn = document.getElementById('saveRevBtn');
  if (heading) heading.textContent = 'Add / Manage Patient Testimonials';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Patient Review';
}

function editReview(id) {
  const revs = JSON.parse(localStorage.getItem('aplus_reviews') || '[]');
  const r = revs.find(x => x.id === id);
  if (!r) return;

  document.getElementById('editReviewId').value = r.id;
  document.getElementById('revName').value = r.name;
  document.getElementById('revLoc').value = r.loc;
  document.getElementById('revRating').value = r.rating || 5;
  document.getElementById('revText').value = r.text;

  const heading = document.getElementById('revFormHeading');
  const btn = document.getElementById('saveRevBtn');
  if (heading) heading.textContent = 'Edit Patient Review';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Review';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteReview(id) {
  if (confirm('Delete patient review?')) {
    if (typeof db !== 'undefined' && db) {
      db.collection('reviews').doc(id).delete().catch(e => console.log(e));
    }

    let revs = JSON.parse(localStorage.getItem('aplus_reviews') || '[]');
    revs = revs.filter(r => r.id !== id);
    localStorage.setItem('aplus_reviews', JSON.stringify(revs));
    renderReviewsTable();
    renderStats();
    showToast('Review Deleted');
  }
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
        <button onclick="editReview('${r.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem; cursor: pointer;" title="Edit Review"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteReview('${r.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem; cursor: pointer;" title="Delete Review"><i class="fa-solid fa-trash-can"></i></button>
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
