import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { usePreviewWorkspaceAttendees } from './previewAttendeesModel'
import { useLiveWorkspaceAttendees } from './liveAttendeesModel'
export {
  arrivalWords,
  channelNames,
  purchaseSources,
  samplePriceMinor,
  visitDate,
  visitSessions,
} from './previewAttendeesModel'
export function useWorkspaceAttendees(eventId, mode = 'paid') {
  return DASHBOARD_PREVIEW
    ? usePreviewWorkspaceAttendees(eventId, mode)
    : useLiveWorkspaceAttendees(eventId, mode)
}
