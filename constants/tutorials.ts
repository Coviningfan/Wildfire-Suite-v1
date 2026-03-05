export interface TutorialSection {
  title: string;
  content: string;
}

export interface Tutorial {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  readTime?: string;
  pdfUrl?: string;
  category: 'tutorial' | 'knowledge';
  sections: TutorialSection[];
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'app-walkthrough',
    title: 'Welcome to Wildfire Suite',
    subtitle: 'A hands-on walkthrough of the complete app — from sign-in to saving your first UV design',
    icon: 'BookOpen',
    color: '#3B82F6',
    readTime: '8 min',
    category: 'tutorial',
    sections: [
      {
        title: 'What You Will Learn',
        content: 'This walkthrough guides you through every major feature of the Wildfire Suite app. By the end, you will have completed a full UV lighting calculation, explored room simulation, saved a project, and reviewed AI-powered design insights.\n\nYou can revisit this tour anytime from the Docs tab or your Profile settings.'
      },
      {
        title: 'The Calculator Tab',
        content: 'The Calculator is your starting point. It uses the FLAME workflow — Fixture, Location, Angle, Material, Effect — to gather the inputs needed for an accurate UV calculation.\n\nEach letter in FLAME represents a step: pick a fixture model (F), set the mounting height and distance (L), define the beam target area (A), choose the surface material (M), and select the intended visual effect (E).'
      },
      {
        title: 'Running a Calculation',
        content: 'Once all FLAME inputs are filled, tap the Calculate button. The app generates irradiance levels (mW/m²), beam coverage area, throw distance, and a safety classification.\n\nThe safety indicator uses four levels: Safe (green), Caution (yellow), Warning (orange), and Danger (red). Each level includes practical guidance for how to handle the UV exposure in that zone.'
      },
      {
        title: 'Room Simulation',
        content: 'After calculating, enable Room Simulation to visualize your setup in a virtual room. Enter the room dimensions (width, depth, ceiling height), then add one or more fixtures.\n\nYou can drag fixtures to reposition them, toggle the heatmap overlay to see UV intensity distribution, and switch between Floor, Back Wall, Left Wall, Right Wall, and Ceiling surfaces.'
      },
      {
        title: 'Views and Layout Tools',
        content: 'Room Simulation offers three view modes: TOP (plan view), SIDE (elevation), and 3D (perspective). Each mode reveals different spatial relationships.\n\nUse Auto Layout presets — Line, Grid, or Perimeter — to generate structured fixture arrangements automatically. Fine-tune positions manually after applying a preset.'
      },
      {
        title: 'Coverage Metrics',
        content: 'While in Room Simulation, review the metrics bar: MAX (peak irradiance), AVG (average across the surface), SAFETY (worst-case exposure), and COVER (percentage of surface receiving usable UV).\n\nThese four numbers let you quickly validate whether your design delivers enough fluorescent punch while staying within safe operating limits.'
      },
      {
        title: 'Saving Your Work',
        content: 'Tap the Save button to store your calculation with a descriptive name — for example, "Main Stage UV Wash" or "Lobby Accent Wall." Saved entries appear in your Calculations history and can be reopened, compared, or exported later.\n\nUse clear, venue-specific names so you can find the right setup quickly during customer reviews.'
      },
      {
        title: 'The Fixtures Tab',
        content: 'The Fixtures tab is your hardware reference. Browse the complete catalog of Wildfire fixtures with specifications, beam data, and coverage details.\n\nTap any fixture for a detail view showing electrical specs, photometric data, and mounting notes. You can also scan a fixture QR code from the Calculator tab to auto-populate inputs.'
      },
      {
        title: 'AI Insights',
        content: 'The AI tab generates intelligent recommendations based on your latest calculation. It analyzes your fixture choice, coverage, safety levels, and room layout to suggest optimizations.\n\nUse AI Insights to get a second opinion on fixture placement, discover alternative fixtures, or identify potential safety concerns you may have missed.'
      },
      {
        title: 'Profile and Settings',
        content: 'The Profile tab shows your account info, calculation stats, and app preferences. From here you can toggle between light and dark themes, switch measurement units (imperial / metric), enable biometric login, and export your calculation history.\n\nYou can also restart this app tour anytime from your profile.'
      },
      {
        title: 'You Are Ready',
        content: 'You now know how to build a complete UV design from start to finish. Here is the recommended workflow for customer demos:\n\n1. Open Calculator and complete a FLAME calculation\n2. Show Room Simulation with surface and view transitions\n3. Highlight the coverage metrics and safety levels\n4. Save the result and generate an AI Insight\n5. Walk through Fixtures for hardware credibility\n\nExplore the other tutorials in the Docs tab for deeper feature guides.'
      }
    ]
  },
  {
    id: 'first-calculation',
    title: 'Your First Calculation',
    subtitle: 'Complete the FLAME workflow step by step and interpret your results',
    icon: 'Calculator',
    color: '#E8412A',
    readTime: '5 min',
    category: 'tutorial',
    sections: [
      {
        title: 'Open the Calculator',
        content: 'Tap the Calculator tab at the bottom of the screen. This is where every UV design begins. The screen shows the FLAME progress indicator at the top — five letters that light up as you complete each step.'
      },
      {
        title: 'Step F — Choose a Fixture',
        content: 'Tap the Fixture picker and select a Wildfire fixture model. Each model has different UV output characteristics, beam angles, and power levels.\n\nIf you have a physical fixture nearby, use the QR scanner icon to scan its label and auto-fill this step.'
      },
      {
        title: 'Step L — Set the Location',
        content: 'Enter the vertical mounting height (distance from fixture to target surface) and, if applicable, the horizontal offset distance. These measurements determine how UV energy spreads by the time it reaches the surface.\n\nHigher mounts mean wider but weaker coverage. Closer mounts mean intense but narrow beams.'
      },
      {
        title: 'Step A — Define the Beam Area',
        content: 'Set the beam width and height targets. These define the area you want the UV light to cover on the target surface.\n\nThe app uses these values together with the fixture specs and mounting distance to calculate the actual irradiance across the target zone.'
      },
      {
        title: 'Step M — Pick the Material',
        content: 'Select the surface material from the dropdown: Fluorescent Paint, UV Reactive Fabric, Body Paint, Scenic Elements, and more.\n\nDifferent materials have different fluorescent responses. The calculation adjusts its recommendations based on how efficiently each material converts UV into visible light.'
      },
      {
        title: 'Step E — Select the Effect',
        content: 'Choose the intended visual effect: Full Wash, Accent/Spot, Reveal/Transition, Ambient Glow, Blacklight Party, or others.\n\nThe effect selection helps the app calibrate its safety and intensity recommendations to match your creative intent.'
      },
      {
        title: 'Tap Calculate',
        content: 'With all five FLAME steps completed, tap the Calculate button. The app processes your inputs and displays a result card showing:\n\n• Irradiance (mW/m²) — UV power density at the surface\n• Beam area — the illuminated zone size\n• Throw distance — effective reach of the fixture\n• Safety level — color-coded exposure classification'
      },
      {
        title: 'Reading Your Results',
        content: 'The result card is your design summary. The irradiance number tells you how much UV energy hits the surface — higher values mean brighter fluorescence but also higher exposure risk.\n\nTap the safety badge to see detailed guidance for that exposure level, including PPE recommendations and access restrictions.\n\nFrom here, you can save the result, open Room Simulation, or generate AI Insights.'
      }
    ]
  },
  {
    id: 'understanding-results',
    title: 'Understanding Your Results',
    subtitle: 'What irradiance, safety levels, and beam metrics actually mean for your design',
    icon: 'Target',
    color: '#7C6BF0',
    readTime: '4 min',
    category: 'tutorial',
    sections: [
      {
        title: 'Irradiance Explained',
        content: 'Irradiance is the amount of UV power hitting a surface per unit area, measured in milliwatts per square meter (mW/m²). Think of it as the "brightness" of the UV at the target.\n\nHigher irradiance means more intense fluorescence — but also more potential for UV exposure. The key is finding the sweet spot where your materials glow brilliantly without exceeding safe levels.'
      },
      {
        title: 'Safety Classifications',
        content: 'The app uses four safety levels based on irradiance thresholds:\n\n• Safe (below 2,500 mW/m²) — No special precautions needed\n• Caution (2,500–10,000 mW/m²) — Limit prolonged exposure, consider UV eyewear\n• Warning (10,000–25,000 mW/m²) — UV eye protection mandatory, minimize skin exposure\n• Danger (above 25,000 mW/m²) — Full PPE required, restrict beam area access'
      },
      {
        title: 'Beam Area and Coverage',
        content: 'Beam area shows the size of the illuminated zone on the target surface. A wider beam covers more area but with less intensity at any given point.\n\nWhen designing for large surfaces (stage backdrops, murals), you may need multiple fixtures to achieve uniform coverage. The Room Simulation tool helps visualize this.'
      },
      {
        title: 'Throw Distance',
        content: 'Throw distance is the effective distance the fixture can project usable UV. Beyond this distance, the irradiance drops below practical levels for fluorescent excitation.\n\nUse throw distance to quickly determine whether a fixture can reach your target surface from the intended mounting position.'
      },
      {
        title: 'Balancing Impact and Safety',
        content: 'The best UV designs maximize visual impact while respecting safety limits. Here are practical strategies:\n\n• Use multiple fixtures at moderate intensity instead of one fixture at maximum\n• Angle fixtures to avoid direct eye lines from the audience\n• Use the "Safe" zone for audience-facing surfaces and reserve higher levels for controlled scenic areas\n• Always check the coverage metrics in Room Simulation before finalizing a design'
      }
    ]
  },
  {
    id: 'room-simulation-guide',
    title: 'Room Simulation',
    subtitle: 'Set up a virtual room, place fixtures, and analyze coverage across every surface',
    icon: 'Layout',
    color: '#10B981',
    readTime: '6 min',
    category: 'tutorial',
    sections: [
      {
        title: 'Opening Room Simulation',
        content: 'After running a calculation in the Calculator tab, toggle the Room Simulation switch to enable it. The simulation panel appears below your result card.\n\nYou can also access Room Simulation with a fresh setup — it will use your most recent fixture selection and calculation parameters.'
      },
      {
        title: 'Setting Room Dimensions',
        content: 'Enter the room width, depth, and ceiling height. These define the virtual space where your fixtures will operate.\n\nUse realistic measurements from the actual venue whenever possible. The accuracy of coverage predictions depends directly on how closely these dimensions match the real room.'
      },
      {
        title: 'Adding and Positioning Fixtures',
        content: 'Tap the Add Fixture button to place a fixture in the room. Each fixture appears as a draggable element in the top view.\n\nDrag fixtures to position them where you want them mounted. The simulation updates coverage calculations in real time as you move fixtures around.'
      },
      {
        title: 'Switching Views',
        content: 'Use the view mode selector to switch between three perspectives:\n\n• TOP — Plan view looking down at the floor. Best for positioning fixtures and checking floor coverage\n• SIDE — Elevation view showing fixture height and throw angles\n• 3D — Perspective view for overall spatial understanding\n\nEach view helps you catch different issues. Use TOP for layout, SIDE for height validation, and 3D for presentation.'
      },
      {
        title: 'Switching Surfaces',
        content: 'Tap the surface selector to switch between Floor, Back Wall, Left Wall, Right Wall, and Ceiling. Each surface shows its own coverage analysis.\n\nThis is critical for theatrical designs where fluorescent elements appear on walls and ceilings, not just the floor. Check every surface that has UV-reactive material.'
      },
      {
        title: 'Using the Heatmap',
        content: 'Toggle the heatmap overlay to see UV intensity distribution as a color gradient. Cool colors (blue/green) indicate lower irradiance, warm colors (yellow/red) indicate higher irradiance.\n\nThe heatmap instantly reveals hotspots, dead zones, and uneven coverage — issues that are nearly impossible to predict without simulation.'
      },
      {
        title: 'Auto Layout Presets',
        content: 'Use the Auto Layout feature to generate structured fixture arrangements:\n\n• Line — Evenly spaced fixtures in a row (ideal for stage washes)\n• Grid — Fixtures in a regular grid pattern (ideal for uniform room coverage)\n• Perimeter — Fixtures along the room edges (ideal for wall washes)\n\nApply a preset as a starting point, then drag individual fixtures to fine-tune the layout.'
      },
      {
        title: 'Reading the Metrics',
        content: 'The metrics bar shows four values updated in real time:\n\n• MAX — Peak irradiance anywhere on the current surface\n• AVG — Average irradiance across the surface\n• SAFETY — The highest exposure level detected\n• COVER — Percentage of the surface receiving usable UV\n\nAim for high COVER with a SAFETY level appropriate for the space. If MAX is too high, spread fixtures apart or raise them higher.'
      }
    ]
  },
  {
    id: 'saving-and-projects',
    title: 'Saving and Projects',
    subtitle: 'Save your calculations, organize by project, and retrieve past work',
    icon: 'Save',
    color: '#F59E0B',
    readTime: '3 min',
    category: 'tutorial',
    sections: [
      {
        title: 'Why Save Your Work',
        content: 'Every calculation you run can be saved for future reference. Saved calculations preserve all your FLAME inputs, results, and room simulation settings so you can reopen them instantly.\n\nThis is essential for customer follow-ups, comparing design alternatives, and building a library of proven setups for different venue types.'
      },
      {
        title: 'How to Save a Calculation',
        content: 'After running a calculation, tap the Save icon. A modal appears asking for a name and optional notes.\n\nUse descriptive names that include the venue and purpose — for example, "Aria Stage - UV Wash" or "Corporate Lobby - Accent Wall." This makes retrieval fast when you are working across multiple projects.'
      },
      {
        title: 'Viewing Saved Calculations',
        content: 'Your saved calculations appear in the Calculations history. Each entry shows the fixture used, key results, safety level, and the date saved.\n\nTap any saved calculation to reload it into the Calculator with all original inputs restored. From there you can modify inputs and re-calculate to explore variations.'
      },
      {
        title: 'Exporting Your Data',
        content: 'From the Profile tab, you can export your entire calculation history as a CSV file. This is useful for sharing results with team members, creating project documentation, or importing data into spreadsheets for further analysis.\n\nThe export includes all FLAME inputs, calculated results, safety levels, and timestamps.'
      }
    ]
  },
  {
    id: 'ai-insights-guide',
    title: 'AI Insights',
    subtitle: 'Generate intelligent design recommendations based on your calculations',
    icon: 'Sparkles',
    color: '#8B5CF6',
    readTime: '3 min',
    category: 'tutorial',
    sections: [
      {
        title: 'What AI Insights Do',
        content: 'The AI tab analyzes your most recent calculation and generates practical recommendations. It considers your fixture choice, coverage area, irradiance levels, safety classification, and intended effect to suggest optimizations.\n\nThink of it as a knowledgeable colleague reviewing your design and offering suggestions you might have missed.'
      },
      {
        title: 'When to Use AI Insights',
        content: 'Generate an AI Insight after completing a calculation, especially when:\n\n• You are unsure if your fixture choice is optimal for the space\n• The safety level is higher than you would like and you need alternatives\n• You want to maximize coverage without adding more fixtures\n• You are preparing a customer proposal and want professional talking points'
      },
      {
        title: 'Reading the Recommendations',
        content: 'AI Insights are structured as actionable suggestions. Each recommendation explains what to change, why it matters, and what outcome to expect.\n\nThe AI may suggest alternative fixture models, different mounting positions, beam angle adjustments, or multi-fixture strategies. It also highlights potential safety concerns and how to mitigate them.'
      },
      {
        title: 'Using AI in Customer Demos',
        content: 'AI Insights add credibility to customer presentations. After walking through a calculation and room simulation, generate an AI Insight to show that the design has been analyzed for optimization.\n\nCustomers appreciate seeing data-driven recommendations rather than guesswork. The AI output can also be shared as part of project documentation.'
      }
    ]
  },
  {
    id: 'qr-scanner-guide',
    title: 'QR Code Scanner',
    subtitle: 'Scan fixture labels to auto-populate your calculation inputs',
    icon: 'QrCode',
    color: '#06B6D4',
    readTime: '2 min',
    category: 'tutorial',
    sections: [
      {
        title: 'What the QR Scanner Does',
        content: 'Wildfire fixtures include QR code labels with encoded product data. Scanning a QR code in the app automatically fills in the fixture selection step of the FLAME workflow, saving time and eliminating data entry errors.\n\nThis is especially useful when working on-site with physical fixtures already installed or available for evaluation.'
      },
      {
        title: 'How to Scan',
        content: 'From the Calculator tab, tap the QR scanner icon near the Fixture picker. The camera view opens with a targeting frame.\n\nPoint your device at the QR code on the fixture label. The scanner reads the code automatically — no need to tap a capture button. Once recognized, the fixture data populates instantly.'
      },
      {
        title: 'After Scanning',
        content: 'Once the fixture is identified, the Calculator updates the Fixture field and you can continue with the remaining FLAME steps (Location, Angle, Material, Effect).\n\nIf the QR code is not recognized, you can always select the fixture manually from the dropdown picker. The QR scanner is a convenience feature, not a requirement.'
      }
    ]
  },
  {
    id: 'uv-science',
    title: 'The Science Behind UV',
    subtitle: 'Understanding ultraviolet light fundamentals',
    icon: 'Atom',
    color: '#7C6BF0',
    category: 'knowledge',
    sections: [
      {
        title: 'What is Ultraviolet Light?',
        content: 'Ultraviolet (UV) light is electromagnetic radiation with wavelengths shorter than visible light but longer than X-rays, ranging from 10nm to 400nm. UV is invisible to the human eye and is divided into three primary bands: UVA (315-400nm), UVB (280-315nm), and UVC (100-280nm). Each band has distinct properties and applications in entertainment lighting.'
      },
      {
        title: 'The UV Spectrum',
        content: 'UVA (long-wave UV) is most commonly used in entertainment and special effects because it penetrates materials effectively and causes fluorescence in many substances. UVB is primarily associated with sunburn and has limited use in controlled environments. UVC is germicidal and is blocked by Earth\'s atmosphere, making it unsuitable for most entertainment applications.'
      },
      {
        title: 'Energy and Wavelength',
        content: 'The energy of UV photons is inversely proportional to wavelength—shorter wavelengths carry more energy. This is why UVC is more dangerous but also more effective for sterilization, while UVA has lower energy but is safer for prolonged human exposure in controlled settings. The formula E = hc/λ describes this relationship, where E is energy, h is Planck\'s constant, c is the speed of light, and λ is wavelength.'
      },
      {
        title: 'Sources of UV Light',
        content: 'Natural UV comes primarily from the sun, but artificial sources include mercury vapor lamps, LED arrays, and specialized fluorescent tubes. Modern UV LED technology has revolutionized the entertainment industry by offering precise wavelength control, lower heat output, and longer lifespans compared to traditional mercury-based sources.'
      },
      {
        title: 'Safety Considerations',
        content: 'While UVA is generally safe for short-term exposure, prolonged or intense UV exposure can cause eye strain and skin damage. Always use proper protective equipment when working directly with UV sources. Modern entertainment-grade UV fixtures are designed to emit primarily in the UVA range to minimize health risks while maximizing fluorescent effects.'
      }
    ]
  },
  {
    id: 'fluorescence',
    title: 'How Fluorescence Works',
    subtitle: 'The physics of light emission',
    icon: 'Lightbulb',
    color: '#10B981',
    category: 'knowledge',
    sections: [
      {
        title: 'The Fluorescence Process',
        content: 'Fluorescence occurs when a substance absorbs photons at one wavelength (typically UV) and immediately re-emits photons at a longer, visible wavelength. This process happens in nanoseconds and involves electrons jumping between energy levels within molecules. The absorbed UV energy excites electrons to higher energy states, and when they return to ground state, visible light is emitted.'
      },
      {
        title: 'Stokes Shift',
        content: 'The difference between the absorbed and emitted wavelengths is called the Stokes shift. This shift is always toward longer wavelengths (lower energy) because some energy is lost as heat during the excitation-relaxation cycle. For example, a fluorescent material might absorb 365nm UV light and emit 520nm green light—a Stokes shift of 155nm.'
      },
      {
        title: 'Quantum Yield',
        content: 'Quantum yield measures the efficiency of fluorescence—the ratio of photons emitted to photons absorbed. High-quality fluorescent pigments have quantum yields approaching 100%, meaning nearly every absorbed UV photon results in a visible photon. Wildfire paints are formulated with pigments selected for maximum quantum yield in the UVA range.'
      },
      {
        title: 'Fluorophores and Pigments',
        content: 'Fluorescent molecules (fluorophores) contain conjugated pi-electron systems that facilitate energy absorption and emission. Common fluorophores include rhodamines, fluoresceins, and coumarins. Each has a characteristic absorption and emission spectrum, allowing for a wide palette of fluorescent colors when illuminated with UV light.'
      },
      {
        title: 'Environmental Factors',
        content: 'Fluorescence intensity depends on several factors: UV intensity, pigment concentration, surface texture, and environmental conditions like temperature and humidity. Optimal fluorescence occurs when UV sources are matched to the absorption peak of the fluorophore and when surfaces are clean and evenly coated.'
      }
    ]
  },
  {
    id: 'luminescence',
    title: 'Shedding Light on Luminescence',
    subtitle: 'Types and applications of light emission',
    icon: 'Sparkles',
    color: '#F59E0B',
    category: 'knowledge',
    sections: [
      {
        title: 'What is Luminescence?',
        content: 'Luminescence is the emission of light that is not caused by heat (unlike incandescence). It includes fluorescence, phosphorescence, chemiluminescence, bioluminescence, and electroluminescence. Each type involves different mechanisms but all result in "cold light" production—light emission without significant thermal radiation.'
      },
      {
        title: 'Fluorescence vs. Phosphorescence',
        content: 'Fluorescence is immediate light emission that stops within nanoseconds when the excitation source is removed. Phosphorescence involves a "forbidden" energy transition that takes longer—from milliseconds to hours—causing the material to glow in the dark after the excitation source is removed. Glow-in-the-dark materials are phosphorescent, while UV-reactive paints are fluorescent.'
      },
      {
        title: 'Photoluminescence',
        content: 'Photoluminescence encompasses both fluorescence and phosphorescence—light emission caused by photon absorption. This is the primary mechanism in entertainment lighting effects. When UV photons strike fluorescent materials, they cause photoluminescence in the form of rapid fluorescence, creating vibrant visible colors from invisible UV light.'
      },
      {
        title: 'Other Luminescence Types',
        content: 'Chemiluminescence occurs in chemical reactions (like glow sticks), bioluminescence in living organisms (fireflies, jellyfish), and electroluminescence in LEDs and displays. While these are fascinating, photoluminescence (fluorescence) remains the cornerstone of UV entertainment effects due to its intensity, reliability, and controllability.'
      },
      {
        title: 'Applications in Entertainment',
        content: 'Luminescent materials create stunning effects in theater, concerts, theme parks, and clubs. UV-reactive paints provide daytime visibility with explosive nighttime fluorescence under blacklight. The ability to "paint with invisible light" allows designers to create transformative environments that shift dramatically between normal and UV-illuminated states.'
      }
    ]
  },
  {
    id: 'wildfire-effect',
    title: 'The Wildfire Effect Explained',
    subtitle: 'Proprietary technology and visual impact',
    icon: 'Flame',
    color: '#E8412A',
    category: 'knowledge',
    sections: [
      {
        title: 'What is the Wildfire Effect?',
        content: 'The Wildfire Effect refers to the intense, eye-catching fluorescence achieved when high-quality UV-reactive pigments are illuminated with optimized UV sources. Unlike ordinary fluorescent materials, Wildfire paints are engineered for maximum brightness, color saturation, and visual impact under blacklight conditions. The effect creates an almost three-dimensional glow that seems to leap off surfaces.'
      },
      {
        title: 'Pigment Technology',
        content: 'Wildfire paints use premium fluorescent pigments with absorption spectra carefully matched to UVA LED and mercury vapor lamp outputs (peak emission around 365-395nm). These pigments have exceptionally high quantum yields, converting absorbed UV energy into visible light with minimal loss. The result is brightness levels that exceed conventional fluorescent paints by 50-200%.'
      },
      {
        title: 'Optimized UV Sources',
        content: 'Achieving the true Wildfire Effect requires proper UV illumination. Wildfire fixtures are designed with specific wavelength outputs, beam angles, and intensities to maximize fluorescent response. LED-based systems like VioStorm offer narrow-band UV output centered at 395nm, perfectly matched to the absorption peaks of Wildfire pigments for maximum efficiency.'
      },
      {
        title: 'The FLAME Formula',
        content: 'The Wildfire Effect is quantified using the proprietary FLAME formula: Fluorescent Luminance Amplification Metric for Entertainment. This formula considers pigment concentration, surface reflectance, UV flux density, and viewing angle to predict the perceived brightness and impact of fluorescent coatings. It allows designers to engineer specific visual outcomes with scientific precision.'
      },
      {
        title: 'Real-World Impact',
        content: 'In practice, the Wildfire Effect transforms spaces. Scenery that appears muted or invisible under normal lighting explodes with color under UV, creating dramatic scene transitions in theater. Murals and artwork gain depth and intensity impossible with conventional lighting. The effect is so striking that it often becomes the centerpiece of the design, rather than just an accent.'
      }
    ]
  },
  {
    id: 'uv-technologies',
    title: 'Technologies That Produce UV Light',
    subtitle: 'Comparing UV light sources',
    icon: 'Zap',
    color: '#8B5CF6',
    category: 'knowledge',
    sections: [
      {
        title: 'Mercury Vapor Lamps',
        content: 'Traditional mercury vapor lamps (including fluorescent blacklight tubes) produce UV by exciting mercury atoms with an electrical discharge. These lamps emit primarily at 365nm (UVA) with some visible violet light. They\'ve been the industry standard for decades due to high UV output and low cost, but they have drawbacks: warm-up time, heat generation, fragility, and mercury content requiring special disposal.'
      },
      {
        title: 'UV LED Technology',
        content: 'UV LEDs represent the modern evolution of UV sources. They emit narrow-band UV light (typically 365nm, 385nm, or 395nm) through semiconductor electroluminescence. Advantages include instant on/off, minimal heat output, long lifespan (50,000+ hours), compact size, dimming capability, and environmental friendliness. UV LEDs have become the preferred choice for professional installations.'
      },
      {
        title: 'Fluorescent Blacklight Tubes',
        content: 'Standard fluorescent blacklight tubes use a mercury vapor discharge tube coated with phosphors that convert the UV emission into a broader UVA spectrum. They\'re inexpensive and widely available, making them suitable for low-budget applications. However, they produce significant visible violet light, reducing the "pure UV" effect, and have lower UV intensity per watt compared to dedicated UV sources.'
      },
      {
        title: 'Metal Halide and HID Sources',
        content: 'High-intensity discharge (HID) lamps, including metal halide types, can produce UV as part of their broad-spectrum output. While not optimized for fluorescent effects, they provide very high total light output and are sometimes used in large-scale applications. UV-enhanced metal halide lamps incorporate UV-transmitting envelopes for increased UVA output.'
      },
      {
        title: 'Comparison and Selection',
        content: 'Choosing the right UV source depends on application requirements: budget, installation permanence, controllability needs, and desired effect intensity. For professional touring productions, UV LEDs offer reliability and control. For permanent installations, a mix of LED and mercury vapor provides intensity and efficiency. For temporary events or hobbyist use, fluorescent tubes remain viable. Wildfire fixtures are available in multiple technologies to suit every application.'
      }
    ]
  },
  {
    id: 'flame-formula',
    title: 'The FLAME Formula',
    subtitle: 'Quantifying fluorescent lighting performance',
    icon: 'Calculator',
    color: '#EF4444',
    category: 'knowledge',
    sections: [
      {
        title: 'Introduction to FLAME',
        content: 'The FLAME formula (Fluorescent Luminance Amplification Metric for Entertainment) is a proprietary method for predicting and optimizing the visual impact of UV-reactive materials under blacklight illumination. It combines photometric measurements, material properties, and perceptual factors into a single metric that correlates with audience impact and designer satisfaction.'
      },
      {
        title: 'Formula Components',
        content: 'FLAME = (Q × P × I × C) / (D² × A) where Q is quantum yield (0-1), P is pigment density (g/m²), I is incident UV irradiance (mW/m²), C is surface coating quality factor (0-1), D is viewing distance (meters), and A is ambient light factor (1-10). This formula accounts for both the physical light production and the perceptual factors that affect how audiences experience the effect.'
      },
      {
        title: 'Quantum Yield (Q)',
        content: 'Quantum yield represents the efficiency of fluorescence—the fraction of absorbed UV photons that result in emitted visible photons. Premium Wildfire pigments achieve Q values of 0.85-0.95, while standard fluorescent paints typically range from 0.40-0.70. A higher Q directly translates to brighter fluorescence for the same UV input, making it the most critical factor in achieving maximum impact.'
      },
      {
        title: 'UV Irradiance (I)',
        content: 'Incident UV irradiance measures the UV power hitting the surface per unit area. Higher irradiance produces proportionally brighter fluorescence until saturation occurs. Typical values: standard blacklight tube at 1m = 5,000–10,000 mW/m², UV LED fixture at 1m = 20,000–50,000 mW/m², professional Wildfire fixture at 1m = 50,000–150,000 mW/m². The FLAME formula is linear with irradiance below saturation threshold. Note: 1 mW/cm² = 10,000 mW/m².'
      },
      {
        title: 'Practical Applications',
        content: 'The FLAME formula allows lighting designers to: (1) predict the brightness of fluorescent surfaces before installation, (2) optimize fixture placement and UV intensity for maximum effect, (3) compare different pigments and UV sources quantitatively, (4) troubleshoot underperforming installations by identifying limiting factors. By targeting specific FLAME values (e.g., FLAME > 100 for primary scenic elements, FLAME > 200 for focal accents), designers can engineer consistent, predictable results across different venues and productions.'
      }
    ]
  },
  {
    id: 'shooting-uv',
    title: 'Shooting UV Effects',
    subtitle: 'Photography and videography techniques',
    icon: 'Camera',
    color: '#06B6D4',
    category: 'knowledge',
    sections: [
      {
        title: 'Camera Settings for UV Effects',
        content: 'Photographing fluorescent effects requires different settings than normal photography. Use manual mode with ISO 400-1600, wide apertures (f/2.8-f/5.6), and shutter speeds of 1/30-1/125s depending on subject movement. Disable auto white balance and set to daylight (5500K) or custom white balance. Fluorescent light is dimmer than it appears to the eye, so exposure compensation of +1 to +2 stops is often necessary.'
      },
      {
        title: 'Lens and Filter Selection',
        content: 'Use high-quality lenses with good UV transmission and minimal chromatic aberration. Avoid UV-blocking filters (standard on many modern lenses) as they can reduce fluorescent brightness. For pure fluorescent effects with minimal ambient light, consider UV-pass filters that block visible light while transmitting UV, allowing only the fluorescence to reach the sensor. For mixed lighting, no filter is usually best.'
      },
      {
        title: 'Lighting Techniques',
        content: 'Position UV fixtures at 30-60° angles to the subject to create depth and reduce flat lighting. Use multiple UV sources from different angles to eliminate shadows and enhance three-dimensionality. Balance UV intensity with minimal ambient light—just enough to provide context without overwhelming the fluorescent effect. Front lighting creates bold color saturation; backlighting creates dramatic silhouettes with glowing edges.'
      },
      {
        title: 'Exposure and Post-Processing',
        content: 'Expose for the fluorescent highlights, allowing non-fluorescent areas to go dark—this maximizes visual impact. Shoot in RAW format for maximum post-processing flexibility. In editing, increase contrast and vibrance (not saturation, which can create artificial-looking colors). Slightly increase sharpness to compensate for the diffuse nature of fluorescent light. Reduce noise carefully, as aggressive noise reduction can muddy fine fluorescent details.'
      },
      {
        title: 'Video-Specific Considerations',
        content: 'For video, use 24fps or 30fps for a cinematic look, or 60fps for smooth motion. Avoid auto-exposure, which will hunt constantly under changing UV conditions. Use manual focus, as autofocus often fails in low-light UV environments. For smooth exposure transitions when switching between normal and UV lighting, shoot in log gamma if available and grade in post. Consider using LUTs (look-up tables) specifically designed for fluorescent scenes to achieve consistent color rendering.'
      }
    ]
  }
];
