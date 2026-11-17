# Property Management System (PMS)

A 100% pixel-perfect, fully functioning web implementation of the **Property Management System** recreated strictly from the Software Requirement Specification (SRS) report document of **Poornima Institute of Engineering & Technology, Jaipur** (Mini Project Lab).

---

## 📸 Recreated Screens (Figures 5.1 – 5.7)

All 7 interface screens from Chapter 5 of the report have been reproduced with 100% exact UI/UX fidelity, layout, typography, colors, and behavior:

| Figure | Screen Name | Description & Route |
| :--- | :--- | :--- |
| **Figure 5.1** | **Login Page** | User login with Poornima banner, Email & Password validation, "Forgot Password?" link, and styled LOGIN button (`/#login`) |
| **Figure 5.2** | **Dashboard Page** | Main application dashboard with Poornima banner, navigation sidebar (Add Property, View Properties, Change Password, Logout), and the "About Property Management System" card (`/#dashboard`) |
| **Figure 5.3** | **View Properties Page** | Registered Properties data table with 4 columns (`Property ID`, `Property Title`, `Location`, `Status`), row selection highlighting, and "View Complete Details" & "Edit Details" actions (`/#view-properties`) |
| **Figure 5.4** | **Add Property Page** | Two-column form with 8 fields (`Property ID`, `Property Title`, `Owner Name`, `Contact No`, `Location`, `Price in ₹`, `Property Type` radio buttons: Residential/Commercial, `Status` radio buttons: Available/Sold) and ADD action button (`/#add-property`) |
| **Figure 5.5** | **Complete Property Details** | Read-only details screen displaying all 8 properties for a selected listing with a CLOSE button returning to View Properties (`/#complete-details`) |
| **Figure 5.6** | **Edit Property Details** | Edit screen allowing updates to Title, Owner, Contact, Location, Price, Type, and Status with an UPDATE button (`/#edit-property`) |
| **Figure 5.7** | **Change Password Page** | Password management form requiring Email ID, Current Password, New Password, and Confirm New Password with validation and UPDATE button (`/#change-password`) |

---

## 🚀 How to Run the Project

### Option 1: Run with Node.js (Recommended)
1. Open PowerShell or Terminal in `e:\Property management system`:
   ```bash
   npm start
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

### Option 2: Run with Python (Zero Dependencies)
If you prefer running via Python 3:
```bash
python server.py
```
Then open `http://localhost:5000` in your browser.

### Option 3: Standalone Offline Mode
You can also directly double-click or open `public/index.html` in any web browser (Chrome, Edge, Firefox). The system has a built-in localStorage database fallback that supports 100% of the features offline without needing any server running!

---

## 🔑 Default Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@poornima.org` | `admin123` |
| **System Admin** | `admin@gmail.com` | `admin` |
| **Student / Author** | `pradeep@poornima.org` | `pradeep123` |

---

## 📦 Seeded Property Records (Exact from Figure 5.3)

| Property ID | Property Title | Location | Status | Owner Name | Contact No | Price (₹) | Type |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PROP-001** | 2 BHK Apartment | Jaipur | Available | Rahul Sharma | 9829012345 | 45,00,000 | Residential |
| **PROP-002** | Commercial Shop | Vaishali Nagar | Sold | Amit Verma | 9829054321 | 85,00,000 | Commercial |
| **PROP-003** | Residential Plot | Ajmer Road | Available | Suresh Meena | 9414011223 | 32,00,000 | Residential |
| **PROP-004** | Office Space | Mansarovar | Available | Pooja Agarwal | 9828198765 | 60,00,000 | Commercial |

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Single Page Application architecture with modal dialogs and seamless routing).
- **Backend**:
  - Node.js Express server (`server.js`) with REST API.
  - Standalone Python server (`server.py`) with standard library HTTP server.
- **Database**:
  - SQLite (`property_management.db`) via `better-sqlite3` and Python `sqlite3`.
  - Schema directly implemented from Table 3.1 of the SRS document.
  - Client-side LocalStorage automatic fallback for offline evaluation.

---

## 📡 REST API Endpoints

- `POST /api/login` - Authenticate user against users table.
- `POST /api/change-password` - Validate current password and update to new password.
- `GET /api/properties` - List all registered properties.
- `GET /api/properties/:id` - Fetch single property details.
- `POST /api/properties` - Add new property record.
- `PUT /api/properties/:id` - Update existing property record.
- `DELETE /api/properties/:id` - Delete property record.
- `POST /api/reset-data` - Restore database back to original Figure 5.3 state.
