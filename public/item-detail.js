// User Management
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let favorites = JSON.parse(localStorage.getItem('favorites')) || {};
let tradeItems = JSON.parse(localStorage.getItem('tradeItems')) || {};

// Get item data from URL
const urlParams = new URLSearchParams(window.location.search);
const itemName = urlParams.get('name');

// UI Elements
const favoriteBtn = document.getElementById('favoriteBtn');
const tradeBtn = document.getElementById('tradeBtn');
const itemMainInfo = document.querySelector('.item-main-info');
const favoritesList = document.querySelector('.favorites-list .user-list-content');
const tradeList = document.querySelector('.trade-list .user-list-content');

// Initialize user state
function initUserState() {
    currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('userInfo').textContent = `Welcome, ${currentUser}`;
        document.getElementById('favoritesBtn').style.display = 'block';
    }

    // Add event listeners for header buttons
    document.getElementById('loginBtn').addEventListener('click', () => {
        window.location.href = 'index.html#login';
    });

    document.getElementById('registerBtn').addEventListener('click', () => {
        window.location.href = 'index.html#register';
    });

    document.getElementById('favoritesBtn').addEventListener('click', () => {
        window.location.href = 'index.html#favorites';
    });
}

// Load item details
async function loadItemDetails() {
    try {
        const response = await fetch(`/api/items?q=${encodeURIComponent(itemName)}`);
        const items = await response.json();
        const item = items[0]; // Get the first matching item

        if (!item) {
            itemMainInfo.innerHTML = '<p class="error">Item not found</p>';
            return;
        }

        // Display item details
        itemMainInfo.innerHTML = `
            <h2>${item.name}</h2>
            <div class="item-details">
                <p><strong>Type:</strong> ${item.type}</p>
                ${item.weaponType ? `<p><strong>Weapon Type:</strong> ${item.weaponType}</p>` : ''}
                ${item.armourType ? `<p><strong>Armour Type:</strong> ${item.armourType}</p>` : ''}
                ${item.accessoryType ? `<p><strong>Accessory Type:</strong> ${item.accessoryType}</p>` : ''}
                <p><strong>Level:</strong> ${item.requirements?.level || 'N/A'}</p>
                <p><strong>Stars:</strong> ${item.stars || 0}</p>
                <p><strong>Rarity:</strong> ${item.rarity}</p>

            </div>
        `;

        // Update favorite and trade buttons
        updateActionButtons(item);
        
        // Load user lists
        loadUserLists(item);
    } catch (error) {
        console.error('Error loading item details:', error);
        itemMainInfo.innerHTML = '<p class="error">Error loading item details</p>';
    }
}

// Update favorite and trade buttons
function updateActionButtons(item) {
    if (!currentUser) {
        favoriteBtn.disabled = true;
        tradeBtn.disabled = true;
        return;
    }

    const userFavorites = favorites[currentUser] || [];
    const userTradeItems = tradeItems[currentUser] || [];

    const isFavorite = userFavorites.some(fav => fav.name === item.name);
    const isForTrade = userTradeItems.some(trade => trade.name === item.name);

    favoriteBtn.innerHTML = `<span class="star">★</span> ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}`;
    favoriteBtn.classList.toggle('active', isFavorite);

    tradeBtn.innerHTML = `<span class="trade-icon">🔄</span> ${isForTrade ? 'Remove from Trade List' : 'Mark as For Trade'}`;
    tradeBtn.classList.toggle('active', isForTrade);
}

// Load user lists
function loadUserLists(item) {
    // Load favorites list
    const favoritesUsers = Object.entries(favorites)
        .filter(([_, userFavorites]) => userFavorites.some(fav => fav.name === item.name))
        .map(([username]) => username);

    favoritesList.innerHTML = favoritesUsers.length ? 
        favoritesUsers.map(username => `<div class="user-item">${username}</div>`).join('') :
        '<p>No users have this item in favorites</p>';

    // Load trade list
    const tradeUsers = Object.entries(tradeItems)
        .filter(([_, userTradeItems]) => userTradeItems.some(trade => trade.name === item.name))
        .map(([username]) => username);

    tradeList.innerHTML = tradeUsers.length ?
        tradeUsers.map(username => `<div class="user-item">${username}</div>`).join('') :
        '<p>No users are offering this item for trade</p>';
}

// Toggle favorite status
function toggleFavorite(item) {
    if (!currentUser) {
        alert('Please login to add favorites');
        return;
    }

    if (!favorites[currentUser]) {
        favorites[currentUser] = [];
    }

    const index = favorites[currentUser].findIndex(fav => fav.name === item.name);
    if (index === -1) {
        favorites[currentUser].push(item);
    } else {
        favorites[currentUser].splice(index, 1);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateActionButtons(item);
    loadUserLists(item);
}

// Toggle trade status
function toggleTrade(item) {
    if (!currentUser) {
        alert('Please login to mark items for trade');
        return;
    }

    if (!tradeItems[currentUser]) {
        tradeItems[currentUser] = [];
    }

    const index = tradeItems[currentUser].findIndex(trade => trade.name === item.name);
    if (index === -1) {
        tradeItems[currentUser].push(item);
    } else {
        tradeItems[currentUser].splice(index, 1);
    }

    localStorage.setItem('tradeItems', JSON.stringify(tradeItems));
    updateActionButtons(item);
    loadUserLists(item);
}

// Event Listeners
favoriteBtn.addEventListener('click', () => toggleFavorite({ name: itemName }));
tradeBtn.addEventListener('click', () => toggleTrade({ name: itemName }));

// Initialize
initUserState();
loadItemDetails(); 