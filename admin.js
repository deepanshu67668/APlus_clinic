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

// Real-Time Firebase Realtime Database Synchronization Listener for Admin Panel
function initAdminCloudListeners() {
  if (typeof db === 'undefined' || !db) return;

  try {
    db.ref('appointments').on('value', snapshot => {
      const data = snapshot.val();
      const list = [];
      if (data) {
        Object.keys(data).forEach(key => {
          if (data[key]) list.push(data[key]);
        });
      }
      localStorage.setItem('aplus_appointments', JSON.stringify(list));
      renderAppointmentsTables();
      renderStats();
    });

    db.ref('treatments').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_treatments', JSON.stringify(list));
        renderTreatmentsTable();
        renderStats();
      }
    });

    db.ref('doctors').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_doctors', JSON.stringify(list));
        renderDoctorsTable();
        renderStats();
      }
    });

    db.ref('team').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_team', JSON.stringify(list));
        renderTeamTable();
      }
    });

    db.ref('gallery').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_gallery', JSON.stringify(list));
        renderGalleryTable();
      }
    });

    db.ref('blogs').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_blogs', JSON.stringify(list));
        renderBlogsTable();
        renderStats();
      }
    });

    db.ref('reviews').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => data[key]);
        localStorage.setItem('aplus_reviews', JSON.stringify(list));
        renderReviewsTable();
        renderStats();
      }
    });

    db.ref('patients').on('value', snapshot => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => data[key]) : [];
      localStorage.setItem('aplus_patients', JSON.stringify(list));
      if (typeof renderPatientsTable === 'function') renderPatientsTable();
      if (typeof populateDropdownOptions === 'function') populateDropdownOptions();
    });

    db.ref('invoices').on('value', snapshot => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => data[key]) : [];
      localStorage.setItem('aplus_invoices', JSON.stringify(list));
      if (typeof renderInvoicesTable === 'function') renderInvoicesTable();
    });

    db.ref('refunds').on('value', snapshot => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => data[key]) : [];
      localStorage.setItem('aplus_refunds', JSON.stringify(list));
    });
  } catch (e) {
    console.warn('Admin realtime database sync initialized in fallback mode.', e);
  }
}

// Secure Authentication and RBAC Integration
function initPinAuth() {
  // Ensure default staff users exist in Database
  seedDefaultStaffUsers();

  const isAuth = sessionStorage.getItem('aplus_admin_auth');
  const pinModal = document.getElementById('pinModal');
  const layout = document.getElementById('adminDashboardLayout');

  if (isAuth === 'true') {
    pinModal.style.display = 'none';
    layout.style.display = 'grid';
    
    // Apply role-based sidebar items filter
    const activeUser = JSON.parse(sessionStorage.getItem('aplus_logged_in_user') || '{}');
    if (activeUser.role) {
      applySidebarRolePermissions(activeUser.role);
    }
    
    loadDashboardData();
    initSessionInactivityTimer();
  }

  // Username field keystroke change listener
  const loginUserField = document.getElementById('loginUsername');
  if (loginUserField) {
    loginUserField.addEventListener('input', (e) => {
      const val = e.target.value;
      const isLegacyPin = /^\d{4}$/.test(val) || val === '1234' || val === '';
      const passGroup = document.getElementById('loginPasswordGroup');
      if (passGroup) {
        passGroup.style.display = isLegacyPin ? 'none' : 'block';
      }
    });
  }

  const pinForm = document.getElementById('pinForm');
  if (pinForm) {
    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value.trim() : '';

      // Legacy PIN bypass handler
      if (username === '1234') {
        const adminUserObj = {
          id: 'usr_admin',
          fullName: 'System Admin',
          username: 'admin',
          role: 'Admin',
          status: 'Active'
        };
        sessionStorage.setItem('aplus_admin_auth', 'true');
        sessionStorage.setItem('aplus_logged_in_user', JSON.stringify(adminUserObj));
        pinModal.style.display = 'none';
        layout.style.display = 'grid';
        
        applySidebarRolePermissions('Admin');
        loadDashboardData();
        showToast('Admin Dashboard Unlocked via PIN!');
        logSystemAuditEvent('Logged in via Admin PIN passcode');
        initSessionInactivityTimer();
        return;
      }

      // Check credentials against staff database
      const usersList = JSON.parse(localStorage.getItem('aplus_users') || '[]');
      const matchedUser = usersList.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (matchedUser) {
        if (matchedUser.status === 'Inactive') {
          showToast('Your account is deactivated! Please contact the Admin.', true);
          return;
        }

        if (matchedUser.passwordHash === password) {
          sessionStorage.setItem('aplus_admin_auth', 'true');
          sessionStorage.setItem('aplus_logged_in_user', JSON.stringify(matchedUser));
          pinModal.style.display = 'none';
          layout.style.display = 'grid';
          
          applySidebarRolePermissions(matchedUser.role);
          loadDashboardData();
          showToast(`Dashboard Unlocked as ${matchedUser.role}!`);
          logSystemAuditEvent(`User logged in as ${matchedUser.role}`);
          initSessionInactivityTimer();
        } else {
          showToast('Incorrect password! Please try again.', true);
        }
      } else {
        showToast('User account not found! Use autofills to try demo logins.', true);
      }
    });
  }
}

function lockAdmin() {
  logSystemAuditEvent('Logged out from session');
  sessionStorage.removeItem('aplus_admin_auth');
  sessionStorage.removeItem('aplus_logged_in_user');
  window.location.reload();
}

function autofillDemoCredentials() {
  const val = document.getElementById('demoRoleAutofill').value;
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  
  if (val) {
    const parts = val.split('|');
    usernameInput.value = parts[0];
    if (passwordInput) passwordInput.value = parts[1];
    
    const passGroup = document.getElementById('loginPasswordGroup');
    if (passGroup) passGroup.style.display = 'block';
  } else {
    usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
  }
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

// Tab Switching with Permission Middleware Protection
function switchAdminTab(tabKey, btn) {
  // Permission Middleware Check
  const activeUser = JSON.parse(sessionStorage.getItem('aplus_logged_in_user') || '{}');
  const role = activeUser.role || 'Admin';

  const permissionMap = {
    Admin: ['dashboard', 'appointments', 'treatments', 'doctors', 'gallery', 'blogs', 'reviews', 'patients', 'billing', 'users-roles', 'audit-logs'],
    Doctor: ['dashboard', 'appointments', 'treatments', 'doctors', 'patients'],
    Receptionist: ['dashboard', 'appointments', 'reviews', 'patients', 'billing'],
    Nurse: ['dashboard', 'appointments', 'patients'],
    'Lab Technician': ['dashboard', 'patients'],
    LabTech: ['dashboard', 'patients']
  };

  const allowedTabs = permissionMap[role] || ['dashboard'];
  if (!allowedTabs.includes(tabKey)) {
    showToast('403 Access Denied: Unauthorized module!', true);
    logSystemAuditEvent(`403 Unauthorized tab access blocked on key: ${tabKey}`);
    return; // Block direct access
  }

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
    reviews: 'Manage Patient Reviews',
    patients: 'Patient Management Dashboard',
    billing: 'Billing & Invoice Dashboard',
    'users-roles': 'Staff Access Control & User Roles',
    'audit-logs': 'System Security Audit Trails'
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
  if (typeof renderPatientsTable === 'function') renderPatientsTable();
  if (typeof renderInvoicesTable === 'function') renderInvoicesTable();
  if (typeof populateDropdownOptions === 'function') populateDropdownOptions();
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
        db.ref('appointments/' + id).set(a).catch(e => console.log(e));
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
    db.ref('appointments/' + id).remove().catch(e => console.log(e));
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
      db.ref('appointments').remove().catch(e => console.log(e));
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
      db.ref('treatments/' + newTreat.id).set(newTreat).catch(e => console.log(e));
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
      db.ref('treatments/' + id).remove().catch(e => console.log(e));
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
          db.ref('doctors/' + docItem.id).set(docItem).catch(e => console.log(e));
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
          db.ref('team/' + teamItem.id).set(teamItem).catch(e => console.log(e));
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
      db.ref('doctors/' + id).remove().catch(e => console.log(e));
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
      db.ref('team/' + id).remove().catch(e => console.log(e));
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
        db.ref('gallery/' + item.id).set(item).catch(e => console.log(e));
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
      db.ref('gallery/' + id).remove().catch(e => console.log(e));
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
        db.ref('blogs/' + newBlog.id).set(newBlog).catch(e => console.log(e));
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
      db.ref('blogs/' + id).remove().catch(e => console.log(e));
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
      db.ref('reviews/' + item.id).set(item).catch(e => console.log(e));
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
      db.ref('reviews/' + id).remove().catch(e => console.log(e));
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

/* ==========================================================================
   MODULE 1: PATIENT MANAGEMENT LOGIC
   ========================================================================== */

let isPhoneVerified = false;
let isAadhaarVerified = false;

function calculatePatientAge() {
  const dobVal = document.getElementById('patientDob').value;
  if (!dobVal) return;
  const dob = new Date(dobVal);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  document.getElementById('patientAge').value = age;
}

function togglePhoneVerification() {
  isPhoneVerified = !isPhoneVerified;
  const badge = document.getElementById('phoneBadge');
  badge.textContent = isPhoneVerified ? 'Verified ✅' : 'Unverified ❌';
  badge.style.background = isPhoneVerified ? '#22c55e' : '#e2e8f0';
  badge.style.color = isPhoneVerified ? 'white' : '#475569';
}

function toggleAadhaarVerification() {
  isAadhaarVerified = !isAadhaarVerified;
  const badge = document.getElementById('aadhaarBadge');
  badge.textContent = isAadhaarVerified ? 'Verified ✅' : 'Unverified ❌';
  badge.style.background = isAadhaarVerified ? '#22c55e' : '#e2e8f0';
  badge.style.color = isAadhaarVerified ? 'white' : '#475569';
}

// Reset patient form
function resetPatientForm() {
  document.getElementById('editPatientIdRaw').value = '';
  document.getElementById('patientRegistrationForm').reset();
  document.getElementById('patientId').value = '';
  document.getElementById('patientFormHeading').textContent = 'Patient Registration';
  document.getElementById('savePatientBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Patient';
  
  isPhoneVerified = false;
  isAadhaarVerified = false;
  togglePhoneVerification();
  togglePhoneVerification(); // Reset badge styles
  toggleAadhaarVerification();
  toggleAadhaarVerification();
}

// Save Patient Form Submission
const patientForm = document.getElementById('patientRegistrationForm');
if (patientForm) {
  patientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    savePatientProcess();
  });
}

function savePatientProcess() {
  const editId = document.getElementById('editPatientIdRaw').value;
  const patientId = editId || 'PAT_' + Date.now();
  
  const firstName = document.getElementById('patientFirstName').value.trim();
  const lastName = document.getElementById('patientLastName').value.trim();
  
  const patientObj = {
    id: patientId,
    firstName: firstName,
    lastName: lastName,
    name: firstName + ' ' + lastName,
    gender: document.getElementById('patientGender').value,
    dob: document.getElementById('patientDob').value,
    age: document.getElementById('patientAge').value,
    phone: document.getElementById('patientMobile').value.trim(),
    altPhone: document.getElementById('patientAltMobile').value.trim(),
    aadhaar: document.getElementById('patientAadhaar').value.trim(),
    email: document.getElementById('patientEmail').value.trim(),
    bloodGroup: document.getElementById('patientBloodGroup').value,
    maritalStatus: document.getElementById('patientMaritalStatus').value,
    emergencyName: document.getElementById('patientEmergencyName').value.trim(),
    emergencyPhone: document.getElementById('patientEmergencyPhone').value.trim(),
    occupation: document.getElementById('patientOccupation').value.trim(),
    familyHead: document.getElementById('patientFamilyHead').value,
    address: document.getElementById('patientAddress').value.trim(),
    city: document.getElementById('patientCity').value.trim(),
    state: document.getElementById('patientState').value.trim(),
    pinCode: document.getElementById('patientPinCode').value.trim(),
    phoneVerified: isPhoneVerified,
    aadhaarVerified: isAadhaarVerified,
    lastVisit: new Date().toLocaleDateString('en-US'),
    status: 'Active'
  };

  // Keep existing timeline/sub-data if editing
  const existingPatients = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const match = existingPatients.find(x => x.id === patientId);
  if (match) {
    patientObj.visits = match.visits || [];
    patientObj.diagnoses = match.diagnoses || [];
    patientObj.prescriptions = match.prescriptions || [];
    patientObj.reports = match.reports || [];
    patientObj.allergies = match.allergies || [];
    patientObj.chronic = match.chronic || [];
    patientObj.vaccines = match.vaccines || [];
    patientObj.docs = match.docs || [];
  } else {
    // Inject default seed logs
    patientObj.visits = [{ visitDate: new Date().toLocaleDateString(), doctor: 'Dr. Vishal Verma', department: 'General Dentistry', diagnosis: 'Initial Oral Health Checkup', prescription: 'No medication required', status: 'Completed' }];
    patientObj.diagnoses = [{ disease: 'Healthy Checkup', date: new Date().toLocaleDateString(), doctor: 'Dr. Vishal Verma', notes: 'Excellent oral health.' }];
    patientObj.prescriptions = [{ medicines: 'Hexidine Mouthwash', dosage: '10ml', frequency: 'Twice daily', duration: '5 days', instructions: 'Rinse thoroughly after meals' }];
    patientObj.allergies = [{ name: 'Penicillin', severity: 'High', notes: 'Severe hives' }];
    patientObj.chronic = [{ name: 'Hypertension', notes: 'Controlled with medication' }];
    patientObj.vaccines = [{ name: 'Tetanus Toxoid', dose: 'Booster', date: new Date().toLocaleDateString(), nextDue: 'None', status: 'Completed' }];
    patientObj.docs = [];
  }

  if (typeof db !== 'undefined' && db) {
    db.ref('patients/' + patientId).set(patientObj).then(() => {
      showToast(editId ? 'Patient Profile Updated!' : 'Patient Registration Successful!');
      resetPatientForm();
      renderPatientsTable();
    }).catch(err => {
      showToast('Database write failed', true);
    });
  } else {
    // Offline storage fallback
    let list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
    list = list.filter(p => p.id !== patientId);
    list.unshift(patientObj);
    localStorage.setItem('aplus_patients', JSON.stringify(list));
    showToast(editId ? 'Patient Updated (Offline)' : 'Patient Registered (Offline)');
    resetPatientForm();
    renderPatientsTable();
  }
}

function saveAndAddAnotherPatient() {
  savePatientProcess();
  setTimeout(() => resetPatientForm(), 500);
}

// Render Patients Data Table
function renderPatientsTable() {
  const raw = localStorage.getItem('aplus_patients') || '[]';
  const list = JSON.parse(raw);
  const tbody = document.getElementById('patientsAdminTable');
  if (!tbody) return;

  // Render stats summary cards
  document.getElementById('statTotalPatients').textContent = list.length;
  const todayStr = new Date().toLocaleDateString();
  const newToday = list.filter(p => p.visits && p.visits[0] && p.visits[0].visitDate === todayStr).length;
  document.getElementById('statNewPatientsToday').textContent = newToday;
  document.getElementById('statReturningPatients').textContent = list.filter(p => p.visits && p.visits.length > 1).length;
  document.getElementById('statActivePatients').textContent = list.filter(p => p.status === 'Active').length;

  tbody.innerHTML = list.map(p => {
    const lastDoc = p.visits && p.visits[0] ? p.visits[0].doctor : 'N/A';
    return `
      <tr>
        <td><strong>${p.id}</strong></td>
        <td><a href="javascript:void(0)" onclick="viewPatientProfile('${p.id}')" style="color: var(--primary); font-weight: 700;">${p.firstName} ${p.lastName}</a></td>
        <td>${p.age || 'N/A'} yrs</td>
        <td>${p.gender}</td>
        <td>${p.phone}</td>
        <td>${p.city}</td>
        <td>${p.lastVisit || 'N/A'}</td>
        <td>${lastDoc}</td>
        <td><span class="badge" style="background: #dcfce7; color: #166534;">${p.status || 'Active'}</span></td>
        <td>
          <button onclick="editPatient('${p.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem; cursor: pointer;" title="Edit Patient"><i class="fa-solid fa-pen-to-square"></i></button>
          <button onclick="deletePatient('${p.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem; cursor: pointer;" title="Delete Patient"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

// Global Filter Search
function filterPatientsList() {
  const query = document.getElementById('patientSearchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#patientsAdminTable tr');
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = text.includes(query) ? '' : 'none';
  });
}

function editPatient(id) {
  const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const p = list.find(x => x.id === id);
  if (!p) return;

  document.getElementById('editPatientIdRaw').value = p.id;
  document.getElementById('patientId').value = p.id;
  document.getElementById('patientFirstName').value = p.firstName || '';
  document.getElementById('patientLastName').value = p.lastName || '';
  document.getElementById('patientGender').value = p.gender || '';
  document.getElementById('patientDob').value = p.dob || '';
  document.getElementById('patientAge').value = p.age || '';
  document.getElementById('patientMobile').value = p.phone || '';
  document.getElementById('patientAltMobile').value = p.altPhone || '';
  document.getElementById('patientAadhaar').value = p.aadhaar || '';
  document.getElementById('patientEmail').value = p.email || '';
  document.getElementById('patientBloodGroup').value = p.bloodGroup || '';
  document.getElementById('patientMaritalStatus').value = p.maritalStatus || 'Single';
  document.getElementById('patientEmergencyName').value = p.emergencyName || '';
  document.getElementById('patientEmergencyPhone').value = p.emergencyPhone || '';
  document.getElementById('patientOccupation').value = p.occupation || '';
  document.getElementById('patientFamilyHead').value = p.familyHead || '';
  document.getElementById('patientAddress').value = p.address || '';
  document.getElementById('patientCity').value = p.city || '';
  document.getElementById('patientState').value = p.state || '';
  document.getElementById('patientPinCode').value = p.pinCode || '';

  isPhoneVerified = !!p.phoneVerified;
  isAadhaarVerified = !!p.aadhaarVerified;
  const pBadge = document.getElementById('phoneBadge');
  pBadge.textContent = isPhoneVerified ? 'Verified ✅' : 'Unverified ❌';
  pBadge.style.background = isPhoneVerified ? '#22c55e' : '#e2e8f0';
  pBadge.style.color = isPhoneVerified ? 'white' : '#475569';

  const aBadge = document.getElementById('aadhaarBadge');
  aBadge.textContent = isAadhaarVerified ? 'Verified ✅' : 'Unverified ❌';
  aBadge.style.background = isAadhaarVerified ? '#22c55e' : '#e2e8f0';
  aBadge.style.color = isAadhaarVerified ? 'white' : '#475569';

  document.getElementById('patientFormHeading').textContent = 'Edit Patient Profile';
  document.getElementById('savePatientBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Profile';
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deletePatient(id) {
  if (confirm('Are you sure you want to delete this patient record?')) {
    if (typeof db !== 'undefined' && db) {
      db.ref('patients/' + id).remove().then(() => {
        showToast('Patient record deleted');
        renderPatientsTable();
      });
    } else {
      let list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
      list = list.filter(p => p.id !== id);
      localStorage.setItem('aplus_patients', JSON.stringify(list));
      showToast('Patient deleted (Offline)');
      renderPatientsTable();
    }
  }
}

// Dropdown Populations
function populateDropdownOptions() {
  const pList = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const familyHeadSelect = document.getElementById('patientFamilyHead');
  const invoicePatientSelect = document.getElementById('invoicePatientSelect');

  if (familyHeadSelect) {
    familyHeadSelect.innerHTML = '<option value="">No Linking (Self / Head)</option>' +
      pList.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.id})</option>`).join('');
  }

  if (invoicePatientSelect) {
    invoicePatientSelect.innerHTML = '<option value="">Select Patient</option>' +
      pList.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.id})</option>`).join('');
  }

  // Populate doctors dropdown for invoice billing
  const dList = JSON.parse(localStorage.getItem('aplus_doctors') || '[]');
  const invoiceDocSelect = document.getElementById('invoiceDoctor');
  if (invoiceDocSelect) {
    invoiceDocSelect.innerHTML = '<option value="">Select Doctor</option>' +
      dList.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
  }
}

// Exports
function exportPatientsCSV() {
  const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const csvHeaders = 'Patient ID,Name,Age,Gender,Phone,City,Last Visit,Status\n';
  const csvContent = csvHeaders + list.map(p => `"${p.id}","${p.firstName} ${p.lastName}","${p.age}","${p.gender}","${p.phone}","${p.city}","${p.lastVisit}","${p.status}"`).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Patient_Records_Export.csv';
  a.click();
}

function printPatientsReport() {
  const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const w = window.open();
  w.document.write(`
    <html>
    <head><title>A Plus Dental Clinic - Patient Records</title></head>
    <body style="font-family: Arial; padding: 2rem;">
      <h2>Registered Patient Records</h2>
      <table border="1" cellpadding="8" style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Phone</th>
            <th>City</th>
            <th>Last Visit</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(p => `<tr><td>${p.id}</td><td>${p.firstName} ${p.lastName}</td><td>${p.age}</td><td>${p.gender}</td><td>${p.phone}</td><td>${p.city}</td><td>${p.lastVisit}</td></tr>`).join('')}
        </tbody>
      </table>
      <script>window.print();</script>
    </body>
    </html>
  `);
  w.document.close();
}

// Patient Profile Modal tab switching and file base64 uploads
let activeProfilePatientId = null;

function viewPatientProfile(id) {
  activeProfilePatientId = id;
  const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const p = list.find(x => x.id === id);
  if (!p) return;

  document.getElementById('profilePatientName').textContent = p.name;
  document.getElementById('profilePatientId').textContent = p.id;
  document.getElementById('patientProfileModal').classList.add('active');

  // Trigger basic tab render
  const basicBtn = document.querySelector('.profile-tab-btn');
  switchProfileTab('basic', basicBtn);
}

function closePatientProfileModal() {
  document.getElementById('patientProfileModal').classList.remove('active');
  activeProfilePatientId = null;
}

function switchProfileTab(tabName, btn) {
  const btns = document.querySelectorAll('.profile-tab-btn');
  btns.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const content = document.getElementById('profileTabContent');
  const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const p = list.find(x => x.id === activeProfilePatientId);
  if (!p) return;

  if (tabName === 'basic') {
    // Linked family heads
    let familyLinks = 'None';
    if (p.familyHead) {
      const parent = list.find(x => x.id === p.familyHead);
      if (parent) familyLinks = `Linked to Head: <strong>${parent.name} (${parent.id})</strong>`;
    }
    const children = list.filter(x => x.familyHead === p.id);
    if (children.length > 0) {
      familyLinks = `Head Patient (Linked Members: ${children.map(c => `<strong>${c.name} (${c.id})</strong>`).join(', ')})`;
    }

    content.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 0.5rem;">
        <div><strong>Gender:</strong> ${p.gender}</div>
        <div><strong>Date of Birth:</strong> ${p.dob}</div>
        <div><strong>Age:</strong> ${p.age} years</div>
        <div><strong>Mobile:</strong> ${p.phone}</div>
        <div><strong>Aadhaar Number:</strong> ${p.aadhaar || 'N/A'}</div>
        <div><strong>Email Address:</strong> ${p.email || 'N/A'}</div>
        <div><strong>Blood Group:</strong> ${p.bloodGroup || 'N/A'}</div>
        <div><strong>Marital Status:</strong> ${p.maritalStatus || 'Single'}</div>
        <div><strong>Occupation:</strong> ${p.occupation || 'N/A'}</div>
        <div><strong>Emergency Contact:</strong> ${p.emergencyName || 'N/A'} (${p.emergencyPhone || 'N/A'})</div>
        <div style="grid-column: span 2;"><strong>Address:</strong> ${p.address}, ${p.city}, ${p.state} - ${p.pinCode}</div>
        <div style="grid-column: span 2; background: #f0fdf4; padding: 0.75rem; border-radius: 4px; border: 1px solid #bbf7d0;">
          <i class="fa-solid fa-people-roof" style="color: #166534;"></i> Family Structure: ${familyLinks}
        </div>
      </div>
    `;
  } else if (tabName === 'visits') {
    const visits = p.visits || [];
    content.innerHTML = `
      <table class="admin-table" style="margin-top: 0.5rem;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Doctor</th>
            <th>Department</th>
            <th>Diagnosis</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${visits.map(v => `<tr><td>${v.visitDate}</td><td>${v.doctor}</td><td>${v.department}</td><td>${v.diagnosis}</td><td><span class="badge" style="background:#dcfce7; color:#166534;">${v.status || 'Completed'}</span></td></tr>`).join('')}
        </tbody>
      </table>
    `;
  } else if (tabName === 'diagnoses') {
    const timeline = p.diagnoses || [];
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem; border-left: 3px solid var(--primary); padding-left: 1.5rem; margin-top: 1rem; margin-left: 0.5rem;">
        ${timeline.map(t => `
          <div style="position: relative; margin-bottom: 0.5rem;">
            <div style="position: absolute; left: -29px; top: 2px; width: 12px; height: 12px; background: var(--primary); border-radius: 50%;"></div>
            <div style="font-weight: 800; font-size: 1rem; color: var(--secondary);">${t.disease}</div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Date: ${t.date} | Diagnosed By: ${t.doctor}</div>
            <p style="font-size: 0.85rem; color: var(--text-primary);">${t.notes}</p>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tabName === 'prescriptions') {
    const rx = p.prescriptions || [];
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;">
        ${rx.map((r, idx) => `
          <div style="border: 1px solid #cbd5e1; padding: 1rem; border-radius: 6px; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
              <strong style="color: var(--secondary);">Rx Prescription #${idx + 1}</strong>
              <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="printSinglePrescription(${idx})"><i class="fa-solid fa-print"></i> Print Rx</button>
            </div>
            <div><strong>Medicine:</strong> ${r.medicines}</div>
            <div><strong>Dosage:</strong> ${r.dosage}</div>
            <div><strong>Frequency:</strong> ${r.frequency}</div>
            <div><strong>Duration:</strong> ${r.duration}</div>
            <div><strong>Instructions:</strong> ${r.instructions}</div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tabName === 'lab') {
    const reports = p.reports || [];
    const labReports = reports.filter(r => r.category === 'Lab');
    const xRayReports = reports.filter(r => r.category === 'X-Ray');
    const mriReports = reports.filter(r => r.category === 'MRI');

    const renderReportRows = (arr) => {
      if (arr.length === 0) return '<div style="font-size: 0.82rem; color: var(--text-muted); padding: 0.5rem 0;">No uploads yet.</div>';
      return arr.map((r, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #f1f5f9;">
          <span style="font-size: 0.85rem;">${r.name} (${r.date})</span>
          <div style="display: flex; gap: 0.5rem;">
            ${r.file.startsWith('data:image') ? `<button class="btn btn-outline" style="padding: 0.2rem 0.4rem; font-size: 0.7rem;" onclick="previewReportImage('${r.file}')">Preview</button>` : ''}
            <a href="${r.file}" download="${r.name}" class="btn btn-primary" style="padding: 0.2rem 0.4rem; font-size: 0.7rem;"><i class="fa-solid fa-download"></i></a>
          </div>
        </div>
      `).join('');
    };

    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;">
        
        <!-- Lab Reports -->
        <div style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: var(--secondary);">Diagnostic Lab Reports</strong>
            <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" onclick="triggerReportUpload('Lab')"><i class="fa-solid fa-plus"></i> Upload</button>
          </div>
          <div>${renderReportRows(labReports)}</div>
        </div>

        <!-- X-Ray -->
        <div style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: var(--secondary);">X-Ray Imaging Reports</strong>
            <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" onclick="triggerReportUpload('X-Ray')"><i class="fa-solid fa-plus"></i> Upload</button>
          </div>
          <div>${renderReportRows(xRayReports)}</div>
        </div>

        <!-- MRI -->
        <div style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: var(--secondary);">MRI Scans</strong>
            <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" onclick="triggerReportUpload('MRI')"><i class="fa-solid fa-plus"></i> Upload</button>
          </div>
          <div>${renderReportRows(mriReports)}</div>
        </div>

        <!-- Hidden File Picker -->
        <input type="file" id="reportFilePicker" style="display: none;" onchange="handleReportUploadProcess(event)">
      </div>
    `;
  } else if (tabName === 'allergies') {
    const allergies = p.allergies || [];
    const chronic = p.chronic || [];
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
        <div style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 6px;">
          <strong style="color: var(--secondary);">Drug / Food Allergies</strong>
          <ul style="margin-top: 0.5rem; list-style: inside square;">
            ${allergies.map(a => `<li><strong>${a.name}</strong> - Severity: <span style="color:#be123c; font-weight:800;">${a.severity}</span> (${a.notes})</li>`).join('')}
          </ul>
        </div>
        <div style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 6px;">
          <strong style="color: var(--secondary);">Chronic Disease History</strong>
          <ul style="margin-top: 0.5rem; list-style: inside square;">
            ${chronic.map(c => `<li><strong>${c.name}</strong> - ${c.notes}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  } else if (tabName === 'vaccines') {
    const vacs = p.vaccines || [];
    content.innerHTML = `
      <table class="admin-table" style="margin-top: 0.5rem;">
        <thead>
          <tr>
            <th>Vaccine</th>
            <th>Dose</th>
            <th>Date</th>
            <th>Next Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${vacs.map(v => `<tr><td>${v.name}</td><td>${v.dose}</td><td>${v.date}</td><td>${v.nextDue}</td><td><span class="badge" style="background:#dcfce7; color:#166534;">${v.status}</span></td></tr>`).join('')}
        </tbody>
      </table>
    `;
  } else if (tabName === 'docs') {
    const docs = p.docs || [];
    content.innerHTML = `
      <div style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 6px; margin-top: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <strong style="color: var(--secondary);">General Documents Locker</strong>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" onclick="triggerReportUpload('GeneralDoc')"><i class="fa-solid fa-plus"></i> Upload Document</button>
        </div>
        <div>
          ${docs.map(d => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #f1f5f9;">
              <span style="font-size: 0.85rem;"><i class="fa-solid fa-file-invoice"></i> ${d.name} (${d.date})</span>
              <div style="display: flex; gap: 0.5rem;">
                <a href="${d.file}" download="${d.name}" class="btn btn-primary" style="padding: 0.2rem 0.4rem; font-size: 0.7rem;"><i class="fa-solid fa-download"></i></a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// Prescription Print helper
function printSinglePrescription(idx) {
  const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const p = list.find(x => x.id === activeProfilePatientId);
  if (!p) return;
  const rx = p.prescriptions && p.prescriptions[idx];
  if (!rx) return;

  const w = window.open();
  w.document.write(`
    <html>
    <head><title>Prescription Rx - A Plus Dental</title></head>
    <body style="font-family: Arial; padding: 3rem; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1;">
      <h2>A PLUS DENTAL CLINIC & IMPLANT CENTRE</h2>
      <p>Address: Rajender Nagar & Shyam Park Ext, Ghaziabad | Tel: +91 78386 97614</p>
      <hr>
      <h3>MEDICAL PRESCRIPTION (Rx)</h3>
      <p><strong>Patient Name:</strong> ${p.firstName} ${p.lastName} | <strong>Age:</strong> ${p.age} | <strong>Gender:</strong> ${p.gender}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <hr>
      <div style="font-size: 1.1rem; line-height: 1.8; margin: 2rem 0;">
        <div><strong>Rx Medication:</strong> ${rx.medicines}</div>
        <div><strong>Dosage Strength:</strong> ${rx.dosage}</div>
        <div><strong>Frequency:</strong> ${rx.frequency}</div>
        <div><strong>Duration:</strong> ${rx.duration}</div>
        <div><strong>Special Instructions:</strong> ${rx.instructions}</div>
      </div>
      <hr>
      <div style="margin-top: 3rem; text-align: right;">
        <p>_____________________</p>
        <p>Authorized Doctor Signature</p>
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `);
  w.document.close();
}

// File base64 picker triggers
let currentUploadCategory = 'Lab';

function triggerReportUpload(cat) {
  currentUploadCategory = cat;
  document.getElementById('reportFilePicker').click();
}

function handleReportUploadProcess(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const base64Data = evt.target.result;
    
    // Save to patient object
    const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
    const pIdx = list.findIndex(x => x.id === activeProfilePatientId);
    if (pIdx === -1) return;

    const fileItem = {
      name: file.name,
      date: new Date().toLocaleDateString(),
      category: currentUploadCategory,
      file: base64Data
    };

    if (currentUploadCategory === 'GeneralDoc') {
      list[pIdx].docs = list[pIdx].docs || [];
      list[pIdx].docs.push(fileItem);
    } else {
      list[pIdx].reports = list[pIdx].reports || [];
      list[pIdx].reports.push(fileItem);
    }

    if (typeof db !== 'undefined' && db) {
      db.ref('patients/' + activeProfilePatientId).set(list[pIdx]).then(() => {
        showToast('Document uploaded successfully to Cloud!');
        localStorage.setItem('aplus_patients', JSON.stringify(list));
        switchProfileTab(currentUploadCategory === 'GeneralDoc' ? 'docs' : 'lab');
      });
    } else {
      localStorage.setItem('aplus_patients', JSON.stringify(list));
      showToast('Document saved (Offline)');
      switchProfileTab(currentUploadCategory === 'GeneralDoc' ? 'docs' : 'lab');
    }
  };
  reader.readAsDataURL(file);
}

function previewReportImage(base64) {
  const w = window.open();
  w.document.write(`<img src="${base64}" style="max-width:100%; height:auto;" alt="Report Preview">`);
  w.document.close();
}

/* ==========================================================================
   MODULE 2: BILLING & INVOICE LOGIC
   ========================================================================== */

let procedureRowsCount = 0;
let labRowsCount = 0;
let pharmacyRowsCount = 0;

function addProcedureBillingRow(name = '', qty = 1, amount = 0) {
  const container = document.getElementById('proceduresBillingContainer');
  if (!container) return;

  const rowId = 'proc_' + Date.now() + Math.random().toString(36).substr(2, 4);
  const div = document.createElement('div');
  div.className = 'form-row';
  div.id = rowId;
  div.style.alignItems = 'center';
  div.style.marginBottom = '0.5rem';
  div.innerHTML = `
    <input type="text" class="form-input proc-name" placeholder="Procedure Name" value="${name}" required style="flex: 2;">
    <input type="number" class="form-input proc-qty" placeholder="Qty" value="${qty}" min="1" required style="width: 80px;" oninput="calculateInvoiceTotal()">
    <input type="number" class="form-input proc-amount" placeholder="Amount (₹)" value="${amount}" min="0" required style="width: 130px;" oninput="calculateInvoiceTotal()">
    <button type="button" class="btn btn-secondary" style="background: #be123c; padding: 0.50rem 0.75rem;" onclick="removeProcedureBillingRow('${rowId}')"><i class="fa-solid fa-trash-can"></i></button>
  `;
  container.appendChild(div);
  calculateInvoiceTotal();
}

function removeProcedureBillingRow(id) {
  const row = document.getElementById(id);
  if (row) row.remove();
  calculateInvoiceTotal();
}

function addLabBillingRow(name = '', qty = 1, amount = 0) {
  const container = document.getElementById('labsBillingContainer');
  if (!container) return;

  const rowId = 'lab_' + Date.now() + Math.random().toString(36).substr(2, 4);
  const div = document.createElement('div');
  div.className = 'form-row';
  div.id = rowId;
  div.style.alignItems = 'center';
  div.style.marginBottom = '0.5rem';
  div.innerHTML = `
    <input type="text" class="form-input lab-name" placeholder="Test Name" value="${name}" required style="flex: 2;">
    <input type="number" class="form-input lab-qty" placeholder="Qty" value="${qty}" min="1" required style="width: 80px;" oninput="calculateInvoiceTotal()">
    <input type="number" class="form-input lab-amount" placeholder="Price (₹)" value="${amount}" min="0" required style="width: 130px;" oninput="calculateInvoiceTotal()">
    <button type="button" class="btn btn-secondary" style="background: #be123c; padding: 0.50rem 0.75rem;" onclick="removeLabBillingRow('${rowId}')"><i class="fa-solid fa-trash-can"></i></button>
  `;
  container.appendChild(div);
  calculateInvoiceTotal();
}

function removeLabBillingRow(id) {
  const row = document.getElementById(id);
  if (row) row.remove();
  calculateInvoiceTotal();
}

function addPharmacyBillingRow(name = '', qty = 1, price = 0, disc = 0) {
  const container = document.getElementById('pharmacyBillingContainer');
  if (!container) return;

  const rowId = 'pharm_' + Date.now() + Math.random().toString(36).substr(2, 4);
  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.innerHTML = `
    <td><input type="text" class="form-input pharm-name" placeholder="Medicine" value="${name}" required></td>
    <td><input type="number" class="form-input pharm-qty" value="${qty}" min="1" oninput="calculatePharmacyRowTotal('${rowId}')" required></td>
    <td><input type="number" class="form-input pharm-price" value="${price}" min="0" oninput="calculatePharmacyRowTotal('${rowId}')" required></td>
    <td><input type="number" class="form-input pharm-disc" value="${disc}" min="0" max="100" oninput="calculatePharmacyRowTotal('${rowId}')" required></td>
    <td><input type="number" class="form-input pharm-total" value="${(qty * price * (1 - disc / 100)).toFixed(2)}" readonly></td>
    <td><button type="button" class="btn btn-secondary" style="background: #be123c; padding: 0.4rem 0.65rem;" onclick="removePharmacyBillingRow('${rowId}')"><i class="fa-solid fa-trash-can"></i></button></td>
  `;
  container.appendChild(tr);
  calculateInvoiceTotal();
}

function removePharmacyBillingRow(id) {
  const row = document.getElementById(id);
  if (row) row.remove();
  calculateInvoiceTotal();
}

function calculatePharmacyRowTotal(trId) {
  const tr = document.getElementById(trId);
  if (!tr) return;
  const qty = parseFloat(tr.querySelector('.pharm-qty').value) || 0;
  const price = parseFloat(tr.querySelector('.pharm-price').value) || 0;
  const disc = parseFloat(tr.querySelector('.pharm-disc').value) || 0;
  const total = qty * price * (1 - disc / 100);
  tr.querySelector('.pharm-total').value = total.toFixed(2);
  calculateInvoiceTotal();
}

function applyPredefinedPackage() {
  const select = document.getElementById('invoicePackageSelect').value;
  const priceInput = document.getElementById('invoicePackagePrice');
  if (select) {
    const price = parseFloat(select.split('|')[1]) || 0;
    priceInput.value = price;
  } else {
    priceInput.value = 0;
  }
  calculateInvoiceTotal();
}

// Recalculate full invoice totals
function calculateInvoiceTotal() {
  let subtotal = 0;

  // 1. Consultation Fee
  const consultFee = parseFloat(document.getElementById('invoiceConsultationFee').value) || 0;
  subtotal += consultFee;

  // 2. Procedures
  const procRows = document.querySelectorAll('#proceduresBillingContainer .form-row');
  procRows.forEach(row => {
    const qty = parseFloat(row.querySelector('.proc-qty').value) || 0;
    const amt = parseFloat(row.querySelector('.proc-amount').value) || 0;
    subtotal += qty * amt;
  });

  // 3. Lab tests
  const labRows = document.querySelectorAll('#labsBillingContainer .form-row');
  labRows.forEach(row => {
    const qty = parseFloat(row.querySelector('.lab-qty').value) || 0;
    const amt = parseFloat(row.querySelector('.lab-amount').value) || 0;
    subtotal += qty * amt;
  });

  // 4. Pharmacy
  const pharmRows = document.querySelectorAll('#pharmacyBillingContainer tr');
  pharmRows.forEach(tr => {
    const tot = parseFloat(tr.querySelector('.pharm-total').value) || 0;
    subtotal += tot;
  });

  // 5. Predefined health packages
  const packagePrice = parseFloat(document.getElementById('invoicePackagePrice').value) || 0;
  subtotal += packagePrice;

  document.getElementById('invoiceSubtotal').textContent = '₹' + subtotal.toFixed(2);

  // 6. Discounts
  const discType = document.getElementById('invoiceDiscountType').value;
  const discVal = parseFloat(document.getElementById('invoiceDiscountValue').value) || 0;
  let discAmt = 0;
  if (discType === 'percent') {
    discAmt = subtotal * (discVal / 100);
  } else {
    discAmt = discVal;
  }
  document.getElementById('invoiceDiscountAmount').textContent = '-₹' + discAmt.toFixed(2);

  // 7. GST Tax (18%)
  const taxableSum = Math.max(0, subtotal - discAmt);
  const gstAmount = taxableSum * 0.18;
  document.getElementById('invoiceGstAmount').textContent = '₹' + gstAmount.toFixed(2);

  // 8. Grand Total Net Payable
  const grandTotal = taxableSum + gstAmount;
  document.getElementById('invoiceGrandTotal').textContent = '₹' + grandTotal.toFixed(2);

  // Check insurance approved subtraction if Approved status
  const insStatus = document.getElementById('invoiceInsuranceStatus').value;
  const approvedAmt = parseFloat(document.getElementById('invoiceInsuranceApproved').value) || 0;
  
  let finalNet = grandTotal;
  if (insStatus === 'Approved') {
    finalNet = Math.max(0, grandTotal - approvedAmt);
  }

  // Update remaining split allocations
  validateSplitPayments();
}

function validateSplitPayments() {
  const subtotalStr = document.getElementById('invoiceGrandTotal').textContent.replace('₹', '');
  const grandTotal = parseFloat(subtotalStr) || 0;

  const insStatus = document.getElementById('invoiceInsuranceStatus').value;
  const approvedAmt = parseFloat(document.getElementById('invoiceInsuranceApproved').value) || 0;
  const insAdjustedTotal = insStatus === 'Approved' ? Math.max(0, grandTotal - approvedAmt) : grandTotal;

  const cash = parseFloat(document.getElementById('payCash').value) || 0;
  const upi = parseFloat(document.getElementById('payUpi').value) || 0;
  const card = parseFloat(document.getElementById('payCard').value) || 0;

  const sumAllocated = cash + upi + card;
  const diff = insAdjustedTotal - sumAllocated;

  const balEl = document.getElementById('unallocatedPaymentBalance');
  const warningEl = document.getElementById('paymentSplitWarning');

  balEl.textContent = '₹' + diff.toFixed(2);
  if (Math.abs(diff) > 0.01) {
    balEl.style.color = '#be123c';
    if (warningEl) warningEl.style.display = 'block';
  } else {
    balEl.style.color = '#166534';
    if (warningEl) warningEl.style.display = 'none';
  }
}

function generateDynamicUpiQR() {
  const upiAmt = parseFloat(document.getElementById('payUpi').value) || 0;
  const container = document.getElementById('dynamicUpiQrContainer');
  const img = document.getElementById('dynamicUpiQrImage');
  if (upiAmt > 0) {
    const upiUri = `upi://pay?pa=aplusdental@upi&pn=APlusDental&am=${upiAmt.toFixed(2)}&cu=INR`;
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`;
    container.style.display = 'flex';
  } else {
    container.style.display = 'none';
  }
}

function autoFillInvoicePatientDetails() {
  const pId = document.getElementById('invoicePatientSelect').value;
  const numInput = document.getElementById('invoiceNumber');
  if (!numInput.value) {
    numInput.value = 'INV_' + Date.now().toString().substr(-6) + Math.floor(Math.random() * 10);
  }
  calculateInvoiceTotal();
}

function resetBillingInvoiceForm() {
  document.getElementById('billingInvoiceForm').reset();
  document.getElementById('proceduresBillingContainer').innerHTML = '';
  document.getElementById('labsBillingContainer').innerHTML = '';
  document.getElementById('pharmacyBillingContainer').innerHTML = '';
  document.getElementById('invoiceNumber').value = '';
  calculateInvoiceTotal();
}

// Save Invoice
const invoiceForm = document.getElementById('billingInvoiceForm');
if (invoiceForm) {
  invoiceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveInvoiceProcess();
  });
}

function saveInvoiceProcess() {
  const pId = document.getElementById('invoicePatientSelect').value;
  if (!pId) {
    showToast('Please select a patient', true);
    return;
  }
  
  const subtotalStr = document.getElementById('invoiceGrandTotal').textContent.replace('₹', '');
  const grandTotal = parseFloat(subtotalStr) || 0;

  const insStatus = document.getElementById('invoiceInsuranceStatus').value;
  const approvedAmt = parseFloat(document.getElementById('invoiceInsuranceApproved').value) || 0;
  const insAdjustedTotal = insStatus === 'Approved' ? Math.max(0, grandTotal - approvedAmt) : grandTotal;

  const cash = parseFloat(document.getElementById('payCash').value) || 0;
  const upi = parseFloat(document.getElementById('payUpi').value) || 0;
  const card = parseFloat(document.getElementById('payCard').value) || 0;
  const sumAllocated = cash + upi + card;

  if (Math.abs(insAdjustedTotal - sumAllocated) > 0.05) {
    showToast('Sum of split payments must match payable total (₹' + insAdjustedTotal.toFixed(2) + ')', true);
    return;
  }

  const invoiceId = document.getElementById('invoiceNumber').value;
  const pList = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const patient = pList.find(x => x.id === pId);

  // Collect procedures, labs, pharmacy
  const procedures = [];
  document.querySelectorAll('#proceduresBillingContainer .form-row').forEach(row => {
    procedures.push({
      name: row.querySelector('.proc-name').value.trim(),
      qty: parseInt(row.querySelector('.proc-qty').value, 10),
      amount: parseFloat(row.querySelector('.proc-amount').value)
    });
  });

  const labs = [];
  document.querySelectorAll('#labsBillingContainer .form-row').forEach(row => {
    labs.push({
      name: row.querySelector('.lab-name').value.trim(),
      qty: parseInt(row.querySelector('.lab-qty').value, 10),
      amount: parseFloat(row.querySelector('.lab-amount').value)
    });
  });

  const pharmacy = [];
  document.querySelectorAll('#pharmacyBillingContainer tr').forEach(tr => {
    pharmacy.push({
      name: tr.querySelector('.pharm-name').value.trim(),
      qty: parseInt(tr.querySelector('.pharm-qty').value, 10),
      price: parseFloat(tr.querySelector('.pharm-price').value),
      disc: parseFloat(tr.querySelector('.pharm-disc').value),
      total: parseFloat(tr.querySelector('.pharm-total').value)
    });
  });

  const invoiceObj = {
    invoiceNo: invoiceId,
    id: invoiceId,
    patientId: pId,
    patientName: patient ? patient.name : 'Unknown Patient',
    date: new Date().toLocaleDateString('en-US'),
    doctor: document.getElementById('invoiceDoctor').value || 'Dr. Vishal Verma',
    consultFee: parseFloat(document.getElementById('invoiceConsultationFee').value) || 0,
    procedures,
    labs,
    pharmacy,
    packageName: document.getElementById('invoicePackageSelect').value.split('|')[0] || '',
    packagePrice: parseFloat(document.getElementById('invoicePackagePrice').value) || 0,
    subtotal: parseFloat(document.getElementById('invoiceSubtotal').textContent.replace('₹', '')) || 0,
    discountType: document.getElementById('invoiceDiscountType').value,
    discountValue: parseFloat(document.getElementById('invoiceDiscountValue').value) || 0,
    discountAmount: parseFloat(document.getElementById('invoiceDiscountAmount').textContent.replace('-₹', '')) || 0,
    gstAmount: parseFloat(document.getElementById('invoiceGstAmount').textContent.replace('₹', '')) || 0,
    grandTotal: grandTotal,
    insuranceCompany: document.getElementById('invoiceInsuranceCompany').value.trim(),
    insurancePolicy: document.getElementById('invoiceInsurancePolicy').value.trim(),
    insuranceStatus: insStatus,
    insuranceApproved: approvedAmt,
    cashAmount: cash,
    upiAmount: upi,
    cardAmount: card,
    paidAmount: sumAllocated,
    dueAmount: Math.max(0, grandTotal - sumAllocated - approvedAmt),
    status: grandTotal - sumAllocated - approvedAmt <= 0 ? 'Paid' : 'Unpaid'
  };

  if (typeof db !== 'undefined' && db) {
    db.ref('invoices/' + invoiceId).set(invoiceObj).then(() => {
      showToast('Invoice generated and saved successfully to Cloud!');
      resetBillingInvoiceForm();
      renderInvoicesTable();
    });
  } else {
    let list = JSON.parse(localStorage.getItem('aplus_invoices') || '[]');
    list = list.filter(i => i.invoiceNo !== invoiceId);
    list.unshift(invoiceObj);
    localStorage.setItem('aplus_invoices', JSON.stringify(list));
    showToast('Invoice saved (Offline fallback)');
    resetBillingInvoiceForm();
    renderInvoicesTable();
  }
}

// Render Invoices Table
function renderInvoicesTable() {
  const list = JSON.parse(localStorage.getItem('aplus_invoices') || '[]');
  const tbody = document.getElementById('invoicesAdminTable');
  if (!tbody) return;

  // Update Billing Dashboard widgets
  let revenue = 0;
  let pending = 0;
  let paidCount = 0;
  let insCount = 0;

  list.forEach(i => {
    revenue += (i.paidAmount || 0);
    pending += (i.dueAmount || 0);
    if (i.status === 'Paid') paidCount++;
    if (i.insuranceStatus && i.insuranceStatus !== 'No Claim') insCount++;
  });

  document.getElementById('statTodayRevenue').textContent = '₹' + revenue.toLocaleString('en-IN');
  document.getElementById('statPendingPayments').textContent = '₹' + pending.toLocaleString('en-IN');
  document.getElementById('statPaidInvoices').textContent = paidCount;
  document.getElementById('statInsuranceClaims').textContent = insCount;

  tbody.innerHTML = list.map(i => {
    return `
      <tr>
        <td><strong>${i.invoiceNo}</strong></td>
        <td>${i.patientName}</td>
        <td>${i.date}</td>
        <td>₹${i.grandTotal.toFixed(2)}</td>
        <td>₹${i.paidAmount.toFixed(2)}</td>
        <td>₹${i.dueAmount.toFixed(2)}</td>
        <td><span class="badge" style="background:${i.status === 'Paid' ? '#dcfce7' : '#fee2e2'}; color:${i.status === 'Paid' ? '#166534' : '#991b1b'};">${i.status}</span></td>
        <td>
          <button onclick="viewInvoiceDetail('${i.invoiceNo}')" class="btn btn-outline" style="padding:0.25rem 0.5rem; font-size:0.75rem;" title="View Preview"><i class="fa-solid fa-eye"></i> View</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Filter invoices
function filterInvoicesList() {
  const query = document.getElementById('invoiceSearchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#invoicesAdminTable tr');
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = text.includes(query) ? '' : 'none';
  });
}

// Printable Invoice view triggers
let activePreviewInvoiceId = null;

function viewInvoiceDetail(id) {
  activePreviewInvoiceId = id;
  const list = JSON.parse(localStorage.getItem('aplus_invoices') || '[]');
  const i = list.find(x => x.invoiceNo === id);
  if (!i) return;

  const sheet = document.getElementById('printableInvoiceSheet');
  
  // Format items lines
  let itemsLines = '';
  if (i.consultFee > 0) {
    itemsLines += `<tr><td>Consultation - ${i.doctor}</td><td>1</td><td>₹${i.consultFee.toFixed(2)}</td><td>₹${i.consultFee.toFixed(2)}</td></tr>`;
  }
  if (i.procedures) {
    i.procedures.forEach(p => {
      itemsLines += `<tr><td>Procedure: ${p.name}</td><td>${p.qty}</td><td>₹${p.amount.toFixed(2)}</td><td>₹${(p.qty * p.amount).toFixed(2)}</td></tr>`;
    });
  }
  if (i.labs) {
    i.labs.forEach(l => {
      itemsLines += `<tr><td>Lab Test: ${l.name}</td><td>${l.qty}</td><td>₹${l.amount.toFixed(2)}</td><td>₹${(l.qty * l.amount).toFixed(2)}</td></tr>`;
    });
  }
  if (i.pharmacy) {
    i.pharmacy.forEach(ph => {
      itemsLines += `<tr><td>Medicine: ${ph.name}</td><td>${ph.qty}</td><td>₹${ph.price.toFixed(2)} (-${ph.disc}%)</td><td>₹${ph.total.toFixed(2)}</td></tr>`;
    });
  }
  if (i.packageName) {
    itemsLines += `<tr><td>Package: ${i.packageName}</td><td>1</td><td>₹${i.packagePrice.toFixed(2)}</td><td>₹${i.packagePrice.toFixed(2)}</td></tr>`;
  }

  sheet.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--primary); padding-bottom: 1rem; margin-bottom: 1.5rem;">
      <div>
        <h2 style="color: var(--secondary); margin: 0;">A PLUS DENTAL CLINIC</h2>
        <span style="font-size: 0.78rem; color: var(--text-secondary);">ISO & NABH Certified Clinic | GSTIN: 09APLUS2026D1Z5</span>
      </div>
      <div style="text-align: right;">
        <h3 style="margin: 0; color: var(--primary);">INVOICE</h3>
        <span style="font-size: 0.85rem;">Invoice No: <strong>${i.invoiceNo}</strong></span><br>
        <span style="font-size: 0.85rem;">Date: ${i.date}</span>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; font-size: 0.85rem;">
      <div>
        <strong style="color: var(--secondary);">Patient Info:</strong><br>
        Name: ${i.patientName}<br>
        Patient ID: ${i.patientId}
      </div>
      <div style="text-align: right;">
        <strong style="color: var(--secondary);">Provider Details:</strong><br>
        Rajender Nagar & Shyam Park, Ghaziabad<br>
        Contact: +91 78386 97614
      </div>
    </div>

    <table border="1" cellpadding="6" style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.85rem;">
      <thead>
        <tr style="background: #f8fafc;">
          <th>Billing Particulars</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsLines}
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 0.85rem;">
      <div>
        <strong>Payment Summary:</strong><br>
        Cash: ₹${(i.cashAmount || 0).toFixed(2)}<br>
        UPI: ₹${(i.upiAmount || 0).toFixed(2)}<br>
        Card: ₹${(i.cardAmount || 0).toFixed(2)}<br>
        Insurance: ${i.insuranceStatus === 'Approved' ? `Approved (₹${i.insuranceApproved.toFixed(2)})` : 'None/Pending'}
      </div>
      <div style="text-align: right; width: 250px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>Subtotal:</span>
          <strong>₹${i.subtotal.toFixed(2)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; color:#be123c;">
          <span>Discount Amount:</span>
          <strong>-₹${(i.discountAmount || 0).toFixed(2)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>GST Tax (18%):</span>
          <strong>₹${i.gstAmount.toFixed(2)}</strong>
        </div>
        <hr style="margin: 0.5rem 0;">
        <div style="display: flex; justify-content: space-between; font-size: 1.1rem; color: var(--primary-dark);">
          <span>Grand Total:</span>
          <strong>₹${i.grandTotal.toFixed(2)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; color: #166534; margin-top: 0.25rem;">
          <span>Paid Amount:</span>
          <strong>₹${i.paidAmount.toFixed(2)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; color: #be123c; margin-top: 0.25rem;">
          <span>Outstanding Due:</span>
          <strong>₹${i.dueAmount.toFixed(2)}</strong>
        </div>
      </div>
    </div>

    <div style="margin-top: 3rem; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`upi://pay?pa=aplusdental@upi&pn=APlusDental&am=${(i.upiAmount || 0).toFixed(2)}&cu=INR`)}" style="width: 80px; height: 80px; display:${i.upiAmount > 0 ? 'block' : 'none'};">
      </div>
      <div style="text-align: right;">
        <p style="margin: 0;">_____________________</p>
        <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Authorized Signatory</p>
      </div>
    </div>
  `;

  document.getElementById('invoicePreviewModal').classList.add('active');
}

function closeInvoicePreviewModal() {
  document.getElementById('invoicePreviewModal').classList.remove('active');
  activePreviewInvoiceId = null;
}

function printInvoiceSheet() {
  const w = window.open();
  w.document.write(`
    <html>
    <head><title>Print Invoice - A Plus Dental</title></head>
    <body style="padding: 2rem;">
      ${document.getElementById('printableInvoiceSheet').innerHTML}
      <script>window.print();</script>
    </body>
    </html>
  `);
  w.document.close();
}

// Exports
function exportInvoicesCSV() {
  const list = JSON.parse(localStorage.getItem('aplus_invoices') || '[]');
  const csvHeaders = 'Invoice No,Patient Name,Date,Doctor,Grand Total,Paid,Due,Status\n';
  const csvContent = csvHeaders + list.map(i => `"${i.invoiceNo}","${i.patientName}","${i.date}","${i.doctor}","${i.grandTotal}","${i.paidAmount}","${i.dueAmount}","${i.status}"`).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Invoice_Log_Export.csv';
  a.click();
}

function printInvoicesReport() {
  const list = JSON.parse(localStorage.getItem('aplus_invoices') || '[]');
  const w = window.open();
  w.document.write(`
    <html>
    <head><title>A Plus Dental Clinic - Invoice History Log</title></head>
    <body style="font-family: Arial; padding: 2rem;">
      <h2>Invoice History & Log</h2>
      <table border="1" cellpadding="8" style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Patient Name</th>
            <th>Date</th>
            <th>Grand Total</th>
            <th>Paid Amount</th>
            <th>Due Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(i => `<tr><td>${i.invoiceNo}</td><td>${i.patientName}</td><td>${i.date}</td><td>₹${i.grandTotal}</td><td>₹${i.paidAmount}</td><td>₹${i.dueAmount}</td><td>${i.status}</td></tr>`).join('')}
        </tbody>
      </table>
      <script>window.print();</script>
    </body>
    </html>
  `);
  w.document.close();
}

// Refund Actions
function lookupRefundInvoiceDetails() {
  const lookNo = document.getElementById('refundInvoiceLookup').value.trim();
  const list = JSON.parse(localStorage.getItem('aplus_invoices') || '[]');
  const inv = list.find(x => x.invoiceNo === lookNo);
  
  const area = document.getElementById('refundInvoiceDetailsArea');
  if (inv) {
    area.innerHTML = `
      <strong>Invoice Found!</strong><br>
      Patient: ${inv.patientName} (${inv.patientId})<br>
      Grand Total Payable: ₹${inv.grandTotal.toFixed(2)} | Paid: ₹${inv.paidAmount.toFixed(2)} | Due: ₹${inv.dueAmount.toFixed(2)}<br>
      Current Status: <strong style="color:var(--primary-dark);">${inv.status}</strong>
    `;
    area.style.display = 'block';
    document.getElementById('refundAmount').max = inv.paidAmount;
    document.getElementById('refundAmount').value = inv.paidAmount;
  } else {
    area.innerHTML = '<strong style="color:#be123c;">Invoice not found. Please verify the invoice number!</strong>';
    area.style.display = 'block';
  }
}

function processRefundSubmit(e) {
  e.preventDefault();
  const lookNo = document.getElementById('refundInvoiceLookup').value.trim();
  const list = JSON.parse(localStorage.getItem('aplus_invoices') || '[]');
  const invIdx = list.findIndex(x => x.invoiceNo === lookNo);

  if (invIdx === -1) {
    showToast('Invalid Invoice Number', true);
    return;
  }

  const refAmt = parseFloat(document.getElementById('refundAmount').value) || 0;
  if (refAmt <= 0 || refAmt > list[invIdx].paidAmount) {
    showToast('Invalid refund amount', true);
    return;
  }

  // Adjust invoice totals
  list[invIdx].paidAmount = Math.max(0, list[invIdx].paidAmount - refAmt);
  list[invIdx].dueAmount = Math.max(0, list[invIdx].grandTotal - list[invIdx].paidAmount);
  list[invIdx].status = list[invIdx].dueAmount <= 0 ? 'Paid' : 'Unpaid';

  const refundLog = {
    id: 'REF_' + Date.now(),
    invoiceNo: lookNo,
    patientName: list[invIdx].patientName,
    amount: refAmt,
    reason: document.getElementById('refundReason').value.trim(),
    mode: document.getElementById('refundMode').value,
    date: new Date().toLocaleDateString('en-US')
  };

  if (typeof db !== 'undefined' && db) {
    // Save refund log and update invoice in Cloud
    Promise.all([
      db.ref('refunds/' + refundLog.id).set(refundLog),
      db.ref('invoices/' + lookNo).set(list[invIdx])
    ]).then(() => {
      showToast('Refund processed successfully and synced to Cloud!');
      document.getElementById('refundManagementForm').reset();
      document.getElementById('refundInvoiceDetailsArea').style.display = 'none';
      renderInvoicesTable();
    });
  } else {
    let refs = JSON.parse(localStorage.getItem('aplus_refunds') || '[]');
    refs.unshift(refundLog);
    localStorage.setItem('aplus_refunds', JSON.stringify(refs));
    localStorage.setItem('aplus_invoices', JSON.stringify(list));
    showToast('Refund processed (Offline fallback)');
    document.getElementById('refundManagementForm').reset();
    document.getElementById('refundInvoiceDetailsArea').style.display = 'none';
    renderInvoicesTable();
  }
}

/* ==========================================================================
   MODULE 3: ROLE-BASED ACCESS CONTROL (RBAC) LOGIC
   ========================================================================== */

// Default staff credentials seed
function seedDefaultStaffUsers() {
  const existing = localStorage.getItem('aplus_users');
  if (existing) return;

  const defaultUsers = [
    { id: 'usr_admin', fullName: 'System Admin', employeeId: 'EMP_001', username: 'admin', passwordHash: 'admin123', role: 'Admin', department: 'Administration', status: 'Active', phone: '9999999999', email: 'admin@aplus.com' },
    { id: 'usr_doc', fullName: 'Dr. Vishal Verma', employeeId: 'EMP_002', username: 'doctor', passwordHash: 'doctor123', role: 'Doctor', department: 'Clinical', status: 'Active', phone: '8888888888', email: 'doctor@aplus.com' },
    { id: 'usr_reception', fullName: 'Sunita Sharma', employeeId: 'EMP_003', username: 'reception', passwordHash: 'reception123', role: 'Receptionist', department: 'Reception', status: 'Active', phone: '7777777777', email: 'reception@aplus.com' },
    { id: 'usr_nurse', fullName: 'Nurse Emily', employeeId: 'EMP_004', username: 'nurse', passwordHash: 'nurse123', role: 'Nurse', department: 'Nursing Care', status: 'Active', phone: '6666666666', email: 'nurse@aplus.com' },
    { id: 'usr_lab', fullName: 'Technician Ravi', employeeId: 'EMP_005', username: 'labtech', passwordHash: 'lab123', role: 'Lab Technician', department: 'Laboratory', status: 'Active', phone: '5555555555', email: 'labtech@aplus.com' }
  ];

  if (typeof db !== 'undefined' && db) {
    defaultUsers.forEach(u => {
      db.ref('users/' + u.id).set(u);
    });
  } else {
    localStorage.setItem('aplus_users', JSON.stringify(defaultUsers));
  }
}

// Apply sidebar visibility rules dynamically
function applySidebarRolePermissions(role) {
  const items = document.querySelectorAll('#adminMenuContainer li');
  items.forEach(li => {
    const allowedRoles = li.getAttribute('data-role');
    if (allowedRoles) {
      const rolesArray = allowedRoles.split(',').map(r => r.trim());
      li.style.display = rolesArray.includes(role) ? 'block' : 'none';
    }
  });
}

// Session Inactivity Auto-logout (15 minutes limit)
let sessionInactivityTimer = null;
function initSessionInactivityTimer() {
  if (sessionInactivityTimer) clearTimeout(sessionInactivityTimer);
  
  // 15 minutes limit (15 * 60 * 1000 ms)
  sessionInactivityTimer = setTimeout(() => {
    showToast('Session expired due to inactivity! Logging out...', true);
    setTimeout(() => lockAdmin(), 2000);
  }, 900000);

  const resetTimer = () => {
    if (sessionStorage.getItem('aplus_admin_auth') === 'true') {
      clearTimeout(sessionInactivityTimer);
      sessionInactivityTimer = setTimeout(() => {
        showToast('Session expired due to inactivity! Logging out...', true);
        setTimeout(() => lockAdmin(), 2000);
      }, 900000);
    }
  };

  window.addEventListener('mousemove', resetTimer);
  window.addEventListener('keypress', resetTimer);
  window.addEventListener('click', resetTimer);
}

// Security Audit Log Generator
function logSystemAuditEvent(action) {
  const user = JSON.parse(sessionStorage.getItem('aplus_logged_in_user') || '{}');
  const auditItem = {
    id: 'AUD_' + Date.now(),
    timestamp: new Date().toLocaleString(),
    username: user.fullName || 'System Guest',
    role: user.role || 'Admin',
    action: action,
    ip: '127.0.0.1 (Local Session)'
  };

  if (typeof db !== 'undefined' && db) {
    db.ref('audit_logs/' + auditItem.id).set(auditItem);
  } else {
    const logs = JSON.parse(localStorage.getItem('aplus_audit_logs') || '[]');
    logs.unshift(auditItem);
    localStorage.setItem('aplus_audit_logs', JSON.stringify(logs));
    renderAuditLogsTable();
  }
}

// Render Audit Logs Table for Admin view
function renderAuditLogsTable() {
  const tbody = document.getElementById('auditLogsAdminTable');
  if (!tbody) return;

  const renderData = (logs) => {
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${l.timestamp}</td>
        <td><strong>${l.username}</strong></td>
        <td><span class="badge" style="background:#cbd5e1; color:#334155;">${l.role}</span></td>
        <td>${l.action}</td>
        <td>${l.ip}</td>
      </tr>
    `).join('');
  };

  if (typeof db !== 'undefined' && db) {
    db.ref('audit_logs').once('value').then(snapshot => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => data[key]) : [];
      list.sort((a, b) => b.id.localeCompare(a.id));
      renderData(list);
    });
  } else {
    const logs = JSON.parse(localStorage.getItem('aplus_audit_logs') || '[]');
    renderData(logs);
  }
}

function clearAuditLogs() {
  if (confirm('Clear all security audit logs?')) {
    if (typeof db !== 'undefined' && db) {
      db.ref('audit_logs').remove().then(() => {
        showToast('Audit log history cleared');
        renderAuditLogsTable();
      });
    } else {
      localStorage.setItem('aplus_audit_logs', '[]');
      showToast('Audit logs cleared');
      renderAuditLogsTable();
    }
  }
}

// Staff Account CRUD Management
const userForm = document.getElementById('userAccountForm');
if (userForm) {
  userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveUserProcess();
  });
}

function resetUserForm() {
  document.getElementById('editUserIdRaw').value = '';
  document.getElementById('userAccountForm').reset();
  document.getElementById('userFormHeading').textContent = 'Add New User Account';
  document.getElementById('saveUserBtn').innerHTML = '<i class="fa-solid fa-user-plus"></i> Save User Account';
}

function saveUserProcess() {
  const editId = document.getElementById('editUserIdRaw').value;
  const userId = editId || 'usr_' + Date.now();

  const password = document.getElementById('userPassword').value;
  const confirmPassword = document.getElementById('userConfirmPassword').value;

  if (password !== confirmPassword) {
    showToast('Passwords do not match! Verify password again.', true);
    return;
  }

  const userObj = {
    id: userId,
    fullName: document.getElementById('userFullName').value.trim(),
    employeeId: document.getElementById('userEmployeeId').value.trim(),
    phone: document.getElementById('userMobile').value.trim(),
    email: document.getElementById('userEmail').value.trim(),
    username: document.getElementById('userUsername').value.trim(),
    role: document.getElementById('userRole').value,
    passwordHash: password, // For demonstration hashes, simple comparison matches criteria
    department: document.getElementById('userDepartment').value.trim(),
    status: document.getElementById('userStatus').value
  };

  if (typeof db !== 'undefined' && db) {
    db.ref('users/' + userId).set(userObj).then(() => {
      showToast(editId ? 'User Access Updated!' : 'New User Created successfully!');
      logSystemAuditEvent(`${editId ? 'Updated' : 'Created'} user account: ${userObj.username}`);
      resetUserForm();
      renderUsersTable();
    });
  } else {
    let list = JSON.parse(localStorage.getItem('aplus_users') || '[]');
    list = list.filter(u => u.id !== userId);
    list.unshift(userObj);
    localStorage.setItem('aplus_users', JSON.stringify(list));
    showToast(editId ? 'User account updated (Offline)' : 'User created (Offline)');
    logSystemAuditEvent(`${editId ? 'Updated' : 'Created'} user account (offline): ${userObj.username}`);
    resetUserForm();
    renderUsersTable();
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('usersAdminTable');
  if (!tbody) return;

  const renderData = (list) => {
    tbody.innerHTML = list.map(u => `
      <tr>
        <td><strong>${u.employeeId}</strong></td>
        <td>${u.fullName}</td>
        <td>${u.username}</td>
        <td><span class="badge" style="background:#dbeafe; color:#1e40af;">${u.role}</span></td>
        <td>${u.department}</td>
        <td><span class="badge" style="background:${u.status === 'Active' ? '#dcfce7' : '#fee2e2'}; color:${u.status === 'Active' ? '#166534' : '#991b1b'};">${u.status}</span></td>
        <td>
          <button onclick="editUser('${u.id}')" style="background: transparent; color: var(--primary); font-size: 1.1rem; margin-right: 0.5rem; cursor: pointer;"><i class="fa-solid fa-pen-to-square"></i></button>
          <button onclick="toggleUserStatus('${u.id}')" style="background: transparent; color: #b45309; font-size: 1.1rem; margin-right: 0.5rem; cursor: pointer;" title="Toggle Activation"><i class="fa-solid fa-ban"></i></button>
          <button onclick="deleteUser('${u.id}')" style="background: transparent; color: #be123c; font-size: 1.1rem; cursor: pointer;"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `).join('');
  };

  if (typeof db !== 'undefined' && db) {
    db.ref('users').once('value').then(snapshot => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => data[key]) : [];
      localStorage.setItem('aplus_users', JSON.stringify(list));
      renderData(list);
    });
  } else {
    const list = JSON.parse(localStorage.getItem('aplus_users') || '[]');
    renderData(list);
  }
}

function editUser(id) {
  const list = JSON.parse(localStorage.getItem('aplus_users') || '[]');
  const u = list.find(x => x.id === id);
  if (!u) return;

  document.getElementById('editUserIdRaw').value = u.id;
  document.getElementById('userFullName').value = u.fullName || '';
  document.getElementById('userEmployeeId').value = u.employeeId || '';
  document.getElementById('userMobile').value = u.phone || '';
  document.getElementById('userEmail').value = u.email || '';
  document.getElementById('userUsername').value = u.username || '';
  document.getElementById('userRole').value = u.role || 'Doctor';
  document.getElementById('userPassword').value = u.passwordHash || '';
  document.getElementById('userConfirmPassword').value = u.passwordHash || '';
  document.getElementById('userDepartment').value = u.department || '';
  document.getElementById('userStatus').value = u.status || 'Active';

  document.getElementById('userFormHeading').textContent = 'Modify User Account';
  document.getElementById('saveUserBtn').innerHTML = '<i class="fa-solid fa-user-pen"></i> Update User Account';
}

function toggleUserStatus(id) {
  const list = JSON.parse(localStorage.getItem('aplus_users') || '[]');
  const uIdx = list.findIndex(x => x.id === id);
  if (uIdx === -1) return;

  list[uIdx].status = list[uIdx].status === 'Active' ? 'Inactive' : 'Active';

  if (typeof db !== 'undefined' && db) {
    db.ref('users/' + id).set(list[uIdx]).then(() => {
      showToast(`User account status toggled to ${list[uIdx].status}`);
      logSystemAuditEvent(`Toggled user status of: ${list[uIdx].username} to ${list[uIdx].status}`);
      renderUsersTable();
    });
  } else {
    localStorage.setItem('aplus_users', JSON.stringify(list));
    showToast(`User status toggled to ${list[uIdx].status} (Offline)`);
    renderUsersTable();
  }
}

function deleteUser(id) {
  if (confirm('Delete this staff account and disable dashboard entry?')) {
    if (typeof db !== 'undefined' && db) {
      db.ref('users/' + id).remove().then(() => {
        showToast('User account deleted');
        renderUsersTable();
      });
    } else {
      let list = JSON.parse(localStorage.getItem('aplus_users') || '[]');
      list = list.filter(u => u.id !== id);
      localStorage.setItem('aplus_users', JSON.stringify(list));
      showToast('User deleted (Offline)');
      renderUsersTable();
    }
  }
}

// Custom Dashboard Render for active User Role
function renderRoleSpecificDashboard(role) {
  // Hide all panels initially
  document.getElementById('adminRoleDashboard').style.display = 'none';
  document.getElementById('doctorRoleDashboard').style.display = 'none';
  document.getElementById('receptionRoleDashboard').style.display = 'none';
  document.getElementById('nurseRoleDashboard').style.display = 'none';
  document.getElementById('labRoleDashboard').style.display = 'none';

  const patientsList = JSON.parse(localStorage.getItem('aplus_patients') || '[]');

  if (role === 'Admin') {
    document.getElementById('adminRoleDashboard').style.display = 'block';
  } 
  else if (role === 'Doctor') {
    document.getElementById('doctorRoleDashboard').style.display = 'block';
    
    // Render appointments queue for doctor (filter today's date)
    const today = new Date().toLocaleDateString('en-US');
    const aptsList = getAllMergedLeads().filter(a => a.date === today);
    document.getElementById('docAppointmentsCount').textContent = aptsList.length;
    document.getElementById('docTotalPatientsCount').textContent = patientsList.length;
    
    let pendingReports = 0;
    patientsList.forEach(p => {
      if (p.reports) {
        pendingReports += p.reports.filter(r => !r.file).length; // Simulated pending placeholder check
      }
    });
    document.getElementById('docPendingReportsCount').textContent = pendingReports;

    const tbody = document.getElementById('doctorQueueTable');
    if (tbody) {
      tbody.innerHTML = aptsList.length === 0 ? `<tr><td colspan="5" style="text-align:center;">No patient cases queued for today.</td></tr>` : 
        aptsList.map(a => `
          <tr>
            <td><strong>${a.timeSlot || a.time || 'Morning'}</strong></td>
            <td>${a.name}</td>
            <td>${a.phone}</td>
            <td><span class="badge" style="background:#fef3c7; color:#b45309;">${a.treatment}</span></td>
            <td><button class="btn btn-primary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="switchAdminTab('patients')">Open Care Locker</button></td>
          </tr>
        `).join('');
    }
  } 
  else if (role === 'Receptionist') {
    document.getElementById('receptionRoleDashboard').style.display = 'block';
    
    const today = new Date().toLocaleDateString('en-US');
    const aptsToday = getAllMergedLeads().filter(a => a.date === today);
    document.getElementById('recAppointmentsCount').textContent = aptsToday.length;

    const newToday = patientsList.filter(p => p.visits && p.visits[0] && p.visits[0].visitDate === today).length;
    document.getElementById('recRegistrationsCount').textContent = newToday;

    const invoiceList = JSON.parse(localStorage.getItem('aplus_invoices') || '[]');
    let revenueToday = 0;
    invoiceList.forEach(i => {
      if (i.date === today) revenueToday += (i.paidAmount || 0);
    });
    document.getElementById('recTodayRevenue').textContent = '₹' + revenueToday.toLocaleString('en-IN');

    lookupReceptionDirectory();
  } 
  else if (role === 'Nurse') {
    document.getElementById('nurseRoleDashboard').style.display = 'block';
    document.getElementById('nurseTotalPatients').textContent = patientsList.length;

    // Load patients select inside nurse vitals recorder
    const select = document.getElementById('vitalsPatientSelect');
    if (select) {
      select.innerHTML = '<option value="">-- Choose Patient --</option>' +
        patientsList.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');
    }

    // Vitals captured today logic
    let vitalsCount = 0;
    const today = new Date().toLocaleDateString('en-US');
    patientsList.forEach(p => {
      if (p.vitalsHistory) {
        vitalsCount += p.vitalsHistory.filter(vh => vh.date === today).length;
      }
    });
    document.getElementById('nurseVitalsCapturedCount').textContent = vitalsCount;
  } 
  else if (role === 'Lab Technician') {
    document.getElementById('labRoleDashboard').style.display = 'block';
    
    // Load patients dropdown inside lab uploader
    const select = document.getElementById('labPatientSelect');
    if (select) {
      select.innerHTML = '<option value="">-- Choose Patient --</option>' +
        patientsList.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');
    }

    // Pending test simulator and completed tests today stats
    const today = new Date().toLocaleDateString('en-US');
    let completedCount = 0;
    patientsList.forEach(p => {
      if (p.reports) {
        completedCount += p.reports.filter(r => r.date === today).length;
      }
    });
    document.getElementById('labCompletedReportsCount').textContent = completedCount;
    document.getElementById('labPendingTestsCount').textContent = Math.max(0, 4 - completedCount); // Default seed gap
  }
}

// Reception lookup table
function lookupReceptionDirectory() {
  const query = document.getElementById('recSearchInput').value.toLowerCase();
  const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const tbody = document.getElementById('receptionDirectoryTable');
  if (!tbody) return;

  const filtered = list.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.phone.includes(query) || 
    p.id.toLowerCase().includes(query)
  );

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td><strong>${p.id}</strong></td>
      <td>${p.name}</td>
      <td>${p.phone}</td>
      <td>${p.city}</td>
      <td>${p.lastVisit || 'N/A'}</td>
      <td><button class="btn btn-outline" style="padding:0.25rem 0.5rem; font-size:0.72rem;" onclick="switchAdminTab('patients')">Select Case</button></td>
    </tr>
  `).join('');
}

// Nurse Vitals Capture Action
function savePatientVitalsProcess(e) {
  e.preventDefault();
  const pId = document.getElementById('vitalsPatientSelect').value;
  if (!pId) return;

  const vitalsRecord = {
    date: new Date().toLocaleDateString('en-US'),
    bp: document.getElementById('vitalsBp').value.trim(),
    pulse: document.getElementById('vitalsPulse').value,
    temp: document.getElementById('vitalsTemp').value,
    spo2: document.getElementById('vitalsSpo2').value,
    notes: document.getElementById('vitalsNotes').value.trim(),
    capturedBy: JSON.parse(sessionStorage.getItem('aplus_logged_in_user') || '{}').fullName || 'Nurse Emily'
  };

  const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
  const pIdx = list.findIndex(x => x.id === pId);
  if (pIdx === -1) return;

  list[pIdx].vitalsHistory = list[pIdx].vitalsHistory || [];
  list[pIdx].vitalsHistory.unshift(vitalsRecord);

  // Auto append notes to visits timeline
  list[pIdx].visits = list[pIdx].visits || [];
  list[pIdx].visits.unshift({
    visitDate: new Date().toLocaleDateString(),
    doctor: 'Triage / Nurse',
    department: 'Vitals Diagnostics',
    diagnosis: `BP: ${vitalsRecord.bp} | Pulse: ${vitalsRecord.pulse} | Temp: ${vitalsRecord.temp} | SpO2: ${vitalsRecord.spo2}%`,
    status: 'Captured'
  });

  if (typeof db !== 'undefined' && db) {
    db.ref('patients/' + pId).set(list[pIdx]).then(() => {
      showToast('Patient vital signs saved and synced successfully!');
      logSystemAuditEvent(`Captured vitals for patient: ${list[pIdx].name}`);
      document.getElementById('nurseVitalsForm').reset();
      renderStats();
    });
  } else {
    localStorage.setItem('aplus_patients', JSON.stringify(list));
    showToast('Vitals saved (Offline fallback)');
    document.getElementById('nurseVitalsForm').reset();
    renderStats();
  }
}

// Lab Tech Diagnostics Upload process
function saveLabReportProcess(e) {
  e.preventDefault();
  const pId = document.getElementById('labPatientSelect').value;
  const fileInput = document.getElementById('labFileSelector');
  if (!pId || !fileInput.files || !fileInput.files[0]) return;

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(evt) {
    const base64Data = evt.target.result;
    
    const fileItem = {
      name: document.getElementById('labTestName').value.trim() || file.name,
      date: new Date().toLocaleDateString(),
      category: document.getElementById('labReportType').value,
      file: base64Data
    };

    const list = JSON.parse(localStorage.getItem('aplus_patients') || '[]');
    const pIdx = list.findIndex(x => x.id === pId);
    if (pIdx === -1) return;

    list[pIdx].reports = list[pIdx].reports || [];
    list[pIdx].reports.push(fileItem);

    if (typeof db !== 'undefined' && db) {
      db.ref('patients/' + pId).set(list[pIdx]).then(() => {
        showToast('Laboratory diagnostic scan uploaded successfully!');
        logSystemAuditEvent(`Uploaded lab report for patient: ${list[pIdx].name}`);
        document.getElementById('labReportForm').reset();
        renderStats();
      });
    } else {
      localStorage.setItem('aplus_patients', JSON.stringify(list));
      showToast('Lab report saved (Offline)');
      document.getElementById('labReportForm').reset();
      renderStats();
    }
  };
  reader.readAsDataURL(file);
}

// Hook renderRoleSpecificDashboard into renderStats
const originalRenderStats = renderStats;
renderStats = function() {
  if (typeof originalRenderStats === 'function') {
    originalRenderStats();
  }
  
  const activeUser = JSON.parse(sessionStorage.getItem('aplus_logged_in_user') || '{}');
  const role = activeUser.role || 'Admin';
  renderRoleSpecificDashboard(role);
  
  // Re-sync Users List and Audit log list table if admin view
  if (role === 'Admin') {
    renderUsersTable();
    renderAuditLogsTable();
  }
};
