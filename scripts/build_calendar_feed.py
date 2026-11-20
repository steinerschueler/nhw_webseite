#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
"""Build kalender.ics, the subscribable feed of Eric's booked days, from kalender.js and verfuegbarkeit.js.

The admin toolkit writes kalender.js and verfuegbarkeit.js; this script turns the same data into an iCalendar
file that Outlook, Apple Calendar or Google Calendar can subscribe to. It runs as a pre-commit hook whenever one
of these files changes, so the feed never lags behind the calendar page.

The feed lists busy days only, with the same words as the calendar page. Weekdays without an entry are free.
Not in the feed: public holidays (every calendar shows its own) and the fixed yearly blocks of kalender.html.
Days before VERFUEGBAR_AB become one event "nicht buchbar" that starts with the first entry of the calendar;
entries that lie completely inside it are left out, so a subscriber does not see the same days twice.

The output depends on the input only (no clock), so the hook can tell whether the committed feed is current.

Usage: python3 scripts/build_calendar_feed.py
When kalender.ics differs, the script rewrites it and exits 1, so pre-commit stops the commit and the new file
can be added; exit 0 means the feed is current.
"""

import datetime as dt
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CALENDAR_JS = ROOT / "kalender.js"
AVAILABILITY_JS = ROOT / "verfuegbarkeit.js"
FEED = ROOT / "kalender.ics"

PAGE_URL = "https://naville-handwerk.ch/kalender.html"
UID_DOMAIN = "naville-handwerk.ch"
NAME = "Eric Naville"

# Same order and words as stateFor() in kalender.html; the first kind wins on a day listed twice.
KINDS = [
    ("normal", "Einsatz"),
    ("extern", "Einsatz extern"),
    ("ausfall", "krank / Unfall"),
    ("ferien", "Ferien"),
    ("weiterbildung", "Kurs/Messe"),
    ("termin", "Termin"),
]


class CalendarDataError(Exception):
    """kalender.js or verfuegbarkeit.js does not have the expected shape."""


def parse_calendar(text):
    """Return {kind: [(first_day, last_day), ...]} from the KALENDER object in kalender.js."""
    match = re.search(r"window\.KALENDER\s*=\s*\{(.*?)\};", text, re.S)
    if not match:
        raise CalendarDataError("kalender.js: window.KALENDER = {...}; not found")
    body = match.group(1)
    ranges = {}
    for kind, _ in KINDS:
        found = re.search(r"\b%s\s*:\s*\[(.*?)\]" % kind, body, re.S)
        if not found:
            raise CalendarDataError("kalender.js: list '%s' missing" % kind)
        ranges[kind] = [parse_range(entry) for entry in re.findall(r'"([^"]*)"', found.group(1))]
    return ranges


def parse_range(entry):
    """'2026-10-05/2026-10-09' or '2026-09-09' -> (first_day, last_day), in either order like the page."""
    parts = [part.strip() for part in entry.split("/")]
    if len(parts) not in (1, 2):
        raise CalendarDataError("kalender.js: entry '%s' is not a date or a date range" % entry)
    try:
        days = [dt.date.fromisoformat(part) for part in parts]
    except ValueError as error:
        raise CalendarDataError("kalender.js: entry '%s': %s" % (entry, error)) from None
    return (min(days), max(days))


def parse_available_from(text):
    """Return the date from VERFUEGBAR_AB, or None if it is empty (bookable right away)."""
    match = re.search(r'window\.VERFUEGBAR_AB\s*=\s*"([^"]*)"', text)
    if not match:
        raise CalendarDataError('verfuegbarkeit.js: window.VERFUEGBAR_AB = "..." not found')
    value = match.group(1).strip()
    if not value:
        return None
    try:
        return dt.date.fromisoformat(value)
    except ValueError as error:
        raise CalendarDataError("verfuegbarkeit.js: '%s': %s" % (value, error)) from None


def build_events(ranges, available_from):
    """Return the feed's events as (first_day, last_day, title, uid_key), sorted by date."""
    events = []
    block = None
    starts = [first for kind_ranges in ranges.values() for first, _ in kind_ranges]
    if available_from and starts:
        block_start = min(starts)
        block_end = available_from - dt.timedelta(days=1)
        if block_start <= block_end:
            block = (block_start, block_end)
            title = "nicht buchbar, wieder ab %d.%d.%d" % (available_from.day, available_from.month, available_from.year)
            events.append((block_start, block_end, title, "gesperrt"))
    for kind, title in KINDS:
        for first, last in ranges[kind]:
            if block and block[0] <= first and last <= block[1]:
                continue
            events.append((first, last, title, kind))
    events.sort(key=lambda event: (event[0], event[1], event[3]))
    return events


def escape_text(value):
    """Escape a TEXT value (RFC 5545, 3.3.11)."""
    return value.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def fold(line):
    """Fold a content line to at most 75 octets per physical line (RFC 5545, 3.1)."""
    raw = line.encode("utf-8")
    if len(raw) <= 75:
        return line
    pieces, current = [], b""
    for char in line:
        encoded = char.encode("utf-8")
        limit = 75 if not pieces else 74  # continuation lines start with a space
        if len(current) + len(encoded) > limit:
            pieces.append(current.decode("utf-8"))
            current = b""
        current += encoded
    pieces.append(current.decode("utf-8"))
    return "\r\n ".join(pieces)


def render_feed(events):
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Naville Handwerk GmbH//Kalender-Abo//DE",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:" + escape_text(NAME + " · belegt"),
        "X-WR-CALDESC:" + escape_text(
            "Belegte Tage von " + NAME + " (Naville Handwerk GmbH, Personalverleih). Werktage ohne Eintrag "
            "sind frei. Anfragen: " + PAGE_URL),
        "X-WR-TIMEZONE:Europe/Zurich",
        "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
        "X-PUBLISHED-TTL:PT6H",
    ]
    for first, last, title, uid_key in events:
        lines += [
            "BEGIN:VEVENT",
            "UID:%s-%s@%s" % (first.strftime("%Y%m%d"), uid_key, UID_DOMAIN),
            # DTSTAMP is required; tied to the event so the file stays the same for the same data
            "DTSTAMP:%sT000000Z" % first.strftime("%Y%m%d"),
            "DTSTART;VALUE=DATE:" + first.strftime("%Y%m%d"),
            "DTEND;VALUE=DATE:" + (last + dt.timedelta(days=1)).strftime("%Y%m%d"),
            "SUMMARY:" + escape_text(NAME + ": " + title),
            "TRANSP:OPAQUE",
            "URL:" + PAGE_URL,
            "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    return "".join(fold(line) + "\r\n" for line in lines)


def main():
    try:
        ranges = parse_calendar(CALENDAR_JS.read_text(encoding="utf-8"))
        available_from = parse_available_from(AVAILABILITY_JS.read_text(encoding="utf-8"))
    except (CalendarDataError, OSError) as error:
        print("Kalender-Abo: %s" % error, file=sys.stderr)
        return 2
    feed = render_feed(build_events(ranges, available_from))
    current = FEED.read_bytes().decode("utf-8") if FEED.exists() else None
    if current == feed:
        return 0
    FEED.write_bytes(feed.encode("utf-8"))
    print("Kalender-Abo: kalender.ics neu erzeugt. Mit 'git add kalender.ics' aufnehmen und nochmals committen.",
          file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
