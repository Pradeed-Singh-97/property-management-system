const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'property_management.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance & reliability
db.pragma('journal_mode = WAL');

// Initialize database schema
function initDatabase() {
    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Properties table matching Table 3.1 of SRS document
    db.exec(`
        CREATE TABLE IF NOT EXISTS properties (
            property_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            contact_no TEXT NOT NULL,
            location TEXT NOT NULL,
            price REAL NOT NULL,
            property_type TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Seed default users if table is empty
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        const insertUser = db.prepare(`
            INSERT INTO users (email, password, name) VALUES (?, ?, ?)
        `);
        insertUser.run('admin@poornima.org', 'admin123', 'Administrator');
        insertUser.run('admin@gmail.com', 'admin', 'System Admin');
        insertUser.run('pradeep@poornima.org', 'pradeep123', 'Pradeep Singh Khangarot');
        console.log('Seeded default users.');
    }

    // Seed default properties if table is empty (matching Figure 5.3)
    const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
    if (propertyCount === 0) {
        const insertProp = db.prepare(`
            INSERT INTO properties (property_id, title, owner_name, contact_no, location, price, property_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertProp.run(
            'PROP-001',
            '2 BHK Apartment',
            'Rahul Sharma',
            '9829012345',
            'Jaipur',
            4500000,
            'Residential',
            'Available'
        );

        insertProp.run(
            'PROP-002',
            'Commercial Shop',
            'Amit Verma',
            '9829054321',
            'Vaishali Nagar',
            8500000,
            'Commercial',
            'Sold'
        );

        insertProp.run(
            'PROP-003',
            'Residential Plot',
            'Suresh Meena',
            '9414011223',
            'Ajmer Road',
            3200000,
            'Residential',
            'Available'
        );

        insertProp.run(
            'PROP-004',
            'Office Space',
            'Pooja Agarwal',
            '9828198765',
            'Mansarovar',
            6000000,
            'Commercial',
            'Available'
        );

        console.log('Seeded 4 default registered properties matching Figure 5.3.');
    }
}

// Reset database helper (for testing or user reset)
function resetDatabase() {
    db.exec(`DROP TABLE IF EXISTS properties;`);
    db.exec(`DROP TABLE IF EXISTS users;`);
    initDatabase();
}

initDatabase();

module.exports = {
    db,
    resetDatabase
};
