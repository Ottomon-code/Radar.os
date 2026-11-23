import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Globe,
} from 'lucide-react';

interface TimeAwareOutreachCalendarProps {
  shareUrl: string;
  analyticsUrl: string;
  referralCode?: string;
}

interface TargetRegionClock {
  id: string;
  label: string;
  city: string;
  timeZone: string;
  bestWindowLocal: string;
  bestDays: string;
  note: string;
}

interface OutreachSlot {
  id: string;
  dayOffsetFromMonday: number;
  dayLabel: string;
  targetRegionId: string;
  targetLabel: string;
  targetTimeZone: string;
  /** Hour/minute in UTC so Samsung/Google Calendar & local browser format accurately */
  utcHour: number;
  utcMinute: number;
  durationMinutes: number;
  channel: string;
  goal: string;
  targets: string;
  pitchPreview: string;
}

const TARGET_REGIONS: TargetRegionClock[] = [
  {
    id: 'nairobi',
    label: 'Kenya / East Africa',
    city: 'Nairobi',
    timeZone: 'Africa/Nairobi',
    bestWindowLocal: '08:30–10:30 & 17:30–20:00',
    bestDays: 'Mon–Fri + Sat AM',
    note: 'Morning commute & post-work dev group peak.',
  },
  {
    id: 'lagos',
    label: 'Nigeria / West Africa',
    city: 'Lagos',
    timeZone: 'Africa/Lagos',
    bestWindowLocal: '09:30–11:30 & 18:00–20:30',
    bestDays: 'Tue–Thu',
    note: 'Avoid Monday 8 AM standups; mid-morning gets highest clicks.',
  },
  {
    id: 'capetown',
    label: 'South Africa',
    city: 'Cape Town',
    timeZone: 'Africa/Johannesburg',
    bestWindowLocal: '09:00–11:30',
    bestDays: 'Tue–Thu',
    note: 'B2B/remote engineers check LinkedIn & Slack before lunch.',
  },
  {
    id: 'london',
    label: 'UK Boutiques & Staff Devs',
    city: 'London',
    timeZone: 'Europe/London',
    bestWindowLocal: '08:30–10:30 & 13:30–15:30',
    bestDays: 'Tue–Thu',
    note: 'Recruiters scan inbox at 08:45 GMT & after lunch.',
  },
  {
    id: 'berlin',
    label: 'EU Hubs (DE / NL / PL)',
    city: 'Berlin',
    timeZone: 'Europe/Berlin',
    bestWindowLocal: '09:00–11:30 & 14:00–16:00',
    bestDays: 'Tue–Thu',
    note: 'Highest reply rates Tue/Wed mid-morning CET.',
  },
  {
    id: 'us_east',
    label: 'US / HN / Global Remote',
    city: 'New York',
    timeZone: 'America/New_York',
    bestWindowLocal: '08:30–11:00',
    bestDays: 'Tue–Thu',
    note: 'Best time for Show HN, X threads & US remote engineers.',
  },
];

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
  const hourStr = parts.find((p) => p.type === 'hour')?.value || '00';
  const minuteStr = parts.find((p) => p.type === 'minute')?.value || '00';
  const hour = Number(hourStr === '24' ? '0' : hourStr);
  const minute = Number(minuteStr);
  return {
    weekday,
    hour,
    minute,
    formattedTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  };
}

function getWindowStatus(hour: number, weekday: string): {
  label: string;
  tone: 'optimal' | 'caution' | 'sleep';
} {
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  if (isWeekend) {
    if (hour >= 10 && hour <= 18) {
      return { label: 'WEEKEND (COMMUNITIES ONLY)', tone: 'caution' };
    }
    return { label: 'OFF-HOURS (SKIP)', tone: 'sleep' };
  }
  if ((hour >= 8 && hour <= 11) || (hour >= 14 && hour <= 16)) {
    return { label: 'OPTIMAL SEND WINDOW', tone: 'optimal' };
  }
  if ((hour >= 12 && hour <= 13) || (hour >= 17 && hour <= 20)) {
    return { label: 'OK (DEV GROUPS / SOCIAL)', tone: 'caution' };
  }
  return { label: 'SLEEPING / OFF-HOURS', tone: 'sleep' };
}

function getNextMondayUtc(fromDate: Date): Date {
  const d = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
  const day = d.getUTCDay(); // 0=Sun, 1=Mon
  const diffToMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

function formatIcsUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  );
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export default function TimeAwareOutreachCalendar({
  shareUrl,
  analyticsUrl,
  referralCode,
}: TimeAwareOutreachCalendarProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completedSlotIds, setCompletedSlotIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('talent_radar_outreach_calendar_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const localTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi';
    } catch {
      return 'Africa/Nairobi';
    }
  }, []);

  const mondayBase = useMemo(() => getNextMondayUtc(now), [now]);

  const outreachPlan: OutreachSlot[] = useMemo(() => {
    const codeLabel = referralCode ? ` (Code: ${referralCode})` : '';
    return [
      {
        id: 'mon_ke_warm',
        dayOffsetFromMonday: 0,
        dayLabel: 'Monday',
        targetRegionId: 'nairobi',
        targetLabel: 'Kenya & Nitasha Pre-re:Invent Warm-Up',
        targetTimeZone: 'Africa/Nairobi',
        utcHour: 6, // 09:00 EAT
        utcMinute: 0,
        durationMinutes: 45,
        channel: 'LinkedIn Comment + WhatsApp Dev Groups',
        goal: 'Leave comment on Nitasha’s AWS re:Invent post + post in 2 Kenyan dev groups (GDG Nairobi / Tech Group Kenya)',
        targets: 'Nitasha Dhanjal (before re:Invent busy week) + Nairobi devs',
        pitchPreview: `Built TalentRadar.OS — live remote salary bands & 3D hiring radar with -50% PPP + direct M-Pesa checkout${codeLabel}: ${shareUrl}`,
      },
      {
        id: 'tue_eu_agencies',
        dayOffsetFromMonday: 1,
        dayLabel: 'Tuesday',
        targetRegionId: 'london',
        targetLabel: 'UK & Berlin Boutique Agencies (Batch 1)',
        targetTimeZone: 'Europe/London',
        utcHour: 8, // 08:45 GMT / 09:45 CET / 11:45 EAT
        utcMinute: 45,
        durationMinutes: 45,
        channel: 'Free Gmail (Agency Website Contact Emails)',
        goal: 'Email 3 real boutique tech agencies ($199/mo Sovereign Pilot offer)',
        targets: 'Zero to One Search (Berlin), 167 Solutions (London), Technology Boutique Ltd (London)',
        pitchPreview: `Subject: Live AI/Staff comp curves for your open searches\n\nHi [Founder] — built TalentRadar.OS so lean search teams can pull live Junior/Senior/Principal cash+equity bands during client intake calls: ${analyticsUrl}. Happy to run a free benchmark for 1 active role this week.`,
      },
      {
        id: 'tue_ng_za_devs',
        dayOffsetFromMonday: 1,
        dayLabel: 'Tuesday',
        targetRegionId: 'lagos',
        targetLabel: 'Nigeria & South Africa Remote Engineers',
        targetTimeZone: 'Africa/Lagos',
        utcHour: 9, // 10:30 WAT / 11:30 SAST / 12:30 EAT
        utcMinute: 30,
        durationMinutes: 30,
        channel: 'X (#NigeriaTech / #SATech) + Telegram / Discord',
        goal: 'Share PPP + USD Visa/Mastercard Paystack access in Lagos & Cape Town channels',
        targets: 'Andela alumni, Lagos & Cape Town remote senior devs',
        pitchPreview: `Targeting EU/US remote tech roles from Lagos or Cape Town? Compare Junior→Principal USD bands + 50% PPP regional pricing${codeLabel}: ${shareUrl}`,
      },
      {
        id: 'wed_eu_engineers',
        dayOffsetFromMonday: 2,
        dayLabel: 'Wednesday',
        targetRegionId: 'berlin',
        targetLabel: 'Berlin / Amsterdam / London Engineers',
        targetTimeZone: 'Europe/Berlin',
        utcHour: 8, // 09:30 CET / 08:30 GMT / 11:30 EAT
        utcMinute: 30,
        durationMinutes: 45,
        channel: 'GitHub Public Emails + LinkedIn Comments (Zero InMail)',
        goal: 'Reach 5 Staff/Senior engineers via GitHub bios & public posts',
        targets: 'GitHub location:Berlin / location:London Distributed Systems & AI devs',
        pitchPreview: `Hi [Name] — saw your work on [Repo]. Built a browser benchmark for EU/US remote Senior→Principal comp curves + equity splits: ${analyticsUrl}. Curious if the Berlin/London numbers match what you're seeing?`,
      },
      {
        id: 'wed_us_hn',
        dayOffsetFromMonday: 2,
        dayLabel: 'Wednesday',
        targetRegionId: 'us_east',
        targetLabel: 'Hacker News / Global Remote Builders',
        targetTimeZone: 'America/New_York',
        utcHour: 14, // 09:00 EST / 14:00 GMT / 17:00 EAT
        utcMinute: 0,
        durationMinutes: 40,
        channel: 'Hacker News / X Global Feed',
        goal: 'Post Show HN / product thread at US East morning peak (also catches EU afternoon)',
        targets: 'US & Global remote engineers, startup founders',
        pitchPreview: `Show HN: TalentRadar – 3D geospatial tech hiring clusters + Junior/Senior/Principal comp curves across US, EU & Africa: ${shareUrl}`,
      },
      {
        id: 'thu_eu_agencies_2',
        dayOffsetFromMonday: 3,
        dayLabel: 'Thursday',
        targetRegionId: 'berlin',
        targetLabel: 'EU Boutique Agencies (Batch 2 + Follow-Ups)',
        targetTimeZone: 'Europe/Berlin',
        utcHour: 8, // 09:15 CET / 11:15 EAT
        utcMinute: 15,
        durationMinutes: 45,
        channel: 'Free Gmail + Google X-Ray Founder Lookup',
        goal: 'Email 3 more EU boutique search firms + 1-line follow-up to Tuesday replies',
        targets: 'Hexwired (UK), DevsData LLC (Berlin), EU-Recruit, Hire European Developers',
        pitchPreview: `Quick 1-line follow-up on benchmarking your hardest Staff/AI role in 60 seconds: ${analyticsUrl}`,
      },
      {
        id: 'fri_ke_evening',
        dayOffsetFromMonday: 4,
        dayLabel: 'Friday',
        targetRegionId: 'nairobi',
        targetLabel: 'Nairobi Tech Hubs & M-Pesa Conversion Push',
        targetTimeZone: 'Africa/Nairobi',
        utcHour: 14, // 17:30 EAT
        utcMinute: 30,
        durationMinutes: 35,
        channel: 'Nairobi Dev WhatsApp / iHub / Zindua Circles + X',
        goal: 'Post weekend career-prep sprint using DataReportal Kenya #1 AI usage hook + M-Pesa link',
        targets: 'iHub / Nailab / Moringa / Zindua builders & job seekers',
        pitchPreview: `DataReportal put Kenya #1 globally in online AI use (97.3%). Stop guessing pay bands — benchmark live global remote salaries & alerts via M-Pesa${codeLabel}: ${shareUrl}`,
      },
      {
        id: 'post_reinvent_nitasha',
        dayOffsetFromMonday: 14, // Monday Dec 7 (right after AWS re:Invent Nov 30-Dec 4)
        dayLabel: 'Post-re:Invent (Mon Dec 7)',
        targetRegionId: 'london',
        targetLabel: 'Nitasha Post-re:Invent Warm Follow-Up',
        targetTimeZone: 'Europe/London',
        utcHour: 10, // 10:00 GMT / 13:00 EAT
        utcMinute: 0,
        durationMinutes: 20,
        channel: 'LinkedIn DM (Only after conference ends Dec 4!)',
        goal: 'Ask 1 smart question about enterprise AI sales or get 30s feedback on TalentRadar.OS',
        targets: 'Nitasha Dhanjal (Spectro Cloud, UK)',
        pitchPreview: `Hi Nitasha — hope Vegas & Booth 135 at re:Invent went well! Since you're in Global AI Infra sales, what's the #1 mistake early builders make when reaching out to companies? Would also value 30s of honest feedback on my Kenya-built career radar if you get a spare moment.`,
      },
    ];
  }, [analyticsUrl, referralCode, shareUrl]);

  const computeSlotDate = (slot: OutreachSlot) => {
    const d = new Date(mondayBase.getTime());
    d.setUTCDate(d.getUTCDate() + slot.dayOffsetFromMonday);
    d.setUTCHours(slot.utcHour, slot.utcMinute, 0, 0);
    return d;
  };

  const toggleSlotDone = (id: string) => {
    setCompletedSlotIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('talent_radar_outreach_calendar_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const downloadIcsEvents = (slots: OutreachSlot[], filename: string) => {
    const stamp = formatIcsUtc(new Date());
    const events = slots
      .map((slot) => {
        const start = computeSlotDate(slot);
        const end = new Date(start.getTime() + slot.durationMinutes * 60_000);
        const description = [
          `Channel: ${slot.channel}`,
          `Targets: ${slot.targets}`,
          `Goal: ${slot.goal}`,
          '',
          'Copy-Paste Pitch:',
          slot.pitchPreview,
        ].join('\n');

        return [
          'BEGIN:VEVENT',
          `UID:${slot.id}-${start.getUTCFullYear()}${start.getUTCMonth() + 1}${start.getUTCDate()}@talentradar.os`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${formatIcsUtc(start)}`,
          `DTEND:${formatIcsUtc(end)}`,
          `SUMMARY:${escapeIcsText(`[TalentRadar Outreach] ${slot.targetLabel}`)}`,
          `DESCRIPTION:${escapeIcsText(description)}`,
          `LOCATION:${escapeIcsText(slot.channel)}`,
          'BEGIN:VALARM',
          'TRIGGER:-PT15M',
          'ACTION:DISPLAY',
          `DESCRIPTION:${escapeIcsText(`Outreach window opens in 15m: ${slot.targetLabel}`)}`,
          'END:VALARM',
          'END:VEVENT',
        ].join('\r\n');
      })
      .join('\r\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TalentRadar.OS//Time-Aware Outreach Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      events,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyPitch = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2200);
  };

  return (
    <div className="bg-[#111a22] border border-[#22d3a5]/40 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1e2b36] pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-5 h-5 text-[#22d3a5]" />
            <h3 className="text-base font-bold text-[#dce7f0] font-mono">
              Time-Aware Global Outreach Calendar
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/15 border border-[#22d3a5]/40 text-[#22d3a5] font-bold">
              YOUR TZ: {localTimeZone}
            </span>
          </div>
          <p className="text-xs text-[#7a8b99]">
            Live send-window radar converted automatically to your phone&apos;s clock, plus 1-tap{' '}
            <strong className="text-[#dce7f0]">.ics</strong> import for Samsung / Google Calendar with 15-min alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => downloadIcsEvents(outreachPlan, 'talentradar-outreach-week.ics')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-[#0a0f14] font-mono text-xs font-bold transition shadow-[0_0_15px_rgba(34,211,165,0.25)] cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>ADD ALL TO PHONE CALENDAR (.ICS)</span>
        </button>
      </div>

      {/* Live Target Timezone Windows */}
      <div>
        <div className="text-[11px] font-mono text-[#7a8b99] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Live Target Clocks Right Now (Who Is Awake &amp; Checking Messages)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {TARGET_REGIONS.map((region) => {
            const parts = getTimeZoneParts(now, region.timeZone);
            const status = getWindowStatus(parts.hour, parts.weekday);
            const badgeStyle =
              status.tone === 'optimal'
                ? 'bg-[#22d3a5]/20 border-[#22d3a5]/50 text-[#22d3a5]'
                : status.tone === 'caution'
                ? 'bg-[#fbbf24]/15 border-[#fbbf24]/50 text-[#fbbf24]'
                : 'bg-[#1e2b36] border-[#2e3e4e] text-[#7a8b99]';

            return (
              <div
                key={region.id}
                className="bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-3 space-y-1.5 font-mono"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#dce7f0] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
                    {region.city}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {parts.weekday} {parts.formattedTime}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badgeStyle}`}>
                    {status.label}
                  </span>
                  <span className="text-[10px] text-[#7a8b99]">{region.bestDays}</span>
                </div>
                <div className="text-[10px] text-[#94a3b8] font-sans">
                  Peak: <span className="text-[#dce7f0] font-mono">{region.bestWindowLocal}</span> — {region.note}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled Time-Aware Blocks */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-mono text-[#7a8b99] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span>Scheduled Weekly Outreach Blocks (Zero LinkedIn Premium Needed)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {outreachPlan.map((slot) => {
            const slotDate = computeSlotDate(slot);
            const localTimeStr = new Intl.DateTimeFormat('en-GB', {
              timeZone: localTimeZone,
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).format(slotDate);
            const targetTimeStr = new Intl.DateTimeFormat('en-GB', {
              timeZone: slot.targetTimeZone,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).format(slotDate);
            const isDone = Boolean(completedSlotIds[slot.id]);

            return (
              <div
                key={slot.id}
                className={`rounded-xl border p-3.5 space-y-2.5 transition ${
                  isDone
                    ? 'bg-[#22d3a5]/10 border-[#22d3a5]/45'
                    : 'bg-[#0a0f14] border-[#1e2b36] hover:border-[#38bdf8]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[#38bdf8] font-bold">
                        {localTimeStr} (You)
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111a22] border border-[#1e2b36] text-[#fbbf24]">
                        {targetTimeStr} Target Local
                      </span>
                    </div>
                    <h4 className="text-xs font-bold font-mono text-[#dce7f0] pt-1">
                      {slot.targetLabel}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSlotDone(slot.id)}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer shrink-0 flex items-center gap-1 ${
                      isDone
                        ? 'bg-[#22d3a5] text-black border-[#22d3a5]'
                        : 'bg-[#111a22] text-[#7a8b99] border-[#1e2b36] hover:text-white'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    <span>{isDone ? 'DONE' : 'MARK DONE'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-[#94a3b8] space-y-1">
                  <div>
                    <strong className="text-[#dce7f0] font-mono">Channel:</strong> {slot.channel}
                  </div>
                  <div>
                    <strong className="text-[#dce7f0] font-mono">Targets:</strong> {slot.targets}
                  </div>
                  <div>
                    <strong className="text-[#22d3a5] font-mono">Goal:</strong> {slot.goal}
                  </div>
                </div>

                <div className="bg-[#111a22] border border-[#1e2b36] rounded-lg p-2.5 text-[11px] text-[#dce7f0] whitespace-pre-wrap font-sans leading-relaxed">
                  {slot.pitchPreview}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyPitch(slot.pitchPreview, slot.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e2b36] hover:bg-[#283847] text-[#dce7f0] font-mono text-[11px] cursor-pointer"
                  >
                    {copiedId === slot.id ? (
                      <Check className="w-3.5 h-3.5 text-[#22d3a5]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === slot.id ? 'PITCH COPIED!' : 'COPY PITCH'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadIcsEvents([slot], `talentradar-${slot.id}.ics`)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/40 text-[#38bdf8] font-mono text-[11px] font-bold cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>ADD TO CALENDAR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
