// Local Templates Library - No AI needed!
// All generators use this for instant, free generation

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  preheader: string;
  html: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    category: 'Onboarding',
    subject: 'Welcome to {{brand}}!',
    preheader: 'We\'re excited to have you on board',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <div style="background:{{primaryColor}};color:white;padding:40px;text-align:center">
          <h1 style="margin:0;font-size:28px">Welcome to {{brand}}!</h1>
        </div>
        <div style="padding:40px;background:#ffffff">
          <h2>Hi {{name}},</h2>
          <p style="color:#666;line-height:1.6">Thank you for joining {{brand}}. We're thrilled to have you as part of our community.</p>
          <p style="color:#666;line-height:1.6">Here's what you can do next:</p>
          <ul style="color:#666;line-height:1.8">
            <li>Complete your profile</li>
            <li>Explore our features</li>
            <li>Connect with your team</li>
          </ul>
          <a href="{{ctaLink}}" style="display:inline-block;background:{{primaryColor}};color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:20px">{{ctaText}}</a>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;color:#999;font-size:12px">
          © {{year}} {{brand}}. All rights reserved.
        </div>
      </div>`
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    category: 'Marketing',
    subject: 'Your {{brand}} Weekly Update',
    preheader: 'Catch up on what\'s new this week',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <div style="background:{{primaryColor}};color:white;padding:30px;text-align:center">
          <h1 style="margin:0">{{brand}} Newsletter</h1>
          <p style="margin:10px 0 0;opacity:0.9">{{date}}</p>
        </div>
        <div style="padding:40px;background:#ffffff">
          <h2 style="color:#333">This Week's Highlights</h2>
          <div style="border-left:4px solid {{primaryColor}};padding-left:15px;margin:20px 0">
            <h3 style="color:#333;margin:0">Feature Update</h3>
            <p style="color:#666;margin:5px 0 0">Your weekly summary goes here...</p>
          </div>
          <div style="border-left:4px solid {{secondaryColor}};padding-left:15px;margin:20px 0">
            <h3 style="color:#333;margin:0">Team News</h3>
            <p style="color:#666;margin:5px 0 0">Team updates go here...</p>
          </div>
          <a href="{{ctaLink}}" style="display:inline-block;background:{{primaryColor}};color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:20px">Read More</a>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;color:#999;font-size:12px">
          <p>You're receiving this because you subscribed to {{brand}} updates.</p>
          <a href="{{unsubscribeLink}}" style="color:{{primaryColor}}">Unsubscribe</a>
        </div>
      </div>`
  },
  {
    id: 'promotional',
    name: 'Promotional',
    category: 'Marketing',
    subject: 'Special Offer from {{brand}}!',
    preheader: 'Get {{discount}} off your next purchase',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <div style="background:linear-gradient(135deg,{{primaryColor}},{{secondaryColor}});color:white;padding:50px;text-align:center">
          <h1 style="margin:0;font-size:36px">{{discount}}% OFF</h1>
          <p style="margin:10px 0 0;font-size:18px">Your Next Purchase</p>
        </div>
        <div style="padding:40px;background:#ffffff;text-align:center">
          <p style="color:#666;font-size:16px;line-height:1.6">Use code <strong style="color:{{primaryColor}}">{{promoCode}}</strong> at checkout</p>
          <div style="background:#f0f0f0;padding:20px;border-radius:8px;margin:20px 0">
            <p style="color:#333;font-size:24px;font-weight:bold;margin:0">{{discount}}% OFF</p>
            <p style="color:#666;margin:5px 0 0">All products & services</p>
          </div>
          <p style="color:#999;font-size:12px">Valid until {{expiryDate}}</p>
          <a href="{{ctaLink}}" style="display:inline-block;background:{{primaryColor}};color:white;padding:16px 40px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:20px">Shop Now</a>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;color:#999;font-size:12px">
          © {{year}} {{brand}}. All rights reserved.
        </div>
      </div>`
  },
  {
    id: 'transactional',
    name: 'Order Confirmation',
    category: 'Transactional',
    subject: 'Order #{{orderId}} Confirmed',
    preheader: 'Your order has been confirmed',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <div style="background:{{primaryColor}};color:white;padding:30px;text-align:center">
          <h1 style="margin:0">Order Confirmed!</h1>
        </div>
        <div style="padding:40px;background:#ffffff">
          <p style="color:#666">Hi {{name}},</p>
          <p style="color:#666">Your order <strong>#{{orderId}}</strong> has been confirmed and is being processed.</p>
          <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0">
            <h3 style="color:#333;margin:0 0 15px">Order Summary</h3>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#666">Items</td><td style="padding:8px 0;text-align:right;color:#333">{{itemCount}}</td></tr>
              <tr><td style="padding:8px 0;color:#666">Subtotal</td><td style="padding:8px 0;text-align:right;color:#333">{{subtotal}}</td></tr>
              <tr><td style="padding:8px 0;color:#666">Shipping</td><td style="padding:8px 0;text-align:right;color:#333">{{shipping}}</td></tr>
              <tr><td style="padding:8px 0;color:#333;font-weight:bold">Total</td><td style="padding:8px 0;text-align:right;color:{{primaryColor}};font-weight:bold">{{total}}</td></tr>
            </table>
          </div>
          <a href="{{trackLink}}" style="display:inline-block;background:{{primaryColor}};color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold">Track Order</a>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;color:#999;font-size:12px">
          © {{year}} {{brand}}. All rights reserved.
        </div>
      </div>`
  },
  {
    id: 'followup',
    name: 'Follow-up',
    category: 'Outreach',
    subject: 'Following up on our conversation',
    preheader: 'Just checking in',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <div style="padding:40px;background:#ffffff">
          <p style="color:#666">Hi {{name}},</p>
          <p style="color:#666;line-height:1.6">I wanted to follow up on our recent conversation about {{topic}}.</p>
          <p style="color:#666;line-height:1.6">{{message}}</p>
          <p style="color:#666;line-height:1.6">Would you be available for a quick call this week to discuss further?</p>
          <p style="color:#666;line-height:1.6">Best regards,<br>{{senderName}}</p>
          <a href="{{ctaLink}}" style="display:inline-block;background:{{primaryColor}};color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:20px">{{ctaText}}</a>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;color:#999;font-size:12px">
          © {{year}} {{brand}}. All rights reserved.
        </div>
      </div>`
  },
  {
    id: 'cold-outreach',
    name: 'Cold Outreach',
    category: 'Outreach',
    subject: 'Quick question about your {{painPoint}}',
    preheader: 'Helping {{brand}} solve {{painPoint}}',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <div style="padding:40px;background:#ffffff">
          <p style="color:#666">Hi {{name}},</p>
          <p style="color:#666;line-height:1.6">I noticed that {{brand}} is {{observation}}.</p>
          <p style="color:#666;line-height:1.6">We've helped companies like {{socialProof}} solve similar challenges by {{solution}}.</p>
          <p style="color:#666;line-height:1.6">Would you be open to a 15-minute call to see if we can help {{brand}} as well?</p>
          <p style="color:#666;line-height:1.6">Best,<br>{{senderName}}</p>
          <a href="{{ctaLink}}" style="display:inline-block;background:{{primaryColor}};color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:20px">Book a Call</a>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;color:#999;font-size:12px">
          © {{year}} {{brand}}. All rights reserved.
        </div>
      </div>`
  }
];

export interface ResumeSection {
  title: string;
  content: string;
}

export const RESUME_SECTIONS = [
  'Contact Information',
  'Professional Summary',
  'Work Experience',
  'Education',
  'Skills',
  'Certifications',
  'Projects',
  'Languages',
  'Volunteer Work',
  'References'
];

export const SKILL_CATEGORIES = {
  'Programming': ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift'],
  'Frontend': ['React', 'Vue.js', 'Angular', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'SASS', 'Redux', 'Next.js'],
  'Backend': ['Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Ruby on Rails', 'ASP.NET', 'Laravel', 'FastAPI', 'GraphQL'],
  'Database': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Firebase', 'Supabase'],
  'DevOps': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'GitHub Actions', 'Nginx', 'Linux'],
  'Design': ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Sketch', 'InVision', 'Canva', 'UI/UX Design'],
  'Business': ['Project Management', 'Agile/Scrum', 'Data Analysis', 'Marketing', 'Sales', 'Customer Service', 'Leadership', 'Communication']
};

export const ACHIEVEMENT_VERBS = [
  'Achieved', 'Increased', 'Reduced', 'Implemented', 'Led', 'Developed', 'Launched',
  'Optimized', 'Streamlined', 'Managed', 'Created', 'Designed', 'Built', 'Delivered',
  'Improved', 'Negotiated', 'Resolved', 'Established', 'Pioneered', 'Spearheaded'
];

export interface LogoShape {
  id: string;
  name: string;
  svg: (color: string, size: number) => string;
}

export const LOGO_SHAPES: LogoShape[] = [
  {
    id: 'circle',
    name: 'Circle',
    svg: (color, size) => `<circle cx="${size/2}" cy="${size/2}" r="${size/2-4}" fill="${color}"/>`
  },
  {
    id: 'square',
    name: 'Square',
    svg: (color, size) => `<rect x="4" y="4" width="${size-8}" height="${size-8}" rx="8" fill="${color}"/>`
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    svg: (color, size) => {
      const cx = size/2, cy = size/2, r = size/2-8;
      const points = Array.from({length: 6}, (_, i) => {
        const angle = (i * 60 - 30) * Math.PI / 180;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      return `<polygon points="${points}" fill="${color}"/>`;
    }
  },
  {
    id: 'diamond',
    name: 'Diamond',
    svg: (color, size) => {
      const cx = size/2, cy = size/2, r = size/2-8;
      return `<polygon points="${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}" fill="${color}"/>`;
    }
  },
  {
    id: 'triangle',
    name: 'Triangle',
    svg: (color, size) => {
      const cx = size/2, r = size/2-8;
      return `<polygon points="${cx},${cx-r} ${cx+r},${cx+r} ${cx-r},${cx+r}" fill="${color}"/>`;
    }
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    svg: (color, size) => {
      const cx = size/2, cy = size/2, r = size/2-8;
      const points = Array.from({length: 5}, (_, i) => {
        const angle = (i * 72 - 90) * Math.PI / 180;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      return `<polygon points="${points}" fill="${color}"/>`;
    }
  },
  {
    id: 'star',
    name: 'Star',
    svg: (color, size) => {
      const cx = size/2, cy = size/2, outer = size/2-8, inner = outer * 0.4;
      const points = Array.from({length: 10}, (_, i) => {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (i * 36 - 90) * Math.PI / 180;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      return `<polygon points="${points}" fill="${color}"/>`;
    }
  },
  {
    id: 'rounded-square',
    name: 'Rounded Square',
    svg: (color, size) => `<rect x="4" y="4" width="${size-8}" height="${size-8}" rx="${size/4}" fill="${color}"/>`
  }
];

export const COLOR_PALETTES = [
  { name: 'Violet', primary: '#6366f1', secondary: '#8b5cf6', accent: '#a78bfa' },
  { name: 'Blue', primary: '#3b82f6', secondary: '#60a5fa', accent: '#93c5fd' },
  { name: 'Emerald', primary: '#10b981', secondary: '#34d399', accent: '#6ee7b7' },
  { name: 'Orange', primary: '#f97316', secondary: '#fb923c', accent: '#fdba74' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#fb7185', accent: '#fda4af' },
  { name: 'Amber', primary: '#f59e0b', secondary: '#fbbf24', accent: '#fcd34d' },
  { name: 'Cyan', primary: '#06b6d4', secondary: '#22d3ee', accent: '#67e8f9' },
  { name: 'Pink', primary: '#ec4899', secondary: '#f472b6', accent: '#f9a8d4' },
  { name: 'Indigo', primary: '#4f46e5', secondary: '#6366f1', accent: '#818cf8' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#2dd4bf', accent: '#5eead4' },
  { name: 'Slate', primary: '#475569', secondary: '#64748b', accent: '#94a3b8' },
  { name: 'Crimson', primary: '#dc2626', secondary: '#ef4444', accent: '#f87171' }
];

export const FONTS = [
  'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Impact', 'Trebuchet MS', 'Palatino', 'Garamond'
];

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_BANKS: Record<string, QuizQuestion[]> = {
  'JavaScript': [
    { question: 'What is the output of typeof null?', options: ['null', 'undefined', 'object', 'boolean'], correctIndex: 2, explanation: 'In JavaScript, typeof null returns "object" which is a known bug in the language.' },
    { question: 'Which method adds an element to the end of an array?', options: ['shift()', 'unshift()', 'push()', 'pop()'], correctIndex: 2, explanation: 'push() adds elements to the end of an array.' },
    { question: 'What does === check?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], correctIndex: 2, explanation: '=== checks both value and type (strict equality).' },
    { question: 'Which keyword declares a constant?', options: ['var', 'let', 'const', 'static'], correctIndex: 2, explanation: 'const declares a constant that cannot be reassigned.' },
    { question: 'What is a closure?', options: ['A function with access to outer scope', 'A closed loop', 'A finished function', 'A private variable'], correctIndex: 0, explanation: 'A closure is a function that has access to variables in its outer scope.' },
    { question: 'Which method removes the last element?', options: ['shift()', 'pop()', 'splice()', 'slice()'], correctIndex: 1, explanation: 'pop() removes and returns the last element of an array.' },
    { question: 'What does JSON stand for?', options: ['Java Source Object Notation', 'JavaScript Object Notation', 'Java Script Online Notation', 'None of the above'], correctIndex: 1, explanation: 'JSON stands for JavaScript Object Notation.' },
    { question: 'Which is not a JavaScript data type?', options: ['String', 'Boolean', 'Float', 'Symbol'], correctIndex: 2, explanation: 'Float is not a JavaScript data type. Numbers are used instead.' },
    { question: 'What is the DOM?', options: ['Document Object Model', 'Data Object Model', 'Document Oriented Model', 'None'], correctIndex: 0, explanation: 'DOM stands for Document Object Model.' },
    { question: 'Which method finds an element by ID?', options: ['getElement()', 'getElementById()', 'findElement()', 'queryElement()'], correctIndex: 1, explanation: 'document.getElementById() finds an element by its ID.' }
  ],
  'Python': [
    { question: 'What is the output of print(type(5))?', options: ['int', 'float', 'number', 'decimal'], correctIndex: 0, explanation: '5 is an integer, so type(5) returns <class "int">.' },
    { question: 'Which keyword defines a function?', options: ['function', 'def', 'func', 'define'], correctIndex: 1, explanation: 'def is used to define functions in Python.' },
    { question: 'What is a list comprehension?', options: ['A way to create lists', 'A list method', 'A loop type', 'A data structure'], correctIndex: 0, explanation: 'List comprehension is a concise way to create lists in Python.' },
    { question: 'Which is used for comments?', options: ['//', '/*', '#', '--'], correctIndex: 2, explanation: '# is used for single-line comments in Python.' },
    { question: 'What does pip install do?', options: ['Removes packages', 'Installs packages', 'Updates Python', 'Lists packages'], correctIndex: 1, explanation: 'pip install installs Python packages from PyPI.' },
    { question: 'What is PEP 8?', options: ['A Python version', 'Style guide for Python', 'A package', 'A function'], correctIndex: 1, explanation: 'PEP 8 is the style guide for Python code.' },
    { question: 'Which creates a dictionary?', options: ['[]', '{}', '()', '<>'], correctIndex: 1, explanation: 'Curly braces {} create dictionaries in Python.' },
    { question: 'What is self in a class?', options: ['The class itself', 'The instance', 'A keyword', 'A variable'], correctIndex: 1, explanation: 'self refers to the current instance of the class.' },
    { question: 'What does *args allow?', options: ['Keyword arguments', 'Variable arguments', 'Default arguments', 'No arguments'], correctIndex: 1, explanation: '*args allows passing variable number of positional arguments.' },
    { question: 'Which is a mutable type?', options: ['tuple', 'string', 'list', 'int'], correctIndex: 2, explanation: 'Lists are mutable, meaning they can be changed after creation.' }
  ],
  'General Knowledge': [
    { question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correctIndex: 2, explanation: 'Paris is the capital and largest city of France.' },
    { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correctIndex: 2, explanation: 'There are 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.' },
    { question: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3, explanation: 'The Pacific Ocean is the largest and deepest ocean.' },
    { question: 'What year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctIndex: 2, explanation: 'World War II ended in 1945.' },
    { question: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctIndex: 2, explanation: 'Au comes from the Latin word "aurum" meaning gold.' },
    { question: 'How many planets in our solar system?', options: ['7', '8', '9', '10'], correctIndex: 1, explanation: 'There are 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.' },
    { question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'], correctIndex: 0, explanation: 'Light travels at approximately 300,000 kilometers per second.' },
    { question: 'Who painted the Mona Lisa?', options: ['Picasso', 'Da Vinci', 'Van Gogh', 'Monet'], correctIndex: 1, explanation: 'Leonardo da Vinci painted the Mona Lisa between 1503-1519.' },
    { question: 'What is the largest planet?', options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], correctIndex: 1, explanation: 'Jupiter is the largest planet in our solar system.' },
    { question: 'What is the smallest country?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctIndex: 1, explanation: 'Vatican City is the smallest country at 0.44 km².' }
  ],
  'Science': [
    { question: 'What is H2O?', options: ['Water', 'Oxygen', 'Hydrogen', 'Carbon'], correctIndex: 0, explanation: 'H2O is the chemical formula for water.' },
    { question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], correctIndex: 2, explanation: 'Mitochondria are known as the powerhouse of the cell.' },
    { question: 'What force keeps us on Earth?', options: ['Magnetism', 'Gravity', 'Friction', 'Inertia'], correctIndex: 1, explanation: 'Gravity is the force that keeps us grounded on Earth.' },
    { question: 'What is the speed of sound?', options: ['343 m/s', '1000 m/s', '100 m/s', '500 m/s'], correctIndex: 0, explanation: 'Sound travels at approximately 343 m/s in air.' },
    { question: 'What is DNA?', options: ['Deoxyribonucleic Acid', 'Dynamic Network Access', 'Data Network Array', 'None'], correctIndex: 0, explanation: 'DNA stands for Deoxyribonucleic Acid.' },
    { question: 'What planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Earth'], correctIndex: 1, explanation: 'Mercury is the closest planet to the Sun.' },
    { question: 'What is photosynthesis?', options: ['Eating plants', 'Making food from light', 'Breathing', 'Decomposition'], correctIndex: 1, explanation: 'Photosynthesis is the process of converting light energy into chemical energy.' },
    { question: 'What is the atomic number of carbon?', options: ['4', '6', '8', '12'], correctIndex: 1, explanation: 'Carbon has an atomic number of 6.' },
    { question: 'What gas do plants absorb?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctIndex: 2, explanation: 'Plants absorb carbon dioxide during photosynthesis.' },
    { question: 'What is the boiling point of water?', options: ['90°C', '100°C', '110°C', '120°C'], correctIndex: 1, explanation: 'Water boils at 100°C (212°F) at standard atmospheric pressure.' }
  ],
  'Math': [
    { question: 'What is 15 × 15?', options: ['200', '225', '250', '275'], correctIndex: 1, explanation: '15 × 15 = 225' },
    { question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], correctIndex: 2, explanation: '√144 = 12' },
    { question: 'What is 25% of 200?', options: ['25', '40', '50', '75'], correctIndex: 2, explanation: '25% of 200 = 0.25 × 200 = 50' },
    { question: 'What is π (pi) to 2 decimal places?', options: ['3.12', '3.14', '3.16', '3.18'], correctIndex: 1, explanation: 'π ≈ 3.14159...' },
    { question: 'What is 7 factorial (7!)?', options: ['720', '5040', '40320', '362880'], correctIndex: 1, explanation: '7! = 7 × 6 × 5 × 4 × 3 × 2 × 1 = 5040' },
    { question: 'What is the value of 2^10?', options: ['512', '1024', '2048', '4096'], correctIndex: 1, explanation: '2^10 = 1024' },
    { question: 'What is the sum of angles in a triangle?', options: ['90°', '180°', '270°', '360°'], correctIndex: 1, explanation: 'The sum of angles in any triangle is always 180°.' },
    { question: 'What is 3/4 as a decimal?', options: ['0.25', '0.50', '0.75', '0.80'], correctIndex: 2, explanation: '3 ÷ 4 = 0.75' },
    { question: 'What is the area of a circle formula?', options: ['2πr', 'πr²', 'πd', '2πr²'], correctIndex: 1, explanation: 'Area of a circle = πr²' },
    { question: 'What is 100 divided by 4?', options: ['20', '25', '30', '40'], correctIndex: 1, explanation: '100 ÷ 4 = 25' }
  ]
};

// Utility functions
export function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

export function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
}

export function generateQRCode(data: string): string {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}`;
}

export function generateBarcode(data: string): string {
  return `https://barcodeapi.org/api/128/${data}`;
}

export function formatCurrency(amount: number, symbol: string = '$'): string {
  return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
