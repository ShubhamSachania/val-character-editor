const crypto = require('crypto');
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

const SKILL_IDS = {};
for (const [id, name] of Object.entries(SKILL_NAMES)) {
  SKILL_IDS[name.toLowerCase()] = parseInt(id, 10);
}

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

class ZPackageWriter {
  constructor() {
    this.chunks = [];
  }

  writeByte(val) {
    const buf = Buffer.alloc(1);
    buf.writeUInt8(val & 0xff, 0);
    this.chunks.push(buf);
  }

  writeBool(val) {
    this.writeByte(val ? 1 : 0);
  }

  writeInt32(val) {
    const buf = Buffer.alloc(4);
    buf.writeInt32LE(val, 0);
    this.chunks.push(buf);
  }

  writeInt64(val) {
    const buf = Buffer.alloc(8);
    buf.writeBigInt64LE(BigInt(val), 0);
    this.chunks.push(buf);
  }

  writeFloat(val) {
    const buf = Buffer.alloc(4);
    buf.writeFloatLE(Number(val), 0);
    this.chunks.push(buf);
  }

  writeVector3(vec) {
    this.writeFloat(vec ? vec.x : 0);
    this.writeFloat(vec ? vec.y : 0);
    this.writeFloat(vec ? vec.z : 0);
  }

  writeVector2i(vec) {
    this.writeInt32(vec ? vec.x : 0);
    this.writeInt32(vec ? vec.y : 0);
  }

  write7BitEncodedInt(val) {
    let num = val;
    while (num >= 0x80) {
      this.writeByte((num & 0x7f) | 0x80);
      num = num >> 7;
    }
    this.writeByte(num & 0x7f);
  }

  writeString(str) {
    if (!str) {
      this.write7BitEncodedInt(0);
      return;
    }
    const strBuf = Buffer.from(str, 'utf8');
    this.write7BitEncodedInt(strBuf.length);
    this.chunks.push(strBuf);
  }

  writeBytes(buf) {
    if (buf && buf.length > 0) {
      this.chunks.push(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
    }
  }

  writeLengthPrefixedByteArray(buf) {
    if (!buf) {
      this.writeInt32(0);
      return;
    }
    const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
    this.writeInt32(b.length);
    this.chunks.push(b);
  }

  writeStringSet(set) {
    const arr = Array.isArray(set) ? set : Array.from(set || []);
    this.writeInt32(arr.length);
    for (const s of arr) {
      this.writeString(s);
    }
  }

  writeMap(map) {
    const entries = Object.entries(map || {});
    this.writeInt32(entries.length);
    for (const [k, v] of entries) {
      this.writeString(k);
      this.writeString(v);
    }
  }

  writeStringFloatMap(map) {
    const entries = Object.entries(map || {});
    this.writeInt32(entries.length);
    for (const [k, v] of entries) {
      this.writeString(k);
      this.writeFloat(Number(v));
    }
  }

  getBuffer() {
    return Buffer.concat(this.chunks);
  }
}

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

function decodeFch(rawBuffer) {
  const reader = new ZPackageReader(rawBuffer);
  const packageLen = reader.readInt32();
  const pkg = new ZPackageReader(reader.readBytes(packageLen));

  const saveVersion = pkg.readInt32();
  let rawStats = [];
  let kills = 0, deaths = 0, crafts = 0, builds = 0;

  if (saveVersion >= 38) {
    const statsCount = pkg.readInt32();
    for (let i = 0; i < statsCount; i++) {
      rawStats.push(pkg.readFloat());
    }
    kills = rawStats[0] || 0;
    deaths = rawStats[1] || 0;
    crafts = rawStats[2] || 0;
    builds = rawStats[3] || 0;
  } else if (saveVersion >= 28) {
    kills = pkg.readInt32();
    deaths = pkg.readInt32();
    crafts = pkg.readInt32();
    builds = pkg.readInt32();
  }

  let preWorldsFlag = 0;
  if (saveVersion >= 38) {
    preWorldsFlag = pkg.readByte();
  }

  // Worlds
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
      const mapBytes = pkg.readBytes(mapBytesLen);
      const mapReader = new ZPackageReader(mapBytes);
      const mapVersion = mapReader.readInt32();
      let rawGzipBase64 = null;
      let minimapPkg;
      if (mapVersion >= 7) {
        const compLen = mapReader.readInt32();
        const compBytes = mapReader.readBytes(compLen);
        rawGzipBase64 = compBytes.toString('base64');
        const decomp = zlib.gunzipSync(compBytes);
        minimapPkg = new ZPackageReader(decomp);
      } else {
        minimapPkg = mapReader;
      }

      const textureSize = minimapPkg.readInt32();
      // Skip texture exploration raw bytes in memory
      minimapPkg.offset += textureSize * textureSize;
      if (mapVersion >= 5) {
        minimapPkg.offset += textureSize * textureSize;
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
      mapData = {
        mapVersion,
        textureSize,
        rawGzipBase64,
        rawMapBytesBase64: mapBytes.toString('base64'),
        pinsCount: pins.length,
        pins,
        visibleToOthers
      };
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

  // Profile Metadata
  const playerName = pkg.readString();
  const playerId = pkg.readInt64().toString();
  const startSeed = pkg.readString();

  let postSeedFlag = 0;
  let logoutTimestamp = '0';
  let worldPlaytimes = [];
  let playerStatsMaps = {
    worldModifiers: {},
    interactions: {},
    enemyKills: {},
    itemCrafts: {},
    itemUses: {}
  };

  if (saveVersion >= 38) {
    postSeedFlag = pkg.readByte();
    logoutTimestamp = pkg.readInt64().toString();
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

  // Player Data
  let playerData = null;
  const hasPlayerData = pkg.readBool();
  if (hasPlayerData) {
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

    const beardItem = pReader.readString();
    const hairItem = pReader.readString();
    const skinColor = pReader.readVector3();
    const hairColor = pReader.readVector3();
    const modelIndex = pReader.readInt32();

    const foodsCount = pReader.readInt32();
    const foods = [];
    for (let i = 0; i < foodsCount; i++) {
      foods.push({
        name: pReader.readString(),
        time: Number(pReader.readFloat().toFixed(1))
      });
    }

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
      inventoryVersion: invVersion,
      inventory,
      knownRecipes,
      knownStations,
      knownMaterials,
      shownTutorials,
      uniques,
      trophies,
      knownBiomes,
      knownTexts,
      appearance: { beardItem, hairItem, skinColor, hairColor, modelIndex },
      foods,
      skillsVersion,
      skills,
      customData
    };
  }

  return {
    saveVersion,
    rawStats,
    preWorldsFlag,
    summaryStats: { kills, deaths, crafts, builds },
    worlds,
    playerName,
    playerId,
    startSeed: startSeed || '',
    postSeedFlag,
    logoutTimestamp,
    worldPlaytimes,
    playerStatsMaps,
    hasPlayerData,
    playerData
  };
}

function encodeFch(data) {
  const pkg = new ZPackageWriter();
  const saveVersion = data.saveVersion || 43;
  pkg.writeInt32(saveVersion);

  if (saveVersion >= 38) {
    const rawStats = data.rawStats || [
      data.summaryStats?.kills || 0,
      data.summaryStats?.deaths || 0,
      data.summaryStats?.crafts || 0,
      data.summaryStats?.builds || 0
    ];
    pkg.writeInt32(rawStats.length);
    for (const st of rawStats) {
      pkg.writeFloat(st);
    }
    pkg.writeByte(data.preWorldsFlag !== undefined ? data.preWorldsFlag : 0);
  } else if (saveVersion >= 28) {
    pkg.writeInt32(data.summaryStats?.kills || 0);
    pkg.writeInt32(data.summaryStats?.deaths || 0);
    pkg.writeInt32(data.summaryStats?.crafts || 0);
    pkg.writeInt32(data.summaryStats?.builds || 0);
  }

  // Worlds
  const worlds = data.worlds || [];
  pkg.writeInt32(worlds.length);
  for (const w of worlds) {
    pkg.writeInt64(w.worldKey);
    pkg.writeBool(w.haveCustomSpawnPoint);
    pkg.writeVector3(w.spawnPoint);
    pkg.writeBool(w.hasLogoutPoint);
    pkg.writeVector3(w.logoutPoint);
    if (saveVersion >= 30) {
      pkg.writeBool(w.hasDeathPoint);
      pkg.writeVector3(w.deathPoint || { x: 0, y: 0, z: 0 });
    }
    pkg.writeVector3(w.homePoint || { x: 0, y: 0, z: 0 });

    if (saveVersion >= 29) {
      if (w.mapData) {
        pkg.writeBool(true);
        if (w.mapData.rawMapBytesBase64) {
          const rawMapBuf = Buffer.from(w.mapData.rawMapBytesBase64, 'base64');
          pkg.writeLengthPrefixedByteArray(rawMapBuf);
        } else if (w.mapData.rawGzipBase64) {
          const mapWriter = new ZPackageWriter();
          const mapVersion = w.mapData.mapVersion || 8;
          mapWriter.writeInt32(mapVersion);
          const gzBuf = Buffer.from(w.mapData.rawGzipBase64, 'base64');
          mapWriter.writeLengthPrefixedByteArray(gzBuf);
          pkg.writeLengthPrefixedByteArray(mapWriter.getBuffer());
        } else {
          const mapWriter = new ZPackageWriter();
          const mapVersion = w.mapData.mapVersion || 8;
          mapWriter.writeInt32(mapVersion);

          const minimapWriter = new ZPackageWriter();
          const textureSize = w.mapData.textureSize || 2048;
          minimapWriter.writeInt32(textureSize);

          const dummyExplored = Buffer.alloc(textureSize * textureSize);
          minimapWriter.writeBytes(dummyExplored);
          if (mapVersion >= 5) {
            minimapWriter.writeBytes(dummyExplored);
          }

          if (mapVersion >= 2) {
            const pins = w.mapData.pins || [];
            minimapWriter.writeInt32(pins.length);
            for (const p of pins) {
              minimapWriter.writeString(p.name || '');
              minimapWriter.writeVector3(p.pos);
              const pinTypeId = p.pinTypeId !== undefined ? p.pinTypeId : 0;
              minimapWriter.writeInt32(pinTypeId);
              if (mapVersion >= 3) minimapWriter.writeBool(p.checked);
              if (mapVersion >= 6) minimapWriter.writeInt64(p.ownerId || '0');
              if (mapVersion >= 8) minimapWriter.writeString(p.author || '');
            }
          }

          if (mapVersion >= 4) {
            minimapWriter.writeBool(w.mapData.visibleToOthers);
          }

          const rawMinimapBuf = minimapWriter.getBuffer();
          if (mapVersion >= 7) {
            const gz = zlib.gzipSync(rawMinimapBuf);
            mapWriter.writeLengthPrefixedByteArray(gz);
          } else {
            mapWriter.writeBytes(rawMinimapBuf);
          }

          const mapBuf = mapWriter.getBuffer();
          pkg.writeLengthPrefixedByteArray(mapBuf);
        }
      } else {
        pkg.writeBool(false);
      }
    }
  }

  // Profile metadata
  pkg.writeString(data.playerName || 'Viking');
  pkg.writeInt64(data.playerId || '0');
  pkg.writeString(data.startSeed || '');

  if (saveVersion >= 38) {
    pkg.writeByte(data.postSeedFlag !== undefined ? data.postSeedFlag : 0);
    pkg.writeInt64(data.logoutTimestamp || '0');
    const worldTimes = data.worldPlaytimes || [];
    pkg.writeInt32(worldTimes.length);
    for (const wt of worldTimes) {
      pkg.writeString(wt.worldName);
      pkg.writeFloat(wt.playtime);
    }

    const sm = data.playerStatsMaps || {};
    pkg.writeStringFloatMap(sm.worldModifiers || {});
    pkg.writeStringFloatMap(sm.interactions || {});
    pkg.writeStringFloatMap(sm.enemyKills || {});
    pkg.writeStringFloatMap(sm.itemCrafts || {});
    pkg.writeStringFloatMap(sm.itemUses || {});
  }

  // Player data
  if (data.playerData && data.hasPlayerData !== false) {
    pkg.writeBool(true);
    const pWriter = new ZPackageWriter();
    const pd = data.playerData;
    const pVersion = pd.version || 29;
    pWriter.writeInt32(pVersion);

    if (pVersion >= 7) pWriter.writeFloat(pd.maxHealth || 25);
    pWriter.writeFloat(pd.health || 25);
    if (pVersion >= 10) pWriter.writeFloat(pd.stamina || 50);
    if (pVersion >= 20) pWriter.writeFloat(pd.timeSinceDeath || 0);
    if (pVersion >= 23) pWriter.writeString(pd.guardianPower || '');
    if (pVersion >= 24) pWriter.writeFloat(pd.guardianPowerCooldown || 0);

    // Inventory
    const invVersion = pd.inventoryVersion || 106;
    pWriter.writeInt32(invVersion);
    const items = pd.inventory || [];
    pWriter.writeInt32(items.length);
    for (const it of items) {
      pWriter.writeString(it.name || '');
      pWriter.writeInt32(it.stack || 1);
      pWriter.writeFloat(it.durability !== undefined ? it.durability : 100);
      pWriter.writeVector2i(it.pos || { x: 0, y: 0 });
      pWriter.writeBool(it.equipped);
      if (invVersion >= 101) pWriter.writeInt32(it.quality || 1);
      if (invVersion >= 102) pWriter.writeInt32(it.variant || 0);
      if (invVersion >= 103) {
        pWriter.writeInt64(it.crafterId || '0');
        pWriter.writeString(it.crafterName || '');
      }
      if (invVersion >= 104) pWriter.writeMap(it.customData || {});
      if (invVersion >= 105) pWriter.writeInt32(it.worldLevel || 0);
      if (invVersion >= 106) pWriter.writeBool(it.pickedUp !== false);
    }

    pWriter.writeStringSet(pd.knownRecipes || []);

    const knownStations = Object.entries(pd.knownStations || {});
    pWriter.writeInt32(knownStations.length);
    for (const [k, v] of knownStations) {
      pWriter.writeString(k);
      pWriter.writeInt32(v);
    }

    pWriter.writeStringSet(pd.knownMaterials || []);
    pWriter.writeStringSet(pd.shownTutorials || []);
    pWriter.writeStringSet(pd.uniques || []);
    pWriter.writeStringSet(pd.trophies || []);

    const knownBiomes = pd.knownBiomes || [];
    pWriter.writeInt32(knownBiomes.length);
    for (const b of knownBiomes) {
      pWriter.writeInt32(typeof b === 'object' ? b.id : b);
    }

    const knownTexts = Object.entries(pd.knownTexts || {});
    pWriter.writeInt32(knownTexts.length);
    for (const [k, v] of knownTexts) {
      pWriter.writeString(k);
      pWriter.writeString(v);
    }

    const app = pd.appearance || {};
    pWriter.writeString(app.beardItem || 'BeardNone');
    pWriter.writeString(app.hairItem || 'HairNone');
    pWriter.writeVector3(app.skinColor || { x: 1, y: 1, z: 1 });
    pWriter.writeVector3(app.hairColor || { x: 0.1, y: 0.05, z: 0.03 });
    pWriter.writeInt32(app.modelIndex || 0);

    const foods = pd.foods || [];
    pWriter.writeInt32(foods.length);
    for (const f of foods) {
      pWriter.writeString(f.name);
      pWriter.writeFloat(f.time || 1000);
    }

    // Skills
    const skillsVersion = pd.skillsVersion || 2;
    pWriter.writeInt32(skillsVersion);
    const skillsEntries = Object.entries(pd.skills || {});
    pWriter.writeInt32(skillsEntries.length);
    for (const [sKey, sVal] of skillsEntries) {
      const sId = sVal.skillId !== undefined ? sVal.skillId : (SKILL_IDS[sKey.toLowerCase()] !== undefined ? SKILL_IDS[sKey.toLowerCase()] : parseInt(sKey, 10));
      pWriter.writeInt32(sId);
      pWriter.writeFloat(sVal.level || 0);
      pWriter.writeFloat(sVal.accumulator || 0);
    }

    if (pVersion >= 26) {
      pWriter.writeMap(pd.customData || {});
      pWriter.writeFloat(pd.stamina2 || 0);
      pWriter.writeFloat(pd.maxEitr || 0);
      pWriter.writeFloat(pd.eitr || 0);
    }

    const pBuf = pWriter.getBuffer();
    pkg.writeLengthPrefixedByteArray(pBuf);
  } else {
    pkg.writeBool(false);
  }

  const payloadBuffer = pkg.getBuffer();

  // Outer Envelope with Length Prefix + SHA512 Checksum
  const finalWriter = new ZPackageWriter();
  finalWriter.writeInt32(payloadBuffer.length);
  finalWriter.writeBytes(payloadBuffer);

  const hash = crypto.createHash('sha512').update(payloadBuffer).digest();
  finalWriter.writeLengthPrefixedByteArray(hash);

  return finalWriter.getBuffer();
}

module.exports = {
  decodeFch,
  encodeFch,
  SKILL_NAMES,
  SKILL_IDS,
  BIOME_NAMES,
  PIN_TYPE_NAMES,
  ZPackageReader,
  ZPackageWriter
};
