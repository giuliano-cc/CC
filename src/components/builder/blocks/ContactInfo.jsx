import { Globe, Info, Mail, MapPin, Phone } from 'lucide-react'
import { parseChecklist } from '../../../utils/contentLists'
import { translateSectionTitle } from '../../../utils/sectionTitles'
import {
  alignClass,
  resolveBodyFont,
  resolveTitleFont,
  sectionTitleStyle,
  titleTextTransformValue,
} from './shared'

export default function renderContactInfoBlock({ block, globalStyle, library, titleOverrides }) {
  const isRowContact = block.layout === 'row'
  // In "Stacked" layout, street and ZIP/City compose onto two separate
  // lines (not one comma-joined line) — same two-line shape as a cover
  // letter's recipient address — via a literal "\n", rendered with
  // whitespace-pre-line below. In "Row" layout every field already
  // sits inline next to the others (flex-wrap), so a line break inside
  // the address would look broken there — street and ZIP/City join on
  // the same line with a comma instead, same as the other fields.
  const composeAddress = (street, zip, city) =>
    [street, [zip, city].filter((v) => v?.trim()).join(' ')]
      .filter((v) => v?.trim())
      .join(isRowContact ? ', ' : '\n')
  const fields = block.useLibraryContact
    ? [
        {
          key: 'address',
          value: composeAddress(library.contactStreet, library.contactZip, library.contactCity),
          Icon: MapPin,
        },
        { key: 'phone', value: library.contactPhone, Icon: Phone },
        { key: 'email', value: library.contactEmail, Icon: Mail },
        { key: 'website', value: library.contactWebsite, Icon: Globe },
      ]
    : [
        {
          key: 'address',
          value: composeAddress(block.addressStreet, block.addressZip, block.addressCity),
          Icon: MapPin,
        },
        { key: 'phone', value: block.phone, Icon: Phone },
        { key: 'email', value: block.email, Icon: Mail },
        { key: 'website', value: block.website, Icon: Globe },
      ]
  // Additional Information notes are their own checklist slot (own
  // section, own "Content Library" card) — `showAdditionalInfo` is an
  // opt-in on this block to append its visible notes as extra lines
  // here too, instead of/in addition to a separate Additional
  // Information section, since the same note can be exactly what you'd
  // want to read right under a contact detail (e.g. "Available for
  // remote work").
  const additionalInfoFields = block.showAdditionalInfo
    ? parseChecklist(library.additionalInfoItems, library.additionalInfo)
        .filter((item) => item.visible !== false && item.text?.trim())
        .map((item, i) => ({ key: `additional-${i}`, value: item.text, Icon: Info }))
    : []
  const visible = [...fields, ...additionalInfoFields].filter((f) => f.value?.trim())
  const alignItems = block.align === 'center' ? 'items-center' : block.align === 'right' ? 'items-end' : 'items-start'
  const justify =
    block.align === 'center' ? 'justify-center' : block.align === 'right' ? 'justify-end' : 'justify-start'
  // Two mechanisms used to govern the same vertical rhythm here:
  // `lineHeight` spaces wrapped lines within one field (the address'
  // own "Street" / "ZIP City" lines), while `rowGap` spaces one field
  // from the next (address from phone, phone from email). Deriving
  // both from the same font size + line-height multiplier keeps that
  // "line step" visually identical everywhere instead of a field-to-
  // field gap landing at a fixed, unrelated value (previously
  // Tailwind's own "gap-1.5" default) while same-field wrapped lines
  // used the font's own line-height.
  const contactFontSizePx = block.bodyFontSize || globalStyle.typographyScale?.p1?.sizePx || 14
  const contactLineHeight = block.lineSpacing || 1.5
  const contactRowGapPx = (contactLineHeight - 1) * contactFontSizePx
  return (
    <div className={`flex flex-col gap-1.5 ${isRowContact ? '' : alignItems}`}>
      {block.title && block.showTitle !== false && (
        <p
          className={`w-full ${alignClass(block.align)} ${block.titleRule !== false ? 'mb-0.5 border-b border-slate-200 pb-1.5' : ''}`}
          style={sectionTitleStyle(block, block.titleColor || globalStyle.primaryColor, resolveTitleFont(globalStyle))}
        >
          {titleTextTransformValue(translateSectionTitle(block.title, globalStyle.contentLanguage, titleOverrides), block, 'title')}
        </p>
      )}
      <div
        className={`flex text-sm ${
          isRowContact ? `flex-wrap items-center gap-x-4 gap-y-1.5 ${justify}` : `flex-col gap-1.5 ${alignItems}`
        }`}
        style={{
          fontFamily: block.bodyFontFamily || resolveBodyFont(globalStyle),
          fontSize: `${contactFontSizePx}px`,
          color: block.bodyColor || undefined,
          letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
          backgroundColor: block.bgColor || undefined,
          lineHeight: contactLineHeight,
          rowGap: isRowContact ? undefined : `${contactRowGapPx}px`,
        }}
      >
        {visible.map((f) => (
          <span
            key={f.key}
            className={`flex gap-2 ${f.value.includes('\n') ? 'items-start' : 'items-center'}`}
          >
            {block.showIcons && (
              <f.Icon size={14} className={`shrink-0 opacity-60 ${f.value.includes('\n') ? 'mt-0.5' : ''}`} />
            )}
            <span className={`whitespace-pre-line ${alignClass(block.align)}`}>{f.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
