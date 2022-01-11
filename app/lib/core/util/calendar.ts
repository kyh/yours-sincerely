export type CalendarEvent = {
  name: string;
  startsAt: string;
  endsAt: string;
  recurring: string[];
  details?: string;
  location?: string;
};

const makeDuration = (event: CalendarEvent) => {
  const minutes = Math.floor(
    (+new Date(event.endsAt) - +new Date(event.startsAt)) / 60 / 1000
  );
  return `${Math.floor(minutes / 60)}:${`0${minutes % 60}`.slice(-2)}`;
};

const makeTime = (time: string) =>
  new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, "");

type Query = { [key: string]: null | boolean | number | string };

const makeUrl = (base: string, query: Query) =>
  Object.keys(query).reduce((accum, key, index) => {
    const value = query[key];

    if (value !== null) {
      return `${accum}${index === 0 ? "?" : "&"}${key}=${encodeURIComponent(
        value
      )}`;
    }
    return accum;
  }, base);

const makeGoogleCalendarUrl = (event: CalendarEvent) =>
  makeUrl("https://calendar.google.com/calendar/render", {
    action: "TEMPLATE",
    dates: `${makeTime(event.startsAt)}/${makeTime(event.endsAt)}`,
    text: event.name,
    location: event.location || null,
    details: event.details || null,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${event.recurring
      .map((d) => d.toUpperCase())
      .join(",")}`,
  });

const makeOutlookCalendarUrl = (event: CalendarEvent) =>
  makeUrl("https://outlook.live.com/owa", {
    rru: "addevent",
    startdt: makeTime(event.startsAt),
    enddt: makeTime(event.endsAt),
    subject: event.name,
    location: event.location || null,
    body: event.details || null,
    allday: false,
    uid: new Date().getTime().toString(),
    path: "/calendar/view/Month",
  });

const makeYahooCalendarUrl = (event: CalendarEvent) =>
  makeUrl("https://calendar.yahoo.com", {
    v: 60,
    view: "d",
    type: 20,
    title: event.name,
    st: makeTime(event.startsAt),
    dur: makeDuration(event),
    desc: event.details || null,
    in_loc: event.location || null,
  });

const makeICSCalendarUrl = (event: CalendarEvent) => {
  const components = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    // `URL:${document.URL}`,
    `DTSTART:${makeTime(event.startsAt)}`,
    `DTEND:${makeTime(event.endsAt)}`,
    `SUMMARY:${event.name}`,
    `DESCRIPTION:${event.details}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return encodeURI(`data:text/calendar;charset=utf8,${components.join("\n")}`);
};

export const makeUrls = (event: CalendarEvent) => ({
  google: makeGoogleCalendarUrl(event),
  outlook: makeOutlookCalendarUrl(event),
  yahoo: makeYahooCalendarUrl(event),
  ics: makeICSCalendarUrl(event),
});

// https://calendar.google.com/calendar/event?action=TEMPLATE&dates=20211001T100000Z/20211001T110000Z&text=Example+event&location=Office&recur=RRULE:FREQ%3DWEEKLY;BYDAY%3DMO,TU,TH

// https://calendar.google.com/calendar/event?action=TEMPLATE&dates=20211001T100000Z/20211001T110000Z&text=Example+event&location=Office&recur=RRULE:FREQ%3DWEEKLY;INTERVAL%3D3
