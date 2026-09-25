// Template di CV predefiniti, ispirati a layout diffusi nel design di
// resume (intestazione + due colonne, bio con foto, titolo colorato, ecc.).
// I contenuti sono placeholder generici pensati per essere sostituiti
// dall'utente: solo la struttura, le proporzioni e le dimensioni dei testi
// riproducono fedelmente il layout di riferimento.

export const CV_TEMPLATES = [
  {
    id: 'cv-1',
    title: 'CV Minimal Serif',
    category: 'Curriculum',
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
        name: 'Nome Cognome',
        role: '',
        contacts: ['tuosito.com', 'tuaemail@esempio.com', '000-000-0000'],
        layout: 'row',
        color: null,
      },
      {
        id: 'cv1-title',
        type: 'heading',
        content: 'Ruolo Professionale in Azienda\nBreve descrizione del tuo profilo.',
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
              { id: 'cv1-edu-h', type: 'heading', content: 'Formazione.', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv1-edu-t', type: 'text', content: 'Nome Istituto\nLaurea in materia; Mese Anno\nDescrizione del percorso', align: 'left', list: false },
              { id: 'cv1-ach-h', type: 'heading', content: 'Riconoscimenti.', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv1-ach-t', type: 'text', content: 'Descrizione di un riconoscimento ottenuto.\n\nAltra attività o traguardo rilevante.', align: 'left', list: false },
            ],
          },
          {
            items: [
              { id: 'cv1-exp-h', type: 'heading', content: 'Esperienza.', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv1-exp1-t', type: 'heading', content: 'Azienda / Ruolo', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv1-exp1-d', type: 'text', content: 'Città, Paese / Mese Anno - Presente', align: 'left', color: '#64748b' },
              { id: 'cv1-exp1-b', type: 'text', content: 'Descrizione delle responsabilità principali e dei risultati raggiunti in questo ruolo.', align: 'left' },
              { id: 'cv1-exp2-t', type: 'heading', content: 'Azienda / Ruolo', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv1-exp2-d', type: 'text', content: 'Città, Paese / Mese Anno - Mese Anno', align: 'left', color: '#64748b' },
              { id: 'cv1-exp2-b', type: 'text', content: 'Descrizione delle responsabilità principali e dei risultati raggiunti in questo ruolo.', align: 'left' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'cv-2',
    title: 'Bio Portfolio',
    category: 'Curriculum',
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
        name: 'nome.studio',
        role: '',
        contacts: ['Lavori', 'Consulenza', 'Info'],
        layout: 'row',
        color: null,
      },
      {
        id: 'cv2-cols1',
        type: 'columns',
        widths: ['1fr', '1fr'],
        columns: [
          { items: [{ id: 'cv2-img', type: 'image', src: '', alt: 'Illustrazione', align: 'left', shape: 'rect' }] },
          {
            items: [
              { id: 'cv2-about-h', type: 'heading', content: 'Chi sono', level: 'h2', align: 'left', bold: true, size: 'md' },
              { id: 'cv2-about-t1', type: 'text', content: 'Breve descrizione dello studio o del professionista e di cosa si occupa.', align: 'left' },
              { id: 'cv2-about-t2', type: 'text', content: "Un secondo paragrafo con qualche dettaglio in più sul percorso e l'esperienza.", align: 'left' },
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
              { id: 'cv2-cap-h', type: 'heading', content: 'Competenze', level: 'h2', align: 'left', bold: false, size: 'sm', color: '#94a3b8' },
              { id: 'cv2-cap-t', type: 'text', content: 'Identità visiva\nGraphic design\nDesign digitale\nUI/UX design', align: 'left', list: true },
            ],
          },
          {
            items: [
              { id: 'cv2-cli-h', type: 'heading', content: 'Clienti selezionati', level: 'h2', align: 'left', bold: false, size: 'sm', color: '#94a3b8' },
              { id: 'cv2-cli-t', type: 'text', content: 'Cliente Uno\nCliente Due\nCliente Tre\nCliente Quattro', align: 'left', list: true },
            ],
          },
        ],
      },
      { id: 'cv2-footer', type: 'footer', content: '© 2026 Nome Studio. Tutti i diritti riservati.', align: 'center', bold: false, italic: false, underline: false },
    ],
  },

  {
    id: 'cv-3',
    title: 'Due Colonne Moderno',
    category: 'Curriculum',
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
        name: 'Nome\nCognome',
        role: 'UI/UX Designer',
        contacts: ['Indirizzo', '1-000-000-000', 'email@esempio.com', 'linkedin: nome.cognome'],
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
              { id: 'cv3-about-t', type: 'text', content: 'Descrizione professionale sintetica con anni di esperienza e principali competenze.', align: 'left' },
              { id: 'cv3-edu-h', type: 'heading', content: 'education', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv3-edu-t', type: 'text', content: 'Anno - Anno\nNome Università, Facoltà\nTitolo di studio', align: 'left' },
              { id: 'cv3-skills-h', type: 'heading', content: 'skills', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv3-skills-t', type: 'text', content: 'Comunicazione visiva\nPrototipazione UX\nInteraction design\nWireframing', align: 'left', list: true },
            ],
          },
          {
            items: [
              { id: 'cv3-exp-h', type: 'heading', content: 'work experience', level: 'h2', align: 'left', bold: true, size: 'sm', rule: true },
              { id: 'cv3-exp1-t', type: 'heading', content: 'Posizione lavorativa', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv3-exp1-d', type: 'text', content: 'Nome Azienda | Anno – Anno', align: 'left', color: '#64748b' },
              { id: 'cv3-exp1-b', type: 'text', content: 'Descrizione delle attività svolte e dei risultati raggiunti in questa posizione.', align: 'left', list: true },
              { id: 'cv3-exp2-t', type: 'heading', content: 'Posizione lavorativa', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv3-exp2-d', type: 'text', content: 'Nome Azienda | Anno – Anno', align: 'left', color: '#64748b' },
              { id: 'cv3-exp2-b', type: 'text', content: 'Descrizione delle attività svolte e dei risultati raggiunti in questa posizione.', align: 'left', list: true },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'cv-4',
    title: 'Creativo con Foto',
    category: 'Curriculum',
    updatedAt: '2026-09-12T11:00:00Z',
    globalStyle: {
      primaryColor: '#111111',
      textColor: '#111111',
      fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    blocks: [
      { id: 'cv4-photo', type: 'image', src: '', alt: 'Foto profilo', align: 'center', shape: 'circle' },
      { id: 'cv4-name', type: 'heading', content: 'COGNOME NOME', level: 'h1', align: 'center', bold: true, size: 'lg', color: null },
      { id: 'cv4-tag', type: 'heading', content: 'CIAO, SONO UNA/UN', level: 'h2', align: 'center', bold: true, size: 'sm' },
      { id: 'cv4-role', type: 'quote', content: 'Graphic Designer', align: 'center', italic: true, bold: true, color: '#ef4444' },
      { id: 'cv4-timeline', type: 'text', content: 'Anno – Anno   Titolo di Laurea, Design Grafico e Comunicazione Visiva\nAnno – Anno   Junior Designer, Nome Azienda\nAnno – Anno   Designer Freelance', align: 'center' },
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
            { id: 'cv4-sk-h', type: 'heading', content: 'Competenze', level: 'h2', align: 'center', bold: true, size: 'sm' },
            { id: 'cv4-sk-t', type: 'text', content: 'Creatività\nProfessionalità\nInnovazione', align: 'center', list: true },
          ] },
          { items: [
            { id: 'cv4-la-h', type: 'heading', content: 'Lingue', level: 'h2', align: 'center', bold: true, size: 'sm' },
            { id: 'cv4-la-t', type: 'text', content: 'Italiano\nInglese\nSpagnolo', align: 'center', list: true },
          ] },
        ],
      },
      { id: 'cv4-contact', type: 'footer', content: 'email@esempio.com · sito-portfolio.com', align: 'center', bold: false, italic: false, underline: false },
    ],
  },

  {
    id: 'cv-5',
    title: 'Titolo Bold Colorato',
    category: 'Curriculum',
    updatedAt: '2026-09-10T11:20:00Z',
    globalStyle: {
      primaryColor: '#dc2626',
      textColor: '#111111',
      fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    blocks: [
      { id: 'cv5-title', type: 'heading', content: 'Nome Cognome', level: 'h1', align: 'left', bold: true, size: 'xl', color: '#dc2626' },
      {
        id: 'cv5-cols',
        type: 'columns',
        widths: ['1fr', '1.4fr'],
        columns: [
          {
            items: [
              { id: 'cv5-contact-t', type: 'text', content: 'tuaemail@esempio.com\n+00 000 000 0000\nsitoweb.com\nIndirizzo, Città', align: 'left' },
              { id: 'cv5-edu-h', type: 'heading', content: 'Formazione', level: 'h2', align: 'left', bold: true, size: 'sm', color: '#dc2626' },
              { id: 'cv5-edu-t', type: 'text', content: 'Master, Nome Corso\nUniversità, Anno – Anno\n\nLaurea, Nome Corso\nUniversità, Anno – Anno', align: 'left' },
              { id: 'cv5-skills-h', type: 'heading', content: 'Competenze', level: 'h2', align: 'left', bold: true, size: 'sm', color: '#dc2626' },
              { id: 'cv5-skills-t', type: 'text', content: 'Competenza 1\nCompetenza 2\nCompetenza 3', align: 'left', list: true },
            ],
          },
          {
            items: [
              { id: 'cv5-exp-h', type: 'heading', content: 'Esperienza', level: 'h2', align: 'left', bold: true, size: 'sm', color: '#dc2626' },
              { id: 'cv5-exp1-t', type: 'heading', content: 'Ruolo lavorativo', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv5-exp1-d', type: 'text', content: 'Nome Azienda / Gennaio Anno - presente', align: 'left', color: '#64748b' },
              { id: 'cv5-exp1-b', type: 'text', content: "Descrizione dell'esperienza lavorativa, delle responsabilità e dei risultati raggiunti.", align: 'left', list: true },
              { id: 'cv5-exp2-t', type: 'heading', content: 'Ruolo lavorativo', level: 'h2', align: 'left', bold: true, size: 'sm' },
              { id: 'cv5-exp2-d', type: 'text', content: 'Nome Azienda / Gennaio Anno - presente', align: 'left', color: '#64748b' },
              { id: 'cv5-exp2-b', type: 'text', content: "Descrizione dell'esperienza lavorativa, delle responsabilità e dei risultati raggiunti.", align: 'left', list: true },
            ],
          },
        ],
      },
    ],
  },
]
