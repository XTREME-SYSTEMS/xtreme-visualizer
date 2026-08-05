// Branded SVG icons for integration connectors. Simplified but recognizable brand marks.
import type { FC } from 'react';

type IconProps = { size?: number };

export const GoogleGIcon: FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export const GmailIcon: FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <path fill="#fff" fillOpacity="0.95" d="M4 6v12h2.5l5.5-4.4L17.5 18H20V6l-8 5.6L4 6z" />
    <path fill="#EA4335" d="M4 18h2.5l5.5-4.4L17.5 18H20l-8-6-8 6z" opacity="0.9" />
    <path fill="#34A853" d="M4 6l8 5.6L20 6v0H4z" opacity="0.0" />
    <path fill="#EA4335" d="M4 6l8 5.6L20 6H4z" />
    <path fill="#fff" d="M7.5 18l4.5-3.6L16.5 18l-4.5-3.4L7.5 18z" opacity="0.0" />
  </svg>
);

export const GoogleCalendarIcon: FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#fff" />
    <path fill="#4285F4" d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3H3V5z" />
    <path fill="#34A853" d="M3 16v3a2 2 0 0 0 2 2h3v-5H3z" />
    <path fill="#FBBC05" d="M16 21h3a2 2 0 0 0 2-2v-3h-5v5z" />
    <path fill="#EA4335" d="M16 16h5V8h-5v8z" />
    <path fill="#4285F4" d="M3 8h5v8H3z" opacity="0.0" />
    <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="700" fill="#4285F4">31</text>
  </svg>
);

export const GoogleDriveIcon: FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="#0F9D58" d="M9 3h6l6 10h-6L9 3z" />
    <path fill="#FFC107" d="M21 13l-3 5H6l3-5h12z" opacity="0.95" />
    <path fill="#FFC107" d="M3 13l3-5 6 0-3 5H3z" opacity="0.0" />
    <path fill="#4285F4" d="M3 13l3 5h6l-3-5H3z" />
    <path fill="#FFC107" d="M9 13l3 5h6l-3-5H9z" />
    <path fill="#EA4335" d="M12 3l3 5h-6l3-5z" opacity="0.0" />
    <path fill="#FFC107" d="M9 3l6 0 3 5-6 0-3-5z" opacity="0.0" />
    <path fill="#0F9D58" d="M9 3h6l3 5h-6L9 3z" />
    <path fill="#4285F4" d="M3 13l3 5 3-5-3-5-3 5z" />
    <path fill="#FFC107" d="M9 13l3 5 3-5-3-5-3 5z" />
  </svg>
);

export const GoogleSheetsIcon: FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="#0F9D58" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
    <path fill="#0F9D58" d="M14 2l6 6h-6V2z" opacity="0.75" />
    <rect x="7" y="10" width="10" height="8" rx="1" fill="#fff" />
    <path fill="#0F9D58" d="M7 10h10v2H7zM7 14h10v1.5H7z" opacity="0.0" />
    <path stroke="#0F9D58" strokeWidth="0.8" d="M8.5 10v8M11.5 10v8M14.5 10v8M7 12h10M7 14.5h10M7 17h10" />
  </svg>
);

export const GoogleTasksIcon: FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="#1A73E8" />
    <path fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M7 12.5l3 3 7-7" />
  </svg>
);

export const GoogleDocsIcon: FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
    <path fill="#4285F4" d="M14 2l6 6h-6V2z" opacity="0.75" />
    <rect x="7" y="10" width="10" height="1.5" rx="0.75" fill="#fff" />
    <rect x="7" y="13" width="10" height="1.5" rx="0.75" fill="#fff" />
    <rect x="7" y="16" width="7" height="1.5" rx="0.75" fill="#fff" />
  </svg>
);

export const HubSpotIcon: FC<IconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="#FF7A59" d="M18.16 15.34a3.38 3.38 0 0 0-2.02 3.09 3.4 3.4 0 0 0 6.8 0 3.38 3.38 0 0 0-2.03-3.09v-3.2a.6.6 0 0 0-.6-.6h-1.55a.6.6 0 0 0-.6.6v3.2zM19.5 2.5a4.7 4.7 0 0 0-4.68 4.72c0 2.04 1.3 3.78 3.1 4.43v2.06a.5.5 0 0 0 .5.5h2.16a.5.5 0 0 0 .5-.5v-2.06a4.7 4.7 0 0 0 3.1-4.43A4.7 4.7 0 0 0 19.5 2.5z" />
    <path fill="none" stroke="#FF7A59" strokeWidth="2.2" strokeLinecap="round" d="M14.82 11.65V8.2M14.82 8.2a5.5 5.5 0 0 0-5.5-5.5 5.5 5.5 0 0 0-5.5 5.5 5.5 5.5 0 0 0 5.5 5.5 5.5 5.5 0 0 0 5.5-5.5z" />
  </svg>
);

export const connectorIcon: Record<string, FC<IconProps>> = {
  gmail: GmailIcon,
  googlecalendar: GoogleCalendarIcon,
  googledrive: GoogleDriveIcon,
  googlesheets: GoogleSheetsIcon,
  googletasks: GoogleTasksIcon,
  googledocs: GoogleDocsIcon,
  hubspot: HubSpotIcon,
};