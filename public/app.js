/**
 * Property Management System - Core Application Logic
 * Recreated with 100% Fidelity to SRS Report Figures 5.1 - 5.7
 */

// ==========================================
// SEED DATA & FALLBACK DATABASE
// ==========================================
const DEFAULT_PROPERTIES = [
    {
        property_id: 'PROP-001',
        title: '2 BHK Apartment',
        owner_name: 'Rahul Sharma',
        contact_no: '9829012345',
        location: 'Jaipur',
        price: '4500000',
        property_type: 'Residential',
        status: 'Available'
    },
    {
        property_id: 'PROP-002',
        title: 'Commercial Shop',
        owner_name: 'Amit Verma',
        contact_no: '9829054321',
        location: 'Vaishali Nagar',
        price: '8500000',
        property_type: 'Commercial',
        status: 'Sold'
    },
    {
        property_id: 'PROP-003',
        title: 'Residential Plot',
        owner_name: 'Suresh Meena',
        contact_no: '9414011223',
        location: 'Ajmer Road',
        price: '3200000',
        property_type: 'Residential',
        status: 'Available'
    },
    {
        property_id: 'PROP-004',
        title: 'Office Space',
        owner_name: 'Pooja Agarwal',
        contact_no: '9828198765',
        location: 'Mansarovar',
        price: '6000000',
        property_type: 'Commercial',
        status: 'Available'
    }
];

const DEFAULT_USERS = [
    { email: 'admin@poornima.org', password: 'admin123', name: 'Administrator' },
    { email: 'admin@gmail.com', password: 'admin', name: 'System Admin' },
    { email: 'pradeep@poornima.org', password: 'pradeep123', name: 'Pradeep Singh Khangarot' }
];

// ==========================================
// APPLICATION STATE
// ==========================================
const state = {
    currentUser: null,
    currentScreen: 'login',
    selectedPropertyId: 'PROP-001', // Default first row selected as in Fig 5.3
    properties: [],
    apiAvailable: false,
    apiBaseUrl: ''
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user session was saved
    const savedUser = sessionStorage.getItem('pms_user');
    if (savedUser) {
        try {
            state.currentUser = JSON.parse(savedUser);
        } catch (e) {
            state.currentUser = null;
        }
    }

    // Initialize local storage backup
    initLocalStorageBackup();

    // Check backend API connectivity
    await checkApiConnection();

    // Load properties
    await loadProperties();

    // Default screen: check URL hash first, else session
    const urlHash = window.location.hash.replace('#', '').trim();
    const validScreens = ['login', 'dashboard', 'view-properties', 'add-property', 'complete-details', 'edit-property', 'change-password'];
    
    if (urlHash && validScreens.includes(urlHash)) {
        if (!state.currentUser && urlHash !== 'login' && urlHash !== 'change-password') {
            state.currentUser = DEFAULT_USERS[0]; // Auto-authenticate for direct screen preview
        }
        switchWindow(urlHash);
    } else if (state.currentUser) {
        switchWindow('dashboard');
    } else {
        switchWindow('login');
    }

    // Listen to hash changes for direct linking
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash && validScreens.includes(hash)) {
            switchWindow(hash);
        }
    });

    // Attach click handlers to window title bar buttons for native feel
    setupWindowTitlebars();
});

// Setup fallback data in localStorage
function initLocalStorageBackup() {
    if (!localStorage.getItem('pms_properties')) {
        localStorage.setItem('pms_properties', JSON.stringify(DEFAULT_PROPERTIES));
    }
    if (!localStorage.getItem('pms_users')) {
        localStorage.setItem('pms_users', JSON.stringify(DEFAULT_USERS));
    }
}

// Check if Express backend API is alive
async function checkApiConnection() {
    const badge = document.getElementById('dbStatusBadge');
    try {
        const res = await fetch('/api/properties', { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
            state.apiAvailable = true;
            if (badge) {
                badge.textContent = '● SQLite DB Connected';
                badge.style.background = '#064e3b';
                badge.style.color = '#6ee7b7';
            }
            return;
        }
    } catch (e) {
        // Backend API not reachable (running standalone or file://)
    }

    state.apiAvailable = false;
    if (badge) {
        badge.textContent = '● Local Storage DB (Active)';
        badge.style.background = '#1e3a8a';
        badge.style.color = '#93c5fd';
    }
}

// ==========================================
// WINDOW NAVIGATION & SWITCHING
// ==========================================
function switchWindow(screenName) {
    state.currentScreen = screenName;

    // Hide all windows
    document.querySelectorAll('.desktop-window').forEach(win => {
        win.classList.remove('active');
    });

    // Show target window
    const targetWin = document.getElementById(`win-${screenName}`);
    if (targetWin) {
        targetWin.classList.add('active');
    }

    // Update reviewer pill buttons
    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.remove('active');
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${screenName}'`)) {
            btn.classList.add('active');
        }
    });

    // Specific screen setups
    if (screenName === 'view-properties') {
        renderPropertiesTable();
    } else if (screenName === 'add-property') {
        setupAddPropertyForm();
    } else if (screenName === 'complete-details') {
        // If viewing complete details, ensure fields are populated with selected property
        const prop = getPropertyById(state.selectedPropertyId) || state.properties[0];
        if (prop) {
            document.getElementById('viewPropId').value = prop.property_id;
            document.getElementById('viewPropTitle').value = prop.title;
            document.getElementById('viewOwnerName').value = prop.owner_name || '';
            document.getElementById('viewContactNo').value = prop.contact_no || '';
            document.getElementById('viewLocation').value = prop.location || '';
            document.getElementById('viewPrice').value = formatPriceDisplay(prop.price);
            document.getElementById('viewPropertyType').value = prop.property_type || 'Residential';
            document.getElementById('viewStatus').value = prop.status || 'Available';
        }
    } else if (screenName === 'edit-property') {
        // If editing property, ensure fields are populated with selected property
        const prop = getPropertyById(state.selectedPropertyId) || state.properties[0];
        if (prop) {
            document.getElementById('editPropId').value = prop.property_id;
            document.getElementById('editPropTitle').value = prop.title;
            document.getElementById('editOwnerName').value = prop.owner_name || '';
            document.getElementById('editContactNo').value = prop.contact_no || '';
            document.getElementById('editLocation').value = prop.location || '';
            document.getElementById('editPrice').value = prop.price || '';
            document.getElementById('editPropertyType').value = prop.property_type || 'Residential';
            document.getElementById('editStatus').value = prop.status || 'Available';
        }
    } else if (screenName === 'change-password') {
        const emailInput = document.getElementById('cpEmail');
        if (emailInput) {
            emailInput.value = state.currentUser ? state.currentUser.email : 'admin@poornima.org';
        }
    }
}

function setupWindowTitlebars() {
    // Window control buttons
    document.querySelectorAll('.win-min').forEach(btn => {
        btn.addEventListener('click', () => {
            showDialog('Minimize', 'Window minimize is simulated in web mode.');
        });
    });

    document.querySelectorAll('.win-max').forEach(btn => {
        btn.addEventListener('click', () => {
            const win = btn.closest('.desktop-window');
            if (win) {
                if (win.style.maxWidth === '98%') {
                    win.style.maxWidth = '';
                } else {
                    win.style.maxWidth = '98%';
                }
            }
        });
    });
}

function toggleReviewerBar() {
    const bar = document.getElementById('reviewerBar');
    if (bar) {
        bar.classList.toggle('hidden');
    }
}

// ==========================================
// DATA ACCESS LAYER (API + LocalStorage Fallback)
// ==========================================
async function loadProperties() {
    if (state.apiAvailable) {
        try {
            const res = await fetch('/api/properties');
            const data = await res.json();
            if (data.success && Array.isArray(data.properties)) {
                state.properties = data.properties;
                return;
            }
        } catch (e) {
            console.warn('API error, falling back to local storage:', e);
        }
    }

    // Fallback to local storage
    const stored = localStorage.getItem('pms_properties');
    if (stored) {
        state.properties = JSON.parse(stored);
    } else {
        state.properties = [...DEFAULT_PROPERTIES];
    }
}

function getPropertyById(id) {
    return state.properties.find(p => p.property_id === id);
}

// ==========================================
// SCREEN 1: LOGIN (Figure 5.1)
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        showDialog('Validation', 'Please enter both Email and Password.', 'error');
        return;
    }

    if (state.apiAvailable) {
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                state.currentUser = data.user;
                sessionStorage.setItem('pms_user', JSON.stringify(data.user));
                switchWindow('dashboard');
                return;
            } else {
                showDialog('Login Failed', data.message || 'Invalid email or password.', 'error');
                return;
            }
        } catch (err) {
            console.warn('Backend login call failed, trying local verification:', err);
        }
    }

    // Local fallback check
    const users = JSON.parse(localStorage.getItem('pms_users') || JSON.stringify(DEFAULT_USERS));
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user && user.password === password) {
        state.currentUser = { email: user.email, name: user.name || 'Admin User' };
        sessionStorage.setItem('pms_user', JSON.stringify(state.currentUser));
        switchWindow('dashboard');
    } else {
        showDialog('Login Failed', 'Invalid email or password. Please try again.', 'error');
    }
}

function openForgotPassword() {
    const loginEmail = document.getElementById('loginEmail').value.trim();
    switchWindow('change-password');
    if (loginEmail) {
        const cpEmail = document.getElementById('cpEmail');
        if (cpEmail) cpEmail.value = loginEmail;
    }
}

// ==========================================
// SCREEN 2: DASHBOARD (Figure 5.2)
// ==========================================
function openAddProperty() {
    switchWindow('add-property');
}

function openViewProperties() {
    switchWindow('view-properties');
}

function openChangePassword() {
    switchWindow('change-password');
}

function handleLogout() {
    state.currentUser = null;
    sessionStorage.removeItem('pms_user');
    switchWindow('login');
}

function backToDashboard() {
    switchWindow('dashboard');
}

// ==========================================
// SCREEN 3: VIEW PROPERTIES (Figure 5.3)
// ==========================================
function renderPropertiesTable() {
    const tbody = document.getElementById('propertiesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!state.properties || state.properties.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; color: #64748b;">No property records found.</td></tr>`;
        return;
    }

    // Default select first property if current selected is invalid
    if (!state.properties.some(p => p.property_id === state.selectedPropertyId)) {
        state.selectedPropertyId = state.properties[0].property_id;
    }

    state.properties.forEach(prop => {
        const tr = document.createElement('tr');
        if (prop.property_id === state.selectedPropertyId) {
            tr.classList.add('selected-row');
        }

        tr.innerHTML = `
            <td>${escapeHtml(prop.property_id)}</td>
            <td>${escapeHtml(prop.title)}</td>
            <td>${escapeHtml(prop.location)}</td>
            <td>${escapeHtml(prop.status)}</td>
        `;

        // Row selection click handler
        tr.addEventListener('click', () => {
            state.selectedPropertyId = prop.property_id;
            document.querySelectorAll('#propertiesTableBody tr').forEach(r => r.classList.remove('selected-row'));
            tr.classList.add('selected-row');
        });

        // Double click to view details directly
        tr.addEventListener('dblclick', () => {
            state.selectedPropertyId = prop.property_id;
            handleViewCompleteDetails();
        });

        tbody.appendChild(tr);
    });
}

function handleViewCompleteDetails() {
    if (!state.selectedPropertyId) {
        showDialog('Selection', 'Please select a property from the table first.', 'error');
        return;
    }

    const prop = getPropertyById(state.selectedPropertyId);
    if (!prop) {
        showDialog('Not Found', 'Selected property could not be found.', 'error');
        return;
    }

    // Populate Complete Details (Figure 5.5)
    document.getElementById('viewPropId').value = prop.property_id;
    document.getElementById('viewPropTitle').value = prop.title;
    document.getElementById('viewOwnerName').value = prop.owner_name || '';
    document.getElementById('viewContactNo').value = prop.contact_no || '';
    document.getElementById('viewLocation').value = prop.location || '';
    document.getElementById('viewPrice').value = formatPriceDisplay(prop.price);
    document.getElementById('viewPropertyType').value = prop.property_type || 'Residential';
    document.getElementById('viewStatus').value = prop.status || 'Available';

    switchWindow('complete-details');
}

function handleEditDetails() {
    if (!state.selectedPropertyId) {
        showDialog('Selection', 'Please select a property from the table first.', 'error');
        return;
    }

    const prop = getPropertyById(state.selectedPropertyId);
    if (!prop) {
        showDialog('Not Found', 'Selected property could not be found.', 'error');
        return;
    }

    // Populate Edit Details (Figure 5.6)
    document.getElementById('editPropId').value = prop.property_id;
    document.getElementById('editPropTitle').value = prop.title;
    document.getElementById('editOwnerName').value = prop.owner_name || '';
    document.getElementById('editContactNo').value = prop.contact_no || '';
    document.getElementById('editLocation').value = prop.location || '';
    document.getElementById('editPrice').value = prop.price || '';
    document.getElementById('editPropertyType').value = prop.property_type || 'Residential';
    document.getElementById('editStatus').value = prop.status || 'Available';

    switchWindow('edit-property');
}

// ==========================================
// SCREEN 4: ADD PROPERTY (Figure 5.4)
// ==========================================
function setupAddPropertyForm() {
    const form = document.getElementById('addPropertyForm');
    if (!form) return;

    // Compute next suggested Property ID
    let nextNum = 1;
    state.properties.forEach(p => {
        const match = p.property_id.match(/PROP-(\d+)/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num >= nextNum) nextNum = num + 1;
        }
    });
    const nextId = `PROP-${String(nextNum).padStart(3, '0')}`;
    const idInput = document.getElementById('addPropId');
    if (idInput && !idInput.value) {
        idInput.value = nextId;
    }
}

async function handleAddProperty(e) {
    e.preventDefault();

    const property_id = document.getElementById('addPropId').value.trim();
    const title = document.getElementById('addPropTitle').value.trim();
    const owner_name = document.getElementById('addOwnerName').value.trim();
    const contact_no = document.getElementById('addContactNo').value.trim();
    const location = document.getElementById('addLocation').value.trim();
    const price = document.getElementById('addPrice').value.trim();

    const propertyTypeRadio = document.querySelector('input[name="addPropertyType"]:checked');
    const property_type = propertyTypeRadio ? propertyTypeRadio.value : 'Residential';

    const statusRadio = document.querySelector('input[name="addStatus"]:checked');
    const status = statusRadio ? statusRadio.value : 'Available';

    if (!property_id || !title || !owner_name || !contact_no || !location || !price) {
        showDialog('Required Fields', 'Please fill in all property information fields.', 'error');
        return;
    }

    // Check duplicate ID
    if (state.properties.some(p => p.property_id.toLowerCase() === property_id.toLowerCase())) {
        showDialog('Duplicate ID', `Property ID "${property_id}" already exists. Please use a unique ID.`, 'error');
        return;
    }

    const newProperty = {
        property_id,
        title,
        owner_name,
        contact_no,
        location,
        price,
        property_type,
        status
    };

    if (state.apiAvailable) {
        try {
            const res = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProperty)
            });
            const data = await res.json();
            if (data.success) {
                await loadProperties();
                state.selectedPropertyId = property_id;
                showDialog('Success', 'Property added successfully!', 'info');
                document.getElementById('addPropertyForm').reset();
                switchWindow('view-properties');
                return;
            } else {
                showDialog('Error', data.message || 'Failed to add property.', 'error');
                return;
            }
        } catch (err) {
            console.warn('Backend call failed, saving locally:', err);
        }
    }

    // Local save
    state.properties.push(newProperty);
    localStorage.setItem('pms_properties', JSON.stringify(state.properties));
    state.selectedPropertyId = property_id;

    showDialog('Success', 'Property added successfully!', 'info');
    document.getElementById('addPropertyForm').reset();
    switchWindow('view-properties');
}

// ==========================================
// SCREEN 5: COMPLETE DETAILS (Figure 5.5)
// ==========================================
function closeDetailsWindow() {
    switchWindow('view-properties');
}

// ==========================================
// SCREEN 6: EDIT DETAILS (Figure 5.6)
// ==========================================
function closeEditWindow() {
    switchWindow('view-properties');
}

async function handleUpdateProperty(e) {
    e.preventDefault();

    const property_id = document.getElementById('editPropId').value.trim();
    const title = document.getElementById('editPropTitle').value.trim();
    const owner_name = document.getElementById('editOwnerName').value.trim();
    const contact_no = document.getElementById('editContactNo').value.trim();
    const location = document.getElementById('editLocation').value.trim();
    const price = document.getElementById('editPrice').value.trim();
    const property_type = document.getElementById('editPropertyType').value.trim();
    const status = document.getElementById('editStatus').value.trim();

    if (!property_id || !title || !owner_name || !contact_no || !location || !price || !property_type || !status) {
        showDialog('Required Fields', 'Please fill in all fields before updating.', 'error');
        return;
    }

    const updatedData = {
        title,
        owner_name,
        contact_no,
        location,
        price,
        property_type,
        status
    };

    if (state.apiAvailable) {
        try {
            const res = await fetch(`/api/properties/${encodeURIComponent(property_id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const data = await res.json();
            if (data.success) {
                await loadProperties();
                showDialog('Success', 'Property details updated successfully!', 'info');
                switchWindow('view-properties');
                return;
            } else {
                showDialog('Error', data.message || 'Failed to update property.', 'error');
                return;
            }
        } catch (err) {
            console.warn('Backend call failed, updating locally:', err);
        }
    }

    // Local update
    const idx = state.properties.findIndex(p => p.property_id === property_id);
    if (idx !== -1) {
        state.properties[idx] = { ...state.properties[idx], ...updatedData };
        localStorage.setItem('pms_properties', JSON.stringify(state.properties));
        showDialog('Success', 'Property details updated successfully!', 'info');
        switchWindow('view-properties');
    } else {
        showDialog('Error', 'Property not found to update.', 'error');
    }
}

// ==========================================
// SCREEN 7: CHANGE PASSWORD (Figure 5.7)
// ==========================================
function closeChangePassword() {
    if (state.currentUser) {
        switchWindow('dashboard');
    } else {
        switchWindow('login');
    }
}

async function handleChangePassword(e) {
    e.preventDefault();

    const email = document.getElementById('cpEmail').value.trim();
    const currentPassword = document.getElementById('cpCurrentPass').value;
    const newPassword = document.getElementById('cpNewPass').value;
    const confirmNewPassword = document.getElementById('cpConfirmPass').value;

    if (!email || !currentPassword || !newPassword || !confirmNewPassword) {
        showDialog('Validation', 'All fields are required.', 'error');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showDialog('Validation', 'New Password and Confirm New Password do not match.', 'error');
        return;
    }

    if (newPassword.length < 3) {
        showDialog('Validation', 'Password must be at least 3 characters long.', 'error');
        return;
    }

    if (state.apiAvailable) {
        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, currentPassword, newPassword, confirmNewPassword })
            });
            const data = await res.json();
            if (data.success) {
                showDialog('Success', 'Password updated successfully!', 'info');
                document.getElementById('changePasswordForm').reset();
                if (state.currentUser) {
                    switchWindow('dashboard');
                } else {
                    switchWindow('login');
                }
                return;
            } else {
                showDialog('Error', data.message || 'Failed to update password.', 'error');
                return;
            }
        } catch (err) {
            console.warn('API error, attempting local password change:', err);
        }
    }

    // Local password update
    const users = JSON.parse(localStorage.getItem('pms_users') || JSON.stringify(DEFAULT_USERS));
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        showDialog('Error', 'No user found with the specified Email ID.', 'error');
        return;
    }

    if (user.password !== currentPassword) {
        showDialog('Error', 'Current Password is incorrect.', 'error');
        return;
    }

    user.password = newPassword;
    localStorage.setItem('pms_users', JSON.stringify(users));

    showDialog('Success', 'Password updated successfully!', 'info');
    document.getElementById('changePasswordForm').reset();
    if (state.currentUser) {
        switchWindow('dashboard');
    } else {
        switchWindow('login');
    }
}

// ==========================================
// RESET DEMO DATA HELPER
// ==========================================
async function resetDbData() {
    if (confirm('Reset database back to the exact initial sample records from Figure 5.3?')) {
        if (state.apiAvailable) {
            try {
                await fetch('/api/reset-data', { method: 'POST' });
            } catch (e) {
                console.warn(e);
            }
        }
        localStorage.setItem('pms_properties', JSON.stringify(DEFAULT_PROPERTIES));
        localStorage.setItem('pms_users', JSON.stringify(DEFAULT_USERS));
        await loadProperties();
        renderPropertiesTable();
        showDialog('Reset Complete', 'Database has been restored to default report seed data.');
    }
}

// ==========================================
// UTILITY FUNCTIONS & DIALOGS
// ==========================================
function showDialog(title, message, type = 'info') {
    const backdrop = document.getElementById('customDialogBackdrop');
    const titleEl = document.getElementById('dialogTitle');
    const msgEl = document.getElementById('dialogMessage');
    const iconCol = document.getElementById('dialogIconCol');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (iconCol) {
        if (type === 'error') {
            iconCol.innerHTML = '<span class="dialog-icon error-icon">✕</span>';
        } else {
            iconCol.innerHTML = '<span class="dialog-icon info-icon">ℹ</span>';
        }
    }

    if (backdrop) backdrop.classList.add('active');
}

function closeDialog() {
    const backdrop = document.getElementById('customDialogBackdrop');
    if (backdrop) backdrop.classList.remove('active');
}

function formatPriceDisplay(price) {
    if (!price) return '0';
    const num = parseFloat(String(price).replace(/,/g, ''));
    if (isNaN(num)) return price;
    return num.toLocaleString('en-IN');
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
