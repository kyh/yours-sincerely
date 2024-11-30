export type CalendarEvent = {
  name: string;
  startsAt: string;
  endsAt: string;
  recurring: string[];
  details?: string;
  location?: string;
};

const getDuration = (event: CalendarEvent) => {
  const minutes = Math.floor(
    (+new Date(event.endsAt) - +new Date(event.startsAt)) / 60 / 1000,
  );
  return `${Math.floor(minutes / 60)}:${`0${minutes % 60}`.slice(-2)}`;
};

const getTime = (time: string) =>
  new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, "");

const getRRule = (recurring: string[]) =>
  `RRULE:FREQ=WEEKLY;BYDAY=${recurring.map((d) => d.toUpperCase()).join(",")}`;

type Query = Record<string, null | boolean | number | string>;

const getUrl = (base: string, query: Query) =>
  Object.keys(query).reduce((accum, key, index) => {
    const value = query[key];

    if (value !== null) {
      return `${accum}${index === 0 ? "?" : "&"}${key}=${encodeURIComponent(
        value!,
      )}`;
    }
    return accum;
  }, base);

const getGoogleCalendarUrl = (event: CalendarEvent) =>
  getUrl("https://calendar.google.com/calendar/render", {
    action: "TEMPLATE",
    dates: `${getTime(event.startsAt)}/${getTime(event.endsAt)}`,
    text: event.name,
    location: event.location ?? null,
    details: event.details ?? null,
    recur: getRRule(event.recurring),
  });

const getOutlookCalendarUrl = (event: CalendarEvent) =>
  getUrl("https://outlook.live.com/owa", {
    rru: "addevent",
    startdt: getTime(event.startsAt),
    enddt: getTime(event.endsAt),
    subject: event.name,
    location: event.location ?? null,
    body: event.details ?? null,
    allday: false,
    uid: new Date().getTime().toString(),
    path: "/calendar/view/Month",
  });

const getYahooCalendarUrl = (event: CalendarEvent) =>
  getUrl("https://calendar.yahoo.com", {
    v: 60,
    view: "d",
    type: 20,
    title: event.name,
    st: getTime(event.startsAt),
    dur: getDuration(event),
    desc: event.details ?? null,
    in_loc: event.location ?? null,
  });

const getICSCalendarUrl = (event: CalendarEvent) => {
  const components = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${getTime(event.startsAt)}`,
    `DTEND:${getTime(event.endsAt)}`,
    `SUMMARY:${event.name}`,
    `DESCRIPTION:${event.details}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
    getRRule(event.recurring),
  ];

  return encodeURI(`data:text/calendar;charset=utf8,${components.join("\n")}`);
};

export const getUrls = (event: CalendarEvent) => ({
  google: getGoogleCalendarUrl(event),
  outlook: getOutlookCalendarUrl(event),
  yahoo: getYahooCalendarUrl(event),
  ics: getICSCalendarUrl(event),
});

// https://calendar.google.com/calendar/event?action=TEMPLATE&dates=20211001T100000Z/20211001T110000Z&text=Example+event&location=Office&recur=RRULE:FREQ%3DWEEKLY;BYDAY%3DMO,TU,TH

// https://calendar.google.com/calendar/event?action=TEMPLATE&dates=20211001T100000Z/20211001T110000Z&text=Example+event&location=Office&recur=RRULE:FREQ%3DWEEKLY;INTERVAL%3D3
