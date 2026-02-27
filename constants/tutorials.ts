export interface TutorialSection {
  heading: string;
  body: string;
}

export interface Tutorial {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  readTime: string;
  sections: TutorialSection[];
  pdfUrl?: string;
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'science-behind-uv',
    title: 'The Science Behind UV',
    subtitle: 'Understanding Black Light',
    icon: 'Atom',
    color: '#7C6BF0',
    readTime: '5 min',
    sections: [
      {
        heading: 'What is UV Light?',
        body: 'Ultraviolet (UV) light is a form of electromagnetic energy with shorter wavelengths and more energy than visible light. It is invisible to the human eye and exists just beyond the violet end of the visible spectrum.',
      },
      {
        heading: 'The Electromagnetic Spectrum',
        body: 'UV light is part of the electromagnetic spectrum, which includes radio waves, microwaves, infrared, visible light, ultraviolet, x-rays, and gamma rays. The relationship between wavelength and energy is inverse — longer wavelengths have lower energy and shorter wavelengths have higher energy.',
      },
      {
        heading: 'Visible Light',
        body: 'Visible light falls in the middle of the electromagnetic spectrum, with wavelengths between 400 and 700 nanometres (nm). It is divided into the familiar colors: red, orange, yellow, green, blue, indigo, and violet (ROYGBIV). Red has the longest wavelength (~700nm) and violet the shortest (~400nm).',
      },
      {
        heading: 'Ultraviolet Light Range',
        body: 'UV light ranges from 100 to 400nm and is divided into several categories:\n\n• Long-wave UV (UV-A): 315–400nm — used in entertainment and black light effects\n• Medium-wave UV (UV-B): 280–315nm — causes sunburn\n• Short-wave UV (UV-C): 100–280nm — dangerous, used for germicidal applications\n• Vacuum UV: below 200nm — absorbed by air',
      },
      {
        heading: 'UV-C Warning',
        body: 'Short-wave UV (UV-C) is dangerous and can cause burns and blindness. It is useful for germicidal applications but should never be used for entertainment purposes. Always ensure your black light fixtures emit long-wave UV-A for safe operation.',
      },
    ],
    pdfUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3q0wjj9gdwnafz7658o7t',
  },
  {
    id: 'how-fluorescence-works',
    title: 'How Fluorescence Works',
    subtitle: 'Why Objects Glow Under Black Light',
    icon: 'Zap',
    color: '#F5A623',
    readTime: '4 min',
    sections: [
      {
        heading: 'The Basics of Fluorescence',
        body: 'When light (photons) comes into contact with an atom, an electron absorbs the energy and jumps to a higher energy state. When it falls back down, it releases the energy as a new photon of light. If a UV photon strikes an atom and the atom emits a visible photon in return, the material is said to be UV-sensitive — it fluoresces.',
      },
      {
        heading: 'Wavelength Matters',
        body: 'Different materials react best to certain UV wavelengths. In the entertainment industry, long-wave UV (UV-A) is typically used. For the brightest possible effect, a fixture with output peaking around 365nm is recommended.',
      },
      {
        heading: 'Energy Conversion',
        body: 'Fluorescence is essentially an energy conversion process. The material absorbs high-energy UV photons (invisible) and re-emits lower-energy visible photons (visible glow). This is why fluorescent materials appear to "glow" — they are converting invisible UV light into visible light your eyes can see.',
      },
      {
        heading: 'Practical Application',
        body: 'The strength of the fluorescent effect depends on several factors: the intensity of the UV source, the sensitivity of the material to UV wavelengths, the distance between the fixture and the material, and the amount of ambient visible light present (which competes with the fluorescent glow).',
      },
    ],
    pdfUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/22zh805bh2vc1mrn8ayqm',
  },
  {
    id: 'shedding-light-on-luminescence',
    title: 'Shedding Light on Luminescence',
    subtitle: 'Clarifying Definitions',
    icon: 'Lightbulb',
    color: '#22C55E',
    readTime: '4 min',
    sections: [
      {
        heading: 'Black Light',
        body: 'Black light is similar to visible light but has shorter wavelengths, existing just beyond the visible violet spectrum. It is known as ultraviolet (UV) light. "Black light" gets its name because you cannot see it — it appears "black" or invisible to human eyes.',
      },
      {
        heading: 'Fluorescence',
        body: 'Fluorescence is a process where a substance absorbs light at a specific wavelength and then emits light at a longer wavelength. In the context of black light, materials absorb long-wave UV light and release visible light almost instantaneously. The glow stops when the UV source is removed.',
      },
      {
        heading: 'Phosphorescence',
        body: 'Phosphorescence is similar to fluorescence but occurs over a longer time frame. Phosphorescent materials continue to glow after the initial light source is removed — this is the familiar "glow in the dark" effect. An example is Wildfire Glow Green Luminescent Paint.',
      },
      {
        heading: 'Luminescence',
        body: 'Luminescence is a broad term for light produced by various processes, including chemical reactions, electrical energy, and atomic changes. It encompasses phenomena such as fluorescence, phosphorescence, bioluminescence, chemiluminescence, and more.',
      },
      {
        heading: 'Photoluminescence',
        body: 'Photoluminescence is a specific type of luminescence resulting from excited electrons in an atom after absorbing photons of light. Both fluorescence and phosphorescence are forms of photoluminescence.',
      },
      {
        heading: 'Lamp vs. Fixture',
        body: 'In technical terms, a "lamp" refers to the light bulb itself — the component that produces light. The "fixture" is the housing that holds the lamp and may include reflectors, ballasts, lenses, and other components that shape and direct the light output.',
      },
    ],
    pdfUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/11ynb570bebcgikfl7e9r',
  },
  {
    id: 'wildfire-effect-explained',
    title: 'The Wildfire Effect Explained',
    subtitle: 'Types of Black Light Effects',
    icon: 'Flame',
    color: '#E8412A',
    readTime: '6 min',
    sections: [
      {
        heading: 'Introduction',
        body: 'Black light effects utilize long-wave ultraviolet light to illuminate materials that fluoresce. Common fluorescent materials include luminescent paint, water-dye, screen ink, and makeup. The versatility of these materials allows for a wide range of creative effects.',
      },
      {
        heading: 'Visible Fluorescent Effects',
        body: 'These images are bright and colourful under normal light and fluoresce even more dramatically under black light. The effect can be enhanced by surrounding fluorescent materials with non-fluorescent materials, making the fluorescent elements stand out more dramatically against the dark background.',
      },
      {
        heading: 'Invisible Fluorescent Effects',
        body: 'Invisible fluorescent materials appear clear or non-descript in normal light and are only visible under black light. This property is used for security applications (currency and ID verification), reveal effects in theatre, and surprise transitions in themed environments.',
      },
      {
        heading: 'Dual Image Effects',
        body: 'This technique involves two images where one is visible in normal light and the other appears only under black light. Artists alternate between normal and black light while painting to create these effects, resulting in scenes that transform completely when the lighting changes.',
      },
      {
        heading: 'Day/Night Transition Effects',
        body: 'A specific type of dual image effect where a scene changes from day to night when illuminated by black light. A daytime scene painted with conventional paint transforms into a moonlit nightscape painted with invisible fluorescent materials underneath.',
      },
      {
        heading: '3-D Effects',
        body: 'Fluorescence can create dramatic three-dimensional effects, enhanced by the use of 3-D glasses. These glasses manipulate the perception of depth based on color brightness, and the intense glow of fluorescent materials under UV light makes the 3D effect especially striking.',
      },
    ],
    pdfUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qi5cixgd1gcqfvwdzq3g0',
  },
  {
    id: 'technologies-produce-uv',
    title: 'Technologies That Produce UV Light',
    subtitle: 'Choosing the Right Black Light Source',
    icon: 'Cpu',
    color: '#3B82F6',
    readTime: '5 min',
    sections: [
      {
        heading: 'Wattage vs. Output',
        body: 'Wattage refers to power consumption, not brightness. The actual output (brightness) of a lamp is directly proportional to its wattage, but efficiency determines how much of that power consumption is converted to useful UV output. A more efficient lamp produces more UV per watt.',
      },
      {
        heading: 'Quality of Output',
        body: 'Different lamps produce light of different wavelengths. A good black light must have an output that is almost entirely in the long-wave UV range (around 365nm). Fixtures that emit significant visible light will wash out the fluorescent effect.',
      },
      {
        heading: 'Tungsten-Halogen Incandescent Lamps',
        body: 'These produce a small amount of UV light, but most of the wattage is wasted on visible light and heat, making them unsuitable for dramatic UV effects. They are essentially purple-tinted visible lights and do not produce true black light.',
      },
      {
        heading: 'Fluorescent Lamps',
        body: 'Fluorescent lamps use mercury vapor excited by an electrical current to produce short-wave UV light, which causes a powdered coating inside the tube to fluoresce. Black light blue (BLB) lamps use a special filter glass called Wood\'s glass to filter out most visible light while passing long-wave UV.',
      },
      {
        heading: 'LED Technology',
        body: 'Modern UV LEDs can produce very pure long-wave UV output with high efficiency. However, quality varies greatly — many lower-end LED fixtures produce light at 385-400nm, which is really high-energy visible violet rather than true UV. For best results across all UV-sensitive materials, look for fixtures peaking at 365-370nm.',
      },
      {
        heading: 'The 385-400nm Problem',
        body: 'The biggest problem with longer wavelength LED fixtures (385-400nm) is that invisible fluorescent materials don\'t respond well, if at all. White shirts and visible fluorescent materials will start to glow at around 400nm, but for the full range of UV effects, a true 365nm fixture is essential.',
      },
    ],
    pdfUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/x5359e8luukhp77o4bdvz',
  },
  {
    id: 'flame-formula',
    title: 'The FLAME Formula',
    subtitle: 'Creating Powerful Black Light Effects',
    icon: 'Flame',
    color: '#F97316',
    readTime: '5 min',
    sections: [
      {
        heading: 'Overview',
        body: 'When it comes to creating the brightest possible black light effects, there are four critical elements you must take into account. We\'ve condensed these into an easy-to-remember acronym called the "FLAME" formula.',
      },
      {
        heading: 'F is for "Fixture"',
        body: 'There are two factors to consider when selecting the right fixture: output and wavelength. Just because two fixtures are each 400 Watts doesn\'t mean each has the same output at the appropriate wavelength.\n\nFor best results, the fixture should peak at 365-370nm. Many so-called black lights aren\'t really black lights at all — many lower-end LED fixtures produce light at 385-400nm, which is really high-energy visible violet, not true black light.\n\nRecommended fixtures: Wildfire VioStorm, UltraBlade, and Effects Master LED and fluorescent series.',
      },
      {
        heading: 'L is for "Length" (Distance)',
        body: 'Mount the fixture as close as possible to the UV-sensitive materials for maximum brightness. UV irradiance follows the inverse-square law — double the distance and you get one-quarter the intensity.\n\nPowerful fixtures like the VioStorm Series can have effective throw distances up to 100 feet or more, but closer is always brighter.',
      },
      {
        heading: 'A is for "Ambient Lighting"',
        body: 'Minimize ambient light by covering windows and turning off unnecessary light sources. Ambient visible light competes with the fluorescent glow, washing out the effect.\n\nWildfire fixtures are powerful enough to still produce an effect even with some ambient light, but for the most dramatic results, reduce ambient light as much as possible.',
      },
      {
        heading: 'M is for "UV Sensitive Materials"',
        body: 'Use materials with the greatest possible sensitivity to long-wave UV. Not all fluorescent materials are created equal — some are more responsive than others.\n\nWildfire\'s paints are formulated to be super-saturated with UV-sensitive pigments, maximizing brightness under UV illumination.',
      },
      {
        heading: 'E is for "Effect"',
        body: 'The "Effect" is the final result when all four factors (Fixture, Length, Ambient, Material) are working together in harmony. By optimizing each element of the FLAME formula, you achieve the brightest, most dramatic black light effects possible.',
      },
    ],
    pdfUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xifit4przm6vwjusachrk',
  },
  {
    id: 'fluorescent-blb-lamps',
    title: 'Fluorescent Black Light Lamps',
    subtitle: 'Maximizing UV Output',
    icon: 'Zap',
    color: '#D946EF',
    readTime: '5 min',
    sections: [
      {
        heading: 'How Fluorescent Lamps Work',
        body: 'Fluorescent lamps contain mercury vapor and noble gases (like argon or xenon). When electrified, they emit UV-C light internally. A fluorescent powder coating inside the tube reacts to this UV-C light, converting it to either visible light or long-wave UV light (black light), which is then filtered through Wood\'s glass.',
      },
      {
        heading: 'Fluorescent Powder Coating',
        body: 'The effectiveness of the fluorescent powder directly influences brightness. Using a more reactive coating increases UV output. Wildfire\'s SableLux lamps use a proprietary high-reactivity coating that produces significantly more UV output than standard BLB lamps.',
      },
      {
        heading: 'Tube Diameter Matters',
        body: 'A smaller tube diameter (e.g., T8 = 1 inch) allows for a brighter fluorescence due to the closer proximity of the phosphor coating to the mercury arc at the center of the tube. This enhances UV output compared to standard larger-diameter T10 or T12 tubes.',
      },
      {
        heading: 'VHO Electronic Ballasts',
        body: 'The fixture housing the lamp significantly affects output. Using a Very High Output (VHO) electronic ballast can double the lamp\'s standard output. The ballast drives the lamp at a higher current, exciting more mercury atoms and producing more UV.',
      },
      {
        heading: 'Maximum UV Output Recipe',
        body: 'To achieve maximum UV output from fluorescent technology:\n\n1. Use a high-reactivity phosphor coating (SableLux)\n2. Choose T8 diameter tubes\n3. Drive with VHO electronic ballasts\n4. Keep lamps clean — dust absorbs UV\n5. Replace lamps regularly — UV output degrades over time',
      },
    ],
    pdfUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ob3ayo95r015u2ijdkx1w',
  },
  {
    id: 'shooting-uv-effects',
    title: 'Shooting UV Effects',
    subtitle: 'Photography & Video Under Black Light',
    icon: 'Camera',
    color: '#EC4899',
    readTime: '4 min',
    sections: [
      {
        heading: 'Film vs. Digital',
        body: 'When shooting on film, use a high-density UV haze filter to prevent fogging, as film is highly sensitive to UV light. For digital cameras and video, a UV filter is generally not necessary since digital sensors are less affected by UV wavelengths.',
      },
      {
        heading: 'Lighting Requirements',
        body: 'You will need significantly more UV light for photography and video than for a live audience viewing. Cameras require higher light levels to properly expose the fluorescent effect. Plan for additional fixtures or closer mounting distances.',
      },
      {
        heading: 'Exposure (Film)',
        body: 'Use a spot meter to determine the correct F-stop:\n\n• Overexposure creates a hazy, glowing effect\n• Underexposure appears flat and muddy\n• The meter reading provides a bright, saturated color\n\nBracket your exposures to find the ideal look.',
      },
      {
        heading: 'Camera Angle',
        body: 'Place the camera at the angle of incidence of the light source for the best results. This means the camera should be positioned where the UV light reflects most strongly off the fluorescent surface, maximizing the captured glow.',
      },
      {
        heading: 'Testing',
        body: 'Always perform test shots and experiment before the actual shoot. UV effects can look very different on camera than they do to the naked eye. Test with your specific camera, lens, and lighting setup to ensure you achieve the desired result.',
      },
    ],
    pdfUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/g7535od8ocm2yltx6rjf8',
  },
];
