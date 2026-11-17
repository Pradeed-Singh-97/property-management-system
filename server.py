#!/usr/bin/env python3
"""
Property Management System - Standalone Python Backend Server
Zero external dependencies (uses standard library http.server + sqlite3)
Supports both Node.js (via server.js) and Python (via server.py)
"""

import http.server
import socketserver
import json
import sqlite3
import os
import mimetypes

PORT = 5000
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'property_management.db')
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    c.execute('''
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
    ''')
    
    # Check users
    c.execute('SELECT COUNT(*) as count FROM users')
    if c.fetchone()['count'] == 0:
        c.execute('INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                  ('admin@poornima.org', 'admin123', 'Administrator'))
        c.execute('INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                  ('admin@gmail.com', 'admin', 'System Admin'))
        c.execute('INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                  ('pradeep@poornima.org', 'pradeep123', 'Pradeep Singh Khangarot'))
    
    # Check properties
    c.execute('SELECT COUNT(*) as count FROM properties')
    if c.fetchone()['count'] == 0:
        props = [
            ('PROP-001', '2 BHK Apartment', 'Rahul Sharma', '9829012345', 'Jaipur', 4500000, 'Residential', 'Available'),
            ('PROP-002', 'Commercial Shop', 'Amit Verma', '9829054321', 'Vaishali Nagar', 8500000, 'Commercial', 'Sold'),
            ('PROP-003', 'Residential Plot', 'Suresh Meena', '9414011223', 'Ajmer Road', 3200000, 'Residential', 'Available'),
            ('PROP-004', 'Office Space', 'Pooja Agarwal', '9828198765', 'Mansarovar', 6000000, 'Commercial', 'Available')
        ]
        c.executemany('''
            INSERT INTO properties (property_id, title, owner_name, contact_no, location, price, property_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', props)
    conn.commit()
    conn.close()

class PMSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            raw = self.rfile.read(content_length).decode('utf-8')
            return json.loads(raw)
        return {}

    def do_GET(self):
        if self.path == '/api/properties':
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM properties ORDER BY property_id ASC')
            rows = [dict(r) for r in c.fetchall()]
            conn.close()
            self.send_json({'success': True, 'properties': rows})
            return

        if self.path.startswith('/api/properties/'):
            prop_id = self.path.split('/')[-1]
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM properties WHERE property_id = ?', (prop_id,))
            row = c.fetchone()
            conn.close()
            if row:
                self.send_json({'success': True, 'property': dict(row)})
            else:
                self.send_json({'success': False, 'message': 'Property not found'}, 404)
            return

        # Serve static file from public dir
        req_path = self.path.split('?')[0].split('#')[0]
        if req_path == '/' or req_path == '':
            target = os.path.join(PUBLIC_DIR, 'index.html')
        else:
            rel = req_path.lstrip('/')
            target = os.path.join(PUBLIC_DIR, rel)

        if os.path.exists(target) and os.path.isfile(target):
            mime_type, _ = mimetypes.guess_type(target)
            if not mime_type:
                mime_type = 'application/octet-stream'
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.end_headers()
            with open(target, 'rb') as f:
                self.wfile.write(f.read())
        else:
            # Fallback to index.html for SPA
            index_file = os.path.join(PUBLIC_DIR, 'index.html')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            with open(index_file, 'rb') as f:
                self.wfile.write(f.read())

    def do_POST(self):
        if self.path == '/api/login':
            body = self.read_json_body()
            email = body.get('email', '').strip()
            password = body.get('password', '').strip()

            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT id, email, password, name FROM users WHERE LOWER(email) = LOWER(?)', (email,))
            user = c.fetchone()
            conn.close()

            if user and user['password'] == password:
                self.send_json({
                    'success': True,
                    'message': 'Login successful',
                    'user': {'id': user['id'], 'email': user['email'], 'name': user['name']}
                })
            else:
                self.send_json({'success': False, 'message': 'Invalid email or password'}, 401)
            return

        if self.path == '/api/change-password':
            body = self.read_json_body()
            email = body.get('email', '').strip()
            curr = body.get('currentPassword', '')
            new_p = body.get('newPassword', '')
            conf_p = body.get('confirmNewPassword', '')

            if not email or not curr or not new_p:
                self.send_json({'success': False, 'message': 'All fields are required'}, 400)
                return
            if new_p != conf_p:
                self.send_json({'success': False, 'message': 'Passwords do not match'}, 400)
                return

            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', (email,))
            user = c.fetchone()
            if not user:
                conn.close()
                self.send_json({'success': False, 'message': 'User not found'}, 404)
                return
            if user['password'] != curr:
                conn.close()
                self.send_json({'success': False, 'message': 'Incorrect current password'}, 400)
                return

            c.execute('UPDATE users SET password = ? WHERE id = ?', (new_p, user['id']))
            conn.commit()
            conn.close()
            self.send_json({'success': True, 'message': 'Password updated successfully'})
            return

        if self.path == '/api/properties':
            body = self.read_json_body()
            prop_id = body.get('property_id', '').strip()
            title = body.get('title', '').strip()
            owner = body.get('owner_name', '').strip()
            contact = body.get('contact_no', '').strip()
            location = body.get('location', '').strip()
            price = body.get('price', 0)
            ptype = body.get('property_type', '').strip()
            status = body.get('status', '').strip()

            if not all([prop_id, title, owner, contact, location, ptype, status]):
                self.send_json({'success': False, 'message': 'All fields are required'}, 400)
                return

            conn = get_db()
            c = conn.cursor()
            try:
                c.execute('''
                    INSERT INTO properties (property_id, title, owner_name, contact_no, location, price, property_type, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (prop_id, title, owner, contact, location, float(str(price).replace(',', '')), ptype, status))
                conn.commit()
                conn.close()
                self.send_json({'success': True, 'message': 'Property added successfully'}, 201)
            except sqlite3.IntegrityError:
                conn.close()
                self.send_json({'success': False, 'message': f'Property ID "{prop_id}" already exists'}, 400)
            return

        if self.path == '/api/reset-data':
            conn = get_db()
            c = conn.cursor()
            c.execute('DROP TABLE IF EXISTS properties')
            c.execute('DROP TABLE IF EXISTS users')
            conn.commit()
            conn.close()
            init_db()
            self.send_json({'success': True, 'message': 'Database reset successfully'})
            return

    def do_PUT(self):
        if self.path.startswith('/api/properties/'):
            prop_id = self.path.split('/')[-1]
            body = self.read_json_body()
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM properties WHERE property_id = ?', (prop_id,))
            existing = c.fetchone()
            if not existing:
                conn.close()
                self.send_json({'success': False, 'message': 'Property not found'}, 404)
                return

            title = body.get('title', existing['title']).strip()
            owner = body.get('owner_name', existing['owner_name']).strip()
            contact = body.get('contact_no', existing['contact_no']).strip()
            location = body.get('location', existing['location']).strip()
            price = float(str(body.get('price', existing['price'])).replace(',', ''))
            ptype = body.get('property_type', existing['property_type']).strip()
            status = body.get('status', existing['status']).strip()

            c.execute('''
                UPDATE properties
                SET title = ?, owner_name = ?, contact_no = ?, location = ?, price = ?, property_type = ?, status = ?
                WHERE property_id = ?
            ''', (title, owner, contact, location, price, ptype, status, prop_id))
            conn.commit()
            conn.close()
            self.send_json({'success': True, 'message': 'Property updated successfully'})
            return

if __name__ == '__main__':
    init_db()
    print(f'Starting PMS Python Server on http://localhost:{PORT}')
    with socketserver.TCPServer(('', PORT), PMSRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer stopped.')
