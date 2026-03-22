const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

// --- 1. CONFIGURATION, CSP & MIDDLEWARES ---

// Middleware pour corriger l'erreur de Content Security Policy (CSP) dans la console
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' http://localhost:3000;"
    );
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sert les fichiers à la racine
app.use(express.static(__dirname));

// Accès explicite au dossier assets
app.use('/assets', express.static(path.join(__dirname, 'sections', 'assets')));

// --- 2. CONNEXION MYSQL ---
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'suad1234567M',
    database: 'encher'
});

db.connect((err) => {
    if (err) {
        console.error('\x1b[31m[!] ERREUR MYSQL :\x1b[0m', err.message);
    } else {
        console.log('\x1b[32m[V] BASE DE DONNÉES CONNECTÉE\x1b[0m');
        
        const createTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            nom VARCHAR(255),
            prenom VARCHAR(255),
            mdp VARCHAR(255) NOT NULL,
            balance DECIMAL(15,2) DEFAULT 50000.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`;
        
        db.query(createTable, (err) => {
            if (!err) console.log("\x1b[34m[i] STRUCTURE OK : Table 'users' opérationnelle.\x1b[0m");
        });
    }
});

// --- 3. ROUTES DE NAVIGATION (PUBLIQUES) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'sections', 'register.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'sections', 'login.html')));
// Route pour l'Inventaire
app.get('/inventaire', (req, res) => {
    res.sendFile(path.join(__dirname, 'sections', 'dejaco', 'inventaireclient.html'));
});

// --- 4. ROUTES DE NAVIGATION (ESPACE DEJACONNECTER) ---

// Route pour le Dashboard
app.get('/client-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'sections', 'dejaco', 'clientconnecter.html'));
});

// ROUTE FIX : Le Marché Actuel (C'est celle-ci qui causait le 404)
app.get('/marcher-actuel', (req, res) => {
    res.sendFile(path.join(__dirname, 'sections', 'dejaco', 'marcheractuelleclient.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'sections', 'dejaco', 'adminconnecter.html'));
});

app.get('/mes-encheres', (req, res) => {
    res.sendFile(path.join(__dirname, 'sections', 'dejaco', 'mesencherclient.html'));
});

app.get('/portefeuille', (req, res) => {
    res.sendFile(path.join(__dirname, 'sections', 'dejaco', 'porteufeilleclient.html'));
});

app.get('/parametres', (req, res) => {
    res.sendFile(path.join(__dirname, 'sections', 'dejaco', 'parametreclient.html'));
});

// --- 5. API SYSTÈME (POST) ---

app.post('/api/register', (req, res) => {
    const { nom, prenom, email, securityKey } = req.body;
    if (!nom || !prenom || !email || !securityKey) {
        return res.status(400).json({ success: false, message: "Données manquantes." });
    }
    const username = (prenom.charAt(0) + nom).toLowerCase().replace(/\s/g, '');
    const sql = "INSERT INTO users (username, email, nom, prenom, mdp) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [username, email, nom, prenom, securityKey], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Erreur SQL (Doublon ?)" });
        res.json({ success: true, username: username });
    });
});

app.post('/api/login', (req, res) => {
    const { username, securityKey } = req.body;
    const sql = "SELECT * FROM users WHERE (username = ? OR email = ?) AND mdp = ?";
    db.query(sql, [username, username, securityKey], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length > 0) {
            const user = results[0];
            res.json({ 
                success: true, 
                user: { username: user.username, balance: user.balance, email: user.email } 
            });
        } else {
            res.status(401).json({ success: false, message: "Identifiants invalides." });
        }
    });
});

// --- 6. DÉMARRAGE ---
app.listen(PORT, () => {
    console.log(`
    \x1b[35m╔════════════════════════════════════════════╗
    ║        IRYON CORE V4 - SYSTÈME ACTIF       ║
    ║   URL : http://localhost:${PORT}/login        ║
    ╚════════════════════════════════════════════╝\x1b[0m
    `);
});