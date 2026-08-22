const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Skill ID mappings
const SKILL_NAMES = {
  0: 'None',
  1: 'Swords',
  2: 'Knives',
  3: 'Clubs',
  4: 'Polearms',
  5: 'Spears',
  6: 'Blocking',
  7: 'Axes',
  8: 'Bows',
  9: 'FireMagic',
  10: 'FrostMagic',
  11: 'Unarmed',
  12: 'Pickaxes',
  13: 'WoodCutting',
  14: 'Crossbows',
  15: 'ElementalMagic',
  16: 'BloodMagic',
  100: 'Run',
  101: 'Sneak',
  102: 'Swim',
  103: 'Jump',
  104: 'Fishing',
  105: 'Ride',
  106: 'Farming',
  107: 'Cooking',
  108: 'Crafting',
  110: 'Mining'
};

// Biome mappings
const BIOME_NAMES = {
  0: 'None',
  1: 'Meadows',
  2: 'Swamp',
  4: 'Mountain',
  8: 'BlackForest',
  16: 'Plains',
  32: 'AshLands',
  64: 'DeepNorth',
  256: 'Ocean',
  512: 'MistLands'
};

// Pin type mappings
const PIN_TYPE_NAMES = {
  0: 'Fireplace',
  1: 'House',
  2: 'Hammer',
  3: 'Dot',
  4: 'Death',
  5: 'Bed',
  6: 'Portal',
  7: 'Shout',
  8: 'None',
  9: 'Boss',
  10: 'Player',
  11: 'RandomEvent',
  12: 'Ping',
  13: 'EventArea'
};

class ZPackageReader {
  constructor(buffer, offset = 0) {
    this.buffer = buffer;
    this.offset = offset;
  }

  hasMore(bytes = 1) {
    return this.offset + bytes <= this.buffer.length;
  }

  readByte() {
    const val = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return val;
  }

  readBytes(count) {
    const slice = this.buffer.subarray(this.offset, this.offset + count);
    this.offset += count;
    return slice;
  }

  readBool() {
    return this.readByte() !== 0;
  }

  readInt32() {
    const val = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return val;
  }

  readInt64() {
    const val = this.buffer.readBigInt64LE(this.offset);
    this.offset += 8;
    return val;
  }

  readFloat() {
    const val = this.buffer.readFloatLE(this.offset);
    this.offset += 4;
    return val;
  }

  readVector3() {
    return {
      x: Number(this.readFloat().toFixed(2)),
      y: Number(this.readFloat().toFixed(2)),
      z: Number(this.readFloat().toFixed(2))
    };
  }

  readVector2i() {
    return {
      x: this.readInt32(),
      y: this.readInt32()
    };
  }

  read7BitEncodedInt() {
    let result = 0;
    let shift = 0;
    while (true) {
      const byte = this.readByte();
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }
    return result;
  }

  readString() {
    const strLen = this.read7BitEncodedInt();
    if (strLen === 0) return '';
    const val = this.buffer.toString('utf8', this.offset, this.offset + strLen);
    this.offset += strLen;
    return val;
  }

  readLengthPrefixedByteArray() {
    const len = this.readInt32();
    return this.readBytes(len);
  }

  readStringSet() {
    const count = this.readInt32();
    const set = [];
    for (let i = 0; i < count; i++) {
      set.push(this.readString());
    }
    return set;
  }

  readMap() {
    const count = this.readInt32();
    const map = {};
    for (let i = 0; i < count; i++) {
      const key = this.readString();
      const value = this.readString();
      map[key] = value;
    }
    return map;
  }

  readStringFloatMap() {
    const count = this.readInt32();
    const map = {};
    for (let i = 0; i < count; i++) {
      const key = this.readString();
      const value = this.readFloat();
      map[key] = value;
    }
    return map;
  }
}

function parseValheimFch(filePath, options = {}) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File '${resolvedPath}' not found.`);
    return null;
  }

  const rawBytes = fs.readFileSync(resolvedPath);
  const reader = new ZPackageReader(rawBytes);

  try {
    const packageLen = reader.readInt32();
    const pkg = new ZPackageReader(reader.readBytes(packageLen));

    const saveVersion = pkg.readInt32();
    let stats = [];
    let kills = 0, deaths = 0, crafts = 0, builds = 0;

    if (saveVersion >= 38) {
      const statsCount = pkg.readInt32();
      for (let i = 0; i < statsCount; i++) {
        stats.push(pkg.readFloat());
      }
      kills = stats[0] || 0;
      deaths = stats[1] || 0;
      crafts = stats[2] || 0;
      builds = stats[3] || 0;
    } else if (saveVersion >= 28) {
      kills = pkg.readInt32();
      deaths = pkg.readInt32();
      crafts = pkg.readInt32();
      builds = pkg.readInt32();
    }

    // Modern character files have an extra byte before worlds list
    if (saveVersion >= 38) {
      pkg.readByte();
    }

    // World List & Minimap Pins
    const worldsCount = pkg.readInt32();
    const worlds = [];
    for (let i = 0; i < worldsCount; i++) {
      const worldKey = pkg.readInt64().toString();
      const haveCustomSpawnPoint = pkg.readBool();
      const spawnPoint = pkg.readVector3();
      const hasLogoutPoint = pkg.readBool();
      const logoutPoint = pkg.readVector3();
      let hasDeathPoint = false;
      let deathPoint = null;
      if (saveVersion >= 30) {
        hasDeathPoint = pkg.readBool();
        deathPoint = pkg.readVector3();
      }
      const homePoint = pkg.readVector3();

      let mapData = null;
      if (saveVersion >= 29 && pkg.readBool()) {
        const mapBytesLen = pkg.readInt32();
        const mapReader = new ZPackageReader(pkg.readBytes(mapBytesLen));
        const mapVersion = mapReader.readInt32();
        let minimapPkg;
        if (mapVersion >= 7) {
          const compLen = mapReader.readInt32();
          const compBytes = mapReader.readBytes(compLen);
          const decomp = zlib.gunzipSync(compBytes);
          minimapPkg = new ZPackageReader(decomp);
        } else {
          minimapPkg = mapReader;
        }

        const textureSize = minimapPkg.readInt32();
        const explored = minimapPkg.readBytes(textureSize * textureSize);
        let exploredOthers = null;
        if (mapVersion >= 5) {
          exploredOthers = minimapPkg.readBytes(textureSize * textureSize);
        }

        const pins = [];
        if (mapVersion >= 2) {
          const pinCount = minimapPkg.readInt32();
          for (let p = 0; p < pinCount; p++) {
            const pinName = minimapPkg.readString();
            const pos = minimapPkg.readVector3();
            const pinTypeId = minimapPkg.readInt32();
            const pinType = PIN_TYPE_NAMES[pinTypeId] || `Type_${pinTypeId}`;
            const checked = (mapVersion >= 3) && minimapPkg.readBool();
            const ownerId = mapVersion >= 6 ? minimapPkg.readInt64().toString() : '0';
            const author = mapVersion >= 8 ? minimapPkg.readString() : '';
            pins.push({ name: pinName, pos, pinType, pinTypeId, checked, ownerId, author });
          }
        }
        const visibleToOthers = mapVersion >= 4 ? minimapPkg.readBool() : false;
        mapData = { mapVersion, textureSize, pinsCount: pins.length, pins, visibleToOthers };
      }

      worlds.push({
        worldKey,
        haveCustomSpawnPoint,
        spawnPoint,
        hasLogoutPoint,
        logoutPoint,
        hasDeathPoint,
        deathPoint,
        homePoint,
        mapData
      });
    }

    // Player Profile Metadata
    const playerName = pkg.readString();
    const playerId = pkg.readInt64().toString();
    const startSeed = pkg.readString();

    let worldPlaytimes = [];
    let playerStatsMaps = {};

    if (saveVersion >= 38) {
      pkg.readByte(); // flag
      const logoutTimestamp = pkg.readInt64().toString();
      const worldTimesCount = pkg.readInt32();
      for (let w = 0; w < worldTimesCount; w++) {
        worldPlaytimes.push({
          worldName: pkg.readString(),
          playtime: pkg.readFloat()
        });
      }

      playerStatsMaps.worldModifiers = pkg.readStringFloatMap();
      playerStatsMaps.interactions = pkg.readStringFloatMap();
      playerStatsMaps.enemyKills = pkg.readStringFloatMap();
      playerStatsMaps.itemCrafts = pkg.readStringFloatMap();
      playerStatsMaps.itemUses = pkg.readStringFloatMap();
    }

    // Inner Player Data Buffer
    let playerData = null;
    if (pkg.readBool()) {
      const playerDataLen = pkg.readInt32();
      const pReader = new ZPackageReader(pkg.readBytes(playerDataLen));
      const pVersion = pReader.readInt32();

      let maxHealth = 25, health = 25, stamina = 50, timeSinceDeath = 0;
      let guardianPower = '', guardianPowerCooldown = 0;

      if (pVersion >= 7) maxHealth = pReader.readFloat();
      health = pReader.readFloat();
      if (pVersion >= 10) stamina = pReader.readFloat();
      if (pVersion >= 20) timeSinceDeath = pReader.readFloat();
      if (pVersion >= 23) guardianPower = pReader.readString();
      if (pVersion >= 24) guardianPowerCooldown = pReader.readFloat();

      // Inventory
      const invVersion = pReader.readInt32();
      const invCount = pReader.readInt32();
      const inventory = [];
      for (let i = 0; i < invCount; i++) {
        const name = pReader.readString();
        const stack = pReader.readInt32();
        const durability = Number(pReader.readFloat().toFixed(1));
        const pos = pReader.readVector2i();
        const equipped = pReader.readBool();
        const quality = invVersion >= 101 ? pReader.readInt32() : 1;
        const variant = invVersion >= 102 ? pReader.readInt32() : 0;
        const crafterId = invVersion >= 103 ? pReader.readInt64().toString() : '0';
        const crafterName = invVersion >= 103 ? pReader.readString() : '';
        const customData = invVersion >= 104 ? pReader.readMap() : {};
        const worldLevel = invVersion >= 105 ? pReader.readInt32() : 0;
        const pickedUp = invVersion >= 106 ? pReader.readBool() : true;

        inventory.push({
          name,
          stack,
          durability,
          pos,
          equipped,
          quality,
          variant,
          crafterId,
          crafterName,
          customData,
          worldLevel,
          pickedUp
        });
      }

      // Recipes, materials, stations, etc.
      const knownRecipes = pReader.readStringSet();
      const knownStationsCount = pReader.readInt32();
      const knownStations = {};
      for (let i = 0; i < knownStationsCount; i++) {
        knownStations[pReader.readString()] = pReader.readInt32();
      }

      const knownMaterials = pReader.readStringSet();
      const shownTutorials = pReader.readStringSet();
      const uniques = pReader.readStringSet();
      const trophies = pReader.readStringSet();

      const knownBiomesCount = pReader.readInt32();
      const knownBiomes = [];
      for (let i = 0; i < knownBiomesCount; i++) {
        const bId = pReader.readInt32();
        knownBiomes.push({ id: bId, name: BIOME_NAMES[bId] || `Unknown (${bId})` });
      }

      const knownTextsCount = pReader.readInt32();
      const knownTexts = {};
      for (let i = 0; i < knownTextsCount; i++) {
        knownTexts[pReader.readString()] = pReader.readString();
      }

      // Appearance
      const beardItem = pReader.readString();
      const hairItem = pReader.readString();
      const skinColor = pReader.readVector3();
      const hairColor = pReader.readVector3();
      const modelIndex = pReader.readInt32();

      // Foods
      const foodsCount = pReader.readInt32();
      const foods = [];
      for (let i = 0; i < foodsCount; i++) {
        foods.push({
          name: pReader.readString(),
          time: Number(pReader.readFloat().toFixed(1))
        });
      }

      // Skills
      const skillsVersion = pReader.readInt32();
      const skillsCount = pReader.readInt32();
      const skills = {};
      for (let i = 0; i < skillsCount; i++) {
        const skillId = pReader.readInt32();
        const skillName = SKILL_NAMES[skillId] || `Skill_${skillId}`;
        const level = Number(pReader.readFloat().toFixed(2));
        const accumulator = Number(pReader.readFloat().toFixed(2));
        skills[skillName] = { skillId, level, accumulator };
      }

      let customData = {};
      if (pVersion >= 26) {
        customData = pReader.readMap();
      }

      let stamina2 = 0, maxEitr = 0, eitr = 0;
      if (pVersion >= 26) {
        stamina2 = Number(pReader.readFloat().toFixed(2));
        maxEitr = Number(pReader.readFloat().toFixed(2));
        eitr = Number(pReader.readFloat().toFixed(2));
      }

      playerData = {
        version: pVersion,
        maxHealth: Number(maxHealth.toFixed(1)),
        health: Number(health.toFixed(1)),
        stamina: Number(stamina.toFixed(1)),
        stamina2,
        maxEitr,
        eitr,
        timeSinceDeath: Number(timeSinceDeath.toFixed(1)),
        guardianPower,
        guardianPowerCooldown: Number(guardianPowerCooldown.toFixed(1)),
        appearance: { beardItem, hairItem, skinColor, hairColor, modelIndex },
        foods,
        inventory,
        skills,
        knownRecipesCount: knownRecipes.length,
        knownRecipes,
        knownStations,
        knownMaterialsCount: knownMaterials.length,
        knownMaterials,
        shownTutorialsCount: shownTutorials.length,
        shownTutorials,
        uniques,
        trophiesCount: trophies.length,
        trophies,
        knownBiomes,
        knownTextsCount: Object.keys(knownTexts).length,
        customData
      };
    }

    const result = {
      saveVersion,
      playerName,
      playerId,
      startSeed: startSeed || 'None',
      summaryStats: {
        kills,
        deaths,
        crafts,
        builds
      },
      worldsCount: worlds.length,
      worlds,
      worldPlaytimes,
      playerStatsMaps,
      playerData
    };

    // Print summary to console
    console.log('\n============================================================');
    console.log(`  VALHEIM CHARACTER DECODER: ${resolvedPath}`);
    console.log('============================================================');
    console.log(`Character Name  : ${playerName}`);
    console.log(`Player ID       : ${playerId}`);
    console.log(`Save Version    : ${saveVersion}`);
    console.log(`Start Seed      : ${startSeed || 'None'}`);
    console.log(`Stats Summary   : ${kills} Kills | ${deaths} Deaths | ${crafts} Crafts | ${builds} Builds`);
    if (playerData) {
      console.log(`Health          : ${playerData.health} / ${playerData.maxHealth}`);
      console.log(`Stamina         : ${playerData.stamina} (Extra: ${playerData.stamina2})`);
      console.log(`Eitr (Magic)    : ${playerData.eitr} / ${playerData.maxEitr}`);
      console.log(`Guardian Power  : ${playerData.guardianPower || 'None'} (Cooldown: ${playerData.guardianPowerCooldown}s)`);
      console.log(`Active Foods    : ${playerData.foods.map(f => `${f.name} (${f.time}s)`).join(', ') || 'None'}`);
      console.log(`Appearance      : Beard="${playerData.appearance.beardItem}", Hair="${playerData.appearance.hairItem}", Model=${playerData.appearance.modelIndex}`);
      console.log(`Known Content   : ${playerData.knownRecipesCount} Recipes | ${playerData.knownMaterialsCount} Materials | ${playerData.trophiesCount} Trophies`);
      console.log(`Inventory Items : ${playerData.inventory.length} items`);
    }

    console.log('\n--- Equipped Equipment ---');
    if (playerData) {
      const equipped = playerData.inventory.filter(i => i.equipped);
      if (equipped.length === 0) {
        console.log('  (No equipped items)');
      } else {
        for (const it of equipped) {
          const crafter = it.crafterName ? ` [Crafted by ${it.crafterName}]` : '';
          console.log(`  * ${it.name} (Quality ${it.quality}, Durability: ${it.durability})${crafter}`);
        }
      }
    }

    console.log('\n--- Skills Summary ---');
    if (playerData) {
      for (const [sName, sData] of Object.entries(playerData.skills)) {
        if (sData.level > 0) {
          console.log(`  * ${sName.padEnd(16)}: Level ${sData.level} (Accumulator: ${sData.accumulator})`);
        }
      }
    }

    console.log('\n--- Associated Worlds & Maps ---');
    for (let w = 0; w < worlds.length; w++) {
      const wData = worlds[w];
      const pinInfo = wData.mapData ? `${wData.mapData.pinsCount} pins, ${wData.mapData.textureSize}x${wData.mapData.textureSize} map` : 'No map';
      console.log(`  [World ${w + 1}] ID: ${wData.worldKey} | Spawn: (${wData.spawnPoint.x}, ${wData.spawnPoint.y}, ${wData.spawnPoint.z}) | ${pinInfo}`);
    }
    console.log('============================================================\n');

    // Export JSON file if requested or by default alongside the .fch
    const outJsonPath = options.outPath || resolvedPath.replace(/\.fch$/i, '.json');
    fs.writeFileSync(outJsonPath, JSON.stringify(result, (key, value) => {
      if (key === 'explored' || key === 'exploredOthers') return undefined; // omit raw binary image textures from JSON
      return value;
    }, 2), 'utf8');
    console.log(`Successfully exported decoded data to: ${outJsonPath}\n`);

    return result;
  } catch (error) {
    console.error(`Parsing stopped: ${error.message}`);
    console.error(error.stack);
    return null;
  }
}

const targetFile = process.argv[2];
if (!targetFile) {
  console.log('Usage: node decode_fch.js <path_to_character.fch> [output.json]');
} else {
  const outPath = process.argv[3];
  parseValheimFch(targetFile, { outPath });
}

module.exports = { parseValheimFch, ZPackageReader };