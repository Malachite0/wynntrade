import express from 'express';
import axios from 'axios';

const app = express();
const port = 3000;

// rest van je code hier


let items = [];

async function loadItems() {
  try {
    const res = await axios.get('https://api.wynncraft.com/v3/item/database?fullResult');
    const rawItems = res.data;

    items = Object.entries(rawItems).map(([name, data]) => ({
      name,
      ...data
    }));

    // Debug: Log sample items for each type
    console.log('Sample weapon:', items.find(item => item.type === 'weapon'));
    console.log('Sample armour:', items.find(item => item.type === 'armour'));
    console.log('Sample accessory:', items.find(item => item.type === 'accessory'));
    console.log('Sample material:', items.find(item => item.type === 'material'));
    console.log('Sample ingredient:', items.find(item => item.type === 'ingredient'));

    console.log(`Loaded ${items.length} items.`);
  } catch (err) {
    console.error('Error loading items:', err.message);
  }
}

app.use(express.static('public'));

app.get('/api/items', (req, res) => {
  const {
    q = '',
    type,
    subtype,
    rarity,
    stars,
    minLevel,
    maxLevel,
    attackSpeed,
    thunder,
    water,
    fire,
    air,
    main_attack,
    spells,
    health,
    mobility,
    xp_loot,
    major_id
  } = req.query;

  console.log('Filter params:', { type, subtype, rarity, stars, minLevel, maxLevel, attackSpeed });

  let filtered = items;
  console.log('Initial items count:', filtered.length);

  // Search by name query
  if (q) {
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(q.toLowerCase())
    );
    console.log('After name filter:', filtered.length);
  }

  // Apply type and subtype filters first (these are special cases)
  if (type) {
    const types = type.toLowerCase().split(',');
    console.log('Filtering by types:', types);
    filtered = filtered.filter(item => {
      const itemType = item.type?.toLowerCase();
      // Map our types to API types
      const typeMapping = {
        'weapon': 'weapons',
        'armour': 'armour',
        'accessory': 'accessories',
        'tome': 'tomes',
        'tool': 'tools',
        'ingredient': 'ingredients',
        'material': 'materials'
      };
      const mappedType = typeMapping[itemType];
      const matches = types.some(t => mappedType === typeMapping[t]);
      if (matches) {
        console.log('Matched type:', item.name, itemType, 'mapped to', mappedType);
      }
      return matches;
    });
    console.log('After type filter:', filtered.length);
  }

  if (subtype) {
    const subtypes = subtype.toLowerCase().split(',');
    console.log('Filtering by subtypes:', subtypes);
    filtered = filtered.filter(item => {
      // Check all possible type properties
      const itemSubType = item.subType?.toLowerCase();
      const itemWeaponType = item.weaponType?.toLowerCase();
      const itemArmourType = item.armourType?.toLowerCase();
      const itemAccessoryType = item.accessoryType?.toLowerCase();
      
      // Map our subtypes to API subtypes
      const subtypeMapping = {
        // Weapon subtypes
        'bow': 'bow',
        'relik': 'relik',
        'wand': 'wand',
        'dagger': 'dagger',
        'spear': 'spear',
        // Armour subtypes
        'helmet': 'helmet',
        'chestplate': 'chestplate',
        'leggings': 'leggings',
        'boots': 'boots',
        // Accessory subtypes
        'necklace': 'necklace',
        'ring': 'ring',
        'bracelet': 'bracelet',
        // Tool subtypes
        'axe': 'axe',
        'pickaxe': 'pickaxe',
        'rod': 'rod',
        'sythe': 'sythe',
        // Crafting professions
        'alchemism': 'alchemism',
        'armouring': 'armouring',
        'cooking': 'cooking',
        'jeweling': 'jeweling',
        'scribbing': 'scribbing',
        'tailoring': 'tailoring',
        'weaponsmithing': 'weaponsmithing',
        'woodworking': 'woodworking',
        // Gathering professions
        'mining': 'mining',
        'fishing': 'fishing',
        'farming': 'farming',
        'woodcutting': 'woodcutting'
      };

      // Check if any of the subtypes match any of the item's type properties
      return subtypes.some(s => {
        const mappedSubType = subtypeMapping[s];
        if (!mappedSubType) return false;

        // For weapons and armor, check weaponType and armourType
        if (item.type === 'weapon' && itemWeaponType === mappedSubType) return true;
        if (item.type === 'armour' && itemArmourType === mappedSubType) return true;

        // For accessories, check accessoryType
        if (item.type === 'accessory' && itemAccessoryType === mappedSubType) return true;

        // For tools, check if the name includes the tool type
        if (item.type === 'tool') {
          const itemName = item.name.toLowerCase();
          if (mappedSubType === 'axe' && itemName.includes(' axe') || itemName.startsWith('axe ')) return true;
          if (mappedSubType === 'pickaxe' && itemName.includes('pickaxe')) return true;
          if (mappedSubType === 'rod' && itemName.includes('fishing rod')) return true;
          if (mappedSubType === 'sythe' && itemName.includes('sythe')) return true;
        }

        // For ingredients, check skills array
        if (item.type === 'ingredient' && item.skills) {
          return item.skills.some(skill => skill.toLowerCase() === mappedSubType);
        }

        // For materials, check skills array
        if (item.type === 'material' && item.skills) {
          return item.skills.some(skill => skill.toLowerCase() === mappedSubType);
        }

        return false;
      });
    });
    console.log('After subtype filter:', filtered.length);
  }

  // Apply rarity/tier filter
  if (rarity) {
    const rarities = rarity.toLowerCase().split(',');
    filtered = filtered.filter(item => {
      // For materials and ingredients, check tier instead of rarity
      if (item.type === 'material' || item.type === 'ingredient') {
        return rarities.includes(item.tier?.toString().toLowerCase());
      }
      return rarities.includes(item.rarity?.toLowerCase());
    });
  }

  if (stars) {
    const starsArr = stars.split(',').map(s => parseInt(s, 10));
    filtered = filtered.filter(item => {
      // For materials and ingredients, use tier as stars
      if (item.type === 'material' || item.type === 'ingredient') {
        return starsArr.includes(item.tier || 0);
      }
      // For other items, use stars property
      return starsArr.includes(item.stars || 0);
    });
  }

  if (attackSpeed) {
    const speeds = attackSpeed.toLowerCase().split(',');
    console.log('Filtering by attack speeds:', speeds);
    filtered = filtered.filter(item => {
      if (!item.attackSpeed) {
        console.log('Item has no attack speed:', item.name);
        return false;
      }
      const itemSpeed = item.attackSpeed.toLowerCase();
      // Map our attack speeds to API attack speeds
      const speedMapping = {
        'super_slow': 'super_slow',
        'very_slow': 'very_slow',
        'slow': 'slow',
        'normal': 'normal',
        'fast': 'fast',
        'very_fast': 'very_fast',
        'super_fast': 'super_fast'
      };
      return speeds.some(s => speedMapping[s] === itemSpeed);
    });
    console.log('After attack speed filter:', filtered.length);
  }

  // Apply level range filters
  if (minLevel) {
    const minL = parseInt(minLevel, 10);
    filtered = filtered.filter(item => item.requirements?.level >= minL);
  }
  if (maxLevel) {
    const maxL = parseInt(maxLevel, 10);
    filtered = filtered.filter(item => item.requirements?.level <= maxL);
  }

  // Helper function to check if an item has all the required identifications
  const hasAllIdentifications = (item, identValues) => {
    if (!identValues || !item.identifications) return true;
    const values = identValues.toLowerCase().split(',');
    
    // Map of frontend names to API names
    const identMapping = {
      // Main Attack
      'main_attack_dmg_percent': ['main_attack_damage_percent'],
      'raw_attack_speed': ['attack_speed'],
      'raw_main_attack_dmg': ['main_attack_damage'],
      'poison': ['poison'],

      // Spells and Mana
      'spell_dmg_percent': ['spell_damage_percent'],
      'mana_steal': ['mana_steal'],
      'mana_regen': ['mana_regen'],
      'raw_spell_dmg': ['spell_damage'],
      'raw_1st_spell_cost': ['spell_cost_1'],
      'raw_2nd_spell_cost': ['spell_cost_2'],
      'raw_3rd_spell_cost': ['spell_cost_3'],
      'raw_4th_spell_cost': ['spell_cost_4'],
      '1st_spell_cost_percent': ['spell_cost_1_percent'],
      '2nd_spell_cost_percent': ['spell_cost_2_percent'],
      '3rd_spell_cost_percent': ['spell_cost_3_percent'],
      '4th_spell_cost_percent': ['spell_cost_4_percent'],
      'raw_neutral_spell_dmg': ['neutral_spell_damage'],

      // Health
      'health_regen_raw': ['health_regen'],
      'life_steal': ['life_steal'],
      'health': ['health'],
      'health_regen_percent': ['health_regen_percent'],

      // Mobility
      'walkspeed': ['walk_speed'],
      'sprint_regen': ['sprint_regen'],
      'jump_height': ['jump_height'],
      'sprint': ['sprint'],

      // XP & Loot
      'loot_bonus': ['loot_bonus'],
      'xp_bonus': ['xp_bonus'],
      'stealing': ['stealing'],
      'loot_quality': ['loot_quality'],
      'gather_xp_bonus': ['gather_xp_bonus'],
      'gather_speed': ['gather_speed'],

      // Elemental Stats
      'thunder_dmg_percent': ['thunder_damage_percent'],
      'thunder_defence': ['thunder_defence'],
      'raw_thunder_main_attack_dmg_percent': ['thunder_main_attack_damage_percent'],
      'raw_thunder_spell_dmg': ['thunder_spell_damage'],
      'raw_thunder_dmg': ['thunder_damage'],

      'water_dmg_percent': ['water_damage_percent'],
      'water_defence': ['water_defence'],
      'raw_water_spell_dmg': ['water_spell_damage'],
      'water_spell_dmg_percent': ['water_spell_damage_percent'],
      'raw_water_dmg': ['water_damage'],

      'fire_dmg_percent': ['fire_damage_percent'],
      'fire_defence': ['fire_defence'],
      'raw_fire_spell_dmg': ['fire_spell_damage'],
      'raw_fire_main_attack_dmg': ['fire_main_attack_damage'],
      'fire_spell_dmg_percent': ['fire_spell_damage_percent'],

      'air_dmg_percent': ['air_damage_percent'],
      'air_defence': ['air_defence'],
      'raw_air_spell_dmg': ['air_spell_damage'],
      'raw_air_main_attack_dmg': ['air_main_attack_damage'],
      'air_main_attack_dmg_percent': ['air_main_attack_damage_percent'],
      'air_spell_dmg_percent': ['air_spell_damage_percent']
    };

    return values.every(v => {
      const possibleNames = identMapping[v] || [v];
      return possibleNames.some(name => {
        return Object.keys(item.identifications).some(key => {
          const keyLower = key.toLowerCase();
          return keyLower === name.toLowerCase();
        });
      });
    });
  };

  // Apply identification filters
  if (thunder) {
    console.log('Filtering thunder:', thunder);
    filtered = filtered.filter(item => hasAllIdentifications(item, thunder));
    console.log('After thunder filter:', filtered.length);
  }
  if (water) {
    console.log('Filtering water:', water);
    filtered = filtered.filter(item => hasAllIdentifications(item, water));
    console.log('After water filter:', filtered.length);
  }
  if (fire) {
    console.log('Filtering fire:', fire);
    filtered = filtered.filter(item => hasAllIdentifications(item, fire));
    console.log('After fire filter:', filtered.length);
  }
  if (air) {
    console.log('Filtering air:', air);
    filtered = filtered.filter(item => hasAllIdentifications(item, air));
    console.log('After air filter:', filtered.length);
  }
  if (main_attack) {
    console.log('Filtering main attack:', main_attack);
    filtered = filtered.filter(item => hasAllIdentifications(item, main_attack));
    console.log('After main attack filter:', filtered.length);
  }
  if (spells) {
    console.log('Filtering spells:', spells);
    filtered = filtered.filter(item => hasAllIdentifications(item, spells));
    console.log('After spells filter:', filtered.length);
  }
  if (health) {
    console.log('Filtering health:', health);
    filtered = filtered.filter(item => hasAllIdentifications(item, health));
    console.log('After health filter:', filtered.length);
  }
  if (mobility) {
    console.log('Filtering mobility:', mobility);
    filtered = filtered.filter(item => hasAllIdentifications(item, mobility));
    console.log('After mobility filter:', filtered.length);
  }
  if (xp_loot) {
    console.log('Filtering xp/loot:', xp_loot);
    filtered = filtered.filter(item => hasAllIdentifications(item, xp_loot));
    console.log('After xp/loot filter:', filtered.length);
  }

  // Apply major ID filter
  if (major_id) {
    const majorIds = major_id.toLowerCase().split(',');
    filtered = filtered.filter(item => {
      if (!item.majorIds) return false;
      return majorIds.every(id => 
        Object.keys(item.majorIds).some(key => key.toLowerCase() === id.toLowerCase())
      );
    });
  }

  // Sort items by level (highest first)
  filtered.sort((a, b) => (b.requirements?.level || 0) - (a.requirements?.level || 0));

  // Limit results to prevent overwhelming the client
  const limitedResults = filtered.slice(0, 100);

  console.log('Final filtered count:', filtered.length);
  res.json(limitedResults);
});

app.listen(port, () => {
  console.log(`Wynncraft Item API running at http://localhost:${port}`);
  loadItems();
});
