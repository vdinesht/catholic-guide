"""Generate the liturgical-day seed for 1 Oct - 31 Dec 2026 (Roman calendar)."""
import datetime as dt
import sys

ORD = {26: 'Twenty-sixth', 27: 'Twenty-seventh', 28: 'Twenty-eighth', 29: 'Twenty-ninth', 30: 'Thirtieth',
       31: 'Thirty-first', 32: 'Thirty-second', 33: 'Thirty-third', 34: 'Thirty-fourth'}
ADV = {1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth'}
WD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


def suffix(n):
    return 'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')


# date -> (day_name or None to keep weekday name, saint, saint_note, colour or None, short, highlight_note)
SPECIAL = {
    (10, 1): (None, 'St. Thérèse of the Child Jesus, Virgin and Doctor of the Church', 'Memorial', 'WHITE', 'St. Thérèse of the Child Jesus', ''),
    (10, 2): (None, 'The Holy Guardian Angels', 'Memorial', 'WHITE', 'Holy Guardian Angels', ''),
    (10, 6): (None, 'St. Bruno, Priest', 'Optional memorial', None, None, ''),
    (10, 7): (None, 'Our Lady of the Rosary', 'Memorial', 'WHITE', 'Our Lady of the Rosary', ''),
    (10, 9): (None, 'St. Denis, Bishop, and Companions, Martyrs', 'Optional memorial', None, None, ''),
    (10, 14): (None, 'St. Callistus I, Pope and Martyr', 'Optional memorial', None, None, ''),
    (10, 15): (None, 'St. Teresa of Jesus, Virgin and Doctor of the Church', 'Memorial', 'WHITE', 'St. Teresa of Jesus', ''),
    (10, 16): (None, 'St. Margaret Mary Alacoque, Virgin', 'Optional memorial', None, None, ''),
    (10, 17): (None, 'St. Ignatius of Antioch, Bishop and Martyr', 'Memorial', 'RED', 'St. Ignatius of Antioch', ''),
    (10, 19): (None, 'Sts. John de Brébeuf and Isaac Jogues, Priests, and Companions, Martyrs', 'Optional memorial', None, None, ''),
    (10, 20): (None, 'St. Paul of the Cross, Priest', 'Optional memorial', None, None, ''),
    (10, 22): (None, 'St. John Paul II, Pope', 'Optional memorial', None, None, ''),
    (10, 23): (None, 'St. John of Capistrano, Priest', 'Optional memorial', None, None, ''),
    (10, 24): (None, 'St. Anthony Mary Claret, Bishop', 'Optional memorial', None, None, ''),
    (10, 28): ('Sts. Simon and Jude, Apostles', '', 'Feast', 'RED', 'Sts. Simon and Jude', ''),
    (11, 1): ('All Saints', '', 'Solemnity', 'WHITE', 'All Saints', 'Solemnity · Sunday'),
    (11, 2): ('The Commemoration of All the Faithful Departed (All Souls)', '', '', 'VIOLET', 'All Souls', 'Commemoration of all the faithful departed'),
    (11, 3): (None, 'St. Martin de Porres, Religious', 'Optional memorial', None, None, ''),
    (11, 4): (None, 'St. Charles Borromeo, Bishop', 'Memorial', 'WHITE', 'St. Charles Borromeo', ''),
    (11, 9): ('The Dedication of the Lateran Basilica', '', 'Feast', 'WHITE', 'Lateran Basilica', ''),
    (11, 10): (None, 'St. Leo the Great, Pope and Doctor of the Church', 'Memorial', 'WHITE', 'St. Leo the Great', ''),
    (11, 11): (None, 'St. Martin of Tours, Bishop', 'Memorial', 'WHITE', 'St. Martin of Tours', ''),
    (11, 12): (None, 'St. Josaphat, Bishop and Martyr', 'Memorial', 'RED', 'St. Josaphat', ''),
    (11, 17): (None, 'St. Elizabeth of Hungary, Religious', 'Memorial', 'WHITE', 'St. Elizabeth of Hungary', ''),
    (11, 21): (None, 'The Presentation of the Blessed Virgin Mary', 'Memorial', 'WHITE', 'Presentation of Mary', ''),
    (11, 22): ('Our Lord Jesus Christ, King of the Universe', '', 'Solemnity', 'WHITE', 'Christ the King', 'Solemnity · last Sunday of the year'),
    (11, 24): (None, 'St. Andrew Dũng-Lạc, Priest, and Companions, Martyrs', 'Memorial', 'RED', 'St. Andrew Dũng-Lạc', ''),
    (11, 30): ('St. Andrew, Apostle', '', 'Feast', 'RED', 'St. Andrew', ''),
    (12, 3): (None, 'St. Francis Xavier, Priest', 'Memorial', 'WHITE', 'St. Francis Xavier', ''),
    (12, 7): (None, 'St. Ambrose, Bishop and Doctor of the Church', 'Memorial', 'WHITE', 'St. Ambrose', ''),
    (12, 8): ('The Immaculate Conception of the Blessed Virgin Mary', '', 'Solemnity', 'WHITE', 'Immaculate Conception', 'Solemnity'),
    (12, 12): (None, 'Our Lady of Guadalupe', 'Optional memorial', None, None, ''),
    (12, 14): (None, 'St. John of the Cross, Priest and Doctor of the Church', 'Memorial', 'WHITE', 'St. John of the Cross', ''),
    (12, 25): ('The Nativity of the Lord (Christmas)', '', 'Solemnity', 'WHITE', 'Christmas', 'Solemnity'),
    (12, 26): ('St. Stephen, the First Martyr', '', 'Feast', 'RED', 'St. Stephen', ''),
    (12, 27): ('The Holy Family of Jesus, Mary and Joseph', '', 'Feast', 'WHITE', 'Holy Family', ''),
    (12, 28): ('The Holy Innocents, Martyrs', '', 'Feast', 'RED', 'Holy Innocents', ''),
}
ADVENT_START = dt.date(2026, 11, 29)
CHRISTMAS = dt.date(2026, 12, 25)
OCTAVE = {29: 'Fifth', 30: 'Sixth', 31: 'Seventh'}


def q(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    days, names = [], []
    d = dt.date(2026, 10, 1)
    while d <= dt.date(2026, 12, 31):
        wd = WD[d.weekday()]
        sunday = d.weekday() == 6
        ta = None
        if d < ADVENT_START:
            # Week n of Ordinary Time begins on Sunday n; 4 Oct 2026 is the 27th Sunday.
            week = 27 + (d - dt.date(2026, 10, 4)).days // 7 if d >= dt.date(2026, 10, 4) else 26
            colour, cycle = 'GREEN', 'A · II'
            season = f'Ordinary Time · Week {week}'
            if sunday:
                name = f'{ORD[week]} Sunday in Ordinary Time'
                short = f'{week}{suffix(week)} Sunday'
                ta = (f'பொதுக்காலம் {week}-ஆம் ஞாயிறு', f'பொதுக்காலம் · {week}-ஆம் வாரம்')
            else:
                name = f'{wd} of the {week}{suffix(week)} Week in Ordinary Time'
                short = f'{wd[:3]} · Week {week}'
                ta = (f'பொதுக்காலம் {week}-ஆம் வாரம்', f'பொதுக்காலம் · {week}-ஆம் வாரம்')
        elif d < CHRISTMAS:
            week = 1 + (d - ADVENT_START).days // 7
            colour, cycle = ('ROSE' if d == dt.date(2026, 12, 13) else 'VIOLET'), 'B · I'
            season = f'Advent · Week {week}'
            if sunday:
                name = f'{ADV[week]} Sunday of Advent'
                short = f'Advent {week}'
            elif d.day >= 17:
                name = f'Advent Weekday · {d.day} December'
                short = f'{wd[:3]} · Advent {week}'
            else:
                name = f'{wd} of the {ADV[week]} Week of Advent'
                short = f'{wd[:3]} · Advent {week}'
        else:
            colour, cycle, season = 'WHITE', 'B · I', 'Christmas Time'
            name = f'{OCTAVE.get(d.day, "")} Day within the Octave of the Nativity of the Lord'
            short = 'Christmas Octave'

        saint, note, hl_note = '', '', ''
        sp = SPECIAL.get((d.month, d.day))
        if sp:
            sp_name, saint, note, sp_colour, sp_short, hl_note = sp
            # Sundays of Ordinary Time outrank memorials; only solemnities and some feasts replace them.
            if sunday and note in ('Memorial', 'Optional memorial'):
                saint, note = '', ''
            else:
                if sp_name:
                    name = sp_name
                if sp_colour:
                    colour = sp_colour
                if sp_short:
                    short = sp_short
            if sp_name:
                ta = None
        if d == ADVENT_START:
            hl_note = 'A new liturgical year begins (Year B)'
        highlight = 'TRUE' if hl_note else 'FALSE'
        days.append(f"('{d.isoformat()}', '{colour}', {q(cycle)}, {highlight})")
        names.append(f"('{d.isoformat()}', 'en', {q(name)}, {q(season)}, {q(saint)}, {q(note)}, {q(short)}, {q(hl_note)})")
        if ta:
            ta_saint = 'புனித அந்தோனி மரிய கிளாரட், ஆயர்' if d == dt.date(2026, 10, 24) else ''
            names.append(f"('{d.isoformat()}', 'ta', {q(ta[0])}, {q(ta[1])}, {q(ta_saint)}, '', '', '')")
        d += dt.timedelta(days=1)

    out = sys.stdout
    out.write('INSERT INTO liturgical_days (day, colour, cycle, highlight) VALUES\n')
    out.write(',\n'.join(days) + ';\n\n')
    out.write('INSERT INTO liturgical_day_names (day, lang, day_name, season_label, saint, saint_note, short_label, highlight_note) VALUES\n')
    out.write(',\n'.join(names) + ';\n')


main()
