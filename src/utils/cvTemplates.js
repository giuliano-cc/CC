// Built-in resume templates, inspired by common layouts seen in resume
// design (header + two columns, bio with photo, colored title, etc.).
// The content is generic placeholder text meant to be replaced by the
// user: only the structure, proportions and text sizes faithfully
// reproduce the reference layout.

export const CV_TEMPLATES = [
  {
    id: 'cv-1',
    title: 'Minimal Serif Resume',
    category: 'Resumes',
    updatedAt: '2026-09-20T10:00:00Z',
    globalStyle: {
      primaryColor: '#1e293b',
      textColor: '#1e293b',
      fontFamily: "Georgia, 'Times New Roman', serif",
    },
    blocks: [
      {
        id: 'cv1-header',
        type: 'cv_header',
        name: 'Your Name',
        role: '',
        contacts: ['yoursite.com', 'you@example.com', '000-000-0000'],
        layout: 'row',
        color: null,
      },
      {
        id: 'cv1-title',
        type: 'heading',
        content: 'Professional Role at Company\nShort description of your profile.',
        level: 'h1',
        align: 'left',
        bold: true,
        italic: false,
        underline: false,
        size: 'lg',
        color: null,
        rule: false,
      },
      {
        id: 'cv1-cols',
        type: 'columns',
        widths: ['1fr', '1.6fr'],
        columns: [
          {
            items: [
              { id: 'cv1-edu-h', type: 'heading', content: 'Education.', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv1-edu-t', type: 'text', content: 'Institution Name\nDegree in Subject; Month Year\nDescription of the program', align: 'left', list: false },
              { id: 'cv1-ach-h', type: 'heading', content: 'Achievements.', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv1-ach-t', type: 'text', content: 'Description of an achievement obtained.\n\nAnother relevant activity or milestone.', align: 'left', list: false },
            ],
          },
          {
            items: [
              { id: 'cv1-exp-h', type: 'heading', content: 'Experience.', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv1-exp1-t', type: 'heading', content: 'Company / Role', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv1-exp1-d', type: 'text', content: 'City, Country / Month Year - Present', align: 'left', color: '#64748b' },
              { id: 'cv1-exp1-b', type: 'text', content: 'Description of the main responsibilities and results achieved in this role.', align: 'left' },
              { id: 'cv1-exp2-t', type: 'heading', content: 'Company / Role', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv1-exp2-d', type: 'text', content: 'City, Country / Month Year - Month Year', align: 'left', color: '#64748b' },
              { id: 'cv1-exp2-b', type: 'text', content: 'Description of the main responsibilities and results achieved in this role.', align: 'left' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'cv-2',
    title: 'Bio Portfolio',
    category: 'Resumes',
    updatedAt: '2026-09-18T09:30:00Z',
    globalStyle: {
      primaryColor: '#166534',
      textColor: '#1f2937',
      fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    blocks: [
      {
        id: 'cv2-header',
        type: 'cv_header',
        name: 'name.studio',
        role: '',
        contacts: ['Work', 'Consulting', 'Info'],
        layout: 'row',
        color: null,
      },
      {
        id: 'cv2-cols1',
        type: 'columns',
        widths: ['1fr', '1fr'],
        columns: [
          { items: [{ id: 'cv2-img', type: 'image', src: '', alt: 'Illustration', align: 'left', shape: 'rect' }] },
          {
            items: [
              { id: 'cv2-about-h', type: 'heading', content: 'About Me', level: 'h2', align: 'left', bold: true, size: 'md' },
              { id: 'cv2-about-t1', type: 'text', content: 'Short description of the studio or professional and what they do.', align: 'left' },
              { id: 'cv2-about-t2', type: 'text', content: 'A second paragraph with a bit more detail on background and experience.', align: 'left' },
            ],
          },
        ],
      },
      {
        id: 'cv2-cols2',
        type: 'columns',
        widths: ['1fr', '1fr'],
        columns: [
          {
            items: [
              { id: 'cv2-cap-h', type: 'heading', content: 'Capabilities', level: 'h2', align: 'left', bold: false, size: 'sm', color: '#94a3b8' },
              { id: 'cv2-cap-t', type: 'text', content: 'Visual identity\nGraphic design\nDigital design\nUI/UX design', align: 'left', list: true },
            ],
          },
          {
            items: [
              { id: 'cv2-cli-h', type: 'heading', content: 'Select Clients', level: 'h2', align: 'left', bold: false, size: 'sm', color: '#94a3b8' },
              { id: 'cv2-cli-t', type: 'text', content: 'Client One\nClient Two\nClient Three\nClient Four', align: 'left', list: true },
            ],
          },
        ],
      },
      { id: 'cv2-footer', type: 'footer', content: '© 2026 Your Studio. All rights reserved.', align: 'center', bold: false, italic: false, underline: false },
    ],
  },

  {
    id: 'cv-3',
    title: 'Modern Two-Column',
    category: 'Resumes',
    updatedAt: '2026-09-15T14:00:00Z',
    globalStyle: {
      primaryColor: '#111827',
      textColor: '#111827',
      fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    blocks: [
      {
        id: 'cv3-header',
        type: 'cv_header',
        name: 'Your\nName',
        role: 'UI/UX Designer',
        contacts: ['Address', '1-000-000-000', 'email@example.com', 'linkedin: your.name'],
        layout: 'stacked',
        color: null,
      },
      {
        id: 'cv3-cols',
        type: 'columns',
        widths: ['1fr', '1.8fr'],
        columns: [
          {
            items: [
              { id: 'cv3-about-h', type: 'heading', content: 'about', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv3-about-t', type: 'text', content: 'Short professional summary with years of experience and key skills.', align: 'left' },
              { id: 'cv3-edu-h', type: 'heading', content: 'education', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv3-edu-t', type: 'text', content: 'Year - Year\nUniversity Name, Faculty\nDegree', align: 'left' },
              { id: 'cv3-skills-h', type: 'heading', content: 'skills', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv3-skills-t', type: 'text', content: 'Visual communication\nUX prototyping\nInteraction design\nWireframing', align: 'left', list: true },
            ],
          },
          {
            items: [
              { id: 'cv3-exp-h', type: 'heading', content: 'work experience', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv3-exp1-t', type: 'heading', content: 'Job Position', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv3-exp1-d', type: 'text', content: 'Company Name | Year – Year', align: 'left', color: '#64748b' },
              { id: 'cv3-exp1-b', type: 'text', content: 'Description of the activities carried out and results achieved in this position.', align: 'left', list: true },
              { id: 'cv3-exp2-t', type: 'heading', content: 'Job Position', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv3-exp2-d', type: 'text', content: 'Company Name | Year – Year', align: 'left', color: '#64748b' },
              { id: 'cv3-exp2-b', type: 'text', content: 'Description of the activities carried out and results achieved in this position.', align: 'left', list: true },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'cv-4',
    title: 'Creative with Photo',
    category: 'Resumes',
    updatedAt: '2026-09-12T11:00:00Z',
    globalStyle: {
      primaryColor: '#111111',
      textColor: '#111111',
      fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    blocks: [
      { id: 'cv4-photo', type: 'image', src: '', alt: 'Profile photo', align: 'center', shape: 'circle' },
      { id: 'cv4-name', type: 'heading', content: 'LAST NAME FIRST NAME', level: 'h1', align: 'center', bold: true, size: 'lg', color: null },
      { id: 'cv4-tag', type: 'heading', content: "HI, I'M A", level: 'h2', align: 'center', bold: true, size: 'sm' },
      { id: 'cv4-role', type: 'quote', content: 'Graphic Designer', align: 'center', italic: true, bold: true, color: '#ef4444' },
      { id: 'cv4-timeline', type: 'text', content: 'Year – Year   Degree, Graphic Design and Visual Communication\nYear – Year   Junior Designer, Company Name\nYear – Year   Freelance Designer', align: 'center' },
      {
        id: 'cv4-cols',
        type: 'columns',
        widths: ['1fr', '1fr', '1fr'],
        columns: [
          { items: [
            { id: 'cv4-sw-h', type: 'heading', content: 'Software', level: 'h2', align: 'center', bold: true, size: 'sm' },
            { id: 'cv4-sw-t', type: 'text', content: 'Photoshop\nIllustrator\nInDesign', align: 'center', list: true },
          ] },
          { items: [
            { id: 'cv4-sk-h', type: 'heading', content: 'Skills', level: 'h2', align: 'center', bold: true, size: 'sm' },
            { id: 'cv4-sk-t', type: 'text', content: 'Creativity\nProfessionalism\nInnovation', align: 'center', list: true },
          ] },
          { items: [
            { id: 'cv4-la-h', type: 'heading', content: 'Languages', level: 'h2', align: 'center', bold: true, size: 'sm' },
            { id: 'cv4-la-t', type: 'text', content: 'English\nItalian\nSpanish', align: 'center', list: true },
          ] },
        ],
      },
      { id: 'cv4-contact', type: 'footer', content: 'email@example.com · portfolio-site.com', align: 'center', bold: false, italic: false, underline: false },
    ],
  },

  {
    id: 'cv-5',
    title: 'Bold Colored Title',
    category: 'Resumes',
    updatedAt: '2026-09-10T11:20:00Z',
    globalStyle: {
      primaryColor: '#dc2626',
      textColor: '#111111',
      fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    blocks: [
      { id: 'cv5-title', type: 'heading', content: 'Your Name', level: 'h1', align: 'left', bold: true, size: 'xl', color: '#dc2626' },
      {
        id: 'cv5-cols',
        type: 'columns',
        widths: ['1fr', '1.4fr'],
        columns: [
          {
            items: [
              { id: 'cv5-contact-t', type: 'text', content: 'you@example.com\n+00 000 000 0000\nyourwebsite.com\nAddress, City', align: 'left' },
              { id: 'cv5-edu-h', type: 'heading', content: 'Education', level: 'h2', align: 'left', bold: true, size: 'sm', color: '#dc2626' },
              { id: 'cv5-edu-t', type: 'text', content: 'Master, Course Name\nUniversity, Year – Year\n\nBachelor, Course Name\nUniversity, Year – Year', align: 'left' },
              { id: 'cv5-skills-h', type: 'heading', content: 'Skills', level: 'h2', align: 'left', bold: true, size: 'sm', color: '#dc2626' },
              { id: 'cv5-skills-t', type: 'text', content: 'Skill 1\nSkill 2\nSkill 3', align: 'left', list: true },
            ],
          },
          {
            items: [
              { id: 'cv5-exp-h', type: 'heading', content: 'Experience', level: 'h2', align: 'left', bold: true, size: 'sm', color: '#dc2626' },
              { id: 'cv5-exp1-t', type: 'heading', content: 'Job Role', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv5-exp1-d', type: 'text', content: 'Company Name / January Year - present', align: 'left', color: '#64748b' },
              { id: 'cv5-exp1-b', type: 'text', content: 'Description of the work experience, responsibilities and results achieved.', align: 'left', list: true },
              { id: 'cv5-exp2-t', type: 'heading', content: 'Job Role', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv5-exp2-d', type: 'text', content: 'Company Name / January Year - present', align: 'left', color: '#64748b' },
              { id: 'cv5-exp2-b', type: 'text', content: 'Description of the work experience, responsibilities and results achieved.', align: 'left', list: true },
            ],
          },
        ],
      },
    ],
  },
]

// For each built-in template, which block field should be bound to which
// Content Library slot when the user clicks "Fill with my content" in the
// builder. `field` is the block prop that holds the slot key (contentSlot
// for heading/text/quote, nameSlot/contactsSlot for cv_header, imageSlot
// for image).
export const TEMPLATE_CONTENT_MAPS = {
  'cv-1': [
    { blockId: 'cv1-header', field: 'nameSlot', slot: 'name' },
    { blockId: 'cv1-header', field: 'contactsSlot', slot: 'contact' },
    { blockId: 'cv1-title', field: 'contentSlot', slot: 'title' },
    { blockId: 'cv1-edu-t', field: 'contentSlot', slot: 'education' },
    { blockId: 'cv1-ach-t', field: 'contentSlot', slot: 'coreCompetencies' },
    { blockId: 'cv1-exp1-b', field: 'contentSlot', slot: 'experience' },
  ],
  'cv-2': [
    { blockId: 'cv2-header', field: 'nameSlot', slot: 'name' },
    { blockId: 'cv2-img', field: 'imageSlot', slot: 'photo' },
    { blockId: 'cv2-about-t1', field: 'contentSlot', slot: 'profileSummary' },
    { blockId: 'cv2-cap-t', field: 'contentSlot', slot: 'skills' },
  ],
  'cv-3': [
    { blockId: 'cv3-header', field: 'nameSlot', slot: 'name' },
    { blockId: 'cv3-header', field: 'contactsSlot', slot: 'contact' },
    { blockId: 'cv3-about-t', field: 'contentSlot', slot: 'profileSummary' },
    { blockId: 'cv3-edu-t', field: 'contentSlot', slot: 'education' },
    { blockId: 'cv3-skills-t', field: 'contentSlot', slot: 'skills' },
    { blockId: 'cv3-exp1-b', field: 'contentSlot', slot: 'experience' },
  ],
  'cv-4': [
    { blockId: 'cv4-photo', field: 'imageSlot', slot: 'photo' },
    { blockId: 'cv4-name', field: 'contentSlot', slot: 'name' },
    { blockId: 'cv4-role', field: 'contentSlot', slot: 'title' },
    { blockId: 'cv4-timeline', field: 'contentSlot', slot: 'experience' },
    { blockId: 'cv4-sk-t', field: 'contentSlot', slot: 'skills' },
    { blockId: 'cv4-la-t', field: 'contentSlot', slot: 'languages' },
  ],
  'cv-5': [
    { blockId: 'cv5-title', field: 'contentSlot', slot: 'name' },
    { blockId: 'cv5-contact-t', field: 'contentSlot', slot: 'contact' },
    { blockId: 'cv5-edu-t', field: 'contentSlot', slot: 'education' },
    { blockId: 'cv5-skills-t', field: 'contentSlot', slot: 'skills' },
    { blockId: 'cv5-exp1-b', field: 'contentSlot', slot: 'experience' },
  ],
}
