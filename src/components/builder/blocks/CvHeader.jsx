import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import { resolveBodyFont, resolveTitleFont } from './shared'

// Best-effort icon for a contact line: email/phone/website get their own
// icon, and anything else (a city, a street address, ...) falls back to a
// pin, since that's virtually always what's left in a resume header's
// contact line.
function guessContactIcon(text) {
  if (/@/.test(text)) return Mail
  if (/^[+()]?[\d\s().-]{6,}$/.test(text)) return Phone
  if (/^(https?:\/\/|www\.)|\.[a-z]{2,}(\/|$)/i.test(text)) return Globe
  return MapPin
}

export default function renderCvHeaderBlock({ block, globalStyle, library }) {
  const isStacked = block.layout === 'stacked'
  const resolvedName = block.nameSlot ? library[block.nameSlot] ?? '' : block.name
  const resolvedContacts = block.contactsSlot
    ? (library[block.contactsSlot] || '').split('\n').filter(Boolean)
    : block.contacts
  const resolvedUsp = block.uspSlot ? library[block.uspSlot] || '' : block.usp
  // Same idea as Header above: the name/role/USP now fall back to the
  // typography scale (H1 for the name, P2/P1 for the secondary lines)
  // instead of a fixed size, so they scale with the rest of the
  // document instead of always staying the same size.
  const nameSizePx = globalStyle.typographyScale?.h1?.sizePx
  const roleSizePx = globalStyle.typographyScale?.p2?.sizePx
  const uspSizePx = globalStyle.typographyScale?.p1?.sizePx
  return (
    <div
      className={`flex ${isStacked ? 'items-start' : 'flex-wrap items-baseline'} justify-between gap-4 border-b border-slate-200 pb-4`}
    >
      <div>
        <p
          className={`whitespace-pre-line font-bold leading-tight ${nameSizePx ? '' : 'text-lg'}`}
          style={{
            // Same accent-color default as Heading/Header/every
            // section title — the name is this block's title line.
            color: block.color || globalStyle.primaryColor,
            fontFamily: resolveTitleFont(globalStyle),
            fontSize: nameSizePx ? `${nameSizePx}px` : undefined,
          }}
        >
          {resolvedName}
        </p>
        {block.role && (
          <p
            className={`opacity-70 ${roleSizePx ? '' : 'text-sm'}`}
            style={{ fontFamily: resolveBodyFont(globalStyle), fontSize: roleSizePx ? `${roleSizePx}px` : undefined }}
          >
            {block.role}
          </p>
        )}
        {resolvedUsp && (
          <p
            className={`mt-1 italic opacity-80 ${uspSizePx ? '' : 'text-sm'}`}
            style={{ fontFamily: resolveBodyFont(globalStyle), fontSize: uspSizePx ? `${uspSizePx}px` : undefined }}
          >
            {resolvedUsp}
          </p>
        )}
      </div>
      {resolvedContacts?.length > 0 && (
        <div
          className={`flex text-xs opacity-70 ${
            isStacked ? 'flex-col items-end gap-1' : 'flex-wrap justify-end gap-4'
          }`}
        >
          {resolvedContacts.map((contact, i) => {
            const Icon = block.showContactIcons ? guessContactIcon(contact) : null
            return (
              <span key={i} className="flex items-center gap-1">
                {Icon && <Icon size={12} className="shrink-0" />}
                {contact}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
