/**
 * Initial content – taken ONLY from Onik_CV.pdf (nothing invented).
 * Everything here is editable afterwards from the admin dashboard; this file is
 * used once to bootstrap an empty database.
 *
 * Sections the CV does not cover (work experience, internships, research,
 * certifications, achievements, services, testimonials, blog) start empty and
 * are hidden on the public site until content is added in the dashboard.
 */

export const profile = {
  name: 'Onik',
  title: 'Full-Stack MERN Developer',
  headline: 'Computer Science & Engineering student at IUBAT',
  shortIntro:
    'Computer Science and Engineering student building full-stack web applications with the MERN stack — from an online grocery store and a movie ticket booking platform with Stripe payments to an AI-powered resume analyzer.',
  bio: [
    'I am a dedicated Computer Science and Engineering student looking for a role where I can apply my knowledge, skills, and passion for technology to provide the best potential I have while gaining hands-on experience and contributing to organizational success.',
    '',
    'I am pursuing a BSc in Computer Science and Engineering at the International University of Business Agriculture and Technology (IUBAT), expected in 2026, with a CGPA of 3.79 / 4.00.',
    '',
    'My work focuses on full-stack JavaScript: React and Tailwind CSS on the frontend, Node.js, Express.js and RESTful APIs on the backend, and MongoDB for data — with experience in user authentication, session handling, Stripe payment integration and the Gemini API.',
  ].join('\n'),
  careerObjective:
    'I am a dedicated Computer Science and Engineering student looking for a role where I can apply my knowledge, skills, and passion for technology to provide the best potential I have while gaining hands-on experience and contributing to organizational success.',
  location: 'Uttara, Dhaka, Bangladesh',
  availability: '',
  avatar: { url: '', alt: 'Portrait of Onik' },
  resume: { url: '', fileName: 'Onik_CV.pdf', updatedAt: '' },
  highlights: [
    { value: '3.79', label: 'CGPA out of 4.00 · BSc CSE' },
    { value: '4', label: 'Live full-stack projects' },
    { value: 'MERN', label: 'Primary stack' },
  ],
  contact: {
    email: 'onik126.cse@gmail.com',
    phone: '+880 1780-350722',
    location: 'Uttara, Dhaka, Bangladesh',
    showEmail: true,
    showPhone: true,
    formEnabled: true,
    note: '',
  },
};

export const settings = {
  general: { siteTitle: 'Onik — Portfolio', logoText: 'onik', logo: { url: '', alt: '' }, favicon: '' },
  theme: { primaryColor: '#5b8cff', defaultTheme: 'dark', allowToggle: true },
  hero: { greeting: "Hi, I'm", ctaProjectsLabel: 'View Projects', ctaCvLabel: 'Download CV', ctaContactLabel: 'Contact Me', showSocials: true },
  seo: {
    title: 'Onik — Full-Stack MERN Developer',
    description:
      'Portfolio of Onik, a Computer Science and Engineering student at IUBAT (Dhaka, Bangladesh) building full-stack web applications with React, Node.js, Express.js and MongoDB.',
    keywords: ['Onik', 'Full-Stack Developer', 'MERN Stack', 'React', 'Node.js', 'Express.js', 'MongoDB', 'Portfolio', 'Dhaka', 'Bangladesh', 'IUBAT'],
    ogImage: '',
    twitterHandle: '',
    siteUrl: 'https://onikportfolio.vercel.app',
    indexable: true,
  },
  footer: { text: 'Designed & built by Onik.', showSocials: true },
  sections: [],
};

export const skills = [
  ['Programming Languages', ['JavaScript', 'Python', 'C#', 'C++']],
  ['Frontend Development', ['HTML5', 'CSS3', 'React.js', 'Tailwind CSS', 'Bootstrap', 'DaisyUI']],
  ['Backend Development', ['Node.js', 'Express.js', 'RESTful APIs', 'ASP.NET Core']],
  ['Databases', ['MongoDB', 'MySQL', 'SQLite']],
  ['Tools & Platforms', ['Git', 'GitHub', 'Postman', 'Thunder Client', 'VS Code', 'Figma', 'XAMPP', 'VS Insiders']],
  ['Core Concepts', ['Data Structures & Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks']],
  // Added on request (not in the CV PDF).
  ['AI Tools', ['GitHub Copilot', 'Claude', 'Codex', 'Antigravity']],
].flatMap(([category, names]) => names.map((name) => ({ name, category })));

export const education = [
  {
    degree: 'Bachelor of Science (BSc)',
    field: 'Computer Science and Engineering',
    institution: 'International University of Business Agriculture and Technology (IUBAT)',
    location: '',
    startDate: '',
    endDate: 'Expected 2026',
    result: 'CGPA 3.79 / 4.00 (Summer 2026)',
    description: '',
  },
  {
    degree: 'Higher Secondary Certificate (HSC)',
    field: '',
    institution: 'Major General Mahmudul Hasan Adarsha College',
    location: '',
    startDate: '',
    endDate: '',
    result: 'GPA 5.00',
    description: '',
  },
];

const MERN = ['MongoDB', 'Express.js', 'React.js', 'Node.js', 'Tailwind CSS'];

export const projects = [
  {
    title: 'Fresh Roots – Online Grocery Store',
    slug: 'fresh-roots',
    shortDescription:
      'A full-stack e-commerce grocery platform where users browse products, add them to a cart and place orders online.',
    description: [
      '- Developed a full-stack e-commerce grocery platform allowing users to browse products, add to cart, and place orders online.',
      '- Implemented user authentication, product management, and order handling with RESTful APIs and MongoDB database integration.',
      '- Designed a responsive and user-friendly UI optimized for a smooth shopping experience across devices.',
    ].join('\n'),
    technologies: MERN,
    category: 'Full-Stack Web App',
    githubUrl: 'https://github.com/fardin0045/FreshRoots-eCommerce',
    liveUrl: 'https://fresh-roots-grocery.vercel.app/',
    featured: true,
    screenshot: 'fresh-roots.png',
  },
  {
    title: 'Crown Cineplex – Online Movie Ticket Booking',
    slug: 'crown-cineplex',
    shortDescription:
      'A full-stack movie ticket booking platform showing films playing in the cinema hall, with ticket purchase and Stripe payments.',
    description: [
      '- Developed a full-stack movie ticket booking platform allowing users to see movies that are playing in the cinema hall, buy tickets, and pay with Stripe payment integration.',
      '- Implemented user authentication and session handling with RESTful APIs and MongoDB database integration.',
      '- Designed a responsive and user-friendly UI optimized for smooth use across devices.',
    ].join('\n'),
    technologies: [...MERN, 'Stripe'],
    category: 'Full-Stack Web App',
    githubUrl: 'https://github.com/fardin0045/Crown-Cineplex/',
    liveUrl: 'https://crowncineplex.vercel.app/',
    featured: true,
    screenshot: 'crown-cineplex.png',
  },
  {
    title: 'ResuMate – Resume Analyzer',
    slug: 'resumate',
    shortDescription:
      'An AI-powered resume analysis platform that evaluates a resume against a targeted job role and suggests improvements.',
    description: [
      '- Developed a full-stack AI-powered resume analysis platform that allows users to evaluate their resumes based on a targeted job role.',
      '- Integrated the Gemini API to analyze resume content, identify strengths and weaknesses, and provide personalized improvement suggestions.',
    ].join('\n'),
    technologies: ['Node.js', 'Express.js', 'MongoDB', 'React', 'Tailwind CSS', 'Gemini API'],
    category: 'AI / Full-Stack Web App',
    githubUrl: 'https://github.com/fardin0045/ResumeCheckerApp',
    liveUrl: 'https://resume-checker-app-iota.vercel.app/',
    featured: true,
    screenshot: 'resumate.png',
  },
];

/**
 * Added on request (not in the CV PDF): NextMeet, from the project README and live deployment.
 * GitHub URL can be added from Dashboard → Projects.
 */
export const extraProjects = [
  {
    title: 'NextMeet – Real-Time Video Chat App',
    slug: 'nextmeet',
    shortDescription:
      'A full-stack real-time communication app with friends management, one-to-one and group chat, and Stream-powered video calling.',
    description: [
      '- Email/password authentication with secure cookie-based sessions (JWT) and an onboarding flow for profile setup.',
      '- Friends directory with friend requests and recommended users.',
      '- Direct and group chat using Stream Chat, plus real-time video calling using Stream Video.',
      '- Profile editing, settings and notifications.',
      '- Production build served by the Express backend and deployed on Render.',
    ].join('\n'),
    technologies: ['React', 'Node.js', 'Express.js', 'MongoDB', 'Mongoose', 'JWT', 'Stream Chat', 'Stream Video', 'TanStack Query', 'Zustand', 'Tailwind CSS', 'DaisyUI'],
    category: 'Real-Time Web App',
    githubUrl: '',
    liveUrl: 'https://next-meet-x0jg.onrender.com/login',
    featured: true,
    screenshot: 'nextmeet.png',
  },
];

/**
 * Added on request with placeholder details – edit in Dashboard → Experience.
 */
export const experience = [
  {
    type: 'work',
    role: 'Software Developer Intern',
    company: 'Arbree Solution',
    employmentType: 'Internship',
    location: 'Dhaka, Bangladesh',
    startDate: '2026',
    endDate: '',
    current: true,
    description: 'Working with the development team on building and maintaining web applications as a software developer intern.',
    highlights: [],
    technologies: ['JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB'],
  },
];

export const socialLinks = [
  { platform: 'github', label: 'GitHub', url: 'https://github.com/fardin0045', showInHero: true },
  { platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/onik-78b702375', showInHero: true },
  { platform: 'email', label: 'Email', url: 'mailto:onik126.cse@gmail.com', showInHero: true },
];
