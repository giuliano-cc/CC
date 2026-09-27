// Built-in resume templates, inspired by common layouts seen in resume
// design (header + two columns, bio with photo, colored title, etc.).
// The content is generic placeholder text meant to be replaced by the
// user: only the structure, proportions and text sizes faithfully
// reproduce the reference layout.

// A second CV page (page: 1), added to every resume template below: the
// resume itself spans two pages, so there's room for the content that
// rarely fits on page one (selected works, core competencies, extra
// notes). Like the resume blocks on page 0, these have no x/y — they
// auto-stack top to bottom the first time the template loads (see
// utils/layout.js seedFreeLayout), and can be freely moved from there.
function secondCvPageBlocks(prefix) {
  return [
    {
      id: `${prefix}-p2-works-h`,
      type: 'heading',
      content: 'Selected Works',
      level: 'h2',
      align: 'left',
      bold: true,
      size: 'md',
      color: null,
      rule: true,
      page: 1,
    },
    {
      id: `${prefix}-p2-works-t`,
      type: 'text',
      content: 'Project or publication title — short description of the work and its outcome.\n\nAnother project or publication title — short description of the work and its outcome.',
      align: 'left',
      contentSlot: 'selectedWorks',
      page: 1,
    },
    {
      id: `${prefix}-p2-comp-h`,
      type: 'heading',
      content: 'Core Competencies',
      level: 'h2',
      align: 'left',
      bold: true,
      size: 'md',
      color: null,
      rule: true,
      page: 1,
    },
    {
      id: `${prefix}-p2-comp-t`,
      type: 'text',
      content: 'Competency One\nCompetency Two\nCompetency Three',
      align: 'left',
      list: true,
      contentSlot: 'coreCompetencies',
      page: 1,
    },
    {
      id: `${prefix}-p2-cert-h`,
      type: 'heading',
      content: 'Certifications',
      level: 'h2',
      align: 'left',
      bold: true,
      size: 'md',
      color: null,
      rule: true,
      page: 1,
    },
    {
      id: `${prefix}-p2-cert-t`,
      type: 'text',
      content: 'Certification Name, Issuing Organization, Year',
      align: 'left',
      list: true,
      contentSlot: 'certifications',
      page: 1,
    },
    {
      id: `${prefix}-p2-pub-h`,
      type: 'heading',
      content: 'Publications',
      level: 'h2',
      align: 'left',
      bold: true,
      size: 'md',
      color: null,
      rule: true,
      page: 1,
    },
    {
      id: `${prefix}-p2-pub-t`,
      type: 'text',
      content: 'Publication title, Publisher, Year',
      align: 'left',
      list: true,
      contentSlot: 'publications',
      page: 1,
    },
    {
      id: `${prefix}-p2-notes-h`,
      type: 'heading',
      content: 'Additional Information',
      level: 'h2',
      align: 'left',
      bold: true,
      size: 'md',
      color: null,
      rule: true,
      page: 1,
    },
    {
      id: `${prefix}-p2-notes-t`,
      type: 'text',
      content: 'Other notes worth mentioning.',
      align: 'left',
      contentSlot: 'additionalInfo',
      page: 1,
    },
    {
      id: `${prefix}-p2-ref-h`,
      type: 'heading',
      content: 'References',
      level: 'h2',
      align: 'left',
      bold: true,
      size: 'md',
      color: null,
      rule: true,
      page: 1,
    },
    {
      id: `${prefix}-p2-ref-t`,
      type: 'text',
      content: 'Available upon request.',
      align: 'left',
      contentSlot: 'references',
      page: 1,
    },
  ]
}

// A cover letter page (page: 2), in the same globalStyle (font/colors) as
// the resume it follows, bound to the same Content Library slots
// (name/contact) so they never fall out of sync, plus its own Cover
// Letter Body slot.
function coverLetterBlocks(prefix) {
  return [
    {
      id: `${prefix}-cl-name`,
      type: 'heading',
      content: 'Your Name',
      level: 'h1',
      align: 'left',
      bold: true,
      italic: false,
      underline: false,
      size: 'sm',
      color: null,
      rule: false,
      contentSlot: 'name',
      page: 2,
    },
    {
      id: `${prefix}-cl-contact`,
      type: 'text',
      content: 'you@example.com · +00 000 000 0000',
      align: 'left',
      contentSlot: 'contact',
      page: 2,
    },
    {
      id: `${prefix}-cl-date`,
      type: 'text',
      content: 'Month Day, Year',
      align: 'left',
      page: 2,
    },
    {
      id: `${prefix}-cl-recipient`,
      type: 'text',
      content: 'Hiring Manager\nCompany Name',
      align: 'left',
      page: 2,
    },
    {
      id: `${prefix}-cl-salutation`,
      type: 'text',
      content: 'Dear Hiring Manager,',
      align: 'left',
      page: 2,
    },
    {
      id: `${prefix}-cl-body`,
      type: 'text',
      content:
        "Write your cover letter here. Explain why you're a great fit for the role, referencing your key achievements and how your skills match what the company is looking for.\n\nUse a second paragraph for a specific example of your impact, and a third to express enthusiasm for the role and next steps.",
      align: 'left',
      contentSlot: 'coverLetterBody',
      page: 2,
    },
    {
      id: `${prefix}-cl-closing`,
      type: 'text',
      content: 'Sincerely,',
      align: 'left',
      page: 2,
    },
    {
      id: `${prefix}-cl-signoff`,
      type: 'text',
      content: 'Your Name',
      align: 'left',
      bold: true,
      contentSlot: 'name',
      page: 2,
    },
  ]
}

export const CV_TEMPLATES = [
  {
    id: 'cv-1',
    title: 'Minimal Serif Resume',
    category: 'Resumes',
    updatedAt: '2026-09-20T10:00:00Z',
    pageCount: 3,
    globalStyle: {
      primaryColor: '#1e293b',
      textColor: '#1e293b',
      fontFamily: "Gelasio, Georgia, 'Times New Roman', serif",
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
              {
                id: 'cv1-edu',
                type: 'education_entries',
                title: 'Education.',
                titleColor: null,
                titleSize: 'sm',
                items: [
                  {
                    id: 'cv1-edu-1',
                    title: 'Degree in Subject',
                    subtitle: 'Institution Name',
                    location: '',
                    startDate: 'Month Year',
                    endDate: '',
                    current: false,
                    description: 'Description of the program',
                  },
                ],
                useLibraryEducation: false,
                align: 'left',
              },
              { id: 'cv1-ach-h', type: 'heading', content: 'Achievements.', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv1-ach-t', type: 'text', content: 'Description of an achievement obtained.\n\nAnother relevant activity or milestone.', align: 'left', list: false },
            ],
          },
          {
            items: [
              {
                id: 'cv1-exp',
                type: 'experience_entries',
                title: 'Experience.',
                titleColor: null,
                titleSize: 'sm',
                items: [
                  {
                    id: 'cv1-exp-1',
                    title: 'Job Role',
                    subtitle: 'Company Name',
                    location: 'City, Country',
                    startDate: 'Month Year',
                    endDate: '',
                    current: true,
                    description: 'Description of the main responsibilities and results achieved in this role.',
                  },
                  {
                    id: 'cv1-exp-2',
                    title: 'Job Role',
                    subtitle: 'Company Name',
                    location: 'City, Country',
                    startDate: 'Month Year',
                    endDate: 'Month Year',
                    current: false,
                    description: 'Description of the main responsibilities and results achieved in this role.',
                  },
                ],
                useLibraryExperience: false,
                align: 'left',
              },
            ],
          },
        ],
      },
      ...secondCvPageBlocks('cv1'),
      ...coverLetterBlocks('cv1'),
    ],
  },

  {
    id: 'cv-2',
    title: 'Bio Portfolio',
    category: 'Resumes',
    updatedAt: '2026-09-18T09:30:00Z',
    pageCount: 3,
    globalStyle: {
      primaryColor: '#166534',
      textColor: '#1f2937',
      fontFamily: "Arimo, 'Segoe UI', Arial, sans-serif",
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
      ...secondCvPageBlocks('cv2'),
      ...coverLetterBlocks('cv2'),
    ],
  },

  {
    id: 'cv-3',
    title: 'Modern Two-Column',
    category: 'Resumes',
    updatedAt: '2026-09-15T14:00:00Z',
    pageCount: 3,
    globalStyle: {
      primaryColor: '#111827',
      textColor: '#111827',
      fontFamily: "Arimo, 'Segoe UI', Arial, sans-serif",
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
              {
                id: 'cv3-edu',
                type: 'education_entries',
                title: 'education',
                titleColor: null,
                titleSize: 'sm',
                items: [
                  {
                    id: 'cv3-edu-1',
                    title: 'Degree',
                    subtitle: 'University Name, Faculty',
                    location: '',
                    startDate: 'Year',
                    endDate: 'Year',
                    current: false,
                    description: '',
                  },
                ],
                useLibraryEducation: false,
                align: 'left',
              },
              { id: 'cv3-skills-h', type: 'heading', content: 'skills', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv3-skills-t', type: 'text', content: 'Visual communication\nUX prototyping\nInteraction design\nWireframing', align: 'left', list: true },
            ],
          },
          {
            items: [
              {
                id: 'cv3-exp',
                type: 'experience_entries',
                title: 'work experience',
                titleColor: null,
                titleSize: 'sm',
                items: [
                  {
                    id: 'cv3-exp-1',
                    title: 'Job Position',
                    subtitle: 'Company Name',
                    location: '',
                    startDate: 'Year',
                    endDate: 'Year',
                    current: false,
                    description: 'Description of the activities carried out and results achieved in this position.',
                  },
                  {
                    id: 'cv3-exp-2',
                    title: 'Job Position',
                    subtitle: 'Company Name',
                    location: '',
                    startDate: 'Year',
                    endDate: 'Year',
                    current: false,
                    description: 'Description of the activities carried out and results achieved in this position.',
                  },
                ],
                useLibraryExperience: false,
                align: 'left',
              },
            ],
          },
        ],
      },
      ...secondCvPageBlocks('cv3'),
      ...coverLetterBlocks('cv3'),
    ],
  },

  {
    id: 'cv-4',
    title: 'Creative with Photo',
    category: 'Resumes',
    updatedAt: '2026-09-12T11:00:00Z',
    pageCount: 3,
    globalStyle: {
      primaryColor: '#111111',
      textColor: '#111111',
      fontFamily: "Arimo, 'Segoe UI', Arial, sans-serif",
    },
    blocks: [
      { id: 'cv4-photo', type: 'image', src: '', alt: 'Profile photo', align: 'center', shape: 'circle' },
      { id: 'cv4-name', type: 'heading', content: 'LAST NAME FIRST NAME', level: 'h1', align: 'center', bold: true, size: 'lg', color: null },
      { id: 'cv4-tag', type: 'heading', content: "HI, I'M A", level: 'h2', align: 'center', bold: true, size: 'sm' },
      { id: 'cv4-role', type: 'quote', content: 'Graphic Designer', align: 'center', italic: true, bold: true, color: '#ef4444' },
      {
        id: 'cv4-edu',
        type: 'education_entries',
        title: '',
        titleColor: null,
        titleSize: 'sm',
        items: [
          {
            id: 'cv4-edu-1',
            title: 'Degree, Graphic Design and Visual Communication',
            subtitle: '',
            location: '',
            startDate: 'Year',
            endDate: 'Year',
            current: false,
            description: '',
          },
        ],
        useLibraryEducation: false,
        align: 'center',
      },
      {
        id: 'cv4-exp',
        type: 'experience_entries',
        title: '',
        titleColor: null,
        titleSize: 'sm',
        items: [
          {
            id: 'cv4-exp-1',
            title: 'Junior Designer',
            subtitle: 'Company Name',
            location: '',
            startDate: 'Year',
            endDate: 'Year',
            current: false,
            description: '',
          },
          {
            id: 'cv4-exp-2',
            title: 'Freelance Designer',
            subtitle: '',
            location: '',
            startDate: 'Year',
            endDate: 'Year',
            current: false,
            description: '',
          },
        ],
        useLibraryExperience: false,
        align: 'center',
      },
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
      ...secondCvPageBlocks('cv4'),
      ...coverLetterBlocks('cv4'),
    ],
  },

  {
    id: 'cv-5',
    title: 'Bold Colored Title',
    category: 'Resumes',
    updatedAt: '2026-09-10T11:20:00Z',
    pageCount: 3,
    globalStyle: {
      primaryColor: '#dc2626',
      textColor: '#111111',
      fontFamily: "Arimo, 'Segoe UI', Arial, sans-serif",
    },
    blocks: [
      { id: 'cv5-title', type: 'heading', content: 'Your Name', level: 'h1', align: 'left', bold: true, size: 'xl', color: null },
      {
        id: 'cv5-cols',
        type: 'columns',
        widths: ['1fr', '1.4fr'],
        columns: [
          {
            items: [
              { id: 'cv5-contact-t', type: 'text', content: 'you@example.com\n+00 000 000 0000\nyourwebsite.com\nAddress, City', align: 'left' },
              {
                id: 'cv5-edu',
                type: 'education_entries',
                title: 'Education',
                titleColor: null,
                titleSize: 'sm',
                items: [
                  {
                    id: 'cv5-edu-1',
                    title: 'Master, Course Name',
                    subtitle: 'University',
                    location: '',
                    startDate: 'Year',
                    endDate: 'Year',
                    current: false,
                    description: '',
                  },
                  {
                    id: 'cv5-edu-2',
                    title: 'Bachelor, Course Name',
                    subtitle: 'University',
                    location: '',
                    startDate: 'Year',
                    endDate: 'Year',
                    current: false,
                    description: '',
                  },
                ],
                useLibraryEducation: false,
                align: 'left',
              },
              { id: 'cv5-skills-h', type: 'heading', content: 'Skills', level: 'h2', align: 'left', bold: true, size: 'sm', color: null },
              { id: 'cv5-skills-t', type: 'text', content: 'Skill 1\nSkill 2\nSkill 3', align: 'left', list: true },
            ],
          },
          {
            items: [
              {
                id: 'cv5-exp',
                type: 'experience_entries',
                title: 'Experience',
                titleColor: null,
                titleSize: 'sm',
                items: [
                  {
                    id: 'cv5-exp-1',
                    title: 'Job Role',
                    subtitle: 'Company Name',
                    location: '',
                    startDate: 'January Year',
                    endDate: '',
                    current: true,
                    description: 'Description of the work experience, responsibilities and results achieved.',
                  },
                  {
                    id: 'cv5-exp-2',
                    title: 'Job Role',
                    subtitle: 'Company Name',
                    location: '',
                    startDate: 'January Year',
                    endDate: '',
                    current: true,
                    description: 'Description of the work experience, responsibilities and results achieved.',
                  },
                ],
                useLibraryExperience: false,
                align: 'left',
              },
            ],
          },
        ],
      },
      ...secondCvPageBlocks('cv5'),
      ...coverLetterBlocks('cv5'),
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
    { blockId: 'cv1-header', field: 'uspSlot', slot: 'usp' },
    { blockId: 'cv1-title', field: 'contentSlot', slot: 'title' },
    { blockId: 'cv1-ach-t', field: 'contentSlot', slot: 'achievements' },
  ],
  'cv-2': [
    { blockId: 'cv2-header', field: 'nameSlot', slot: 'name' },
    { blockId: 'cv2-header', field: 'uspSlot', slot: 'usp' },
    { blockId: 'cv2-img', field: 'imageSlot', slot: 'photo' },
    { blockId: 'cv2-about-t1', field: 'contentSlot', slot: 'profileSummary' },
    { blockId: 'cv2-cap-t', field: 'contentSlot', slot: 'skills' },
    { blockId: 'cv2-cli-t', field: 'contentSlot', slot: 'selectedClients' },
  ],
  'cv-3': [
    { blockId: 'cv3-header', field: 'nameSlot', slot: 'name' },
    { blockId: 'cv3-header', field: 'contactsSlot', slot: 'contact' },
    { blockId: 'cv3-header', field: 'uspSlot', slot: 'usp' },
    { blockId: 'cv3-about-t', field: 'contentSlot', slot: 'profileSummary' },
    { blockId: 'cv3-skills-t', field: 'contentSlot', slot: 'skills' },
  ],
  'cv-4': [
    { blockId: 'cv4-photo', field: 'imageSlot', slot: 'photo' },
    { blockId: 'cv4-name', field: 'contentSlot', slot: 'name' },
    { blockId: 'cv4-role', field: 'contentSlot', slot: 'title' },
    { blockId: 'cv4-sk-t', field: 'contentSlot', slot: 'skills' },
    { blockId: 'cv4-la-t', field: 'contentSlot', slot: 'languages' },
  ],
  'cv-5': [
    { blockId: 'cv5-title', field: 'contentSlot', slot: 'name' },
    { blockId: 'cv5-contact-t', field: 'contentSlot', slot: 'contact' },
    { blockId: 'cv5-skills-t', field: 'contentSlot', slot: 'skills' },
  ],
}
