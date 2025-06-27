// Toggle filter sections
function toggleSection(header) {
  const section = header.parentElement;
  section.classList.toggle('active');
}

// Initialize all filter sections as collapsed
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.filter-section').forEach(section => {
    section.classList.remove('active');
  });
});

const advancedFilters = {
  weapon: `
    <div class="filter-group">
      <h3>Attack Speed</h3>
      <div class="checkbox-group">
        <label><input type="checkbox" name="attackSpeed" value="super_slow"> Super Slow</label>
        <label><input type="checkbox" name="attackSpeed" value="very_slow"> Very Slow</label>
        <label><input type="checkbox" name="attackSpeed" value="slow"> Slow</label>
        <label><input type="checkbox" name="attackSpeed" value="normal"> Normal</label>
        <label><input type="checkbox" name="attackSpeed" value="fast"> Fast</label>
        <label><input type="checkbox" name="attackSpeed" value="very_fast"> Very Fast</label>
        <label><input type="checkbox" name="attackSpeed" value="super_fast"> Super Fast</label>
      </div>
    </div>
    <div class="filter-group">
      <h3>Weapon Type</h3>
      <div class="checkbox-group">
        <label><input type="checkbox" name="subtype" value="bow"> Bow</label>
        <label><input type="checkbox" name="subtype" value="relik"> Relik</label>
        <label><input type="checkbox" name="subtype" value="wand"> Wand</label>
        <label><input type="checkbox" name="subtype" value="dagger"> Dagger</label>
        <label><input type="checkbox" name="subtype" value="spear"> Spear</label>
      </div>
    </div>
  `,
  armour: `
    <div class="filter-group">
      <h3>Armour Type</h3>
      <div class="checkbox-group">
        <label><input type="checkbox" name="subtype" value="helmet"> Helmet</label>
        <label><input type="checkbox" name="subtype" value="chestplate"> Chestplate</label>
        <label><input type="checkbox" name="subtype" value="leggings"> Leggings</label>
        <label><input type="checkbox" name="subtype" value="boots"> Boots</label>
      </div>
    </div>
  `,
  accessory: `
    <div class="filter-group">
      <h3>Accessory Type</h3>
      <div class="checkbox-group">
        <label><input type="checkbox" name="subtype" value="necklace"> Necklace</label>
        <label><input type="checkbox" name="subtype" value="ring"> Ring</label>
        <label><input type="checkbox" name="subtype" value="bracelet"> Bracelet</label>
      </div>
    </div>
  `,
  tool: `
    <div class="filter-group">
      <h3>Tool Type</h3>
      <div class="checkbox-group">
        <label><input type="checkbox" name="subtype" value="axe"> Axe</label>
        <label><input type="checkbox" name="subtype" value="pickaxe"> Pickaxe</label>
        <label><input type="checkbox" name="subtype" value="rod"> Rod</label>
        <label><input type="checkbox" name="subtype" value="sythe"> Sythe</label>
      </div>
    </div>
  `,
  tome: `
    <div class="filter-group">
      <h3>Tome Type</h3>
      <div class="checkbox-group">
        <label><input type="checkbox" name="tomeType" value="weapon_tome"> Weapon Tome</label>
        <label><input type="checkbox" name="tomeType" value="armour_tome"> Armour Tome</label>
        <label><input type="checkbox" name="tomeType" value="guild_tome"> Guild Tome</label>
        <label><input type="checkbox" name="tomeType" value="expertise_tome"> Expertise Tome</label>
        <label><input type="checkbox" name="tomeType" value="mysticism_tome"> Mysticism Tome</label>
        <label><input type="checkbox" name="tomeType" value="marathon_tome"> Marathon Tome</label>
        <label><input type="checkbox" name="tomeType" value="lootrun_tome"> Lootrun Tome</label>
      </div>
    </div>
  `
};

// Handle type selection to show advanced filters
document.querySelectorAll('input[name="type"]').forEach(cb => {
  cb.addEventListener('change', () => {
    const selected = Array.from(document.querySelectorAll('input[name="type"]:checked')).map(el => el.value);
    const advDiv = document.getElementById('advanced-filters');
    advDiv.innerHTML = '';
    selected.forEach(type => {
      if (advancedFilters[type]) advDiv.innerHTML += advancedFilters[type];
    });
  });
});

// Handle form submission
document.getElementById('filterForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  await performSearch();
});

// Function to perform the search
async function performSearch() {
    const formData = new FormData(document.getElementById('filterForm'));
    const queryParams = new URLSearchParams();
    
    for (let [key, value] of formData.entries()) {
        if (queryParams.has(key)) {
            queryParams.set(key, queryParams.get(key) + ',' + value);
        } else {
            queryParams.set(key, value);
        }
    }

    try {
        const response = await fetch('/api/items?' + queryParams.toString());
        const items = await response.json();
        
        const itemsContainer = document.getElementById('itemsContainer');
        itemsContainer.innerHTML = '';
        
        if (!items || items.length === 0) {
            itemsContainer.innerHTML = '<p class="no-results">No items found matching your criteria.</p>';
            return;
        }
        
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            
            // Add rarity/tier data attribute
            if (item.type === 'material' || item.type === 'ingredient') {
                card.setAttribute('data-tier', item.tier || 1);
            } else {
                card.setAttribute('data-rarity', item.rarity?.toLowerCase() || 'common');
            }
            
            // Create content container
            const content = document.createElement('div');
            content.className = 'item-content';
            
            // Add favorite button
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'favorite-btn';
            favoriteBtn.innerHTML = '★';
            favoriteBtn.dataset.itemName = item.name;
            
            if (currentUser) {
                const userFavorites = favorites[currentUser] || [];
                favoriteBtn.classList.toggle('active', userFavorites.some(fav => fav.name === item.name));
            }
            
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(item);
            });
            card.appendChild(favoriteBtn);

            // Add trade button
            const tradeBtn = document.createElement('button');
            tradeBtn.className = 'trade-btn';
            tradeBtn.innerHTML = '🔄';
            tradeBtn.dataset.itemName = item.name;
            
            if (currentUser) {
                const userTradeItems = tradeItems[currentUser] || [];
                tradeBtn.classList.toggle('active', userTradeItems.some(trade => trade.name === item.name));
            }
            
            tradeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTrade(item);
            });
            card.appendChild(tradeBtn);

            // Add item content with detailed information
            content.innerHTML = `
                <h3>${item.name}</h3>
                <p><strong>Type:</strong> ${item.type}</p>
                ${item.weaponType ? `<p><strong>Weapon Type:</strong> ${item.weaponType}</p>` : ''}
                ${item.armourType ? `<p><strong>Armour Type:</strong> ${item.armourType}</p>` : ''}
                ${item.accessoryType ? `<p><strong>Accessory Type:</strong> ${item.accessoryType}</p>` : ''}
                ${item.tomeType ? `<p><strong>Tome Type:</strong> ${item.tomeType.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>` : ''}
                <p><strong>Level:</strong> ${item.requirements?.level || 'N/A'}</p>
                ${item.type === 'material' || item.type === 'ingredient' ? 
                    `<p><strong>Stars:</strong> ${item.tier || 0}</p>` :
                    `<p><strong>Stars:</strong> ${item.stars || 0}</p>`
                }
                ${item.type === 'material' || item.type === 'ingredient' ? 
                    `<span class="rarity tier-${item.tier}">Tier ${item.tier}</span>` :
                    `<span class="rarity ${item.rarity?.toLowerCase()}">${item.rarity}</span>`
                }
                ${item.subType ? `<p><strong>Subtype:</strong> ${item.subType}</p>` : ''}
                ${item.attackSpeed ? `<p><strong>Attack Speed:</strong> ${item.attackSpeed}</p>` : ''}
                
                ${item.type === 'ingredient' && item.skills ? `
                    <div class="usage-info">
                        <h4>Used in:</h4>
                        <ul>
                            ${item.skills.map(skill => `<li>${skill}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${item.type === 'material' && item.skills ? `
                    <div class="usage-info">
                        <h4>Gathered by:</h4>
                        <ul>
                            ${item.skills.map(skill => `<li>${skill}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${item.type === 'tool' ? `
                    <div class="usage-info">
                        <h4>Tool Type:</h4>
                        <p>${item.subtype || 'Unknown'}</p>
                    </div>
                ` : ''}
                
                ${item.requirements ? `
                    <div class="requirements">
                        <h4>Requirements</h4>
                        ${item.requirements.strength ? `<p><strong>Strength:</strong> ${item.requirements.strength}</p>` : ''}
                        ${item.requirements.dexterity ? `<p><strong>Dexterity:</strong> ${item.requirements.dexterity}</p>` : ''}
                        ${item.requirements.intelligence ? `<p><strong>Intelligence:</strong> ${item.requirements.intelligence}</p>` : ''}
                        ${item.requirements.defence ? `<p><strong>Defence:</strong> ${item.requirements.defence}</p>` : ''}
                        ${item.requirements.agility ? `<p><strong>Agility:</strong> ${item.requirements.agility}</p>` : ''}
                    </div>
                ` : ''}
                ${item.identifications ? `
                    <div class="identifications">
                        <h4>Identifications</h4>
                        ${Object.entries(item.identifications).map(([key, value]) => {
                            // Format the key to be more readable
                            const formattedKey = key
                                .replace(/_/g, ' ')
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase());
                            
                            // Format the value based on its type
                            let formattedValue = value;
                            if (typeof value === 'object' && value !== null) {
                                if (value.min !== undefined && value.max !== undefined) {
                                    formattedValue = `${value.min} - ${value.max}`;
                                } else if (value.raw !== undefined) {
                                    formattedValue = value.raw;
                                } else if (value.percent !== undefined) {
                                    formattedValue = `${value.percent}%`;
                                }
                            }
                            
                            // Add % symbol for percentage values
                            if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('_percent')) {
                                formattedValue = `${formattedValue}%`;
                            }
                            
                            return `<p><strong>${formattedKey}:</strong> ${formattedValue}</p>`;
                        }).join('')}
                    </div>
                ` : ''}
            `;
            
            card.appendChild(content);

            // Add click handler to navigate to detail page
            card.addEventListener('click', () => {
                window.location.href = `item-detail.html?name=${encodeURIComponent(item.name)}`;
            });
            
            itemsContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        document.getElementById('itemsContainer').innerHTML = 
            '<p class="error">Error loading items. Please try again later.</p>';
    }
}

function applyFilters(items) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const rarityFilter = document.getElementById('rarityFilter').value;
    const levelFilter = document.getElementById('levelFilter').value;
    const advancedFilters = document.getElementById('advancedFilters');
    const selectedAttackSpeeds = Array.from(advancedFilters.querySelectorAll('input[name="attackSpeed"]:checked')).map(cb => cb.value);
    const selectedSubtypes = Array.from(advancedFilters.querySelectorAll('input[name="subtype"]:checked')).map(cb => cb.value);
    const selectedTomeTypes = Array.from(advancedFilters.querySelectorAll('input[name="tomeType"]:checked')).map(cb => cb.value);

    // If no filters are selected, return all items
    if (searchTerm === '' && 
        typeFilter === 'all' && 
        rarityFilter === 'all' && 
        levelFilter === 'all' && 
        selectedAttackSpeeds.length === 0 && 
        selectedSubtypes.length === 0 && 
        selectedTomeTypes.length === 0) {
        return items;
    }

    return items.filter(item => {
        // Basic filters
        const matchesSearch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || item.type === typeFilter;
        const matchesRarity = rarityFilter === 'all' || item.rarity === rarityFilter;
        const matchesLevel = levelFilter === 'all' || (item.requirements && item.requirements.level <= parseInt(levelFilter));

        // Advanced filters
        let matchesAdvanced = true;
        if (typeFilter === 'weapon' && selectedAttackSpeeds.length > 0) {
            matchesAdvanced = matchesAdvanced && selectedAttackSpeeds.includes(item.attackSpeed);
        }
        if (selectedSubtypes.length > 0 && item.subtype) {
            matchesAdvanced = matchesAdvanced && selectedSubtypes.includes(item.subtype);
        }
        if (typeFilter === 'tome' && selectedTomeTypes.length > 0) {
            matchesAdvanced = matchesAdvanced && selectedTomeTypes.includes(item.tomeType);
        }

        return matchesSearch && matchesType && matchesRarity && matchesLevel && matchesAdvanced;
    });
}

// Add live filtering with debounce
let debounceTimer;
function debounce(func, delay) {
  return function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, arguments), delay);
  };
}

// Handle live filtering with debounce
const handleFilterChange = debounce(() => {
  performSearch();
}, 500); // Increased delay to 500ms to reduce server load

// Add event listeners for all filter inputs
document.querySelectorAll('input[type="checkbox"], input[type="number"]').forEach(input => {
  input.addEventListener('change', handleFilterChange);
});

// Initialize the page with all items
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all filter sections as collapsed
  document.querySelectorAll('.filter-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show only basic filters initially
  document.querySelector('.filter-section:first-child').classList.add('active');
  
  // Load initial items
  performSearch();
});

// User Management
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let favorites = JSON.parse(localStorage.getItem('favorites')) || {};
let tradeItems = JSON.parse(localStorage.getItem('tradeItems')) || {};

// Modal Elements
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const favoritesModal = document.getElementById('favoritesModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const userInfo = document.getElementById('userInfo');

// Modal Event Listeners
loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
registerBtn.addEventListener('click', () => registerModal.style.display = 'block');
favoritesBtn.addEventListener('click', () => {
  if (!currentUser) {
    alert('Please login to view favorites');
    return;
  }
  showFavorites();
  favoritesModal.style.display = 'block';
});

// Close modals when clicking the X
document.querySelectorAll('.close').forEach(closeBtn => {
  closeBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
    favoritesModal.style.display = 'none';
  });
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === loginModal) loginModal.style.display = 'none';
  if (e.target === registerModal) registerModal.style.display = 'none';
  if (e.target === favoritesModal) favoritesModal.style.display = 'none';
});

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  if (users[username] && users[username].password === password) {
    currentUser = username;
    updateUI();
    loginModal.style.display = 'none';
    document.getElementById('loginForm').reset();
  } else {
    alert('Invalid username or password');
  }
});

// Register Form Handler
document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (users[username]) {
    alert('Username already exists');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  users[username] = { password };
  favorites[username] = [];
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('favorites', JSON.stringify(favorites));
  
  currentUser = username;
  updateUI();
  registerModal.style.display = 'none';
  document.getElementById('registerForm').reset();
});

// Update UI based on login state
function updateUI() {
  if (currentUser) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    userInfo.textContent = `Welcome, ${currentUser}`;
    favoritesBtn.style.display = 'block';
  } else {
    loginBtn.style.display = 'block';
    registerBtn.style.display = 'block';
    favoritesBtn.style.display = 'none';
    userInfo.textContent = '';
  }
}

// Toggle favorite status
function toggleFavorite(item) {
  if (!currentUser) {
    alert('Please login to add favorites');
    return;
  }

  const userFavorites = favorites[currentUser];
  const index = userFavorites.findIndex(fav => fav.name === item.name);

  if (index === -1) {
    userFavorites.push(item);
  } else {
    userFavorites.splice(index, 1);
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoritesUI();
}

// Show favorites in the modal
function showFavorites() {
  const favoritesContainer = document.getElementById('favoritesContainer');
  favoritesContainer.innerHTML = '';

  const userFavorites = favorites[currentUser] || [];
  userFavorites.forEach(item => {
    const itemElement = createItemElement(item);
    favoritesContainer.appendChild(itemElement);
  });
}

// Update favorite buttons in the main view
function updateFavoritesUI() {
  const userFavorites = favorites[currentUser] || [];
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const itemName = btn.dataset.itemName;
    btn.classList.toggle('active', userFavorites.some(fav => fav.name === itemName));
  });
}

// Modify the createItemElement function to include favorite button
function createItemElement(item) {
  const div = document.createElement('div');
  div.className = 'item-card';
  
  // Add favorite button
  const favoriteBtn = document.createElement('button');
  favoriteBtn.className = 'favorite-btn';
  favoriteBtn.innerHTML = '★';
  favoriteBtn.dataset.itemName = item.name;
  
  if (currentUser) {
    const userFavorites = favorites[currentUser] || [];
    favoriteBtn.classList.toggle('active', userFavorites.some(fav => fav.name === item.name));
  }
  
  favoriteBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent card click when clicking favorite button
    toggleFavorite(item);
  });
  div.appendChild(favoriteBtn);

  // Add trade button
  const tradeBtn = document.createElement('button');
  tradeBtn.className = 'trade-btn';
  tradeBtn.innerHTML = '🔄';
  tradeBtn.dataset.itemName = item.name;
  
  if (currentUser) {
    const userTradeItems = tradeItems[currentUser] || [];
    tradeBtn.classList.toggle('active', userTradeItems.some(trade => trade.name === item.name));
  }
  
  tradeBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent card click when clicking trade button
    toggleTrade(item);
  });
  div.appendChild(tradeBtn);

  // Add click handler to navigate to detail page
  div.addEventListener('click', () => {
    window.location.href = `item-detail.html?name=${encodeURIComponent(item.name)}`;
  });

  // Add item content
  const name = document.createElement('h3');
  name.textContent = item.name;
  div.appendChild(name);

  if (item.type) {
    const type = document.createElement('p');
    type.textContent = `Type: ${item.type}`;
    div.appendChild(type);
  }

  if (item.rarity) {
    const rarity = document.createElement('p');
    rarity.textContent = `Rarity: ${item.rarity}`;
    div.appendChild(rarity);
  }

  if (item.requirements?.level) {
    const level = document.createElement('p');
    level.textContent = `Level Required: ${item.requirements.level}`;
    div.appendChild(level);
  }

  if (item.identifications) {
    const identifications = document.createElement('div');
    identifications.className = 'identifications';
    Object.entries(item.identifications).forEach(([key, value]) => {
      const ident = document.createElement('p');
      ident.textContent = `${key}: ${value}`;
      identifications.appendChild(ident);
    });
    div.appendChild(identifications);
  }

  return div;
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
    updateTradeUI();
}

// Update trade buttons in the main view
function updateTradeUI() {
    const userTradeItems = tradeItems[currentUser] || [];
    document.querySelectorAll('.trade-btn').forEach(btn => {
        const itemName = btn.dataset.itemName;
        btn.classList.toggle('active', userTradeItems.some(trade => trade.name === itemName));
    });
}

// Initialize UI
updateUI();