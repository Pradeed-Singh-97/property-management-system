const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, resetDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// AUTHENTICATION APIs
// ==========================================

// Login
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = db.prepare('SELECT id, email, password, name FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        return res.json({
            success: true,
            message: 'Login successful',
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Change Password
app.post('/api/change-password', (req, res) => {
    try {
        const { email, currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
        }

        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }

        if (user.password !== currentPassword) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, user.id);

        return res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Reset Password (Forgot Password flow)
app.post('/api/reset-password', (req, res) => {
    try {
        const { email, newPassword, confirmNewPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email and new password are required' });
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email' });
        }

        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, user.id);
        return res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ==========================================
// PROPERTIES APIs
// ==========================================

// Get all properties
app.get('/api/properties', (req, res) => {
    try {
        const properties = db.prepare('SELECT * FROM properties ORDER BY property_id ASC').all();
        return res.json({ success: true, properties });
    } catch (err) {
        console.error('Get properties error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get single property details
app.get('/api/properties/:id', (req, res) => {
    try {
        const prop = db.prepare('SELECT * FROM properties WHERE property_id = ?').get(req.params.id);
        if (!prop) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }
        return res.json({ success: true, property: prop });
    } catch (err) {
        console.error('Get property by id error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Add new property
app.post('/api/properties', (req, res) => {
    try {
        const {
            property_id,
            title,
            owner_name,
            contact_no,
            location,
            price,
            property_type,
            status
        } = req.body;

        if (!property_id || !title || !owner_name || !contact_no || !location || price === undefined || price === null || !property_type || !status) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if property_id already exists
        const existing = db.prepare('SELECT property_id FROM properties WHERE property_id = ?').get(property_id.trim());
        if (existing) {
            return res.status(400).json({ success: false, message: `Property ID "${property_id}" already exists` });
        }

        const parsedPrice = parseFloat(String(price).replace(/,/g, '')) || 0;

        db.prepare(`
            INSERT INTO properties (property_id, title, owner_name, contact_no, location, price, property_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            property_id.trim(),
            title.trim(),
            owner_name.trim(),
            contact_no.trim(),
            location.trim(),
            parsedPrice,
            property_type.trim(),
            status.trim()
        );

        const newProp = db.prepare('SELECT * FROM properties WHERE property_id = ?').get(property_id.trim());
        return res.status(201).json({ success: true, message: 'Property added successfully', property: newProp });
    } catch (err) {
        console.error('Add property error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update property details
app.put('/api/properties/:id', (req, res) => {
    try {
        const propId = req.params.id;
        const {
            title,
            owner_name,
            contact_no,
            location,
            price,
            property_type,
            status
        } = req.body;

        const existing = db.prepare('SELECT * FROM properties WHERE property_id = ?').get(propId);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }

        const parsedPrice = price !== undefined ? (parseFloat(String(price).replace(/,/g, '')) || 0) : existing.price;

        db.prepare(`
            UPDATE properties
            SET title = ?,
                owner_name = ?,
                contact_no = ?,
                location = ?,
                price = ?,
                property_type = ?,
                status = ?
            WHERE property_id = ?
        `).run(
            title !== undefined ? title.trim() : existing.title,
            owner_name !== undefined ? owner_name.trim() : existing.owner_name,
            contact_no !== undefined ? contact_no.trim() : existing.contact_no,
            location !== undefined ? location.trim() : existing.location,
            parsedPrice,
            property_type !== undefined ? property_type.trim() : existing.property_type,
            status !== undefined ? status.trim() : existing.status,
            propId
        );

        const updated = db.prepare('SELECT * FROM properties WHERE property_id = ?').get(propId);
        return res.json({ success: true, message: 'Property updated successfully', property: updated });
    } catch (err) {
        console.error('Update property error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Delete property
app.delete('/api/properties/:id', (req, res) => {
    try {
        const propId = req.params.id;
        const result = db.prepare('DELETE FROM properties WHERE property_id = ?').run(propId);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }
        return res.json({ success: true, message: 'Property deleted successfully' });
    } catch (err) {
        console.error('Delete property error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Reset database endpoint
app.post('/api/reset-data', (req, res) => {
    try {
        resetDatabase();
        return res.json({ success: true, message: 'Database reset to default seed data matching report' });
    } catch (err) {
        console.error('Reset data error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Fallback to index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`Property Management System Server running on:`);
    console.log(`http://localhost:${PORT}`);
    console.log(`=======================================================`);
});
