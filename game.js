// Configuration des constantes PSG1
const CANVAS_SIZE = 240;
const GRID_SIZE = 15;
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- INTEGRATION SDK PLAY SOLANA ---
const psg1 = {
    wallet: null,
    async init() {
        // Détecter si on est sur la console
        if (window.solana && window.solana.isPlaySolana) {
            try {
                const resp = await window.solana.connect();
                this.wallet = resp.publicKey.toString();
                document.getElementById('wallet-addr').innerText = this.wallet.slice(0,4) + ".." + this.wallet.slice(-4);
                document.getElementById('player-status').innerText = "PRÊT";
                return true;
            } catch (err) {
                console.error("Connexion Wallet refusée");
            }
        }
        return false;
    }
};

// --- LOGIQUE MULTIJOUEUR (Web Bomb) ---
const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://votre-serveur-render.com/gamehub")
    .withAutomaticReconnect()
    .build();

let playerPos = { x: 1, y: 1 };

// --- GESTION DES BOUTONS PHYSIQUES (SDK / GAMEPAD) ---
function updateInputs() {
    const gamepads = navigator.getGamepads();
    if (!gamepads[0]) return;

    const gp = gamepads[0];

    // Mouvements D-PAD (PSG1 standard)
    if (gp.buttons[12].pressed) move(0, -1); // Haut
    if (gp.buttons[13].pressed) move(0, 1);  // Bas
    if (gp.buttons[14].pressed) move(-1, 0); // Gauche
    if (gp.buttons[15].pressed) move(1, 0);  // Droite

    // BOUTON A (PSG1) : Poser Bombe
    if (gp.buttons[0].pressed) {
        placeBomb();
    }

    // BOUTON X ou Y : Recharger / Menu
    if (gp.buttons[2].pressed) {
        psg1.init(); // Reconnecter le wallet si besoin
    }
}

function move(dx, dy) {
    // On envoie au serveur SignalR (Logique Web Bomb)
    connection.invoke("Move", dx, dy);
    // Simulation visuelle immédiate
    playerPos.x += dx;
    playerPos.y += dy;
}

function placeBomb() {
    connection.invoke("PlaceBomb");
}

// --- BOUCLE DE RENDU ---
function draw() {
    ctx.fillStyle = "#2ecc71"; // Fond herbe
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = "#e74c3c"; // Joueur
    ctx.fillRect(playerPos.x * TILE_SIZE, playerPos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function tick() {
    updateInputs();
    draw();
    requestAnimationFrame(tick);
}

// Lancement
connection.start().then(() => {
    psg1.init();
    tick();
});