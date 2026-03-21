const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

// Middleware pour lire le JSON et les formulaires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURATION DES FICHIERS STATIQUES ---
// On sert tout le dossier actuel (index.html, engine.js, CSS)
app.use(express.static(__dirname));
app.use('/sections', express.static(path.join(__dirname, 'sections')));

// --- CONNEXION À LA BASE DE DONNÉES ---
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',      // Ton utilisateur MySQL (souvent root)
    password: 'suad1234567M',      // Ton mot de passe MySQL
    database: 'encher'
});

db.connect((err) => {
    if (err) {
        console.error('\x1b[31m[!] ERREUR DE LIAISON BDD :\x1b[0m', err.message);
        return;
    }
    console.log('\x1b[32m[+] BASE DE DONNÉES QUANTUM CONNECTÉE\x1b[0m');
});

// --- ROUTES ---

// 1. Accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Récupérer les actifs (Table 'assets')
app.get('/api/assets', (req, res) => {
    const query = "SELECT * FROM assets WHERE status = 'active'";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. Authentification (Table 'users')
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    const query = "SELECT * FROM users WHERE username = ?";
    
    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.json({ success: false, message: "Utilisateur inconnu" });
        }
    });
});

// 4. Gestion des Achats (Le "Boss Final")
app.post('/api/buy', (req, res) => {
    const { userId, assetId, price } = req.body;

    // Début d'une transaction SQL pour être sûr que tout se passe bien
    db.beginTransaction((err) => {
        if (err) throw err;

        // Étape A : Vérifier et déduire le solde
        const updateBalance = "UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?";
        db.query(updateBalance, [price, userId, price], (err, result) => {
            if (err || result.affectedRows === 0) {
                return db.rollback(() => res.json({ success: false, message: "Fonds insuffisants" }));
            }

            // Étape B : Marquer l'objet comme vendu
            const updateAsset = "UPDATE assets SET status = 'sold' WHERE id = ?";
            db.query(updateAsset, [assetId], (err) => {
                if (err) return db.rollback(() => res.json({ success: false }));

                // Étape C : Enregistrer la transaction
                const insertTx = "INSERT INTO transactions (asset_id, buyer_id, final_price) VALUES (?, ?, ?)";
                db.query(insertTx, [assetId, userId, price], (err) => {
                    if (err) return db.rollback(() => res.json({ success: false }));

                    // Validation finale
                    db.commit((err) => {
                        if (err) return db.rollback(() => res.json({ success: false }));
                        res.json({ success: true });
                    });
                });
            });
        });
    });
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(PORT, () => {
    console.log(`
    \x1b[35m╔══════════════════════════════════════════╗
    ║        IRYON TERMINAL - CORE V3          ║
    ║        Network: ONLINE (Port ${PORT})        ║
    ╚══════════════════════════════════════════╝\x1b[0m
    `);
});