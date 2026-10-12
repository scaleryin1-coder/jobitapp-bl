// All 20 main categories and their specific issues/sub-categories
export const ALL_MAIN_CATEGORIES = [
  {
    id: 'cat_electrician',
    name: 'Electrician',
    icon: '⚡',
    color: '#FEF3C7',
    basePrice: 299,
    subCategories: [
      'Wiring & Short Circuit Fix',
      'Switch, Socket & Plug Setup',
      'Fan Installation & Repair',
      'MCB, Fuse & Inverter Connection',
      'Light Fixture & Chandelier Setup',
      'Appliance Power Point Fix'
    ]
  },
  {
    id: 'cat_ac',
    name: 'AC Service',
    icon: '❄️',
    color: '#E0F7FA',
    basePrice: 450,
    subCategories: [
      'AC Service',
      'AC Repair',
      'AC Installation',
      'AC Gas Filling',
      'AC Uninstallation',
      'Cooling Coil Jet Cleaning'
    ]
  },
  {
    id: 'cat_plumber',
    name: 'Plumber',
    icon: '🔧',
    color: '#E0F2FE',
    basePrice: 300,
    subCategories: [
      'Tap & Mixer Repair',
      'Pipe Leakage & Blockage',
      'Basin & Kitchen Sink Fix',
      'Toilet & Flush Tank Repair',
      'Water Motor & Pump Service',
      'Drainage & Waste Pipe Clearing'
    ]
  },
  {
    id: 'cat_carpenter',
    name: 'Carpenter',
    icon: '🪚',
    color: '#FEE2E2',
    basePrice: 350,
    subCategories: [
      'Furniture Repair & Assembly',
      'Door & Window Lock Fitting',
      'Cupboard & Drawer Hinge Fix',
      'Wood Polishing & Varnishing',
      'Bed & Wardrobe Making',
      'Curtain Rod & Wall Drilling'
    ]
  },
  {
    id: 'cat_painting',
    name: 'Painting',
    icon: '🎨',
    color: '#F3E8FF',
    basePrice: 499,
    subCategories: [
      'Wall Touch-up & Patch Painting',
      'Full Interior House Painting',
      'Exterior Weatherproof Coat',
      'Waterproofing & Damp Sealing',
      'Texture Design & Stencil Art',
      'Door, Grille & Wood Enamel'
    ]
  },
  {
    id: 'cat_construction',
    name: 'Construction',
    icon: '🏗️',
    color: '#FFF7ED',
    basePrice: 599,
    subCategories: [
      'Masonry & Brickwork Repair',
      'Wall Plastering & Crack Sealing',
      'Tile & Marble Floor Laying',
      'Bathroom Renovation Civil Work',
      'Wall Demolition & Debris Disposal',
      'Concrete Slab & Pillar Work'
    ]
  },
  {
    id: 'cat_welding',
    name: 'Welding',
    icon: '🔥',
    color: '#FFEDD5',
    basePrice: 399,
    subCategories: [
      'Main Gate & Grill Repair',
      'Window Safety Bar Welding',
      'Metal Shed & Truss Welding',
      'Rolling Shutter Spring Fix',
      'Custom Steel Furniture Weld',
      'On-site Spot Arc Welding'
    ]
  },
  {
    id: 'cat_aluminium',
    name: 'Aluminium Fabrication',
    icon: '🪟',
    color: '#F1F5F9',
    basePrice: 450,
    subCategories: [
      'Sliding Window Channel Repair',
      'Aluminium Partition & Cabins',
      'Mosquito Mesh Net Frame',
      'Glass Door & Hinge Adjustment',
      'Bathroom Aluminium Door Fitting',
      'Balcony Glazing & Louvers'
    ]
  },
  {
    id: 'cat_garden',
    name: 'Garden Work',
    icon: '🌿',
    color: '#DCFCE7',
    basePrice: 350,
    subCategories: [
      'Lawn Mowing & Grass Trimming',
      'Tree Pruning & Hedge Shaping',
      'Soil Manure & Fertilizer Mix',
      'Weeding & Garden Bed Cleaning',
      'Balcony Potting & Plant Setup',
      'Drip Irrigation Setup'
    ]
  },
  {
    id: 'cat_pest_control',
    name: 'Pest Control',
    icon: '🐜',
    color: '#FEF9C3',
    basePrice: 599,
    subCategories: [
      'Cockroach Gel Treatment',
      'Termite Drill & Fill Treatment',
      'Bed Bug Chemical Eradication',
      'Mosquito Fogging & Spraying',
      'Rodent & Rat Glue Trap Setup',
      'Ant & Spider Herbal Spray'
    ]
  },
  {
    id: 'cat_bike',
    name: 'Bike Service',
    icon: '🏍️',
    color: '#E0F2FE',
    basePrice: 349,
    subCategories: [
      'Doorstep General Bike Service',
      'Engine Oil & Filter Change',
      'Brake Shoe & Disc Pad Fix',
      'Chain Cleaning & Lubrication',
      'Battery Testing & Jumpstart',
      'Carburetor & Spark Plug Tuning'
    ]
  },
  {
    id: 'cat_car',
    name: 'Car Mechanic',
    icon: '🚗',
    color: '#EDE9FE',
    basePrice: 599,
    subCategories: [
      'Periodic Car Service Inspection',
      'Doorstep Battery Jumpstart',
      'Brake Pad Check & Replacement',
      'Engine Oil & Coolant Top-up',
      'Car AC Cooling & Filter Cleaning',
      'Clutch & Gear Shift Inspection'
    ]
  },
  {
    id: 'cat_moving',
    name: 'Moving & Labour',
    icon: '📦',
    color: '#FEF3C7',
    basePrice: 499,
    subCategories: [
      'Household Loading & Unloading',
      'Heavy Appliance Moving',
      'Packing & Box Wrapping Help',
      'Truck / Tempo Loading Labour',
      'Room Furniture Shifting',
      'Luggage & Parcel Transport'
    ]
  },
  {
    id: 'cat_security',
    name: 'Security/Smart Home',
    icon: '📹',
    color: '#E0E7FF',
    basePrice: 499,
    subCategories: [
      'CCTV Camera Installation',
      'Smart Door Lock Fitting',
      'Video Doorbell WiFi Setup',
      'Security Sensor & Motion Alarm',
      'Intercom & EPABX Repair',
      'Smart Switch Home Automation'
    ]
  },
  {
    id: 'cat_electronics',
    name: 'Electronics Service',
    icon: '📺',
    color: '#FCE7F3',
    basePrice: 399,
    subCategories: [
      'LED/Smart TV Wall Mounting',
      'Refrigerator Cooling & Gas Fix',
      'Washing Machine Drum & Motor',
      'Microwave Oven Heating Fix',
      'RO Water Purifier Filter Change',
      'Mixer Grinder & Induction Fix'
    ]
  },
  {
    id: 'cat_laundry',
    name: 'Laundry',
    icon: '🧺',
    color: '#E0F8F3',
    basePrice: 199,
    subCategories: [
      'Wash & Fold (Per KG)',
      'Steam Ironing Service',
      'Dry Cleaning Suit & Saree',
      'Curtain & Heavy Blanket Wash',
      'Shoe Cleaning & Restoration',
      'Stain Removal Deep Treatment'
    ]
  },
  {
    id: 'cat_home_support',
    name: 'Home Support',
    icon: '🧹',
    color: '#E2E8F0',
    basePrice: 399,
    subCategories: [
      'Deep Home Sanitization',
      'Kitchen Grease Degreasing',
      'Bathroom Tile Deep Scrubbing',
      'Sofa & Carpet Shampooing',
      'Window Glass Scrubbing',
      'Floor Polishing & Buffing'
    ]
  },
  {
    id: 'cat_beauty',
    name: 'Beauty & Personal Care',
    icon: '💅',
    color: '#FDF2F8',
    basePrice: 499,
    subCategories: [
      'Haircut & Blowdry at Home',
      'Facial & Fruit Cleanup',
      'Full Body Waxing & Threading',
      'Pedicure & Manicure Care',
      'Bleach & De-Tan Therapy',
      'Party Makeup & Saree Draping'
    ]
  },
  {
    id: 'cat_mehndi',
    name: 'Mehndi Artist',
    icon: '🌺',
    color: '#FEF2F2',
    basePrice: 599,
    subCategories: [
      'Bridal Mehndi Full Hands & Feet',
      'Arabic Designer Mehndi',
      'Traditional Indian Marwari Style',
      'Party Guest Mehndi (Per Hand)',
      'Baby Shower / Engagement Mehndi',
      'Contemporary Tattoo Style Mehndi'
    ]
  },
  {
    id: 'cat_water_tank',
    name: 'Water Tank & Waste Service',
    icon: '🚰',
    color: '#CFFAFE',
    basePrice: 599,
    subCategories: [
      'Overhead Sintex Tank Cleaning',
      'Underground Sump Deep Wash',
      'UV Sanitization & Sludge Removal',
      'Bio-Septic Tank Evacuation',
      'Solid Waste & Debris Clearing',
      'Drain & Gutter High-Pressure Wash'
    ]
  }
];

export function getSubCategoriesForCategory(categoryName = '') {
  const norm = categoryName.toLowerCase().trim();
  const matched = ALL_MAIN_CATEGORIES.find(c => 
    c.name.toLowerCase() === norm ||
    norm.includes(c.name.toLowerCase()) ||
    c.name.toLowerCase().includes(norm)
  );

  if (matched && matched.subCategories) {
    return matched.subCategories;
  }

  // Sensible default issues for any service
  return [
    `${categoryName} Inspection & Diagnosis`,
    `${categoryName} Standard Repair`,
    `${categoryName} New Installation`,
    `${categoryName} Deep Maintenance`,
    `${categoryName} Emergency Service`
  ];
}
