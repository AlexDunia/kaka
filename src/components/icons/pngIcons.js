import { defineComponent, h, ref } from 'vue'
import { pngIconUrl } from '../../constants/pngIcons.js'

// Keep existing sizing, CSS selectors, and accessible labels.
function pngIcon(name) {
  return defineComponent({
    name: `PngIcon-${name}`,
    setup: () => {
      const backImageFailed = ref(false)
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            width: '1em',
            height: '1em',
            'data-png-icon': name,
            'aria-hidden': 'true',
            focusable: 'false',
          },
          [
            backImageFailed.value
              ? h('path', {
                  d: 'm15 5-7 7 7 7',
                  fill: 'none',
                  stroke: 'currentColor',
                  'stroke-width': 2,
                  'stroke-linecap': 'round',
                  'stroke-linejoin': 'round',
                })
              : h('image', {
                  href: pngIconUrl(name),
                  width: 24,
                  height: 24,
                  preserveAspectRatio: 'xMidYMid meet',
                  onError: () => {
                    if (name === 'back') backImageFailed.value = true
                  },
                }),
          ],
        )
    },
  })
}

export const AcademicCapIcon = pngIcon('graduation')
export const ArrowLeftIcon = pngIcon('back')
export const ArrowRightIcon = pngIcon('next')
export const BanknotesIcon = pngIcon('wallet')
export const CalendarDaysIcon = pngIcon('calendar')
export const CheckIcon = pngIcon('check')
export const ClockIcon = pngIcon('clock')
export const ComputerDesktopIcon = pngIcon('computer')
export const DocumentTextIcon = pngIcon('document')
export const EyeIcon = pngIcon('eye')
export const EyeSlashIcon = pngIcon('eye-off')
export const GlobeAltIcon = pngIcon('globe')
export const HeartIcon = pngIcon('heart')
export const InformationCircleIcon = pngIcon('info')
export const LinkIcon = pngIcon('link')
export const MapPinIcon = pngIcon('location')
export const MoonIcon = pngIcon('moon')
export const MusicalNoteIcon = pngIcon('music')
export const PaintBrushIcon = pngIcon('art')
export const PhotoIcon = pngIcon('photo')
export const PlusIcon = pngIcon('plus')
export const QuestionMarkCircleIcon = pngIcon('help')
export const SparklesIcon = pngIcon('sparkles')
export const SunIcon = pngIcon('sun')
export const TicketIcon = pngIcon('ticket')
export const TrashIcon = pngIcon('trash')
export const TrophyIcon = pngIcon('trophy')
export const UserIcon = pngIcon('user')
export const XMarkIcon = pngIcon('close')
export const Bars3Icon = pngIcon('menu')
export const UserCircleIcon = pngIcon('user')
export const DocumentDuplicateIcon = pngIcon('copy')
export const QrCodeIcon = pngIcon('qr')
export const MinusIcon = pngIcon('minus')
export const ShareIcon = pngIcon('share')
export const ChevronLeftIcon = pngIcon('back')
export const ChevronRightIcon = pngIcon('next')
export const ChevronDownIcon = pngIcon('down')
export const MagnifyingGlassIcon = pngIcon('search')
