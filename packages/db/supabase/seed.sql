-- WEBHOOKS SEED
-- PLEASE NOTE: These webhooks are only for development purposes. Leave them as they are or add new ones.

-- These webhooks are only for development purposes.
-- In production, you should manually create webhooks in the Supabase dashboard (or create a migration to do so).
-- We don't do it because you'll need to manually add your webhook URL and secret key.

-- this webhook will be triggered after deleting an account
-- create trigger "accounts_teardown" after delete
-- on "public"."Accounts" for each row
-- execute function "supabase_functions"."http_request"(
--   'http://host.docker.internal:3000/api/db/webhook',
--   'POST',
--   '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}',
--   '{}',
--   '5000'
-- );

-- -- this webhook will be triggered after a delete on the Subscriptions table
-- -- which should happen when a user deletes their account (and all their subscriptions)
-- create trigger "subscriptions_delete" after delete
-- on "public"."Subscriptions" for each row
-- execute function "supabase_functions"."http_request"(
--   'http://host.docker.internal:3000/api/db/webhook',
--   'POST',
--   '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}',
--   '{}',
--   '5000'
-- );

-- this webhook will be triggered after every insert on the Invitations table
-- which should happen when a user invites someone to their account
-- create trigger "invitations_insert" after insert
-- on "public"."Invitations" for each row
-- execute function "supabase_functions"."http_request"(
--   'http://host.docker.internal:3000/api/db/webhook',
--   'POST',
--   '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}',
--   '{}',
--   '5000'
-- );


-- DATA SEED
-- This is a data dump for testing purposes. It should be used to seed the database with data for testing.

-- We seed the role_permissions table with the default roles and permissions
insert into public."Prompt"(
  content)
values (
  'What’s the weather outside your window doing right now? If that’s not inspiring, what’s the weather like somewhere you wish you could be?'),
(
  'How do you feel when you love someone who does not love you back?'),
(
  'Write about a ship or other vehicle that can take you somewhere different from where you are now.'),
(
  'Who’s dancing and why are they tapping those toes?'),
(
  'What’s for breakfast? Dinner? Lunch? Or maybe you could write a poem about that time you met a friend at a cafe.'),
(
  'Write about two people seeing each other for the first time.'),
(
  'Write about a rocket-ship on its way to the moon or a distant galaxy far, far, away.'),
(
  'Write something inspired by a recent dream you had.'),
(
  'Choose an animal. Write about it!'),
(
  'Write about being friends with someone.'),
(
  'Envision a dragon. Do you battle him? Or is the dragon friendly? Use descriptive language.'),
(
  'Write a story or poem that starts with the word “hello” or another greeting.'),
(
  'Write a poem or story using words from a famous letter or inspired by a letter someone sent you.'),
(
  'Read a book and circle some words on a page. Use those words to craft a poem. Alternatively, you can cut out words and phrases from magazines.'),
(
  'Create a poem, short story, or journal entry about a conversation you’ve overheard.'),
(
  'Everyone’s addicted to something in some shape or form. What are things you can’t go without?'),
(
  'Open up a dictionary to a random word. Define what that word means to you.'),
(
  'Hey, even writers and creative artists have to do housework sometimes. Write about doing laundry, dishes, and other cleaning activities.'),
(
  'Write  about someone you admire and you thought to have had a beautiful mind.'),
(
  'If you go to Craigslist, there is a “Missed Connections” section where you can find some interesting storylines to inspire your writing.'),
(
  'Write a poem or short story about someone who has lost or is about to lose their home.'),
(
  'Write about not being able to see ahead of you.'),
(
  'Write something so sweet, it makes your teeth hurt.'),
(
  'Write a poem or journal entry about numbers that have special meaning to you.'),
(
  'Write about doing something you don’t want to do.'),
(
  'What scares you a little? What do you feel when scared? How do you react?'),
(
  'What’s behind the door? Why is it closed?'),
(
  'Imagine you are someone’s shadow for a day.'),
(
  'What makes you smile? What makes you happy?'),
(
  'Write about your shopping wishlist and how you like to spend money.'),
(
  'Write about a teacher that has influenced you.'),
(
  'Take any poem or short story you enjoy. Rewrite it in your own words.'),
(
  'Write about a piece of jewelry. Who does it belong to?'),
(
  'Sit outside for about an hour. Write down the sounds you hear.'),
(
  'Write about a recent conflict that you dealt with in your life.'),
(
  'Write a poem or some phrases that would make for good wall art in your home.'),
(
  'Write about putting together the pieces of puzzles.'),
(
  'Write about building a fire.'),
(
  'Surely you drink one or the other or know someone who does- write about it!'),
(
  'Write about someone getting their driver’s license for the first time.'),
(
  'Write about a secret you’ve kept from someone else or how you feel when you know someone is keeping a secret from you.'),
(
  'Write about being inside an old abandoned warehouse.'),
(
  'Write about staying quiet when you feel like shouting.'),
(
  'Write about being insulted. How do you feel? Why do you think the other person insulted you?'),
(
  'What if you mirror started talking to you? What might the mirror say?'),
(
  'Write a poem about getting covered in mud.'),
(
  'Write about coming out of the dark and seeing the light.'),
(
  'Take inspiration from a night sky. Or, write about a time when “the stars aligned” in your horoscope.'),
(
  'What did the wall say to the other wall? Meet you at the corner! Write something inspired by a favorite joke.'),
(
  'Write about the power you felt when you told someone no.'),
(
  'The sun comes up, the sun goes down. It goes round and round. Write something inspiring about the sunrise or sunset.'),
(
  'What does Memory Lane look like? How do you get there?'),
(
  'Watch a movie that makes you cry. Write about that scene in the movie.'),
(
  'Write a poem or short story about a diary entry you’ve read or imagined.'),
(
  'The first time you held someone’s hand.'),
(
  'Write a story or journal entry influenced by a photograph you see online or in a magazine.'),
(
  'Write about waking up.'),
(
  'Write a poem or journal entry inspired by what you can’t see.'),
(
  'Write a poem about a time you really felt refreshed and renewed. Maybe it was a dip into a pool on a hot summer day, a drink of lemonade, or other situation that helped you relax and start again.'),
(
  'Write about a very fragile or delicate object.'),
(
  'Write about a time when you got stuck in between two parties fighting with each other.'),
(
  'Write about making mistakes.'),
(
  'Write about flavors and tastes or a favorite spice of yours.'),
(
  'Take a popular song off the radio and rewrite it as a poem in your own words.'),
(
  'Write about a phone call you recently received.'),
(
  'Write a poem or short story using your name in some way or form.'),
(
  'Write a poem or short story from the viewpoint of someone living in a doll house.'),
(
  'Go to Wikipedia and click on Random Article. Write about whatever the page you get.'),
(
  'Write about an extreme or silly sport. If none inspire you, make up the rules for your own game.'),
(
  'Write about a recipe for something abstract, such as a feeling.'),
(
  'Choose a famous painting and write about it.'),
(
  'Think of a place you went to when you were younger but it now no longer there or is something else. Capture your feelings about this in your writing.'),
(
  'Write a quick little poem or story about the last person you spoke with.'),
(
  'Write about being caught doing something embarrassing.'),
(
  'Write a list of questions you have for someone you would like to interview, real or fictional.'),
(
  'Write about someone you miss dearly.'),
(
  'Pick a state or country you’ve never visited. Write about why you would or would not like to visit that place.'),
(
  'Randomly point to a place on a map or globe. Do you want to go there? Why or why not?'),(
  'Turn on the radio, use the shuffle feature on your music collection or your favorite streaming music service. Write something inspired by the first song you hear.'),
(
  'Write a tribute to someone you regard as a hero.'),
(
  'Go people watching and write an ode to a stranger you see on the street.'),
(
  'Advertisements are everywhere, aren’t they? Write using the slogan or line from an ad.'),
(
  'Think of your favorite book. Now write a poem that sums up the entire story in  lines.'),
(
  'Imagine you have a touch of magic, and can make impossible things happen. What would you do?'),
(
  'Get out your favorite pen, pencils, or even colored markers and write using them!'),
(
  'Write about your daily habits and routine.'),
(
  'Write about your muse – what do they look like? What does your muse do to inspire you?'),
(
  'Write about an experience you’ve had at a gas station or convenience store.'),
(
  'Choose one of the natural wonders of the world. Write about it.'),
(
  'Write a poem using the words from your latest status update or a friend’s status update. If you don’t use sites like Facebook or Twitter, you can often search online for some funny ones to use as inspiration.'),
(
  'Write about growing something.'),
(
  'Write about an object that’s been passed through the generations in your family.'),
(
  'Write about insects.'),
(
  'Write about a magic potion. What is it made of? What does it do? What is the antidote?'),
(
  'Write something inspired by a playground or treehouse.'),
(
  'Make a list of the first  adjectives that pop into your head. Use these  words in your story, poem, or journal entry.'),
(
  'Rewrite a fairy tale. Give it a new ending or make it modern or write as a poem.'),
(
  'Write about someone who has to whisper a secret to someone else.'),
(
  'Write a poem about the things that make you smile.'),
(
  'Write about your favorite season.'),
(
  'What does normal mean to you? Is it good or bad to be normal?'),
(
  'Take something you’ve written in the past and rewrite it into a completely different piece.'),
(
  'Write about a fashion model or what’s currently in your closet or drawers.'),
(
  'Write something with a secret message hidden in between the words. For example, you could make an acrostic poem using the last letters of the word or use secret code words in the poem.'),
(
  'Write about a vacation you took.'),
(
  'Write about being overheated and sweltering.'),
(
  'Write a magic spell.'),
(
  'Write about collecting something, such as salt shakers, sea shells, or stamps.'),
(
  'Everyone takes a risk at some point in their life. Write about a time when you took a chance and what the result was.'),
(
  'Write a poem or story or journal entry inspired by a carnival or street fair.'),
(
  'Write about someone who grew up in the country visiting the city for the first time.'),
(
  'include an answer key.'),
(
  'Write about moving quickly and doing things fast.'),
(
  'Use a photo of a staircase or the stairs in your home or a building you love to inspire you.'),
(
  'Make up a story or poem about your next door neighbor.'),
(
  'Write about a time you’ve been physically hurt.'),
(
  'Choose a saint and create a poem about his or her life.'),
(
  'What’s not to write about the beach?'),
(
  'What kind of shoes do you wear? Where do they lead your feet?'),
(
  'Write a poem to someone who is estranged from you.'),
(
  'Write in the first person point of view.'),
(
  'Think of the life of a stray cat or dog and write about that.'),
(
  'Create a poem or story about something you could watch forever.'),
(
  'Describe where you sleep each night.'),
(
  'Do they inspire you or do you not like the noise and commotion? Write about it.'),
(
  'Write about a moment in your life you wish you could freeze and preserve.'),
(
  'Do you like to be alone or do you like having company?'),
(
  'Write about something you are very knowledgeable about, for example a favorite hobby or passion of yours.'),
(
  'Write about a promise you’ve made to someone. Did you keep that promise?'),
(
  'Write about being overstimulated by a lot of chaos.'),
(
  'Construct a poem or story using a news headline for your first line.'),
(
  'Write a description of an object close-up.'),
(
  'Write about taking your favorite (or least-favorite) form of transportation.'),
(
  'If you could invent a gadget, what would it do? Are there any gadgets that make your life easier?'),
(
  'Write a tacky love poem that is so cheesy, it belongs on top of a pizza.'),
(
  'Write a story or poem that uses ladders as a symbol.'),
(
  'There is a bizarre holiday for any date! Look up a holiday for today’s date and create a poem in greeting card fashion or write a short story about the holiday to celebrate.'),
(
  'Visit your favorite blog or your feedreader and craft a story, journal entry, or poem based on the latest blog post you read.'),
(
  'Create a poem, short story, or journal entry based on a recent item of mail you’ve received.'),
(
  'Write about sharing something with someone else.'),
(
  'Write from the viewpoint of a cactus. What’s it like to live in the desert or have a prickly personality?'),
(
  'Have you seen any interesting road signs lately?'),
(
  'Write about a piece of furniture in your home.'),
(
  'Write about a time you failed at something. Did you try again or give up completely?'),
(
  'Angels or other mystical creatures – use them as inspiration.'),
(
  'Write about having wings and what you would do.'),
(
  'Write a poem about being able to see-through something.'),
(
  'Record yourself speaking, then write down what you spoke and revise into a short story or poem.'),
(
  'Listen to music with a strong rhythm or listen to drum loops. Write something that goes along with the beat you feel and hear.'),
(
  'Search online for color palettes and be inspired to write by one you resonate with.'),
(
  'Randomly flip to a page in a magazine and write using the first few words you see as an opening line.'),
(
  'Write about switching the place with someone or going to where it seems the “grass is greener”.'),
(
  'Write something that would motivate others to workout and exercise.'),
(
  'a circle, a heart, a square, etc.'),
(
  'Write about your st birthday.'),
(
  'Write about scents you just absolutely love.'),
(
  'Create a poem that uses Onomatopoeia.'),
(
  'What Time is It? Write about the time of day it is right now. What are people doing? What do you usually do at this time each day?'),
(
  'Have you ever gone to a party you didn’t want to leave? Or do you hate parties? Write about it!'),
(
  'Use the words “please” and “thank you” in your writing.'),
(
  'Choose a common cliche, then write something that says the same thing but without using the catch phrase.'),
(
  'Write about going green or an environmental concern you have.'),
(
  'Write about someone you miss.'),
(
  'Think of a time when you had to let someone or something go to be free…did they come back?'),
(
  'Write about a time when you’ve felt left out or you’ve noticed someone else feeling as if they didn’t belong.'),
(
  'Write about packing for a trip or unpacking from when you arrive home.'),
(
  'Write about fairies, gnomes, elves, or other mythical creatures.'),
(
  'Write about giving and receiving.'),
(
  'Imagine the scents and sights of a bakery and write.'),
(
  'Write about your own secret treehouse hideaway.'),
(
  'Write about taking a gamble on something.'),
(
  'Choose a word and write an acrostic poem where every line starts with a letter from the word.'),
(
  'Open up the newspaper or find a crossword puzzle online and choose one of the clues to use as inspiration for your writing.'),
(
  'Write about the good that happens in a bad situation.'),
(
  'Write about a pair of gloves – what kind of gloves are they? Who wears them and why?'),
(
  'Write about a shiny object.'),
(
  'Write with a theme of envy and jealousy.'),
(
  'How Does Your Garden Grow? Write about a flower that grows in an unusual place.'),
(
  'Write a short story or poem that takes place in a courtroom.'),
(
  'Write about a gift you have given or received.'),
(
  'Write about running away from someone or something.'),
(
  'Think of something you’ve recently discovered and use it as inspiration.'),
(
  'Write about your complaints about something.'),
(
  'Write a poem or journal entry that is all about things you are thankful for.'),
(
  'Choose an element and write a poem or story that uses that word in one of the lines.'),
(
  'Write about giving someone a standing ovation.'),
(
  'Take an old poem, story, or journal entry of yours and use the last line and make it the first line of your writing today.'),
(
  'Write  about something you very much want to do.'),
(
  'Write a motivational poem or journal entry about positive traits that make you who you are.'),
(
  'What is at the end of a rainbow? Or, take a cue from Kermit the Frog, and ask yourself, why are there so many songs about rainbows?'),
(
  'What’s on the other side of this rainbow? Who’s waiting for you? Write about it!'),
(
  'Take some time to visit a nearby museum with your journal. Write about one of the pieces that speaks to you.'),
(
  'Think of your favorite cartoon or comic. Write a poem or story that takes place in that setting.'),
(
  'Borrow a line from a famous public domain poem to craft your own.'),
(
  'Imagine you could stand on a rooftop and broadcast a message to everyone below – what would you say?'),
(
  'If there was a time period you could visit for a day, where would you go? Write about traveling back in time to that day.'),
(
  'Imagine living the day as someone else.'),
(
  'Write about your favorite place in your neighborhood to visit and hang out at.'),
(
  'Write about a pirate ship.'),
(
  'Write based on a recent interview you’ve read or seen on TV or heard on the radio.'),
(
  'Write about places you like to hide things at. What was a favorite hiding spot for you as a child playing hide-and-seek?'),
(
  'Imagine how life might be different if you could change your hair color or clothing into something completely opposite from your current style.'),
(
  'Write about your feelings of empathy or compassion for another person.'),
(
  'Write a poem or story that ties in together two opposites.'),
(
  'Write about being bored or make a list of different ways to entertain yourself.'),
(
  'Think of a time when you’ve been physically or emotionally strong and use that as inspiration.'),
(
  'Write from the perspective of someone with no money to buy food.'),
(
  'Write about someone who always wants more – whether it be money, power, etc. etc.'),
(
  'Write about an eruption of a volcano.'),
(
  'Go to Vimeo.com or YouTube.com and watch one of the videos featured on the homepage. Write something based on what you watch.'),
(
  'Write about things that make you sneeze.'),
(
  'Write about the possibility of life in outer-space.'),
(
  'Write a short modern version of the story of Romeo and Juliet or think of real-life examples of lovers who are not allowed to be together to use as inspiration for your writing.'),
(
  'Choose a unique font and type out a poem, story or journal entry using that font.'),
(
  'Take a look at your calendar and use the schedule for inspiration in writing.'),
(
  'Write about a moment in your grandparent’s life.'),
(
  'Go through a magazine and cut out words that grab your attention. Use these words to construct a poem or as a story starter or inspiration for your journal.'),
(
  'Write a poem about what you do when you are alone – do you feel lonely or do you enjoy your own company?'),
(
  'Think of a waterfall you’ve seen in person or spend some time browsing photos of waterfalls online. Write about the movement, flow, and energy.'),
(
  'Write about your first kiss.'),
(
  'Write about an ironic situation you’ve been in throughout your life.'),
(
  'Write a limerick today.'),
(
  'Write about an experience at the grocery store.'),
(
  'Go through a fashion magazine or browse fashion websites online and write about a style you love.'),
(
  'Write about coming close to reaching a goal.'),
(
  'Write a poem or short story that takes place at a bar.'),
(
  'Write an ode to someone online you’ve met and become friends with.'),
(
  'Is there someone you admire? Write about those feelings.'),
(
  'Write from the perspective of a garbage collector.'),
(
  'Open your mailbox and write something inspired by one of the pieces of mail you received.'),
(
  'Write about how you feel after you take a shower.'),
(
  'Write about how you feel when you’re either at a high or low energy level for the day.'),
(
  'Make up a silly rhyming poem using made up words.'),
(
  'Use computers or a conversation with tech support you’ve had as inspiration.'),
(
  'Write from the perspective of someone who works at a hotel or staying at a hotel.'),
(
  'Write about sea creatures and under water life. What’s under the surface of the ocean? What adventures might be waiting?'),
(
  'What’s it like deep in the ocean? How did you get there?'),(
  'Take a few minutes to do some deep breathing relaxation techniques. Once your mind is clear, just write the first few things that you think of.'),
(
  'Make up a poem or story of complete lies about yourself or someone else.'),
(
  'Look at the recent obituaries online or in the newspaper and imagine the life of someone and write about that person.'),
(
  'Rummage through your pockets and write about what you keep or find in your pockets.'),
(
  'Write a cinquain poem, which consists of  lines that do not rhyme.'),
(
  'Write a poem that has every letter of the alphabet in it.'),
(
  'Write something inspired by a comedian.'),
(
  'Write about someone who is unfaithful.'),
(
  'Give a try to writing a sestina poem.'),
(
  'Write about witnessing two people get in an argument with each other.'),
(
  'Facebook, Pinterest, Google, Twitter, etc.) and write a about a post you see there.'),
(
  'Write about something peaceful and serene.'),
(
  'Go cloud watching for the day and write about what you imagine in the clouds.'),
(
  'Take some time to sit on a park bench and write about the sights, scenes, and senses and emotions you experience.'),
(
  'Write a sonnet today.'),
(
  'Write a poem or story using the words should, would, and could.'),
(
  'Write directions on how to do something.'),
(
  'Use alliteration in your poem or in a sentence in a story.'),
(
  'Write about playing a card game.'),
(
  'Set a timer for  minutes and just write. Don’t worry about it making sense or being perfect.'),
(
  'Write about a dancer or a time you remember dancing.'),
(
  'Write a poem or essay that raises awareness for a cause you support.'),
(
  'Write about a magician or magic trick.'),
(
  'Imagine finding a box. Write about opening it and what’s inside.'),
(
  'What is something has impacted you positively in your life?'),
(
  'Write from the perspective a forgotten or lost toy.'),
(
  'Write about a rock or gemstone meaning.'),
(
  'Imagine you can fast forward and rewind your life with a remote control.'),
(
  'Think of objects, animals, etc. that have symbolic meaning to you. Write about it.'),
(
  'Write about a time when you saw hope when it seemed like a hopeless situation.'),
(
  '“Where there’s smoke, there’s fire.” Use this saying as inspiration to write!'),
(
  'Write about a train and its cargo or passengers.'),
(
  'Write about words you imagine on an office clipboard.'),
(
  'Write about being stranded somewhere – an island, a bus stop, etc.'),
(
  'Use a popular quote from a speaker and use it as inspiration for your writing.'),
(
  'Create a mind map of words, phrases, and ideas that pop into your head or spend some time browsing the many mind maps online. Write a poem, story, or journal entry inspired by the mind map.'),
(
  'Write about repeating patterns that occur in life.'),
(
  'Write about finding a scrapbook and the memories it contains.'),
(
  'Write about finding a cure for an illness.'),
(
  'Read your email today and look for subject lines that may be good starters for writing inspiration.'),
(
  'Write about a wish you have.'),
(
  'Spend some time today doodling for about - minutes. Write about the thoughts you had while doodling or create something inspired by your finished doodle.'),
(
  'Imagine you are in a classroom. What does it say on the chalkboard?'),
(
  'Imagine a situation that’s very sticky, maybe even covered in maple syrup, tape or glue. Write about it!'),
(
  'Imagine going somewhere very dark with only a flashlight to guide you.'),
(
  'Envision yourself traveling to a fictional place, what do you experience in your imaginary journey?'),
(
  'Write about being in a country or rural setting.'),
(
  'Write about a promise you want to make to yourself and keep.'),
(
  'Write a poem that is about a brick wall – whether literal or figurative.'),
(
  'Write about a time when you had to make a difficult choice.'),
(
  'Write about a time when you’ve had to repeat yourself or a time when it felt like no one was listening.'),
(
  'Write about someone who is not accepted by their peers. (for example, the Ugly Ducking)'),
(
  'Write about a scary (or not-so-scary) monster in your closet or under the bed.'),
(
  'Write about something you’ve sacrificed doing to do something else or help another person.'),
(
  'Create a poem that highlights the beauty in being flawed.'),
(
  'Write a poem inspired by birthdays.'),
(
  'Make a list of potential poem or story titles and choose one to write from.'),
(
  'Write about going on a job interview.'),
(
  'Write a poem that will help someone who is sick feel better quick!'),
(
  'Write about feeling lost in the crowd.'),
(
  'Write about a health topic that interests you.'),
(
  'Write about craving something.'),
(
  'Research some common phobias, choose one, and write about it.'),
(
  'Write about living in the present moment.'),
(
  'Write about walking down a sidewalk and what you see and experience.'),
(
  'Write about an epic battle, whether real, fictional or figurative.'),
(
  'Write about an old house that is abandoned or being renovated.'),
(
  'Is there a cluttered spot in your home? Go through some of that clutter today and write about what you find or the process of organizing.'),
(
  'Write about flying a kite.'),
(
  'Flip to a random TV channel and write about the first thing that comes on – even if it is an infomercial!'),
(
  'Write an ode to your favorite fruit.'),
(
  'Write about a couple that is separated by distance.'),
(
  'Write about a pair of eyeglasses or someone wearing glasses.'),
(
  'Write about a robot.'),
(
  'Write about something you think is just adorable.'),
(
  'Use a memorable conversation from a favorite movie to inspire your writing.'),
(
  'Write  about doing something effortlessly.'),
(
  'It is raining cats and dogs)'),
(
  'Whether it is the swings or the sandbox or the sliding boards, write about your memories of being on a playground.'),
(
  'Write about romantic things partners can do for each other.'),
(
  'Imagine you are a famous rock star. Write about the experience.'),
(
  'What’s it like to live a day in the life of a rock star? Imagine your story!'),(
  'Imagine ordinary objects have come to life. Write about what they do and say.'),
(
  'Write about meeting someone on an airplane and a conversation you might have.'),
(
  'Take some time to peruse your medicine cabinet or the health and beauty aisles at a local store. Write a poem, short story, or journal entry inspired by a product label.'),
(
  'Write about not giving up.'),
(
  'Listen to some instrumental music and write a poem that matches the mood, beat, and style of the music.'),
(
  'Write about having to wait in line.'),
(
  'Do you know your personality type? (There are many free quizzes online) – write about what type of personality traits you have.'),
(
  '’s or ’s for example)'),
(
  'Write your personal credo of things you believe in.'),
(
  'Write about a lost object.'),
(
  'Write a poem or story that uses dialogue between two people.'),
(
  'Write about a letter that never made it to its recipient.'),
(
  'Write a poem about the story that is told through someone’s eyes.'),
(
  'Write about something you learned the hard way.'),
(
  'Write about where you like to go to escape from it all.'),
(
  'Write something inspired a favorite food or recipe.'),
(
  'Go through your file box and pull out old receipts or records…write something inspired by what you find!'),
(
  'Write about visiting the bank.'),
(
  'Write about trying to convince someone of something.'),
(
  'Write about something that happened by chance in a positive way.'),
(
  'Write about how it feels when you can’t focus.'),
(
  'Write about big business.'),
(
  'Go to a dictionary website that has a word of the day and use it in a poem, story or journal entry you write.'),
(
  'What do you do when you need a pick me up?'),
(
  'Write about a project you started but never completed.'),
(
  'Write about a time when someone forgave you or you forgave someone.'),
(
  'Write about your greatest weakness.'),
(
  'Write about starting a project.'),
(
  'Think of gears, moving parts, machines.'),
(
  'Write about a random act of kindness you’ve done for someone or someone has done for you, no matter how small or insignificant it may have seemed.'),
(
  'Imagine living in a home underground and use that as inspiration for writing.'),
(
  'Pick a classic rock love ballad and rewrite it into a story or poem with a similar theme.'),
(
  'Write about staying up late at night.'),
(
  'Write about attraction to something or someone.'),
(
  'Write about working with a team towards a common goal.'),
(
  'Write about the ups and downs in life.'),
(
  'Look at some motivational posters online and write a poem or journal entry inspired by your favorite one.'),
(
  'Write about the games people play – figuratively or literally.'),
(
  'Write about a point in life where things turned for the better or worse.'),
(
  'Write about a witch’s spell.'),
(
  'Write about the anniversary of a special date.'),
(
  'Be inspired by a casino or lottery ticket.'),
(
  'Write about going on a picnic.'),
(
  'Write about some random item you might find in a garage.'),
(
  'Review your week, month, or year in a journal entry or poem format.'),
(
  'Write about a detective searching for clues or solving a mystery.'),
(
  'Take your camera for a walk and write based on one of the photographs you take.'),
(
  'Write about visiting a family member or friend.'),
(
  'Write about putting trust in someone.');