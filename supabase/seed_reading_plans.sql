-- =============================================================================
-- Seed: 6 Additional Reading Plans (Abide is already in seed.sql)
-- The Honest Salesman, When the Month Is Dying, Serving the Customer You Don't Like,
-- Money Without Mastery, The Servant Leader, Walking in Integrity
-- =============================================================================

-- ── 1. THE HONEST SALESMAN (7 days): Proverbs and integrity on the floor ──────

INSERT INTO reading_plans (slug, title, subtitle, description, day_count, is_premium)
VALUES (
  'the-honest-salesman',
  'The Honest Salesman',
  'Proverbs and integrity on the floor',
  'The car business tests your integrity every day — on payment quotes, trade-in appraisals, disclosure requirements, and customer conversations. This 7-day plan walks through Proverbs to build a foundation of honesty that can withstand the pressure of the showroom floor.',
  7,
  false
);

WITH plan AS (SELECT id FROM reading_plans WHERE slug = 'the-honest-salesman')
INSERT INTO reading_plan_days (plan_id, day_number, title, scripture_reference, scripture_text, body, application)
SELECT plan.id, day_number, title, scripture_reference, scripture_text, body, application
FROM plan, (VALUES
  (1, 'The Scale in Your Hand', 'Proverbs 11:1',
   'A false balance is an abomination to the Lord, but a just weight is his delight.',
   'God cares about the instrument of measurement before any transaction takes place. The "false balance" in Proverbs is not just about ancient merchant scales — it is about any system rigged to benefit one party at the expense of another. On the sales floor, the false balance shows up in inflated payments, undisclosed fees, hidden damage, and carefully worded half-truths. Proverbs uses a strong word: abomination. This is not a minor infraction or an industry standard. God sees the scale itself. The good news is that the just weight — honest dealing — is described as God''s delight. Not just tolerated. Not just permitted. Delighted in. When you deal honestly on the floor, you participate in something that brings God joy. That is a higher motivation than fear of being caught.',
   'Identify one area of your sales process where the "scale" could tilt toward dishonesty. Decide in advance how you will keep it true.'),
  (2, 'Words That Build or Destroy', 'Proverbs 12:22',
   'Lying lips are an abomination to the Lord, but those who act faithfully are his delight.',
   'The sales floor runs on words. What you say to a customer about a vehicle, a payment, a rebate, a trade-in value — every word carries weight. Proverbs draws a sharp line: lying lips are an abomination; faithful words are a delight. Notice the contrast is not between "lying" and "telling the truth." It is between lying and acting faithfully. Faithfulness is broader than factual accuracy. It includes tone, context, what you choose to emphasize and what you choose to omit. A half-truth that misleads is still a lie. A technically true statement delivered to deceive is still dishonest. Acting faithfully means the customer can trust not just your words but your intent.',
   'Think of a time you told a technically true statement in a misleading way. What would "acting faithfully" have looked like instead?'),
  (3, 'The Wealth That Comes Without Sorrow', 'Proverbs 10:2',
   'Treasures gained by wickedness do not profit, but righteousness delivers from death.',
   'The promise is counterintuitive: dishonest gain does not actually profit. Not "it profits but you should not do it anyway." It does not profit. The money may hit your account. The commission may post. But something is lost that outweighs the gain — peace of conscience, trust with your spouse, the ability to pray without a cloud of guilt. Righteousness is described as delivering from death — not just physical death but the slow death of the soul that comes from trading integrity for income. The treasure that matters is not the one that shows up on your paycheck. It is the treasure of a life oriented toward God, which no market downturn can touch.',
   'Is there income you have earned in a way that troubles your conscience? Bring it to God honestly. Ask what repair might look like.'),
  (4, 'The Companion of the Wise', 'Proverbs 13:20',
   'Whoever walks with the wise becomes wise, but the companion of fools will suffer harm.',
   'You become like the people you spend time with. This is true in every area of life, and it is acutely true on the sales floor. If your closest coworkers cut corners, mock customers, and treat dishonesty as a joke, their habits will shape yours — not overnight, but gradually, almost imperceptibly. Proverbs says the solution is not to isolate yourself or become self-righteous. It is to intentionally walk with the wise. Find the person on your floor — or in your network — who does business honestly and spend time with them. Let their example challenge and encourage you. Wisdom is contagious. So is foolishness. Choose your companions carefully.',
   'Who is the wisest, most honest person you know in the car business? Reach out to them this week — even just a text.'),
  (5, 'A Good Name', 'Proverbs 22:1',
   'A good name is to be chosen rather than great riches, and favor is better than silver or gold.',
   'In the car business, reputation is everything — but the industry often defines reputation in terms of numbers: who is a "closer," who moves metal, who makes gross. Proverbs defines a good name differently. It is not about production. It is about character. A good name means that when people hear your name, they associate it with honesty, fairness, and integrity. That kind of name takes years to build and can be lost in a single bad decision. But once built, it is more valuable than any single deal, any single month, any single bonus. People will drive across town to buy from someone they trust. More importantly, you will be able to look at yourself in the mirror without flinching.',
   'What do you want people to think when they hear your name — coworkers, customers, your family? Are you living in a way that builds that reputation?'),
  (6, 'The Lord Establishes Your Steps', 'Proverbs 16:9',
   'The heart of man plans his way, but the Lord establishes his steps.',
   'Salespeople are planners by nature. You set goals, track pipelines, forecast income, work a process. Planning is not the problem. The problem is when we mistake our plans for guarantees and judge God''s faithfulness by whether our plans succeed. Proverbs says we plan, but God establishes. His establishment may look different from our vision. A deal we counted on falls through; a door we never expected opens. The discipline is to hold our plans loosely, work them diligently, and trust the outcome to the one who actually controls it. This is not passivity. It is the peace of knowing that your life is not held together by the strength of your planning.',
   'What plan are you white-knuckling right now? Can you open your hand and entrust the outcome to God?'),
  (7, 'The Fear of the Lord', 'Proverbs 1:7',
   'The fear of the Lord is the beginning of knowledge; fools despise wisdom and instruction.',
   'We end where Proverbs begins: the fear of the Lord. Not terror of a capricious deity, but the reverent awe that recognizes God as God and ourselves as not-God. This is where integrity starts. Not with a code of ethics. Not with a fear of getting caught. With a deep, settled awareness that we live and work before the face of God. When the fear of the Lord is your foundation, the choice to be honest is not a calculation — it is the only option that makes sense. You are not trying to impress anyone. You are not gaming a system. You are living before an audience of One, and that One sees everything. That should terrify the dishonest and comfort the honest. Both reactions are appropriate.',
   'Do you live and work with an awareness of God''s presence? What would change if you did — specifically, concretely, on Monday morning?')
) AS t(day_number, title, scripture_reference, scripture_text, body, application);

-- ── 2. WHEN THE MONTH IS DYING (5 days): Psalms of lament for sales slumps ──

INSERT INTO reading_plans (slug, title, subtitle, description, day_count, is_premium)
VALUES (
  'when-the-month-is-dying',
  'When the Month Is Dying',
  'Psalms of lament for sales slumps',
  'The third week of a bad month feels like a slow-motion disaster. The Psalms give us language for the despair, frustration, and fear that come when the numbers are not moving. This 5-day plan walks through Psalms of lament — not to fix the slump, but to meet God honestly in the middle of it.',
  5,
  false
);

WITH plan AS (SELECT id FROM reading_plans WHERE slug = 'when-the-month-is-dying')
INSERT INTO reading_plan_days (plan_id, day_number, title, scripture_reference, scripture_text, body, application)
SELECT plan.id, day_number, title, scripture_reference, scripture_text, body, application
FROM plan, (VALUES
  (1, 'How Long, O Lord?', 'Psalm 13:1-2',
   'How long, O Lord? Will you forget me forever? How long will you hide your face from me? How long must I take counsel in my soul and have sorrow in my heart all the day?',
   'The month is halfway over and the board looks terrible. You have done the work — followed up, made calls, walked the lot — and nothing is sticking. David''s question is raw: "How long?" Four times in two verses he asks it. He does not open with praise. He does not qualify his complaint with a statement of faith. He leads with lament. The Psalms give us permission to bring our frustration to God unfiltered. He can handle your anger about a dead month. He is not intimidated by your disappointment. The first step toward trusting God in a slump is telling him honestly how you feel about it. Do not clean it up. Bring it as it is.',
   'Write down your honest feelings about this month — no filtering, no spiritual language. Bring those words to God in prayer.'),
  (2, 'My God, Why Have You Forsaken Me?', 'Psalm 22:1-2',
   'My God, my God, why have you forsaken me? Why are you so far from saving me, from the words of my groaning? O my God, I cry by day, but you do not answer, and by night, but I find no rest.',
   'This is the psalm Jesus quoted from the cross. When a sales slump drags on, it can feel like abandonment. The phone is silent. The traffic is dead. The managers are avoiding eye contact. You pray and nothing changes. Psalm 22 names that experience without minimizing it. The psalmist cries out day and night and hears nothing back. Yet this psalm is also the one that pivots in verse 22 to praise. Not because the circumstances changed — the turn happens while the suffering is still present. The movement from lament to trust is not linear. It is a spiral: lament, trust, lament again, trust again. You do not need to have the whole thing figured out to be honest with God.',
   'Are you angry at God about something right now? Tell him. He can take it. Then ask him to help you trust anyway.'),
  (3, 'Out of the Depths', 'Psalm 130:1-2',
   'Out of the depths I cry to you, O Lord! O Lord, hear my voice! Let your ears be attentive to the voice of my pleas for mercy!',
   'The depths are not a place of mild disappointment. They are the bottom — the place where you have exhausted every human option and still need a miracle. For a salesperson, the depths might be a month where you are thousands of dollars in the hole on your draw, bills are due, and you cannot see a way out. The psalmist does not offer a strategy for climbing out. He cries out. That is the whole prayer: "Out of the depths I cry to you." The faith in this moment is not confidence that things will improve. It is the simple act of directing the cry toward God instead of into the void. He hears. He is attentive. That is enough for now.',
   'What feels like "the depths" for you right now? Cry out to God from that exact place — do not try to climb out first.'),
  (4, 'My Soul Refuses to Be Comforted', 'Psalm 77:2-3',
   'In the day of my trouble I seek the Lord; in the night my hand is stretched out without wearying; my soul refuses to be comforted. When I remember God, I moan; when I meditate, my spirit faints.',
   'There are seasons when even remembering God brings pain rather than comfort. The psalmist is so distressed that thinking about God makes him moan. This is not a failure of faith; it is the honest experience of someone whose theology has not yet caught up to their suffering. On the sales floor, this might be the moment when a coworker says "God has a plan" and you want to scream. You know God has a plan. You believe it — mostly. But right now, the plan feels like it involves your failure, and that is hard to accept. The psalmist does not pretend to be fine. He brings his exhausted, comfort-refusing soul to God and leaves it there. Sometimes that is the most faithful thing you can do.',
   'Has well-meaning spiritual advice felt hollow lately? Bring your honest weariness to God without trying to make it sound faithful.'),
  (5, 'Yet I Will Rejoice', 'Psalm 42:5',
   'Why are you cast down, O my soul, and why are you in turmoil within me? Hope in God; for I shall again praise him, my salvation and my God.',
   'The psalmist talks to himself. He does not wait for circumstances to improve or for a prophetic word to arrive. He addresses his own soul: "Why are you cast down? Hope in God." This is not denial. He has spent the previous verses describing his tears, his enemies'' taunts, his sense of being forgotten by God. But then he preaches to himself. He commands his soul to hope. This is a skill that can be developed: speaking truth to your own heart when your heart is lying to you. The month may still be dying. The numbers may still be bad. But your soul can hope in God anyway — not because the situation has changed, but because God has not.',
   'What truth do you need to preach to your own soul today? Write it down. Say it out loud. Tell yourself to hope in God.')
) AS t(day_number, title, scripture_reference, scripture_text, body, application);

-- ── 3. SERVING THE CUSTOMER YOU DON'T LIKE (7 days): Luke 6, Romans 12 ───────

INSERT INTO reading_plans (slug, title, subtitle, description, day_count, is_premium)
VALUES (
  'serving-the-customer-you-dont-like',
  'Serving the Customer You Don''t Like',
  'Grace for difficult people on the lot',
  'Every salesperson encounters customers who are rude, demanding, suspicious, or just plain unpleasant. This 7-day plan from Luke 6 and Romans 12 explores what it means to show Christ-like love to the people who make it hardest.',
  7,
  true
);

WITH plan AS (SELECT id FROM reading_plans WHERE slug = 'serving-the-customer-you-dont-like')
INSERT INTO reading_plan_days (plan_id, day_number, title, scripture_reference, scripture_text, body, application)
SELECT plan.id, day_number, title, scripture_reference, scripture_text, body, application
FROM plan, (VALUES
  (1, 'Love Your Enemies', 'Luke 6:27-28',
   'But I say to you who hear, Love your enemies, do good to those who hate you, bless those who curse you, pray for those who abuse you.',
   'Jesus is not talking about hypothetical enemies. He is talking about the customer who called you a liar before you opened your mouth. The one who cursed at you over a $200 difference. The one who wasted four hours of your Saturday and bought somewhere else. Love them. Do good to them. Bless them. Pray for them. This is not natural. It is not even possible without the Spirit''s work. But it is a command, not a suggestion. Loving difficult customers does not mean letting them abuse you. It means refusing to let their behavior determine yours. It means wanting their genuine good — not just wanting them off your back. The person who treats you worst may be the person who most needs to encounter unexpected kindness.',
   'Think of the most difficult customer you have dealt with recently. Pray for them by name — not that they buy a car, but that they experience God''s goodness.'),
  (2, 'Do to Others', 'Luke 6:31',
   'And as you wish that others would do to you, do so to them.',
   'The Golden Rule is simple to understand and brutal to apply. How do you want to be treated when you are the customer? With patience. With honesty. With respect for your time and intelligence. Now apply that to the person across the desk — the one who is being unreasonable, the one who keeps you late, the one who treats you like a con artist. Jesus does not add a qualifier. He does not say "do to others as you wish they would do to you, unless they are difficult." The command stands on its own. Treat every customer the way you want to be treated when you walk onto a lot. Even the ones who do not deserve it. Especially them.',
   'The next time a difficult customer walks in, pause for three seconds and ask: "How would I want to be treated if I were them?" Then do that.'),
  (3, 'Judge Not', 'Luke 6:37',
   'Judge not, and you will not be judged; condemn not, and you will not be condemned; forgive, and you will be forgiven.',
   'It is easy to judge customers. They are dressed poorly — probably cannot afford anything. They are argumentative — probably just tire-kickers. They are rude — probably not worth your time. Jesus warns against the snap judgments that let us dismiss people before we have really seen them. The customer you write off in the first thirty seconds might be a cash buyer having a bad day. They might be a stroke of undeserved grace in your life. More importantly, they are a person made in God''s image, carrying a story you do not know. Forgive their rough edges. You have your own. The measure you use will be measured back to you — not just by God, but by the customers who sense whether you have already decided about them.',
   'Catch yourself the next time you make a snap judgment about a customer. Ask: "What do I not know about this person?"'),
  (4, 'Overcome Evil with Good', 'Romans 12:17-21',
   'Repay no one evil for evil, but give thought to do what is honorable in the sight of all... Do not be overcome by evil, but overcome evil with good.',
   'Paul gives a strategy for dealing with difficult people that is completely counterintuitive. Do not repay evil for evil. If someone is hostile, do not match their hostility. Instead, overcome their evil with your good. This is not passivity. It is active resistance — but the weapon is kindness rather than retaliation. On the sales floor, this might mean staying calm when a customer is yelling. Responding with patience when they are impatient. Following up with genuine care after they treated you poorly. You are not being weak. You are fighting a spiritual battle with spiritual weapons. Evil cannot overcome evil. Only good can.',
   'Identify one customer interaction this week where you were tempted to match hostility with hostility. Plan a different response for next time.'),
  (5, 'If Your Enemy Is Hungry', 'Romans 12:20',
   'To the contrary, if your enemy is hungry, feed him; if he is thirsty, give him something to drink; for by so doing you will heap burning coals on his head.',
   'Paul quotes Proverbs 25 and applies it to Christian conduct. "Burning coals on his head" sounds like revenge, but it is actually an image of conviction leading to repentance. Your kindness to an enemy may be the thing that breaks through their hostility. When a customer is rude and you respond with genuine warmth, it disorients them. It forces a choice: either double down on hostility (which now feels absurd) or reconsider. You are not manipulating them. You are treating them as a full human being made in God''s image, capable of being reached by kindness. The "burning coals" are the discomfort of realizing they have been treating a decent person badly.',
   'Do one unexpected act of kindness for a difficult customer this week — a follow-up call, a handwritten note, a genuine inquiry about their day.'),
  (6, 'Live in Harmony', 'Romans 12:16',
   'Live in harmony with one another. Do not be haughty, but associate with the lowly. Never be wise in your own sight.',
   'Harmony is not uniformity. You do not have to agree with a customer to treat them with dignity. Paul''s instruction has three parts: live in harmony, associate with the lowly, do not be wise in your own sight. Applied to the sales floor: seek peaceful resolution with every customer, regardless of their status; do not look down on the person with bad credit or the one driving a beater; do not assume you are smarter than the person across the desk. Arrogance closes deals sometimes, but it also closes hearts. Humility — genuine, not performative — opens doors that pride keeps locked.',
   'Check your heart for contempt toward any category of customer. Ask God to replace it with genuine respect.'),
  (7, 'Bless Those Who Persecute You', 'Romans 12:14',
   'Bless those who persecute you; bless and do not curse them.',
   'Not every difficult customer rises to the level of persecution. But some do — the ones who file false complaints, who lie about you to management, who damage your reputation. Paul says: bless them. Do not curse them. This is not a natural response. It requires supernatural grace. But when you bless someone who has wronged you, you break the cycle of retaliation. You refuse to let their sin make you sin. You entrust justice to God instead of taking it into your own hands. That frees you from the exhausting work of nursing a grudge. Blessing is not approving what they did. It is releasing them — and yourself — to God.',
   'Is there a customer or coworker you need to bless instead of curse? Pray a specific blessing over them — out loud, by name.')
) AS t(day_number, title, scripture_reference, scripture_text, body, application);

-- ── 4. MONEY WITHOUT MASTERY (7 days): Matthew 6, 1 Timothy 6 ──────────────

INSERT INTO reading_plans (slug, title, subtitle, description, day_count, is_premium)
VALUES (
  'money-without-mastery',
  'Money Without Mastery',
  'Freedom from the reign of the commission check',
  'In a commission-only world, money can become the loudest voice in your life. This 7-day plan explores what Scripture says about wealth, contentment, and the danger of letting money become your master.',
  7,
  true
);

WITH plan AS (SELECT id FROM reading_plans WHERE slug = 'money-without-mastery')
INSERT INTO reading_plan_days (plan_id, day_number, title, scripture_reference, scripture_text, body, application)
SELECT plan.id, day_number, title, scripture_reference, scripture_text, body, application
FROM plan, (VALUES
  (1, 'You Cannot Serve Two Masters', 'Matthew 6:24',
   'No one can serve two masters, for either he will hate the one and love the other, or he will be devoted to the one and despise the other. You cannot serve God and money.',
   'Jesus could not be clearer. You cannot serve both God and money. Not "you should not." Not "it is difficult." You cannot. They are rival masters with competing demands. In a commission-based career, money is not just a byproduct of your work — it is the explicit goal. The board tracks it. The managers push it. Your family''s security depends on it. But Jesus says money is a master, not a tool. If you serve it, you will eventually despise God — maybe not in words, but in the quiet choices you make every day. The alternative is not poverty. It is allegiance. Who sits on the throne of your life? If the answer is God, then money has to take a subordinate seat — even in a profession built on the chase.',
   'Do a quick audit: when you think about your work, is your first thought about serving God or about making money? Be honest.'),
  (2, 'Do Not Be Anxious', 'Matthew 6:25-26',
   'Therefore I tell you, do not be anxious about your life, what you will eat or what you will drink, nor about your body, what you will put on... Look at the birds of the air: they neither sow nor reap nor gather into barns, and yet your heavenly Father feeds them.',
   'Anxiety about money is the salesperson''s constant companion. The draw is uncertain. The next deal is never guaranteed. Jesus''s command — "do not be anxious" — feels impossible in this context. But he is not telling us to ignore reality. He is telling us to look at the birds. They do not have a pipeline. They do not track their numbers. And yet they are fed. This is not a promise that you will close every deal. It is a promise that you are more valuable to God than a bird, and if he feeds them, he will take care of you. The anxiety does not produce income. It only produces misery. Trust does not guarantee income either, but it does guarantee peace.',
   'What is the specific financial anxiety that follows you onto the floor? Bring it to God and ask: "Do I trust you with this?"'),
  (3, 'Seek First the Kingdom', 'Matthew 6:33',
   'But seek first the kingdom of God and his righteousness, and all these things will be added to you.',
   'Jesus does not say "do not seek money at all." He says seek first the Kingdom. The priority matters. When you wake up and your first thought is the board, the money has already won. When your first thought is "God, how do I serve you today on this floor?" — the day is ordered differently. The promise is not that you will get rich by being spiritual. It is that when you orient your life around God''s reign, the things you need will be provided. Maybe not the things you want. Maybe not the lifestyle you have been chasing. But what you actually need. The Kingdom-first life is not a poverty vow. It is a priority reset.',
   'Tomorrow morning, before you check your phone or the CRM, spend five minutes praying: "God, what does your Kingdom look like on this floor today?"'),
  (4, 'Godliness with Contentment', '1 Timothy 6:6-8',
   'But godliness with contentment is great gain, for we brought nothing into the world, and we cannot take anything out of the world. But if we have food and clothing, with these we will be content.',
   'Paul names "great gain" — and it is not a fat commission check. It is godliness with contentment. The combination matters. Godliness without contentment produces self-righteousness. Contentment without godliness produces complacency. Together they produce a life that is rich in the things that actually matter. Paul grounds this in mortality: you arrived with nothing, you will leave with nothing. Everything in between is temporary. That is not a depressing thought — it is a freeing one. If you cannot take it with you, then it does not define you. The car you drive, the house you own, the numbers on your W-2 — all of it stays here. What goes with you is your character, your faith, and the people you loved.',
   'If you lost everything tomorrow — job, income, possessions — what would remain? Thank God for what cannot be taken away.'),
  (5, 'The Love of Money', '1 Timothy 6:9-10',
   'But those who desire to be rich fall into temptation, into a snare, into many senseless and harmful desires that plunge people into ruin and destruction. For the love of money is a root of all kinds of evils.',
   'Notice: it is the love of money, not money itself. Money is not evil. Earning a good living is not evil. But loving money — desiring it, pursuing it as an end in itself — leads to ruin. The desire to be rich is a trap. It promises freedom and delivers bondage. It promises security and produces anxiety. It promises satisfaction and leaves you hungrier than before. On the sales floor, the love of money disguises itself as ambition, as providing for your family, as "just being competitive." But the fruit tells the truth: strained relationships, compromised integrity, the quiet dread of looking at yourself in the mirror. Ask God to show you where the love of money has taken root.',
   'Write down one way the desire for more money has negatively affected your relationships, your integrity, or your peace. Confess it.'),
  (6, 'Be Rich in Good Works', '1 Timothy 6:17-18',
   'As for the rich in this present age, charge them not to be haughty, nor to set their hopes on the uncertainty of riches, but on God, who richly provides us with everything to enjoy. They are to do good, to be rich in good works, to be generous and ready to share.',
   'Paul does not tell the rich to become poor. He tells them to be rich in a different currency: good works, generosity, readiness to share. The problem with wealth is not the number but the posture — haughtiness, misplaced hope, hoarding. The antidote is not poverty but generosity. In a commission-based career, income fluctuates wildly. A $20,000 month can be followed by a $2,000 month. Paul''s instruction is to hold wealth loosely — do not set your hope on it — and let it flow through you to others. The goal is not a certain net worth. It is being rich toward God, rich toward others, and free from the grip of money.',
   'Identify one concrete way to be generous this week — with money, time, or attention. Do it without expecting anything in return.'),
  (7, 'My God Will Supply', 'Philippians 4:19',
   'And my God will supply every need of yours according to his riches in glory in Christ Jesus.',
   'We end with a promise. Not a promise of wealth. Not a promise of a record month. A promise that God will supply every need. Not every want. Not every desire. Every need. Paul wrote this from prison, not from a comfortable office. He knew scarcity and he knew abundance, and in both he had learned contentment (Philippians 4:11-12). His security was not in his circumstances but in the God who supplies. As a salesperson, your needs may be met in ways you do not expect — through a deal you did not see coming, through unexpected help, through the discipline of learning to live on less. But they will be met. The God who did not spare his own Son will not abandon you over a car payment.',
   'Name your biggest financial fear. Then read Philippians 4:19 out loud, inserting your name: "My God will supply every need of [your name] according to his riches in glory."')
) AS t(day_number, title, scripture_reference, scripture_text, body, application);
