const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');

const app = express();
const PORT = 3000;

// --- 1. CONFIGURATION DES SESSIONS ---
app.use(session({
    secret: 'iryon_quantum_core_77_ultra_key',
    resave: false,
    saveUninitialized: false, 
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

// --- 2. MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log des requêtes (Super utile pour voir si tu boucles)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// IMPORTANT : Définir requireAuth AVANT les routes
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        console.log("🔒 Accès refusé : Redirection vers /login");
        res.redirect('/login');
    }
};

// Servir les fichiers statiques
app.use(express.static(__dirname));

// --- 3. CONNEXION BDD ---
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'suad1234567M',
    database: 'encher'
});

db.connect(err => {
    if (err) console.error('❌ ERREUR MYSQL:', err.message);
    else console.log('✅ BDD CONNECTÉE');
});

// --- 4. ROUTES DE NAVIGATION ---

app.get('/login', (req, res) => {
    // Si déjà connecté, on envoie au dashboard
    if (req.session.user) return res.redirect('/client-dashboard');
    res.sendFile(path.join(__dirname, 'sections', 'login.html'));
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Route Dashboard
app.get('/client-dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'sections', 'dejaco', 'clientconnecter.html'));
});

// Autres pages
const pagesDejaco = [
    { route: '/marcher-actuel', file: 'marcheractuelleclient.html' },
    { route: '/inventaire', file: 'inventaireclient.html' },
    { route: '/portefeuille', file: 'portefeuilleclient.html' }, // <--- ICI : pas de "u" après le "e"
    { route: '/parametres', file: 'parametreclient.html' },
    { route: '/mes-encheres', file: 'mesencheresclient.html' }
];

pagesDejaco.forEach(page => {
    app.get(page.route, requireAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'sections', 'dejaco', page.file));
    });
});

// --- 5. API ---

app.post('/api/login', (req, res) => {
    const { username, securityKey } = req.body;
    const sql = "SELECT id, username, balance FROM users WHERE (username = ? OR email = ?) AND mdp = ?";
    
    db.query(sql, [username, username, securityKey], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        
        if (results.length > 0) {
            req.session.user = { id: results[0].id, username: results[0].username };
            res.json({ 
                success: true, 
                user: { 
                    username: results[0].username, 
                    balance: results[0].balance || 1500000 
                } 
            });
        } else {
            res.status(401).json({ success: false, message: "Invalide" });
        }
    });
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`🚀 SERVEUR OK : http://localhost:${PORT}/login`);
});