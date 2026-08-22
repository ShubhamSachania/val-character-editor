// Valheim Item Database & Official Game Icon Assets
const VALHEIM_ITEMS = [
  // MELEE WEAPONS - SWORDS
  { id: 'SwordBlackmetal', name: 'Blackmetal Sword', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/SwordBlackmetal.png', desc: 'Deadly blade forged of refined black metal.' },
  { id: 'SwordSilver', name: 'Silver Sword', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 250, icon: 'icons/SwordSilver.png', desc: 'Glints with silver power, highly effective against undead.' },
  { id: 'SwordIron', name: 'Iron Sword', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 200, icon: 'icons/SwordIron.png', desc: 'A sturdy iron blade for hacking foes.' },
  { id: 'SwordBronze', name: 'Bronze Sword', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 200, icon: 'icons/SwordBronze.png', desc: 'A heavy bronze blade.' },
  { id: 'SwordMistwalker', name: 'Mistwalker', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/SwordMistwalker.png', desc: 'Shrouded in mist, deals frost and slash damage.' },
  { id: 'SwordFlametal', name: 'Dyrnwyn (Flametal Sword)', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 350, icon: 'icons/SwordFlametal.png', desc: 'Burning sword forged from ashlands ore.' },

  // MELEE WEAPONS - ATGEIRS & POLEARMS
  { id: 'AtgeirBlackmetal', name: 'Blackmetal Atgeir', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/AtgeirBlackmetal.png', desc: 'Long-reaching polearm with a sweeping secondary attack.' },
  { id: 'AtgeirIron', name: 'Iron Atgeir', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 225, icon: 'icons/AtgeirIron.png', desc: 'Iron polearm with broad sweeping arc.' },
  { id: 'AtgeirBronze', name: 'Bronze Atgeir', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 175, icon: 'icons/AtgeirBronze.png', desc: 'Bronze polearm for crowd control.' },
  { id: 'AtgeirHimminAfl', name: 'Himmin Afl', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 350, icon: 'icons/AtgeirHimminAfl.png', desc: 'Infused with lightning and raw magical force.' },

  // MELEE WEAPONS - CLUBS & MACES
  { id: 'MaceSilver', name: 'Frostner', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 250, icon: 'icons/MaceSilver.png', desc: 'A legendary silver hammer glowing with frost and spirit.' },
  { id: 'MaceIron', name: 'Iron Mace', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 200, icon: 'icons/MaceIron.png', desc: 'Heavy iron mace, devastating against skeletons and blobs.' },
  { id: 'MaceBronze', name: 'Bronze Mace', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 200, icon: 'icons/MaceBronze.png', desc: 'Hardened bronze spiked club.' },
  { id: 'Club', name: 'Wooden Club', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 100, icon: 'icons/Club.png', desc: 'Crude wooden bludgeon.' },
  { id: 'MaceNeedle', name: 'Porcupine', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 250, icon: 'icons/MaceNeedle.png', desc: 'Deadly morningstar studded with Deathsquito needles.' },
  { id: 'Demolisher', name: 'Demolisher', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/Demolisher.png', desc: 'Colossal two-handed sledge that shatters the earth.' },

  // MELEE WEAPONS - AXES
  { id: 'AxeBlackMetal', name: 'Blackmetal Axe', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/AxeBlackMetal.png', desc: 'A vicious combat axe that cuts through foes and ancient wood.' },
  { id: 'AxeIron', name: 'Iron Axe', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 225, icon: 'icons/AxeIron.png', desc: 'Strong iron axe for felling trees and splitting skulls.' },
  { id: 'AxeBronze', name: 'Bronze Axe', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 175, icon: 'icons/AxeBronze.png', desc: 'Can fell birch and oak trees.' },
  { id: 'AxeFlint', name: 'Flint Axe', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 100, icon: 'icons/AxeFlint.png', desc: 'Basic flint woodchopping axe.' },
  { id: 'AxeStone', name: 'Stone Axe', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 100, icon: 'icons/AxeStone.png', desc: 'Primitive starter axe.' },
  { id: 'AxeJotunBane', name: 'Jotun Bane', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/AxeJotunBane.png', desc: 'Drips with concentrated bile and poison.' },

  // BOWS & CROSSBOWS
  { id: 'BowDraugrFang', name: 'Draugr Fang', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 250, icon: 'icons/BowDraugrFang.png', desc: 'Infuses every arrow with glowing poison.' },
  { id: 'BowHuntsman', name: 'Huntsman Bow', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 200, icon: 'icons/BowHuntsman.png', desc: 'A quiet, long-range iron hunting bow.' },
  { id: 'BowFineWood', name: 'Finewood Bow', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 150, icon: 'icons/BowFineWood.png', desc: 'Crafted from flexible fine wood.' },
  { id: 'CrossbowArbalest', name: 'Arbalest', category: 'Weapons', maxStack: 1, maxQuality: 4, durability: 250, icon: 'icons/CrossbowArbalest.png', desc: 'Heavy mechanical crossbow with extreme piercing power.' },

  // AMMUNITION
  { id: 'ArrowObsidian', name: 'Obsidian Arrow', category: 'Ammo', maxStack: 100, maxQuality: 1, durability: 100, icon: 'icons/ArrowObsidian.png', desc: 'Sharp glass-like obsidian arrowheads.' },
  { id: 'ArrowNeedle', name: 'Needle Arrow', category: 'Ammo', maxStack: 100, maxQuality: 1, durability: 100, icon: 'icons/ArrowNeedle.png', desc: 'Pierces deep with death needle tips.' },
  { id: 'ArrowFrost', name: 'Frost Arrow', category: 'Ammo', maxStack: 100, maxQuality: 1, durability: 100, icon: 'icons/ArrowFrost.png', desc: 'Freezes and slows targets upon impact.' },
  { id: 'ArrowPoison', name: 'Poison Arrow', category: 'Ammo', maxStack: 100, maxQuality: 1, durability: 100, icon: 'icons/ArrowPoison.png', desc: 'Dripping with venom.' },
  { id: 'ArrowFire', name: 'Fire Arrow', category: 'Ammo', maxStack: 100, maxQuality: 1, durability: 100, icon: 'icons/ArrowFire.png', desc: 'Ignites enemies in flames.' },
  { id: 'ArrowFlint', name: 'Flint Arrow', category: 'Ammo', maxStack: 100, maxQuality: 1, durability: 100, icon: 'icons/ArrowFlint.png', desc: 'Standard flint tipped arrows.' },
  { id: 'ArrowWood', name: 'Wood Arrow', category: 'Ammo', maxStack: 100, maxQuality: 1, durability: 100, icon: 'icons/ArrowWood.png', desc: 'Basic wooden practice arrows.' },
  { id: 'BoltCarapace', name: 'Carapace Bolt', category: 'Ammo', maxStack: 100, maxQuality: 1, durability: 100, icon: 'icons/BoltCarapace.png', desc: 'Heavy arbalest bolts tipped in insect armor.' },

  // MAGIC & EITR WEAPONS
  { id: 'StaffFireball', name: 'Staff of Embers', category: 'Magic', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/StaffFireball.png', desc: 'Hurls explosive fireballs fueled by Eitr.' },
  { id: 'StaffIceShards', name: 'Staff of Frost', category: 'Magic', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/StaffIceShards.png', desc: 'Unleashes a rapid stream of freezing ice shards.' },
  { id: 'StaffShield', name: 'Staff of Protection', category: 'Magic', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/StaffShield.png', desc: 'Envelops the caster in a blood shield.' },
  { id: 'StaffSkeleton', name: 'Dead Raiser', category: 'Magic', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/StaffSkeleton.png', desc: 'Summons skeletal minions to fight at your command.' },

  // SHIELDS
  { id: 'ShieldBlackmetal', name: 'Blackmetal Shield', category: 'Shields', maxStack: 1, maxQuality: 3, durability: 300, icon: 'icons/ShieldBlackmetal.png', desc: 'High block armor forged of black metal.' },
  { id: 'ShieldSilver', name: 'Silver Shield', category: 'Shields', maxStack: 1, maxQuality: 3, durability: 250, icon: 'icons/ShieldSilver.png', desc: 'Elegant and durable silver round shield.' },
  { id: 'ShieldIronTower', name: 'Iron Tower Shield', category: 'Shields', maxStack: 1, maxQuality: 3, durability: 250, icon: 'icons/ShieldIronTower.png', desc: 'Massive defense against heavy assaults.' },
  { id: 'ShieldCarapace', name: 'Carapace Shield', category: 'Shields', maxStack: 1, maxQuality: 3, durability: 350, icon: 'icons/ShieldCarapace.png', desc: 'Hardened bug chitin shield with superb parry.' },

  // ARMOR - PADDED (Plains tier)
  { id: 'HelmetPadded', name: 'Padded Helmet', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1000, icon: 'icons/HelmetPadded.png', desc: 'Reinforced with iron and woven linen.' },
  { id: 'ArmorPaddedCuirass', name: 'Padded Cuirass', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1200, icon: 'icons/ArmorPaddedCuirass.png', desc: 'Top tier heavy chest armor before Mistlands.' },
  { id: 'ArmorPaddedGreaves', name: 'Padded Greaves', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1000, icon: 'icons/ArmorPaddedGreaves.png', desc: 'Padded leg guards with iron plates.' },
  { id: 'CapeLinen', name: 'Linen Cape', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1200, icon: 'icons/CapeLinen.png', desc: 'A regal flowing linen cloak.' },

  // ARMOR - CARAPACE & EITR (Mistlands tier)
  { id: 'HelmetCarapace', name: 'Carapace Helmet', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1200, icon: 'icons/HelmetCarapace.png', desc: 'Forged from black marble and Seeker chitin.' },
  { id: 'ArmorCarapaceCuirass', name: 'Carapace Breastplate', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1400, icon: 'icons/ArmorCarapaceCuirass.png', desc: 'Heaviest standard armor in the Mistlands.' },
  { id: 'ArmorCarapaceGreaves', name: 'Carapace Greaves', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1200, icon: 'icons/ArmorCarapaceGreaves.png', desc: 'Incredibly tough chitin greaves.' },
  { id: 'HelmetMage', name: 'Eitr-weave Hood', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1000, icon: 'icons/HelmetMage.png', desc: 'Empowers magic with 20% Eitr regeneration.' },
  { id: 'ArmorMageChest', name: 'Eitr-weave Robe', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1000, icon: 'icons/ArmorMageChest.png', desc: 'Woven with refined Eitr threads.' },
  { id: 'ArmorMageLegs', name: 'Eitr-weave Trousers', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1000, icon: 'icons/ArmorMageLegs.png', desc: 'Infused with mystical energy.' },
  { id: 'CapeFeather', name: 'Feather Cape', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1200, icon: 'icons/CapeFeather.png', desc: 'Grants Slow Fall (no fall damage) and frost resistance.' },
  { id: 'CapeWolf', name: 'Wolf Cape', category: 'Armor', maxStack: 1, maxQuality: 4, durability: 1000, icon: 'icons/CapeWolf.png', desc: 'Thick fur cloak that keeps you warm in freezing blizzards.' },

  // TOOLS
  { id: 'PickaxeIron', name: 'Iron Pickaxe', category: 'Tools', maxStack: 1, maxQuality: 4, durability: 300, icon: 'icons/PickaxeIron.png', desc: 'Mines silver, obsidian, and iron deposits.' },
  { id: 'PickaxeBlackMetal', name: 'Blackmetal Pickaxe', category: 'Tools', maxStack: 1, maxQuality: 4, durability: 350, icon: 'icons/PickaxeBlackMetal.png', desc: 'Superior mining tool.' },
  { id: 'Hammer', name: 'Hammer', category: 'Tools', maxStack: 1, maxQuality: 3, durability: 300, icon: 'icons/Hammer.png', desc: 'Essential tool for constructing shelters, bases, and furniture.' },
  { id: 'Hoe', name: 'Hoe', category: 'Tools', maxStack: 1, maxQuality: 3, durability: 200, icon: 'icons/Hoe.png', desc: 'Flattens and raises terrain.' },
  { id: 'Cultivator', name: 'Cultivator', category: 'Tools', maxStack: 1, maxQuality: 3, durability: 200, icon: 'icons/Cultivator.png', desc: 'Prepares soil and plants seeds.' },
  { id: 'FishingRod', name: 'Fishing Rod', category: 'Tools', maxStack: 1, maxQuality: 1, durability: 100, icon: 'icons/FishingRod.png', desc: 'Purchased from Haldor to catch ocean fish.' },

  // ACCESSORIES
  { id: 'BeltStrength', name: 'Megingjord (Belt of Strength)', category: 'Accessories', maxStack: 1, maxQuality: 1, durability: 100, icon: 'icons/BeltStrength.png', desc: 'Increases carry weight capacity by +150.' },
  { id: 'Demister', name: 'Wisplight', category: 'Accessories', maxStack: 1, maxQuality: 1, durability: 100, icon: 'icons/Demister.png', desc: 'Summons a loyal wisp that clears thick mist.' },
  { id: 'Wishbone', name: 'Wishbone', category: 'Accessories', maxStack: 1, maxQuality: 1, durability: 100, icon: 'icons/Wishbone.png', desc: 'Pulses and chimes when buried silver or treasure is near.' },
  { id: 'TrinketBronzeHealth', name: 'Bronze Health Trinket', category: 'Accessories', maxStack: 1, maxQuality: 1, durability: 100, icon: 'icons/TrinketBronzeHealth.png', desc: 'Boosts max vitality.' },

  // FOODS
  { id: 'SerpentStew', name: 'Serpent Stew', category: 'Food', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/SerpentStew.png', desc: 'Hearty meat stew (+80 Health, +26 Stamina).' },
  { id: 'BloodPudding', name: 'Blood Pudding', category: 'Food', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/BloodPudding.png', desc: 'Rich in iron and stamina (+25 Health, +75 Stamina).' },
  { id: 'LoxPie', name: 'Lox Meat Pie', category: 'Food', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/LoxPie.png', desc: 'Delicious baked pie (+75 Health, +24 Stamina).' },
  { id: 'FishAndBread', name: 'Fish Wraps', category: 'Food', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/FishAndBread.png', desc: 'Crispy fish wrapped in bread (+70 Health, +23 Stamina).' },
  { id: 'MeatPlatter', name: 'Meat Platter', category: 'Food', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/MeatPlatter.png', desc: 'High tier Mistlands feast (+80 Health, +26 Stamina).' },
  { id: 'MushroomMagecap', name: 'Magecap Mushroom', category: 'Food', maxStack: 20, maxQuality: 1, durability: 100, icon: 'icons/MushroomMagecap.png', desc: 'Blue glowing fungus rich in magic (+25 Health, +85 Eitr).' },
  { id: 'MushroomStuffed', name: 'Stuffed Mushroom', category: 'Food', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/MushroomStuffed.png', desc: 'Savory Mistlands dish (+25 Health, +75 Eitr).' },
  { id: 'YggdrasilPorridge', name: 'Yggdrasil Porridge', category: 'Food', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/YggdrasilPorridge.png', desc: 'Infused with sap (+27 Health, +80 Eitr).' },
  { id: 'Cloudberry', name: 'Cloudberries', category: 'Food', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/Cloudberry.png', desc: 'Golden sweet berry of the Plains (+13 Health, +40 Stamina).' },

  // MATERIALS & METALS
  { id: 'BlackMetal', name: 'Blackmetal Bar', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/BlackMetal.png', desc: 'Smelted from black metal scrap found on Fulings.' },
  { id: 'Silver', name: 'Silver Bar', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/Silver.png', desc: 'Pure silver mined from Mountain peaks.' },
  { id: 'Iron', name: 'Iron Bar', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/Iron.png', desc: 'Essential metal smelted from sunken crypt scrap.' },
  { id: 'Bronze', name: 'Bronze Bar', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/Bronze.png', desc: 'Alloy forged from 2 copper and 1 tin.' },
  { id: 'Copper', name: 'Copper Bar', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/Copper.png', desc: 'Smelted copper ore.' },
  { id: 'Tin', name: 'Tin Bar', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/Tin.png', desc: 'Smelted tin ore.' },
  { id: 'Flametal', name: 'Flametal Bar', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/Flametal.png', desc: 'Glowing fiery metal from Ashlands.' },
  { id: 'Eitr', name: 'Refined Eitr', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/Eitr.png', desc: 'Pulsing arcane essence distilled in a refinery.' },
  { id: 'Carapace', name: 'Carapace', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/Carapace.png', desc: 'Tough chitin harvested from Seekers.' },
  { id: 'BlackMarble', name: 'Black Marble', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/BlackMarble.png', desc: 'Dense dark stone used for ancient structures.' },
  { id: 'YggdrasilWood', name: 'Yggdrasil Wood', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/YggdrasilWood.png', desc: 'Sacred branches of the world tree.' },
  { id: 'Wood', name: 'Wood', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/Wood.png', desc: 'Standard timber for building and fires.' },
  { id: 'FineWood', name: 'Fine Wood', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/FineWood.png', desc: 'Smooth timber from birch and oak.' },
  { id: 'CoreWood', name: 'Core Wood', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/CoreWood.png', desc: 'Sturdy pine logs.' },
  { id: 'Stone', name: 'Stone', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/Stone.png', desc: 'Heavy stone for foundations and walls.' },
  { id: 'Obsidian', name: 'Obsidian', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/Obsidian.png', desc: 'Volcanic glass.' },
  { id: 'Flint', name: 'Flint', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/Flint.png', desc: 'Sharp coastal stone.' },
  { id: 'Resin', name: 'Resin', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/Resin.png', desc: 'Sticky sap used for torches and glue.' },
  { id: 'Feathers', name: 'Feathers', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/Feathers.png', desc: 'Used to fletch arrows.' },
  { id: 'Coins', name: 'Coins (Gold)', category: 'Materials', maxStack: 999, maxQuality: 1, durability: 100, icon: 'icons/Coins.png', desc: 'Valheim currency accepted by traders.' },
  { id: 'Ruby', name: 'Ruby', category: 'Materials', maxStack: 20, maxQuality: 1, durability: 100, icon: 'icons/Ruby.png', desc: 'Valuable red gemstone.' },
  { id: 'Amber', name: 'Amber', category: 'Materials', maxStack: 20, maxQuality: 1, durability: 100, icon: 'icons/Amber.png', desc: 'Fossilized golden tree resin.' },
  { id: 'CopperScrap', name: 'Copper Scrap', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/CopperScrap.png', desc: 'Weathered scrap from Mistlands ruins.' },
  { id: 'BlackMetalScrap', name: 'Blackmetal Scrap', category: 'Materials', maxStack: 30, maxQuality: 1, durability: 100, icon: 'icons/BlackMetalScrap.png', desc: 'Scrap carried by Fulings.' },
  { id: 'BugMeat', name: 'Seeker Meat', category: 'Food', maxStack: 20, maxQuality: 1, durability: 100, icon: 'icons/BugMeat.png', desc: 'Succulent meat from giant Mistlands bugs.' },
  { id: 'GiantBloodSack', name: 'Bloodbag', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/GiantBloodSack.png', desc: 'Harvested from Swamp leeches.' },
  { id: 'BoneFragments', name: 'Bone Fragments', category: 'Materials', maxStack: 50, maxQuality: 1, durability: 100, icon: 'icons/BoneFragments.png', desc: 'Crushed skeleton remains.' },

  // TROPHIES & BOSS TOKENS
  { id: 'TrophyBonemass', name: 'Bonemass Trophy', category: 'Trophies', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/TrophyBonemass.png', desc: 'Gruesome trophy of the Swamp lord.' },
  { id: 'TrophyEikthyr', name: 'Eikthyr Trophy', category: 'Trophies', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/TrophyEikthyr.png', desc: 'Antlered head of the Meadow beast.' },
  { id: 'TrophyTheElder', name: 'The Elder Trophy', category: 'Trophies', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/TrophyTheElder.png', desc: 'Living wood trophy of the Forest master.' },
  { id: 'TrophyDragonQueen', name: 'Moder Trophy', category: 'Trophies', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/TrophyDragonQueen.png', desc: 'Mother dragon skull.' },
  { id: 'TrophyGoblinKing', name: 'Yagluth Trophy', category: 'Trophies', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/TrophyGoblinKing.png', desc: 'Crown of the fallen Plains sorcerer.' },
  { id: 'TrophySeekerQueen', name: 'The Queen Trophy', category: 'Trophies', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/TrophySeekerQueen.png', desc: 'The ruler of the infested citadels.' },
  { id: 'TrophyFrostTroll', name: 'Troll Trophy', category: 'Trophies', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/TrophyFrostTroll.png', desc: 'Massive blue head of a troll.' },
  { id: 'TrophyDeathsquito', name: 'Deathsquito Trophy', category: 'Trophies', maxStack: 10, maxQuality: 1, durability: 100, icon: 'icons/TrophyDeathsquito.png', desc: 'Vicious flying stinger.' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VALHEIM_ITEMS };
}
