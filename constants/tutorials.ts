export interface TutorialSection {
  title: string;
  content: string;
  heading?: string;
  body?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  readTime?: string;
  pdfUrl?: string;
  sections: TutorialSection[];
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'uv-science',
    title: 'The Science Behind UV',
    subtitle: 'Understanding ultraviolet light fundamentals',
    icon: 'Atom',
    color: '#7C6BF0',
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
    sections: [
      {
        title: 'Introduction to FLAME',
        content: 'The FLAME formula (Fluorescent Luminance Amplification Metric for Entertainment) is a proprietary method for predicting and optimizing the visual impact of UV-reactive materials under blacklight illumination. It combines photometric measurements, material properties, and perceptual factors into a single metric that correlates with audience impact and designer satisfaction.'
      },
      {
        title: 'Formula Components',
        content: 'FLAME = (Q × P × I × C) / (D² × A) where Q is quantum yield (0-1), P is pigment density (g/m²), I is incident UV irradiance (mW/cm²), C is surface coating quality factor (0-1), D is viewing distance (meters), and A is ambient light factor (1-10). This formula accounts for both the physical light production and the perceptual factors that affect how audiences experience the effect.'
      },
      {
        title: 'Quantum Yield (Q)',
        content: 'Quantum yield represents the efficiency of fluorescence—the fraction of absorbed UV photons that result in emitted visible photons. Premium Wildfire pigments achieve Q values of 0.85-0.95, while standard fluorescent paints typically range from 0.40-0.70. A higher Q directly translates to brighter fluorescence for the same UV input, making it the most critical factor in achieving maximum impact.'
      },
      {
        title: 'UV Irradiance (I)',
        content: 'Incident UV irradiance measures the UV power hitting the surface per unit area. Higher irradiance produces proportionally brighter fluorescence until saturation occurs. Typical values: standard blacklight tube at 1m = 0.5-1 mW/cm², UV LED fixture at 1m = 2-5 mW/cm², professional Wildfire fixture at 1m = 5-15 mW/cm². The FLAME formula is linear with irradiance below saturation threshold.'
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
