-- Starter content: the editorial team, the prayers and hymns shown in the design,
-- and the readings for Saturday 24 October 2026 (Douay-Rheims, public domain).
-- Bracketed text marks content that must come from a licensed source before publishing.

INSERT INTO users (name, email, role, status, last_sign_in_at, created_at) VALUES
('Vinoth',        'vinoth@genixtec.com',        'ADMIN',  'ACTIVE',      '2026-10-24 16:51+05:30', '2026-08-01 10:00+05:30'),
('Arul Raj',      'arul.raj@example.org',       'EDITOR', 'ACTIVE',      '2026-10-24 15:42+05:30', '2026-08-02 10:00+05:30'),
('Maria Joseph',  'maria.joseph@example.org',   'EDITOR', 'ACTIVE',      '2026-10-23 18:10+05:30', '2026-08-02 10:05+05:30'),
('Fr. Antony',    'fr.antony@example.org',      'ADMIN',  'ACTIVE',      '2026-10-20 09:00+05:30', '2026-08-01 10:10+05:30'),
('Teresa Thomas', 'teresa@example.org',         'EDITOR', 'INVITED',     NULL,                     '2026-10-24 09:20+05:30'),
('John Peter',    'john.peter@example.org',     'EDITOR', 'DEACTIVATED', '2026-09-02 10:00+05:30', '2026-08-05 10:00+05:30');

-- ---------------------------------------------------------------- Songs
INSERT INTO songs (slug, lang, category_id, title, author, tune, rights, licence_number, updated_at, updated_by) VALUES
('holy-god-we-praise-thy-name', 'en', (SELECT id FROM categories WHERE kind = 'SONG' AND name = 'Praise & thanksgiving'),
 'Holy God, We Praise Thy Name', 'tr. Clarence Walworth, 1858', 'Grosser Gott', 'PUBLIC_DOMAIN', '', '2026-10-24 16:51+05:30', 1),
('holy-holy-holy', 'en', (SELECT id FROM categories WHERE kind = 'SONG' AND name = 'Praise & thanksgiving'),
 'Holy, Holy, Holy! Lord God Almighty', 'Reginald Heber, 1826', 'Nicaea', 'PUBLIC_DOMAIN', '', '2026-10-14 11:00+05:30', 3),
('be-thou-my-vision', 'en', (SELECT id FROM categories WHERE kind = 'SONG' AND name = 'Devotional'),
 'Be Thou My Vision', 'Irish, tr. Mary Byrne & Eleanor Hull', 'Slane', 'PUBLIC_DOMAIN', '', '2026-10-14 11:05+05:30', 3),
('panis-angelicus', 'la', (SELECT id FROM categories WHERE kind = 'SONG' AND name = 'Eucharistic'),
 'Panis Angelicus', 'St. Thomas Aquinas', '', 'PUBLIC_DOMAIN', '', '2026-10-03 10:00+05:30', 4),
('now-thank-we-all-our-god', 'en', (SELECT id FROM categories WHERE kind = 'SONG' AND name = 'Praise & thanksgiving'),
 'Now Thank We All Our God', 'tr. Catherine Winkworth, 1858', 'Nun danket', 'PUBLIC_DOMAIN', '', '2026-10-14 11:10+05:30', 3),
('salve-regina', 'la', (SELECT id FROM categories WHERE kind = 'SONG' AND name = 'Marian'),
 'Salve Regina', '', 'Chant, simple tone', 'PUBLIC_DOMAIN', '', '2026-10-03 10:05+05:30', 4),
('o-come-o-come-emmanuel', 'en', (SELECT id FROM categories WHERE kind = 'SONG' AND name = 'Advent & Christmas'),
 'O Come, O Come, Emmanuel', 'tr. John Mason Neale, 1851', 'Veni Emmanuel', 'PUBLIC_DOMAIN', '', '2026-10-23 17:30+05:30', 2),
('tamil-hymn', 'ta', (SELECT id FROM categories WHERE kind = 'SONG' AND name = 'Devotional'),
 '[தமிழ் பாடல் தலைப்பு]', '[Composer]', '', 'NEEDS_CHECKING', '', '2026-10-24 13:00+05:30', 2),
('tamil-marian-hymn', 'ta', (SELECT id FROM categories WHERE kind = 'SONG' AND name = 'Marian'),
 '[தமிழ் மரியன்னை பாடல்]', '[Composer]', '', 'LICENSED', '', '2026-10-18 12:00+05:30', 3);

INSERT INTO song_blocks (song_id, position, type, body)
SELECT s.id, b.position, b.type, b.body
FROM (VALUES
  ('holy-god-we-praise-thy-name', 0, 'VERSE', E'Holy God, we praise Thy Name;\nLord of all, we bow before Thee!\nAll on earth Thy scepter claim,\nAll in Heaven above adore Thee;\nInfinite Thy vast domain,\nEverlasting is Thy reign.'),
  ('holy-god-we-praise-thy-name', 1, 'VERSE', E'Hark! the loud celestial hymn\nAngel choirs above are raising,\nCherubim and Seraphim,\nIn unceasing chorus praising;\nFill the heavens with sweet accord:\nHoly, holy, holy, Lord.'),
  ('holy-god-we-praise-thy-name', 2, 'VERSE', E'Lo! the apostolic train\nJoin the sacred Name to hallow;\nProphets swell the loud refrain,\nAnd the white-robed martyrs follow;\nAnd from morn to set of sun,\nThrough the Church the song goes on.'),
  ('holy-holy-holy', 0, 'VERSE', E'Holy, holy, holy! Lord God Almighty!\nEarly in the morning our song shall rise to Thee;\nHoly, holy, holy! merciful and mighty!\nGod in three Persons, blessed Trinity!'),
  ('be-thou-my-vision', 0, 'VERSE', E'Be Thou my Vision, O Lord of my heart;\nNaught be all else to me, save that Thou art;\nThou my best Thought, by day or by night,\nWaking or sleeping, Thy presence my light.'),
  ('panis-angelicus', 0, 'VERSE', E'Panis angelicus\nfit panis hominum;\ndat panis caelicus\nfiguris terminum:\nO res mirabilis!\nmanducat Dominum\npauper, servus et humilis.'),
  ('now-thank-we-all-our-god', 0, 'VERSE', E'Now thank we all our God,\nWith heart and hands and voices,\nWho wondrous things hath done,\nIn whom His world rejoices;\nWho from our mother’s arms\nHath blessed us on our way\nWith countless gifts of love,\nAnd still is ours today.'),
  ('salve-regina', 0, 'VERSE', E'Salve, Regina, Mater misericordiae,\nvita, dulcedo, et spes nostra, salve.'),
  ('o-come-o-come-emmanuel', 0, 'VERSE', E'O come, O come, Emmanuel,\nAnd ransom captive Israel,\nThat mourns in lonely exile here\nUntil the Son of God appear.'),
  ('o-come-o-come-emmanuel', 1, 'REFRAIN', E'Rejoice! Rejoice! Emmanuel\nShall come to thee, O Israel.'),
  ('tamil-hymn', 0, 'VERSE', '[தமிழ் பாடல் வரிகள் — உரிமம் பெற்ற பாடல் நூலிலிருந்து]'),
  ('tamil-hymn', 1, 'REFRAIN', '[பல்லவி]'),
  ('tamil-marian-hymn', 0, 'VERSE', '[தமிழ் பாடல் வரிகள்]')
) AS b (slug, position, type, body)
JOIN songs s ON s.slug = b.slug;

-- Publish every public-domain hymn as it stands.
UPDATE songs s SET
  published = (
    SELECT jsonb_build_object('title', s.title, 'author', s.author, 'tune', s.tune,
             'blocks', jsonb_agg(jsonb_build_object('type', b.type, 'body', b.body) ORDER BY b.position))
    FROM song_blocks b WHERE b.song_id = s.id),
  published_at = s.updated_at
WHERE s.rights = 'PUBLIC_DOMAIN';

-- "O Come, O Come, Emmanuel" is live, with a refrain edit waiting to publish.
UPDATE songs SET published = jsonb_set(published, '{blocks}', jsonb_build_array(published->'blocks'->0)), has_changes = TRUE
WHERE slug = 'o-come-o-come-emmanuel';

-- ---------------------------------------------------------------- Prayers
INSERT INTO prayers (slug, category_id, reading_time, tags, source, updated_at, updated_by)
SELECT p.slug, c.id, p.reading_time, p.tags, 'Traditional', p.updated_at::timestamptz, p.updated_by
FROM (VALUES
  ('our-father',    'Essentials',         '1 min',               'Lord''s Prayer, Pater Noster',        '2026-10-12 10:00+05:30', 4),
  ('hail-mary',     'Mary & Rosary',      '1 min',               'Our Lady, Ave Maria, Rosary',         '2026-10-12 10:05+05:30', 4),
  ('glory-be',      'Essentials',         'Under 1 min',         'Doxology, Trinity',                   '2026-10-12 10:10+05:30', 4),
  ('memorare',      'Mary & Rosary',      '1 min',               'Our Lady, Saturday, intercession',    '2026-10-24 11:05+05:30', 3),
  ('hail-holy-queen','Mary & Rosary',     '1 min',               'Our Lady, Salve Regina, Rosary',      '2026-10-09 12:00+05:30', 3),
  ('st-michael',    'Saints & Angels',    '1 min',               'Archangel, protection',               '2026-10-08 15:00+05:30', 2),
  ('angel-of-god',  'Morning & Night',    'Under 1 min',         'Guardian angel, children',            '2026-10-02 09:00+05:30', 3),
  ('morning-offering','Morning & Night',  '1 min',               'Sacred Heart, morning',               '2026-09-28 09:00+05:30', 3),
  ('act-of-contrition','Sacraments',      '1 min',               'Confession, Reconciliation',          '2026-10-02 18:00+05:30', 1),
  ('eternal-rest',  'For the departed',   'Under 1 min',         'Holy Souls, November, funeral',       '2026-10-23 18:14+05:30', 2),
  ('divine-mercy-novena','Novenas & Litanies','9 days · 10 min a day','Divine Mercy, chaplet, novena', '2026-10-01 10:00+05:30', 4),
  ('litany-of-loreto','Novenas & Litanies','5 min',              'Our Lady, litany',                    '2026-10-01 10:05+05:30', 4)
) AS p (slug, category, reading_time, tags, updated_at, updated_by)
JOIN categories c ON c.kind = 'PRAYER' AND c.name = p.category;

INSERT INTO prayer_translations (prayer_id, lang, title, body, updated_at, updated_by)
SELECT p.id, t.lang, t.title, t.body, p.updated_at, p.updated_by
FROM (VALUES
  ('our-father', 'en', 'Our Father', E'Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven.\n\nGive us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil.\n\nAmen.'),
  ('hail-mary', 'en', 'Hail Mary', E'Hail Mary, full of grace, the Lord is with thee. Blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus.\n\nHoly Mary, Mother of God, pray for us sinners, now and at the hour of our death.\n\nAmen.'),
  ('glory-be', 'en', 'Glory Be', E'Glory be to the Father, and to the Son, and to the Holy Spirit,\nas it was in the beginning, is now, and ever shall be, world without end.\n\nAmen.'),
  ('memorare', 'en', 'The Memorare', E'Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thine intercession was left unaided.\n\nInspired by this confidence, I fly unto thee, O Virgin of virgins, my Mother; to thee do I come, before thee I stand, sinful and sorrowful.\n\nO Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me.\n\nAmen.'),
  ('memorare', 'ta', '[தமிழ் தலைப்பு — நினைவுகூரும்]', '[தமிழ் செபம் — உரிமம் பெற்ற மொழிபெயர்ப்பிலிருந்து]'),
  ('hail-holy-queen', 'en', 'Hail, Holy Queen', E'Hail, holy Queen, Mother of mercy, our life, our sweetness and our hope.\n\nTo thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears.\n\nTurn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile show unto us the blessed fruit of thy womb, Jesus.\n\nO clement, O loving, O sweet Virgin Mary.'),
  ('st-michael', 'en', 'Prayer to St. Michael the Archangel', E'Saint Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil.\n\nMay God rebuke him, we humbly pray; and do thou, O Prince of the heavenly host, by the power of God, thrust into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls.\n\nAmen.'),
  ('st-michael', 'ta', '[தமிழ் தலைப்பு]', '[தமிழ் செபம் — உரிமம் பெற்ற மொழிபெயர்ப்பிலிருந்து]'),
  ('angel-of-god', 'en', 'Angel of God', E'Angel of God, my guardian dear, to whom God’s love commits me here,\never this day be at my side, to light and guard, to rule and guide.\n\nAmen.'),
  ('morning-offering', 'en', 'Morning Offering', E'O Jesus, through the Immaculate Heart of Mary, I offer you my prayers, works, joys and sufferings of this day for all the intentions of your Sacred Heart, in union with the Holy Sacrifice of the Mass throughout the world, in reparation for my sins, for the intentions of all our associates, and in particular for the intentions of the Holy Father.\n\nAmen.'),
  ('act-of-contrition', 'en', 'Act of Contrition', E'O my God, I am heartily sorry for having offended Thee, and I detest all my sins because of Thy just punishments, but most of all because they offend Thee, my God, who art all good and deserving of all my love.\n\nI firmly resolve, with the help of Thy grace, to sin no more and to avoid the near occasion of sin.\n\nAmen.'),
  ('eternal-rest', 'en', 'Eternal Rest', E'Eternal rest grant unto them, O Lord, and let perpetual light shine upon them. May they rest in peace.\nAmen.\n\nMay their souls and the souls of all the faithful departed, through the mercy of God, rest in peace.\nAmen.'),
  ('divine-mercy-novena', 'en', 'Divine Mercy Novena', '[Day-by-day novena text — 9 days, with the Chaplet of Divine Mercy]'),
  ('litany-of-loreto', 'en', 'Litany of Loreto', E'Lord, have mercy. Christ, have mercy. Lord, have mercy.\nChrist, hear us. Christ, graciously hear us.\n\n[Full litany text]')
) AS t (slug, lang, title, body)
JOIN prayers p ON p.slug = t.slug;

-- English versions go live, except the two that are still placeholders.
UPDATE prayer_translations t SET published_title = t.title, published_body = t.body, published_at = t.updated_at
FROM prayers p
WHERE p.id = t.prayer_id AND t.lang = 'en' AND p.slug NOT IN ('divine-mercy-novena', 'litany-of-loreto');

-- "Eternal Rest" is live with an edit waiting to publish.
UPDATE prayer_translations t SET has_changes = TRUE,
  published_body = E'Eternal rest grant unto them, O Lord, and let perpetual light shine upon them. May they rest in peace.\nAmen.'
FROM prayers p WHERE p.id = t.prayer_id AND p.slug = 'eternal-rest' AND t.lang = 'en';

-- ---------------------------------------------------------------- Readings
INSERT INTO reading_sets (day, lang, credit, quote, quote_cite, updated_at, updated_by) VALUES
('2026-10-24', 'en', 'Douay-Rheims Bible (public domain)', 'Lord, let it alone this year also, until I dig about it.', 'Luke 13:8', '2026-10-23 14:02+05:30', 3),
('2026-10-24', 'ta', '[Licensed Tamil lectionary]', '', '', '2026-10-24 15:42+05:30', 2),
('2026-10-25', 'en', 'Douay-Rheims Bible (public domain)', '', '', '2026-10-23 19:00+05:30', 4);

INSERT INTO reading_parts (reading_set_id, position, kind, citation, intro, response, body, close_reader, close_people)
SELECT rs.id, p.position, p.kind, p.citation, p.intro, p.response, p.body, p.close_reader, p.close_people
FROM (VALUES
  ('2026-10-24', 'en', 0, 'First Reading', 'Ephesians 4:7–16', 'A reading from the Letter of Saint Paul to the Ephesians', '',
   E'[7] But to every one of us is given grace, according to the measure of the giving of Christ. [8] Wherefore he saith: Ascending on high, he led captivity captive; he gave gifts to men. [9] Now that he ascended, what is it, but because he also descended first into the lower parts of the earth? [10] He that descended is the same also that ascended above all the heavens, that he might fill all things.\n\n[11] And he gave some apostles, and some prophets, and other some evangelists, and other some pastors and doctors, [12] For the perfecting of the saints, for the work of the ministry, for the edifying of the body of Christ: [13] Until we all meet into the unity of faith, and of the knowledge of the Son of God, unto a perfect man, unto the measure of the age of the fulness of Christ;\n\n[14] That henceforth we be no more children tossed to and fro, and carried about with every wind of doctrine by the wickedness of men, by cunning craftiness, by which they lie in wait to deceive. [15] But doing the truth in charity, we may in all things grow up in him who is the head, even Christ: [16] From whom the whole body, being compacted and fitly joined together, by what every joint supplieth, according to the operation in the measure of every part, maketh increase of the body, unto the edifying of itself in charity.',
   'The word of the Lord.', 'Thanks be to God.'),
  ('2026-10-24', 'en', 1, 'Responsorial Psalm', 'Psalm 122:1–5', '', 'Let us go rejoicing to the house of the Lord.',
   E'[1] I rejoiced at the things that were said to me: We shall go into the house of the Lord. [2] Our feet were standing in thy courts, O Jerusalem.\n\n[3] Jerusalem, which is built as a city, which is compact together. [4] For thither did the tribes go up, the tribes of the Lord: the testimony of Israel, to praise the name of the Lord.\n\n[5] Because their seats have sat in judgment, seats upon the house of David.',
   '', ''),
  ('2026-10-24', 'en', 2, 'Gospel Acclamation', 'Ezekiel 33:11', '', '',
   E'Alleluia, alleluia.\nI desire not the death of the wicked, but that the wicked turn from his way, and live.\nAlleluia.',
   '', ''),
  ('2026-10-24', 'en', 3, 'Gospel', 'Luke 13:1–9', 'A reading from the holy Gospel according to Luke', '',
   E'[1] And there were present, at that very time, some that told him of the Galileans, whose blood Pilate had mingled with their sacrifices. [2] And he answering, said to them: Think you that these Galileans were sinners above all the men of Galilee, because they suffered such things? [3] No, I say to you: but unless you shall do penance, you shall all likewise perish.\n\n[4] Or those eighteen upon whom the tower fell in Siloe, and slew them: think you, that they also were debtors above all the men that dwelt in Jerusalem? [5] No, I say to you; but except you do penance, you shall all likewise perish.\n\n[6] He spoke also this parable: A certain man had a fig tree planted in his vineyard, and he came seeking fruit on it, and found none. [7] And he said to the dresser of the vineyard: Behold, for these three years I come seeking fruit on this fig tree, and I find none. Cut it down therefore: why cumbereth it the ground? [8] But he answering, said to him: Lord, let it alone this year also, until I dig about it, and dung it. [9] And if happily it bear fruit: but if not, then after that thou shalt cut it down.',
   'The Gospel of the Lord.', 'Praise to you, Lord Jesus Christ.'),

  ('2026-10-24', 'ta', 0, 'First Reading', 'எபேசியர் 4:7–16', 'திருத்தூதர் பவுல் எபேசியருக்கு எழுதிய திருமுகத்திலிருந்து வாசகம்', '',
   '[தமிழ் வாசகம் — உரிமம் பெற்ற மொழிபெயர்ப்பிலிருந்து ஒட்டவும்]', 'இது ஆண்டவர் வழங்கும் அருள்வாக்கு.', 'இறைவா, உமக்கு நன்றி.'),
  ('2026-10-24', 'ta', 1, 'Responsorial Psalm', 'திருப்பாடல் 122:1–5', '', '[தமிழ் பல்லவி]',
   '[தமிழ் வாசகம் — உரிமம் பெற்ற மொழிபெயர்ப்பிலிருந்து ஒட்டவும்]', '', ''),
  ('2026-10-24', 'ta', 2, 'Gospel Acclamation', 'எசேக்கியேல் 33:11', '', '',
   '[தமிழ் வாசகம் — உரிமம் பெற்ற மொழிபெயர்ப்பிலிருந்து ஒட்டவும்]', '', ''),
  ('2026-10-24', 'ta', 3, 'Gospel', 'லூக்கா 13:1–9', 'லூக்கா எழுதிய தூய நற்செய்தியிலிருந்து வாசகம்', '',
   '[தமிழ் வாசகம் — உரிமம் பெற்ற மொழிபெயர்ப்பிலிருந்து ஒட்டவும்]', 'இது கிறிஸ்து வழங்கும் நற்செய்தி.', 'கிறிஸ்துவே, உமக்குப் புகழ்.'),

  ('2026-10-25', 'en', 0, 'First Reading', 'Exodus 22:20–26', '', '', '', 'The word of the Lord.', 'Thanks be to God.'),
  ('2026-10-25', 'en', 1, 'Responsorial Psalm', 'Psalm 18:2–4, 47, 51', '', '', '', '', ''),
  ('2026-10-25', 'en', 2, 'Second Reading', '1 Thessalonians 1:5c–10', '', '', '', 'The word of the Lord.', 'Thanks be to God.'),
  ('2026-10-25', 'en', 3, 'Gospel', 'Matthew 22:34–40', '', '', '', 'The Gospel of the Lord.', 'Praise to you, Lord Jesus Christ.')
) AS p (day, lang, position, kind, citation, intro, response, body, close_reader, close_people)
JOIN reading_sets rs ON rs.day = p.day::date AND rs.lang = p.lang;

-- English readings for 24 October are live.
UPDATE reading_sets rs SET
  published = jsonb_build_object('credit', rs.credit, 'quote', rs.quote, 'quoteCite', rs.quote_cite,
    'parts', (SELECT jsonb_agg(jsonb_build_object('kind', p.kind, 'citation', p.citation, 'intro', p.intro,
                'response', p.response, 'body', p.body, 'closeReader', p.close_reader, 'closePeople', p.close_people)
              ORDER BY p.position) FROM reading_parts p WHERE p.reading_set_id = rs.id)),
  published_at = rs.updated_at
WHERE rs.day = '2026-10-24' AND rs.lang = 'en';

UPDATE liturgical_days SET hymn_song_id = (SELECT id FROM songs WHERE slug = 'holy-god-we-praise-thy-name')
WHERE day = '2026-10-24';

-- ---------------------------------------------------------------- Activity
INSERT INTO activity (at, user_id, verb, item) VALUES
('2026-09-02 10:11+05:30', 1, 'deactivated', 'John Peter'),
('2026-10-22 20:30+05:30', 4, 'published', 'Readings · 20 Oct (தமிழ்)'),
('2026-10-23 14:02+05:30', 3, 'published', 'Readings · 24 Oct (English)'),
('2026-10-23 18:14+05:30', 2, 'created', 'Eternal Rest'),
('2026-10-24 09:20+05:30', 1, 'invited', 'Teresa Thomas as Editor'),
('2026-10-24 11:05+05:30', 3, 'saved a draft of', 'The Memorare (தமிழ்)'),
('2026-10-24 15:42+05:30', 2, 'edited', 'Readings · 24 Oct (தமிழ்)'),
('2026-10-24 16:51+05:30', 1, 'published', 'Holy God, We Praise Thy Name (English)');
