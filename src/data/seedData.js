// High-quality imagery matching the reference visual style
export const initialCategories = [
  {
    id: "cat_ac",
    name: "AC Repair",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
    order: 1
  },
  {
    id: "cat_cleaning",
    name: "Cleaning",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
    order: 2
  },
  {
    id: "cat_electrician",
    name: "Electrician",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80",
    order: 3
  },
  {
    id: "cat_plumbing",
    name: "Plumbing",
    image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80",
    order: 4
  },
  {
    id: "cat_painting",
    name: "Painting",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80",
    order: 5
  },
  {
    id: "cat_carpenter",
    name: "Carpenter",
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80",
    order: 6
  }
];

export const initialBanners = [
  {
    id: "banner_1",
    title: "Book Trusted Services",
    subtitle: "Get quick access to home services your location.",
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=600&q=80",
    serviceName: "Home Repair",
    price: 300,
    order: 1,
    active: true
  },
  {
    id: "banner_2",
    title: "Expert AC Maintenance",
    subtitle: "Beat the heat with deep coil sanitization.",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    serviceName: "AC Servicing",
    price: 499,
    order: 2,
    active: true
  }
];

export const initialWorkers = [
  {
    id: "worker_rajesh",
    name: "Rajesh Sharma",
    phone: "98765 43210",
    skill: "Plumbing",
    categoryId: "cat_plumbing",
    rating: 4.9,
    reviewCount: 699,
    jobsCompleted: 745,
    isOnline: true,
    city: "Celina, Delaware",
    avatar: "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80",
    vehicle: "Bike • DL-04-AB-1234",
    experience: "8 years",
    status: "available"
  },
  {
    id: "worker_amit",
    name: "Amit Verma",
    phone: "98765 11223",
    skill: "AC Repair",
    categoryId: "cat_ac",
    rating: 4.9,
    reviewCount: 520,
    jobsCompleted: 610,
    isOnline: true,
    city: "Celina, Delaware",
    avatar: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80",
    vehicle: "Scooter • DL-07-EF-5678",
    experience: "7 years",
    status: "available"
  },
  {
    id: "worker_sunita",
    name: "Sunita Sen",
    phone: "98765 99887",
    skill: "Cleaning",
    categoryId: "cat_cleaning",
    rating: 4.8,
    reviewCount: 412,
    jobsCompleted: 489,
    isOnline: true,
    city: "Celina, Delaware",
    avatar: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80",
    vehicle: "Van • DL-02-GH-9012",
    experience: "5 years",
    status: "available"
  },
  {
    id: "worker_vikram",
    name: "Vikram Sen",
    phone: "98765 33445",
    skill: "Electrician",
    categoryId: "cat_electrician",
    rating: 4.9,
    reviewCount: 388,
    jobsCompleted: 430,
    isOnline: false,
    city: "Celina, Delaware",
    avatar: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=80",
    vehicle: "Bike • DL-09-JK-3456",
    experience: "6 years",
    status: "offline"
  },
  {
    id: "worker_ramesh",
    name: "Ramesh Kumar",
    phone: "98765 77665",
    skill: "Carpenter",
    categoryId: "cat_carpenter",
    rating: 4.7,
    reviewCount: 295,
    jobsCompleted: 340,
    isOnline: true,
    city: "Celina, Delaware",
    avatar: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=300&q=80",
    vehicle: "Bike • DL-05-MN-7890",
    experience: "9 years",
    status: "available"
  }
];

export const initialServices = [
  {
    id: "serv_plumbing_1",
    workerId: "worker_rajesh",
    categoryId: "cat_plumbing",
    categoryName: "Plumbing",
    workerName: "Rajesh Sharma",
    title: "Plumbing",
    badge: "Skilled & Reliable Plumbing Expert",
    about: "I'm a professional plumber with years of experience in residential and commercial services. I specialize in repairs, installations, and maintenance. My goal is to provide reliable, efficient, and long-lasting solutions. Customer satisfaction is always my top priority.",
    price: 300,
    rating: 4.9,
    reviewCount: 699,
    ordersCompleted: 745,
    city: "Celina, Delaware",
    available: true,
    approved: true,
    heroImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=500&q=80"
    ],
    details: [
      "Pipe leakage inspection & repair",
      "Basin & sink trap replacement",
      "Tap & mixer cartridge renewal",
      "Water pressure testing & valve tune-up"
    ],
    faqs: [
      { q: "How long does standard inspection take?", a: "Typically 30 to 45 minutes for diagnosis and standard minor leak repairs." },
      { q: "Are replacement parts included?", a: "Service fee covers labor and diagnostics. Any new pipes or fixtures are billed at transparent actual store costs." }
    ]
  },
  {
    id: "serv_ac_1",
    workerId: "worker_amit",
    categoryId: "cat_ac",
    categoryName: "AC Repair",
    workerName: "Amit Verma",
    title: "AC Repair & Jet Service",
    badge: "Certified HVAC Specialist",
    about: "Expert air conditioner technician with 8+ years experience handling split, window, and inverter AC systems. Equipped with professional high-pressure jet pumps and gas gauges.",
    price: 450,
    rating: 4.9,
    reviewCount: 520,
    ordersCompleted: 610,
    city: "Celina, Delaware",
    available: true,
    approved: true,
    heroImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=500&q=80"
    ],
    details: [
      "Indoor cooling coil foam wash",
      "Outdoor condenser high-pressure jet wash",
      "Filter sanitization & airflow calibration",
      "Gas pressure inspection"
    ],
    faqs: [
      { q: "Does this include gas refill?", a: "Gas leak testing and inspection are included. Gas top-up is optional based on measured pressure." }
    ]
  },
  {
    id: "serv_cleaning_1",
    workerId: "worker_sunita",
    categoryId: "cat_cleaning",
    categoryName: "Cleaning",
    workerName: "Sunita & Team",
    title: "Deep Home Cleaning",
    badge: "Eco-Friendly Deep Sanitization",
    about: "Thorough sanitization team trained in residential kitchen, bathroom, and living room revitalization using hospital-grade non-toxic disinfectants.",
    price: 350,
    rating: 4.8,
    reviewCount: 412,
    ordersCompleted: 489,
    city: "Celina, Delaware",
    available: true,
    approved: true,
    heroImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80"
    ],
    details: [
      "Tile scrubbing and grout descaling",
      "Dusting fan blades and wardrobe exteriors",
      "Kitchen chimney degreasing"
    ],
    faqs: [
      { q: "Do you bring your own cleaning machines?", a: "Yes, we bring vacuum cleaners, steamers, and premium cleaning liquids." }
    ]
  },
  {
    id: "serv_electrician_1",
    workerId: "worker_vikram",
    categoryId: "cat_electrician",
    categoryName: "Electrician",
    workerName: "Vikram Sen",
    title: "Electrical Diagnostics",
    badge: "Licensed Electrician",
    about: "Specialist in short-circuit detection, appliance installation, MCB trip troubleshooting, and modern home automation switches.",
    price: 320,
    rating: 4.9,
    reviewCount: 388,
    ordersCompleted: 430,
    city: "Celina, Delaware",
    available: true,
    approved: true,
    heroImage: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=500&q=80"
    ],
    details: [
      "Wiring load test & grounding check",
      "Switchboard rewiring & socket replacement",
      "Chandelier and LED strip fitting"
    ],
    faqs: [
      { q: "Is emergency service supported?", a: "Yes, we dispatch with heavy-duty safety gear." }
    ]
  }
];

export const initialReviews = [
  {
    id: "rev_1",
    serviceId: "serv_plumbing_1",
    customerName: "Aman Gupta",
    rating: 5,
    comment: "Punctual, polite and resolved the kitchen leak within 25 minutes. Highly recommended!",
    date: "2 days ago"
  },
  {
    id: "rev_2",
    serviceId: "serv_plumbing_1",
    customerName: "Priya Nair",
    rating: 5,
    comment: "Very neat work, cleaned up the workspace after repairing the tap.",
    date: "1 week ago"
  }
];
