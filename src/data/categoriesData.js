// High-resolution reliable remote CDN image for Mehndi / Henna category
const MEHNDI_ART_IMAGE_URL = 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80';

// All 20 main categories with verified icons and their specific issues/sub-categories
export const ALL_MAIN_CATEGORIES = [
  {
    id: 'cat_electrician',
    name: 'Electrician',
    icon: '⚡',
    color: '#FEF3C7', // soft yellow/amber
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
    color: '#E0F2FE', // soft sky cyan
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
    color: '#E0F2FE', // soft blue/sky
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
    color: '#FEE2E2', // soft warm red/pink
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
    name: 'Painting & Wall Work',
    icon: '🎨',
    color: '#F3E8FF', // soft purple/violet
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
    color: '#FFEDD5', // soft orange
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
    color: '#FEE2E2', // soft flame red/orange
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
    color: '#F1F5F9', // soft slate/window
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
    name: 'Garden & Outdoor Work',
    icon: '🍃',
    color: '#DCFCE7', // soft pastel mint green
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
    color: '#FEF9C3', // soft pastel lime
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
    color: '#E0E7FF', // soft indigo
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
    color: '#FEE2E2', // soft red pastel
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
    name: 'Moving & Labour Service',
    icon: '📦',
    color: '#FEF3C7', // soft amber
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
    name: 'Security & Smart Home',
    icon: '🔒',
    color: '#EDE9FE', // soft purple/lavender
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
    icon: '🧺', // Washing machine / appliance style
    altIcon: '🫧',
    color: '#E0F2FE', // soft appliance cyan
    basePrice: 399,
    subCategories: [
      'Washing Machine Drum & Motor',
      'LED/Smart TV Wall Mounting',
      'Refrigerator Cooling & Gas Fix',
      'Microwave Oven Heating Fix',
      'RO Water Purifier Filter Change',
      'Mixer Grinder & Induction Fix'
    ]
  },
  {
    id: 'cat_laundry',
    name: 'Laundry Service',
    icon: '🧺',
    color: '#E0F8F3', // soft teal mint
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
    name: 'Home Support Service',
    icon: '🧹',
    color: '#F1F5F9', // soft slate/pearl
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
    icon: '💄',
    color: '#FDF2F8', // soft pink
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
    icon: '🖐️',
    image: MEHNDI_ART_IMAGE_URL,
    color: '#FFF1EE', // soft peach/coral
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
    icon: '🛢️',
    color: '#CFFAFE', // soft aqua/cyan
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
  const matched = ALL_MAIN_CATEGORIES.find(c => {
    const cNorm = c.name.toLowerCase();
    return (
      cNorm === norm ||
      norm.includes(cNorm) ||
      cNorm.includes(norm) ||
      (norm.includes('ac') && cNorm.includes('ac')) ||
      (norm.includes('plumb') && cNorm.includes('plumb')) ||
      (norm.includes('elect') && cNorm.includes('elect')) ||
      (norm.includes('clean') && (cNorm.includes('clean') || cNorm.includes('home support'))) ||
      (norm.includes('paint') && cNorm.includes('paint')) ||
      (norm.includes('carp') && cNorm.includes('carp')) ||
      (norm.includes('construct') && cNorm.includes('construct')) ||
      (norm.includes('weld') && cNorm.includes('weld')) ||
      (norm.includes('alumin') && cNorm.includes('alumin')) ||
      (norm.includes('garden') && cNorm.includes('garden')) ||
      (norm.includes('pest') && cNorm.includes('pest')) ||
      (norm.includes('bike') && cNorm.includes('bike')) ||
      (norm.includes('car') && !norm.includes('carp') && cNorm.includes('car')) ||
      ((norm.includes('mov') || norm.includes('shift') || norm.includes('labour')) && cNorm.includes('moving')) ||
      ((norm.includes('secur') || norm.includes('cctv') || norm.includes('smart')) && cNorm.includes('security')) ||
      ((norm.includes('electron') || norm.includes('tv') || norm.includes('fridge')) && cNorm.includes('electronics')) ||
      ((norm.includes('laund') || norm.includes('wash') || norm.includes('iron')) && cNorm.includes('laundry')) ||
      ((norm.includes('beaut') || norm.includes('salon') || norm.includes('makeup')) && cNorm.includes('beauty')) ||
      ((norm.includes('mehndi') || norm.includes('henna')) && cNorm.includes('mehndi')) ||
      ((norm.includes('tank') || norm.includes('waste') || norm.includes('sump')) && cNorm.includes('tank'))
    );
  });

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
