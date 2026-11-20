# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
"""Tests for build_calendar_feed.py. Run: python3 -m unittest discover -s scripts"""

import datetime as dt
import unittest

import build_calendar_feed as feed

CALENDAR = '''window.KALENDER = {
  normal:       ["2026-10-05/2026-10-09", "2027-03-08/2027-03-12"],
  extern:       ["2026-09-01/2026-09-04"],
  ferien:       ["2027-04-02"],
  weiterbildung:[],
  termin:       ["2027-02-25/2027-03-02"],
  ausfall:      [],
};'''

D = dt.date


class BuildEventsTest(unittest.TestCase):
    def events(self, available_from):
        return feed.build_events(feed.parse_calendar(CALENDAR), available_from)

    def test_days_before_available_from_become_one_block_from_the_first_entry(self):
        block = self.events(D(2027, 3, 1))[0]
        self.assertEqual(block[:2], (D(2026, 9, 1), D(2027, 2, 28)))
        self.assertEqual(block[2], "nicht buchbar, wieder ab 1.3.2027")

    def test_entries_inside_the_block_are_left_out_and_later_ones_keep_the_page_words(self):
        titles = [(event[0], event[2]) for event in self.events(D(2027, 3, 1))[1:]]
        self.assertEqual(titles, [(D(2027, 2, 25), "Termin"), (D(2027, 3, 8), "Einsatz"), (D(2027, 4, 2), "Ferien")])

    def test_without_available_from_every_entry_is_its_own_event(self):
        self.assertEqual(len(self.events(None)), 5)

    def test_a_single_day_ends_the_next_day_in_the_feed(self):
        text = feed.render_feed([(D(2027, 4, 2), D(2027, 4, 2), "Ferien", "ferien")])
        self.assertIn("DTSTART;VALUE=DATE:20270402\r\nDTEND;VALUE=DATE:20270403\r\n", text)

    def test_same_data_gives_the_same_file(self):
        self.assertEqual(feed.render_feed(self.events(D(2027, 3, 1))), feed.render_feed(self.events(D(2027, 3, 1))))


class FormatTest(unittest.TestCase):
    def test_long_lines_are_folded_to_75_octets_and_unfold_to_the_original(self):
        line = "X-WR-CALDESC:" + "Belegte Tage für Einsätze " * 8
        folded = feed.fold(line)
        self.assertTrue(all(len(part.encode("utf-8")) <= 75 for part in folded.split("\r\n")))
        self.assertEqual(folded.replace("\r\n ", ""), line)

    def test_commas_and_semicolons_in_text_are_escaped(self):
        self.assertEqual(feed.escape_text("a, b; c"), "a\\, b\\; c")


class BadDataTest(unittest.TestCase):
    def test_missing_list_is_reported(self):
        with self.assertRaises(feed.CalendarDataError):
            feed.parse_calendar(CALENDAR.replace("termin:", "terminx:"))

    def test_invalid_date_is_reported(self):
        with self.assertRaises(feed.CalendarDataError):
            feed.parse_calendar(CALENDAR.replace("2027-04-02", "2027-04-31"))

    def test_invalid_available_from_is_reported(self):
        with self.assertRaises(feed.CalendarDataError):
            feed.parse_available_from('window.VERFUEGBAR_AB = "1.3.2027";')


if __name__ == "__main__":
    unittest.main()
