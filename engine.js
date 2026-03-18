/**
 * QUANTUM ENGINE v2.5 - INTEGRAL SOURCE
 * Système de gestion d'état et de navigation
 */

const State = {
    isLoggedIn: false,
    user: null,
    balance: 0,
    currentFilter: 'All',
    uploadedImages: [],
    inventory: [],
    auctions: [
        { id: 101, title: "Rolex Daytona Panda", desc: "Acier 2021, full set.", cat: "Luxe", cond: "Excellent", seller: "WatchTrader", current: 15000.0, speed: 1.5, icon: "fa-stopwatch", images: [] },
        { id: 102, title: "NVIDIA RTX 4090", desc: "Founder Edition.", cat: "Tech", cond: "Excellent", seller: "PC_Master", current: 800.0, speed: 0.5, icon: "fa-microchip", images: [] },
        { id: 103, title: "Bitcoin Hardware Wallet", desc: "Édition limitée Gold.", cat: "Crypto", cond: "Neuf", seller: "Satoshi_N", current: 250.0, speed: 0.2, icon: "fa-wallet", images: [] }
    ]
};

// --- NAVIGATION SYSTEM ---
async function switchTab(tabName, event = null) {
    const content = document.getElementById('app-content');
    const title = document.getElementById('view-title');
    const subtitle = document.getElementById('view-subtitle');
    
    if (!content) return;

    // Mise à jour visuelle des boutons de la sidebar
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active-tab'));
    if (event) {
        event.currentTarget.classList.add('active-tab');
    } else {
        const activeBtn = document.querySelector(`button[onclick*="'${tabName}'"]`);
        if (activeBtn) activeBtn.classList.add('active-tab');
    }

    // Animation de transition
    content.style.opacity = "0";
    content.style.transform = "translateY(10px)";

    try {
        const response = await fetch(`sections/${tabName}.html`);
        if (!response.ok) throw new Error(`Fichier ${tabName}.html introuvable`);
        const html = await response.text();
        
        content.innerHTML = html;
        
        // Trigger Reflow pour l'animation
        void content.offsetWidth; 
        content.style.opacity = "1";
        content.style.transform = "translateY(0)";

        // Configuration des titres
        const config = { 
            'home': { t: 'Accueil', s: 'Statistiques et flux réseau.' }, 
            'live': { t: 'Marché Live', s: 'Actifs en cours d\'inflation.' }, 
            'admin': { t: 'Vendre', s: 'Proposer un actif au réseau.' }, 
            'inventory': { t: 'Coffre-fort', s: 'Vos actifs sécurisés.' }, 
            'login': { t: 'Authentification', s: 'Accès sécurisé requis.' },
            'register': { t: 'Inscription', s: 'Créer un profil Quantum.' }
        };
        
        if(title && config[tabName]) title.innerText = config[tabName].t;
        if(subtitle && config[tabName]) subtitle.innerText = config[tabName].s;

        // Initialisation des vues spécifiques
        if(tabName === 'live') renderMarket();
        if(tabName === 'inventory') renderInventory();
        
    } catch (e) { 
        console.error("Navigation Error:", e); 
        content.innerHTML = `<div class="p-10 text-red-500 glass-panel rounded-3xl border border-red-500/10 text-center font-mono text-xs uppercase tracking-widest">⚠️ Erreur de liaison : ${e.message}</div>`;
    }
}



// --- SYSTÈME DE FILTRAGE ---
function applyFilter(category, button) {
    // 1. Mettre à jour l'état global
    State.currentFilter = category;

    // 2. Gérer l'apparence des boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-slate-800', 'text-slate-300');
    });
    
    // 3. Activer le bouton cliqué
    if (button) {
        button.classList.remove('bg-slate-800', 'text-slate-300');
        button.classList.add('bg-indigo-600', 'text-white');
    }

    // 4. Relancer le rendu du marché
    renderMarket();
}




// --- RENDU DU MARCHÉ (LIVE) ---
function renderMarket() {
    const grid = document.getElementById('market-grid');
    if (!grid) return;

    grid.innerHTML = State.auctions.map(auc => `
        <div class="glass-panel p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all group">
            <div class="flex justify-between items-start mb-6">
                <div class="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl text-indigo-400 border border-white/5">
                    <i class="fa-solid ${auc.icon}"></i>
                </div>
                <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">${auc.cat}</span>
            </div>
            <h3 class="text-xl font-black text-white mb-2 tracking-tight">${auc.title}</h3>
            <p class="text-slate-400 text-xs mb-6 line-clamp-2">${auc.desc}</p>
            <div class="bg-black/40 p-5 rounded-2xl border border-white/5 flex justify-between items-center mb-6">
                <div>
                    <p class="text-[9px] text-slate-500 uppercase font-bold mb-1">Prix Actuel</p>
                    <p id="price-${auc.id}" class="text-2xl font-mono font-bold text-indigo-300 tracking-tighter">${auc.current.toFixed(2)}€</p>
                </div>
            </div>
            <button onclick="buyItem(${auc.id})" class="w-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 py-4 rounded-xl font-black uppercase text-sm hover:bg-indigo-600 hover:text-white transition-all shadow-xl active:scale-95">
                Acquérir
            </button>
        </div>
    `).join('');
}


// --- RENDU DE L'INVENTAIRE ---
function renderInventory() {
    const container = document.getElementById('inv-container');
    const emptyMsg = document.getElementById('inv-empty');
    const totalValEl = document.getElementById('total-inv-value');

    if (!container) return;

    if (State.inventory.length === 0) {
        container.classList.add('hidden');
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        if (totalValEl) totalValEl.innerText = "0.00€";
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');
    container.classList.remove('hidden');

    let total = 0;
    container.innerHTML = State.inventory.map(item => {
        total += item.purchasePrice;
        return `
            <div class="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-900/20 transition-all group hover:border-emerald-500/30">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <i class="fa-solid ${item.icon}"></i>
                    </div>
                    <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">Authentifié</span>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">${item.title}</h3>
                <div class="bg-black/40 p-4 rounded-xl border border-white/[0.03] mt-4">
                    <p class="text-[8px] text-slate-500 uppercase font-black mb-1">Acquisition</p>
                    <p class="text-xl font-mono font-bold text-white">${item.purchasePrice.toFixed(2)}€</p>
                </div>
            </div>
        `;
    }).join('');

    if (totalValEl) totalValEl.innerText = total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ') + "€";
}


// --- GESTION DES ACHATS ---
function buyItem(id) {
    if (!State.isLoggedIn) {
        showToast("Sécurité", "Authentification requise pour acheter", "error");
        return switchTab('login');
    }
    
    const index = State.auctions.findIndex(a => a.id === id);
    const item = State.auctions[index];

    if (State.balance >= item.current) {
        State.balance -= item.current;
        State.inventory.push({ ...item, purchasePrice: item.current });
        State.auctions.splice(index, 1);
        
        updateBalanceDisplay();
        renderMarket();
        showToast("Succès", `${item.title} ajouté à l'inventaire`, "success");
    } else {
        showToast("Solde", "Crédits insuffisants pour cet actif", "error");
    }
}

// --- AUTHENTIFICATION (VERSION ULTIME) ---
function executeLogin() {
    console.log("Tentative de login détectée...");
    
    // On cible l'input par l'ID exact du nouveau login.html
    const input = document.getElementById('FINAL-LOGIN-INPUT') || 
                  document.getElementById('direct-login-input') ||
                  document.querySelector('input[type="text"]');

    if (!input) {
        alert("Erreur : Le champ de saisie est introuvable !");
        return;
    }

    const val = input.value.trim();

    if (val.length < 2) {
        showToast("Erreur", "Identifiant trop court (min. 2 car.)", "error");
        return;
    }

    // Mise à jour de l'état global
    State.isLoggedIn = true;
    State.user = val;
    State.balance = 50000.00; // Capital de départ

    // Mise à jour de la Sidebar
    const loggedOut = document.getElementById('state-logged-out');
    const loggedIn = document.getElementById('state-logged-in');
    const displayUser = document.getElementById('display-username');

    if (loggedOut) loggedOut.classList.add('hidden');
    if (loggedIn) {
        loggedIn.classList.remove('hidden');
        loggedIn.classList.add('flex');
    }
    if (displayUser) displayUser.innerText = val;
    
    updateBalanceDisplay();
    showToast("Système", `Liaison établie avec succès : ${val}`, "success");
    
    // Redirection automatique vers l'accueil
    switchTab('home');
}

// Sécurité pour les anciens appels de fonctions
const forceLogin = executeLogin;
const executeLoginFromRegister = executeLogin;

// --- UTILS : SOLDE & TOASTS ---
function updateBalanceDisplay() {
    const el = document.getElementById('nav-balance');
    if(el) el.innerText = State.balance.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ') + "€";
}

function showToast(title, msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const colors = { 
        success: 'border-emerald-500 text-emerald-400', 
        error: 'border-red-500 text-red-400', 
        info: 'border-indigo-500 text-indigo-400' 
    };
    toast.className = `glass-panel p-4 rounded-2xl border-l-4 mb-3 transition-all duration-500 animate-fade-in-right ${colors[type]}`;
    toast.innerHTML = `
        <div class="flex items-start gap-3">
            <div>
                <p class="font-black uppercase text-[10px] tracking-widest mb-1">${title}</p>
                <p class="text-white/80 text-[11px] font-medium leading-tight">${msg}</p>
            </div>
        </div>`;
    container.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 500); 
    }, 4000);
}

// --- MOTEUR DE PRIX ---
function startPriceEngine() {
    setInterval(() => {
        State.auctions.forEach(auc => {
            auc.current += (auc.speed / 10);
            const el = document.getElementById(`price-${auc.id}`);
            if (el) el.innerText = auc.current.toFixed(2) + "€";
        });
    }, 100);
}


// --- SYSTÈME DE CONNEXION AUTOMATIQUE (MODE DÉVELOPPEUR) ---
function forceAutoLogin() {
    console.log("⚡ Initialisation du profil de test...");

    // 1. On définit l'état de connexion
    State.isLoggedIn = true; // CRUCIAL pour pouvoir acheter
    State.user = "Admin_Quantum";
    State.balance = 75000.00;

    // 2. On met à jour l'interface (Sidebar)
    const loggedOutDiv = document.getElementById('state-logged-out');
    const loggedInDiv = document.getElementById('state-logged-in');
    const displayUser = document.getElementById('display-username');

    if (loggedOutDiv) loggedOutDiv.classList.add('hidden');
    if (loggedInDiv) {
        loggedInDiv.classList.remove('hidden');
        loggedInDiv.classList.add('flex');
    }
    if (displayUser) displayUser.innerText = State.user;
    
    // 3. On lance l'affichage du solde (Utilise la bonne fonction)
    updateBalanceDisplay();

    // 4. On redirige vers l'accueil directement
    switchTab('home');
    
    console.log("✅ Connecté en tant que " + State.user);
}

// Lancer la connexion auto après 500ms
setTimeout(forceAutoLogin, 500);

// Lancer la connexion auto après 500ms (le temps que le DOM charge)
setTimeout(forceAutoLogin, 500);

// --- INITIALISATION AU CHARGEMENT ---
window.onload = () => {
    console.log("🚀 Quantum Engine Initiated");
    switchTab('home');
    startPriceEngine();
};