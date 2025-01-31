const prompts = [
  {
    id: "cky8b014b0004bhfigahler0d",
    content:
      "What’s the weather outside your window doing right now? If that’s not inspiring, what’s the weather like somewhere you wish you could be?",
  },
  {
    id: "cky8b014b0005bhfi5qdmfkq2",
    content:
      "How do you feel when you love someone who does not love you back?",
  },
  {
    id: "cky8b014b0006bhfiawwds5n0",
    content:
      "Write about a ship or other vehicle that can take you somewhere different from where you are now.",
  },
  {
    id: "cky8b014b0007bhfifdyaczk4",
    content: "Who’s dancing and why are they tapping those toes?",
  },
  {
    id: "cky8b014b0008bhfih8tblra7",
    content:
      "What’s for breakfast? Dinner? Lunch? Or maybe you could write a poem about that time you met a friend at a cafe.",
  },
  {
    id: "cky8b014b0009bhfi470ndhj9",
    content: "Write about two people seeing each other for the first time.",
  },
  {
    id: "cky8b014b0010bhfis2qjorkx",
    content:
      "Write about a rocket-ship on its way to the moon or a distant galaxy far, far, away.",
  },
  {
    id: "cky8b014b0011bhfihrig5ugy",
    content: "Write something inspired by a recent dream you had.",
  },
  {
    id: "cky8b014b0012bhfic7ir5gr6",
    content: "Choose an animal. Write about it!",
  },
  {
    id: "cky8b014b0013bhfilng32ys8",
    content: "Write about being friends with someone.",
  },
  {
    id: "cky8b014b0014bhfik8orphrg",
    content:
      "Envision a dragon. Do you battle him? Or is the dragon friendly? Use descriptive language.",
  },
  {
    id: "cky8b014b0015bhfif7xo62ei",
    content:
      "Write a story or poem that starts with the word “hello” or another greeting.",
  },
  {
    id: "cky8b014b0016bhfi4yf9gjj9",
    content:
      "Write a poem or story using words from a famous letter or inspired by a letter someone sent you.",
  },
  {
    id: "cky8b014b0017bhfih1vdi8nn",
    content:
      "Read a book and circle some words on a page. Use those words to craft a poem. Alternatively, you can cut out words and phrases from magazines.",
  },
  {
    id: "cky8b014b0018bhfiegyxapvk",
    content:
      "Create a poem, short story, or journal entry about a conversation you’ve overheard.",
  },
  {
    id: "cky8b014b0019bhfijtwt593i",
    content:
      "Everyone’s addicted to something in some shape or form. What are things you can’t go without?",
  },
  {
    id: "cky8b014b0020bhfi5j8f3226",
    content:
      "Open up a dictionary to a random word. Define what that word means to you.",
  },
  {
    id: "cky8b014b0021bhfilucmh415",
    content:
      "Hey, even writers and creative artists have to do housework sometimes. Write about doing laundry, dishes, and other cleaning activities.",
  },
  {
    id: "cky8b014b0022bhfizrdmnj39",
    content:
      "Write  about someone you admire and you thought to have had a beautiful mind.",
  },
  {
    id: "cky8b014b0023bhfipwz20q0h",
    content:
      "If you go to Craigslist, there is a “Missed Connections” section where you can find some interesting storylines to inspire your writing.",
  },
  {
    id: "cky8b014b0024bhfi4bh58nbs",
    content:
      "Write a poem or short story about someone who has lost or is about to lose their home.",
  },
  {
    id: "cky8b014b0025bhfinaug16qk",
    content: "Write about not being able to see ahead of you.",
  },
  {
    id: "cky8b014b0026bhfinx9wvnh0",
    content: "Write something so sweet, it makes your teeth hurt.",
  },
  {
    id: "cky8b014b0027bhfif8va1rms",
    content:
      "Write a poem or journal entry about numbers that have special meaning to you.",
  },
  {
    id: "cky8b014b0028bhfi8rrecn4z",
    content: "Write about doing something you don’t want to do.",
  },
  {
    id: "cky8b014b0029bhfijkxhpyf0",
    content:
      "What scares you a little? What do you feel when scared? How do you react?",
  },
  {
    id: "cky8b014b0030bhfil2lnf07r",
    content: "What’s behind the door? Why is it closed?",
  },
  {
    id: "cky8b014b0031bhfiie7smrjt",
    content: "Imagine you are someone’s shadow for a day.",
  },
  {
    id: "cky8b014b0032bhfierrg5jtk",
    content: "What makes you smile? What makes you happy?",
  },
  {
    id: "cky8b014b0033bhfidlv1in17",
    content:
      "Write about your shopping wishlist and how you like to spend money.",
  },
  {
    id: "cky8b014b0034bhfixx2lm68x",
    content: "Write about a teacher that has influenced you.",
  },
  {
    id: "cky8b014b0035bhfig79xo8bl",
    content:
      "Take any poem or short story you enjoy. Rewrite it in your own words.",
  },
  {
    id: "cky8b014b0036bhfiobsp5g86",
    content: "Write about a piece of jewelry. Who does it belong to?",
  },
  {
    id: "cky8b014b0037bhfifq9opchm",
    content: "Sit outside for about an hour. Write down the sounds you hear.",
  },
  {
    id: "cky8b014b0038bhfib20ijj28",
    content: "Write about a recent conflict that you dealt with in your life.",
  },
  {
    id: "cky8b014b0039bhfi77u42hcc",
    content:
      "Write a poem or some phrases that would make for good wall art in your home.",
  },
  {
    id: "cky8b014b0040bhfieznmc04m",
    content: "Write about putting together the pieces of puzzles.",
  },
  {
    id: "cky8b014b0041bhfi57rel05d",
    content: "Write about building a fire.",
  },
  {
    id: "cky8b014b0042bhfiwmp1y4kr",
    content:
      "Surely you drink one or the other or know someone who does- write about it!",
  },
  {
    id: "cky8b014b0043bhfidv1gedvz",
    content:
      "Write about someone getting their driver’s license for the first time.",
  },
  {
    id: "cky8b014b0044bhfi7y0rbsah",
    content:
      "Write about a secret you’ve kept from someone else or how you feel when you know someone is keeping a secret from you.",
  },
  {
    id: "cky8b014b0045bhfi6vp7jlq4",
    content: "Write about being inside an old abandoned warehouse.",
  },
  {
    id: "cky8b014b0046bhfir1fih9ju",
    content: "Write about staying quiet when you feel like shouting.",
  },
  {
    id: "cky8b014b0047bhfio6ugu9ia",
    content:
      "Write about being insulted. How do you feel? Why do you think the other person insulted you?",
  },
  {
    id: "cky8b014b0048bhfigkayyh0l",
    content:
      "What if you mirror started talking to you? What might the mirror say?",
  },
  {
    id: "cky8b014b0049bhfimpurptgw",
    content: "Write a poem about getting covered in mud.",
  },
  {
    id: "cky8b014b0050bhfi7hknue09",
    content: "Write about coming out of the dark and seeing the light.",
  },
  {
    id: "cky8b014c0051bhfijqr4nyyv",
    content:
      "Take inspiration from a night sky. Or, write about a time when “the stars aligned” in your horoscope.",
  },
  {
    id: "cky8b014c0052bhfi60sw32pc",
    content:
      "What did the wall say to the other wall? Meet you at the corner! Write something inspired by a favorite joke.",
  },
  {
    id: "cky8b014c0053bhfi3uttjmle",
    content: "Write about the power you felt when you told someone no.",
  },
  {
    id: "cky8b014c0054bhfibap38v0h",
    content:
      "The sun comes up, the sun goes down. It goes round and round. Write something inspiring about the sunrise or sunset.",
  },
  {
    id: "cky8b014c0055bhfie4zewzg9",
    content: "What does Memory Lane look like? How do you get there?",
  },
  {
    id: "cky8b014c0056bhfidsuc5wmt",
    content:
      "Watch a movie that makes you cry. Write about that scene in the movie.",
  },
  {
    id: "cky8b014c0057bhfie0kzo7sx",
    content:
      "Write a poem or short story about a diary entry you’ve read or imagined.",
  },
  {
    id: "cky8b014c0058bhfiyq7oyvxl",
    content: "The first time you held someone’s hand.",
  },
  {
    id: "cky8b014c0059bhfi2mrjj3nl",
    content:
      "Write a story or journal entry influenced by a photograph you see online or in a magazine.",
  },
  {
    id: "cky8b014c0060bhfi45g71jz5",
    content: "Write about waking up.",
  },
  {
    id: "cky8b014c0061bhfi4mcayk4r",
    content: "Write a poem or journal entry inspired by what you can’t see.",
  },
  {
    id: "cky8b014c0062bhfiw8g4ea5c",
    content:
      "Write a poem about a time you really felt refreshed and renewed. Maybe it was a dip into a pool on a hot summer day, a drink of lemonade, or other situation that helped you relax and start again.",
  },
  {
    id: "cky8b014c0063bhfiobu08fqn",
    content: "Write about a very fragile or delicate object.",
  },
  {
    id: "cky8b014c0064bhfi3maab0wl",
    content:
      "Write about a time when you got stuck in between two parties fighting with each other.",
  },
  {
    id: "cky8b014c0065bhfifvag88bi",
    content: "Write about making mistakes.",
  },
  {
    id: "cky8b014c0066bhfi5ews1vk6",
    content: "Write about flavors and tastes or a favorite spice of yours.",
  },
  {
    id: "cky8b014c0067bhfiuhll4ank",
    content:
      "Take a popular song off the radio and rewrite it as a poem in your own words.",
  },
  {
    id: "cky8b014c0068bhfi9t741lf2",
    content: "Write about a phone call you recently received.",
  },
  {
    id: "cky8b014c0069bhfismgkxfjf",
    content: "Write a poem or short story using your name in some way or form.",
  },
  {
    id: "cky8b014c0070bhfi5bkq3c94",
    content:
      "Write a poem or short story from the viewpoint of someone living in a doll house.",
  },
  {
    id: "cky8b014c0071bhfib2p5raqg",
    content:
      "Go to Wikipedia and click on Random Article. Write about whatever the page you get.",
  },
  {
    id: "cky8b014c0072bhficpr809ev",
    content:
      "Write about an extreme or silly sport. If none inspire you, make up the rules for your own game.",
  },
  {
    id: "cky8b014c0073bhfiwb7mpt56",
    content: "Write about a recipe for something abstract, such as a feeling.",
  },
  {
    id: "cky8b014c0074bhfitytvl3gv",
    content: "Choose a famous painting and write about it.",
  },
  {
    id: "cky8b014c0075bhfiyoeb99n2",
    content:
      "Think of a place you went to when you were younger but it now no longer there or is something else. Capture your feelings about this in your writing.",
  },
  {
    id: "cky8b014c0076bhfila2cinxx",
    content:
      "Write a quick little poem or story about the last person you spoke with.",
  },
  {
    id: "cky8b014c0077bhfiqnc63r7w",
    content: "Write about being caught doing something embarrassing.",
  },
  {
    id: "cky8b014c0078bhfiaa6c8k82",
    content:
      "Write a list of questions you have for someone you would like to interview, real or fictional.",
  },
  {
    id: "cky8b014c0079bhfiqllr2tdf",
    content: "Write about someone you miss dearly.",
  },
  {
    id: "cky8b014c0080bhfi98wrnhar",
    content:
      "Pick a state or country you’ve never visited. Write about why you would or would not like to visit that place.",
  },
  {
    id: "cky8b014c0081bhfizvu16bkx",
    content:
      "Randomly point to a place on a map or globe. Do you want to go there? Why or why not?",
  },
  {
    id: "cky8b014c0082bhfihsbxnjye",
    content:
      "Turn on the radio, use the shuffle feature on your music collection or your favorite streaming music service. Write something inspired by the first song you hear.",
  },
  {
    id: "cky8b014c0083bhfih8c67mlm",
    content: "Write a tribute to someone you regard as a hero.",
  },
  {
    id: "cky8b014c0084bhfith40gvve",
    content:
      "Go people watching and write an ode to a stranger you see on the street.",
  },
  {
    id: "cky8b014c0085bhfibd50mtpb",
    content:
      "Advertisements are everywhere, aren’t they? Write using the slogan or line from an ad.",
  },
  {
    id: "cky8b014c0086bhfid4k9wpkg",
    content:
      "Think of your favorite book. Now write a poem that sums up the entire story in  lines.",
  },
  {
    id: "cky8b014c0087bhfidcjuqcb5",
    content:
      "Imagine you have a touch of magic, and can make impossible things happen. What would you do?",
  },
  {
    id: "cky8b014c0088bhfiwqvsp2h4",
    content:
      "Get out your favorite pen, pencils, or even colored markers and write using them!",
  },
  {
    id: "cky8b014c0089bhfiefyro2i7",
    content: "Write about your daily habits and routine.",
  },
  {
    id: "cky8b014c0090bhfidkhfkx1f",
    content:
      "Write about your muse – what do they look like? What does your muse do to inspire you?",
  },
  {
    id: "cky8b014c0091bhfifur0ar6x",
    content:
      "Write about an experience you’ve had at a gas station or convenience store.",
  },
  {
    id: "cky8b014c0092bhfi4tggqv7t",
    content: "Choose one of the natural wonders of the world. Write about it.",
  },
  {
    id: "cky8b014c0093bhfijrij92p7",
    content:
      "Write a poem using the words from your latest status update or a friend’s status update. If you don’t use sites like Facebook or Twitter, you can often search online for some funny ones to use as inspiration.",
  },
  {
    id: "cky8b014c0094bhfinrpmuv40",
    content: "Write about growing something.",
  },
  {
    id: "cky8b014c0095bhfiuo7s78d7",
    content:
      "Write about an object that’s been passed through the generations in your family.",
  },
  {
    id: "cky8b014c0096bhfi9rq4tnf3",
    content: "Write about insects.",
  },
  {
    id: "cky8b014c0097bhfi7aiqxlp9",
    content:
      "Write about a magic potion. What is it made of? What does it do? What is the antidote?",
  },
  {
    id: "cky8b014c0098bhfibhbp8ooo",
    content: "Write something inspired by a playground or treehouse.",
  },
  {
    id: "cky8b014c0099bhfid736t2he",
    content:
      "Make a list of the first  adjectives that pop into your head. Use these  words in your story, poem, or journal entry.",
  },
  {
    id: "cky8b014c0100bhfi3klm7do3",
    content:
      "Rewrite a fairy tale. Give it a new ending or make it modern or write as a poem.",
  },
  {
    id: "cky8b014c0101bhfi9ubtloz9",
    content: "Write about someone who has to whisper a secret to someone else.",
  },
  {
    id: "cky8b014c0102bhfiogxfgy0b",
    content: "Write a poem about the things that make you smile.",
  },
  {
    id: "cky8b014c0103bhfitvqkdf26",
    content: "Write about your favorite season.",
  },
  {
    id: "cky8b014c0104bhfi187tjpc2",
    content: "What does normal mean to you? Is it good or bad to be normal?",
  },
  {
    id: "cky8b014c0105bhfir7lk383e",
    content:
      "Take something you’ve written in the past and rewrite it into a completely different piece.",
  },
  {
    id: "cky8b014c0106bhfi44q54tce",
    content:
      "Write about a fashion model or what’s currently in your closet or drawers.",
  },
  {
    id: "cky8b014c0107bhfiw090ht1b",
    content:
      "Write something with a secret message hidden in between the words. For example, you could make an acrostic poem using the last letters of the word or use secret code words in the poem.",
  },
  {
    id: "cky8b014c0108bhfiu2ipkv1t",
    content: "Write about a vacation you took.",
  },
  {
    id: "cky8b014c0109bhfi8ko9avzr",
    content: "Write about being overheated and sweltering.",
  },
  {
    id: "cky8b014c0110bhfixv58st4t",
    content: "Write a magic spell.",
  },
  {
    id: "cky8b014c0111bhfi3b4jnwrl",
    content:
      "Write about collecting something, such as salt shakers, sea shells, or stamps.",
  },
  {
    id: "cky8b014c0112bhfii036qx3i",
    content:
      "Everyone takes a risk at some point in their life. Write about a time when you took a chance and what the result was.",
  },
  {
    id: "cky8b014c0113bhfi0gcd1ew9",
    content:
      "Write a poem or story or journal entry inspired by a carnival or street fair.",
  },
  {
    id: "cky8b014c0114bhfi8knt5b55",
    content:
      "Write about someone who grew up in the country visiting the city for the first time.",
  },
  {
    id: "cky8b014c0115bhfiiinjod6g",
    content: "include an answer key.",
  },
  {
    id: "cky8b014c0116bhfi6u2j5quz",
    content: "Write about moving quickly and doing things fast.",
  },
  {
    id: "cky8b014c0117bhfijbg2jt77",
    content:
      "Use a photo of a staircase or the stairs in your home or a building you love to inspire you.",
  },
  {
    id: "cky8b014c0118bhfinvm4eaaf",
    content: "Make up a story or poem about your next door neighbor.",
  },
  {
    id: "cky8b014c0119bhfifzmpggt2",
    content: "Write about a time you’ve been physically hurt.",
  },
  {
    id: "cky8b014c0120bhfiocvr5398",
    content: "Choose a saint and create a poem about his or her life.",
  },
  {
    id: "cky8b014c0121bhfihiegxizj",
    content: "What’s not to write about the beach?",
  },
  {
    id: "cky8b014c0122bhfimp8j8xl1",
    content: "What kind of shoes do you wear? Where do they lead your feet?",
  },
  {
    id: "cky8b014c0123bhfisy3s482r",
    content: "Write a poem to someone who is estranged from you.",
  },
  {
    id: "cky8b014c0124bhfi2lnxc2pf",
    content: "Write in the first person point of view.",
  },
  {
    id: "cky8b014c0125bhfin46isnfh",
    content: "Think of the life of a stray cat or dog and write about that.",
  },
  {
    id: "cky8b014c0126bhfihvovnm48",
    content: "Create a poem or story about something you could watch forever.",
  },
  {
    id: "cky8b014c0127bhfi79r99r1s",
    content: "Describe where you sleep each night.",
  },
  {
    id: "cky8b014c0128bhfiom7vucoy",
    content:
      "Do they inspire you or do you not like the noise and commotion? Write about it.",
  },
  {
    id: "cky8b014c0129bhfiq1ul2t4z",
    content:
      "Write about a moment in your life you wish you could freeze and preserve.",
  },
  {
    id: "cky8b014c0130bhfitdeuhmn2",
    content: "Do you like to be alone or do you like having company?",
  },
  {
    id: "cky8b014c0131bhfibl6hoaoe",
    content:
      "Write about something you are very knowledgeable about, for example a favorite hobby or passion of yours.",
  },
  {
    id: "cky8b014c0132bhfifwwtjx6r",
    content:
      "Write about a promise you’ve made to someone. Did you keep that promise?",
  },
  {
    id: "cky8b014c0133bhfiwzual7vf",
    content: "Write about being overstimulated by a lot of chaos.",
  },
  {
    id: "cky8b014c0134bhfir6cx7ui5",
    content:
      "Construct a poem or story using a news headline for your first line.",
  },
  {
    id: "cky8b014c0135bhfic2o6l0sk",
    content: "Write a description of an object close-up.",
  },
  {
    id: "cky8b014c0136bhfi9oinrarv",
    content:
      "Write about taking your favorite (or least-favorite) form of transportation.",
  },
  {
    id: "cky8b014c0137bhfiq1mkgti2",
    content:
      "If you could invent a gadget, what would it do? Are there any gadgets that make your life easier?",
  },
  {
    id: "cky8b014c0138bhfijj3j3565",
    content:
      "Write a tacky love poem that is so cheesy, it belongs on top of a pizza.",
  },
  {
    id: "cky8b014c0139bhficz0w5fuf",
    content: "Write a story or poem that uses ladders as a symbol.",
  },
  {
    id: "cky8b014c0140bhfif9rnzx3a",
    content:
      "There is a bizarre holiday for any date! Look up a holiday for today’s date and create a poem in greeting card fashion or write a short story about the holiday to celebrate.",
  },
  {
    id: "cky8b014c0141bhfiyqyq9mym",
    content:
      "Visit your favorite blog or your feedreader and craft a story, journal entry, or poem based on the latest blog post you read.",
  },
  {
    id: "cky8b014c0142bhfit5pgw2et",
    content:
      "Create a poem, short story, or journal entry based on a recent item of mail you’ve received.",
  },
  {
    id: "cky8b014c0143bhfinorgnccx",
    content: "Write about sharing something with someone else.",
  },
  {
    id: "cky8b014c0144bhficpo1vmkk",
    content:
      "Write from the viewpoint of a cactus. What’s it like to live in the desert or have a prickly personality?",
  },
  {
    id: "cky8b014c0145bhfilzjor1l3",
    content: "Have you seen any interesting road signs lately?",
  },
  {
    id: "cky8b014c0146bhfif11yqy13",
    content: "Write about a piece of furniture in your home.",
  },
  {
    id: "cky8b014c0147bhfipfefyg1x",
    content:
      "Write about a time you failed at something. Did you try again or give up completely?",
  },
  {
    id: "cky8b014c0148bhfiid4tn7l0",
    content: "Angels or other mystical creatures – use them as inspiration.",
  },
  {
    id: "cky8b014c0149bhfiutyvwpnl",
    content: "Write about having wings and what you would do.",
  },
  {
    id: "cky8b014c0150bhfi4bvsmo1f",
    content: "Write a poem about being able to see-through something.",
  },
  {
    id: "cky8b014c0151bhfi13gddgig",
    content:
      "Record yourself speaking, then write down what you spoke and revise into a short story or poem.",
  },
  {
    id: "cky8b014c0152bhfixci4fqbo",
    content:
      "Listen to music with a strong rhythm or listen to drum loops. Write something that goes along with the beat you feel and hear.",
  },
  {
    id: "cky8b014c0153bhfiuuy6avpq",
    content:
      "Search online for color palettes and be inspired to write by one you resonate with.",
  },
  {
    id: "cky8b014c0154bhfiktazuwfi",
    content:
      "Randomly flip to a page in a magazine and write using the first few words you see as an opening line.",
  },
  {
    id: "cky8b014c0155bhfikeys99gv",
    content:
      "Write about switching the place with someone or going to where it seems the “grass is greener”.",
  },
  {
    id: "cky8b014c0156bhfi4i2iq2wz",
    content:
      "Write something that would motivate others to workout and exercise.",
  },
  {
    id: "cky8b014c0157bhfig6ic39iy",
    content: "a circle, a heart, a square, etc.",
  },
  {
    id: "cky8b014c0158bhfi0vvwgcul",
    content: "Write about your st birthday.",
  },
  {
    id: "cky8b014c0159bhfivm08x6cn",
    content: "Write about scents you just absolutely love.",
  },
  {
    id: "cky8b014c0160bhfigtg9v68t",
    content: "Create a poem that uses Onomatopoeia.",
  },
  {
    id: "cky8b014c0161bhfihgbmk1tn",
    content:
      "What Time is It? Write about the time of day it is right now. What are people doing? What do you usually do at this time each day?",
  },
  {
    id: "cky8b014c0162bhfi05r7nstq",
    content:
      "Have you ever gone to a party you didn’t want to leave? Or do you hate parties? Write about it!",
  },
  {
    id: "cky8b014c0163bhfiqe8i753k",
    content: "Use the words “please” and “thank you” in your writing.",
  },
  {
    id: "cky8b014c0164bhfixx6li9he",
    content:
      "Choose a common cliche, then write something that says the same thing but without using the catch phrase.",
  },
  {
    id: "cky8b014c0165bhfitvwocn2r",
    content: "Write about going green or an environmental concern you have.",
  },
  {
    id: "cky8b014c0166bhfilokrtkfq",
    content: "Write about someone you miss.",
  },
  {
    id: "cky8b014c0167bhfiir4gc0to",
    content:
      "Think of a time when you had to let someone or something go to be free…did they come back?",
  },
  {
    id: "cky8b014c0168bhfi1zskzah0",
    content:
      "Write about a time when you’ve felt left out or you’ve noticed someone else feeling as if they didn’t belong.",
  },
  {
    id: "cky8b014c0169bhfik40eycj5",
    content:
      "Write about packing for a trip or unpacking from when you arrive home.",
  },
  {
    id: "cky8b014c0170bhfi1na7fis7",
    content: "Write about fairies, gnomes, elves, or other mythical creatures.",
  },
  {
    id: "cky8b014c0171bhfi8e8zbbda",
    content: "Write about giving and receiving.",
  },
  {
    id: "cky8b014c0172bhfixbhlifg4",
    content: "Imagine the scents and sights of a bakery and write.",
  },
  {
    id: "cky8b014c0173bhfi7i6lm2pi",
    content: "Write about your own secret treehouse hideaway.",
  },
  {
    id: "cky8b014c0174bhfikqcodgmq",
    content: "Write about taking a gamble on something.",
  },
  {
    id: "cky8b014c0175bhfi02iw1jtg",
    content:
      "Choose a word and write an acrostic poem where every line starts with a letter from the word.",
  },
  {
    id: "cky8b014c0176bhfic0rf5dei",
    content:
      "Open up the newspaper or find a crossword puzzle online and choose one of the clues to use as inspiration for your writing.",
  },
  {
    id: "cky8b014c0177bhfiz1v42eao",
    content: "Write about the good that happens in a bad situation.",
  },
  {
    id: "cky8b014c0178bhfi2vbich9p",
    content:
      "Write about a pair of gloves – what kind of gloves are they? Who wears them and why?",
  },
  {
    id: "cky8b014c0179bhfij65wklqm",
    content: "Write about a shiny object.",
  },
  {
    id: "cky8b014c0180bhfiuibyyxha",
    content: "Write with a theme of envy and jealousy.",
  },
  {
    id: "cky8b014c0181bhfiecvqqbuv",
    content:
      "How Does Your Garden Grow? Write about a flower that grows in an unusual place.",
  },
  {
    id: "cky8b014c0182bhfibywizyyk",
    content: "Write a short story or poem that takes place in a courtroom.",
  },
  {
    id: "cky8b014c0183bhfismm6sz8r",
    content: "Write about a gift you have given or received.",
  },
  {
    id: "cky8b014c0184bhfi6nk2qjjs",
    content: "Write about running away from someone or something.",
  },
  {
    id: "cky8b014c0185bhfisu7vs6wq",
    content:
      "Think of something you’ve recently discovered and use it as inspiration.",
  },
  {
    id: "cky8b014c0186bhfi52zfk3hx",
    content: "Write about your complaints about something.",
  },
  {
    id: "cky8b014c0187bhfi2xkujqlp",
    content:
      "Write a poem or journal entry that is all about things you are thankful for.",
  },
  {
    id: "cky8b014c0188bhfip2dzr0zq",
    content:
      "Choose an element and write a poem or story that uses that word in one of the lines.",
  },
  {
    id: "cky8b014d0189bhfi2iw0s8xi",
    content: "Write about giving someone a standing ovation.",
  },
  {
    id: "cky8b014d0190bhfi1341b96b",
    content:
      "Take an old poem, story, or journal entry of yours and use the last line and make it the first line of your writing today.",
  },
  {
    id: "cky8b014d0191bhfio9gej8os",
    content: "Write  about something you very much want to do.",
  },
  {
    id: "cky8b014d0192bhfibp3kdnkh",
    content:
      "Write a motivational poem or journal entry about positive traits that make you who you are.",
  },
  {
    id: "cky8b014d0193bhfip5rfo8so",
    content:
      "What is at the end of a rainbow? Or, take a cue from Kermit the Frog, and ask yourself, why are there so many songs about rainbows?",
  },
  {
    id: "cky8b014d0194bhfit35ljegg",
    content:
      "What’s on the other side of this rainbow? Who’s waiting for you? Write about it!",
  },
  {
    id: "cky8b014d0195bhfi7530gss9",
    content:
      "Take some time to visit a nearby museum with your journal. Write about one of the pieces that speaks to you.",
  },
  {
    id: "cky8b014d0196bhfimsy0dc9y",
    content:
      "Think of your favorite cartoon or comic. Write a poem or story that takes place in that setting.",
  },
  {
    id: "cky8b014d0197bhfi929l4h6x",
    content:
      "Borrow a line from a famous public domain poem to craft your own.",
  },
  {
    id: "cky8b014d0198bhfisznqe8cm",
    content:
      "Imagine you could stand on a rooftop and broadcast a message to everyone below – what would you say?",
  },
  {
    id: "cky8b014d0199bhfilujmctn4",
    content:
      "If there was a time period you could visit for a day, where would you go? Write about traveling back in time to that day.",
  },
  {
    id: "cky8b014d0200bhfis9s7a7o5",
    content: "Imagine living the day as someone else.",
  },
  {
    id: "cky8b014d0201bhfiipgftyor",
    content:
      "Write about your favorite place in your neighborhood to visit and hang out at.",
  },
  {
    id: "cky8b014d0202bhfi9223uqir",
    content: "Write about a pirate ship.",
  },
  {
    id: "cky8b014d0203bhfitxf7b35p",
    content:
      "Write based on a recent interview you’ve read or seen on TV or heard on the radio.",
  },
  {
    id: "cky8b014d0204bhfir87a7g2b",
    content:
      "Write about places you like to hide things at. What was a favorite hiding spot for you as a child playing hide-and-seek?",
  },
  {
    id: "cky8b014d0205bhfidfk45w5k",
    content:
      "Imagine how life might be different if you could change your hair color or clothing into something completely opposite from your current style.",
  },
  {
    id: "cky8b014d0206bhfil9sd0i2i",
    content:
      "Write about your feelings of empathy or compassion for another person.",
  },
  {
    id: "cky8b014d0207bhfipr31lz9c",
    content: "Write a poem or story that ties in together two opposites.",
  },
  {
    id: "cky8b014d0208bhfivvqun7ay",
    content:
      "Write about being bored or make a list of different ways to entertain yourself.",
  },
  {
    id: "cky8b014d0209bhfi6ggy2xty",
    content:
      "Think of a time when you’ve been physically or emotionally strong and use that as inspiration.",
  },
  {
    id: "cky8b014d0210bhfi61y0envh",
    content: "Write from the perspective of someone with no money to buy food.",
  },
  {
    id: "cky8b014d0211bhfikugf43xl",
    content:
      "Write about someone who always wants more – whether it be money, power, etc. etc.",
  },
  {
    id: "cky8b014d0212bhfijoqw0v6k",
    content: "Write about an eruption of a volcano.",
  },
  {
    id: "cky8b014d0213bhfio4vuxggg",
    content:
      "Go to Vimeo.com or YouTube.com and watch one of the videos featured on the homepage. Write something based on what you watch.",
  },
  {
    id: "cky8b014d0214bhfi5z0dyke1",
    content: "Write about things that make you sneeze.",
  },
  {
    id: "cky8b014d0215bhfi2blyw507",
    content: "Write about the possibility of life in outer-space.",
  },
  {
    id: "cky8b014d0216bhfixxq6dij0",
    content:
      "Write a short modern version of the story of Romeo and Juliet or think of real-life examples of lovers who are not allowed to be together to use as inspiration for your writing.",
  },
  {
    id: "cky8b014d0217bhfi7cznmgg5",
    content:
      "Choose a unique font and type out a poem, story or journal entry using that font.",
  },
  {
    id: "cky8b014d0218bhfis7ktwdqk",
    content:
      "Take a look at your calendar and use the schedule for inspiration in writing.",
  },
  {
    id: "cky8b014d0219bhfif4eg4ojf",
    content: "Write about a moment in your grandparent’s life.",
  },
  {
    id: "cky8b014d0220bhfibnqwtyqi",
    content:
      "Go through a magazine and cut out words that grab your attention. Use these words to construct a poem or as a story starter or inspiration for your journal.",
  },
  {
    id: "cky8b014d0221bhfiouzgl7ku",
    content:
      "Write a poem about what you do when you are alone – do you feel lonely or do you enjoy your own company?",
  },
  {
    id: "cky8b014d0222bhfioiixszvz",
    content:
      "Think of a waterfall you’ve seen in person or spend some time browsing photos of waterfalls online. Write about the movement, flow, and energy.",
  },
  {
    id: "cky8b014d0223bhfi39sfbp8y",
    content: "Write about your first kiss.",
  },
  {
    id: "cky8b014d0224bhfi8hblg9ng",
    content:
      "Write about an ironic situation you’ve been in throughout your life.",
  },
  {
    id: "cky8b014d0225bhfini5ustd2",
    content: "Write a limerick today.",
  },
  {
    id: "cky8b014d0226bhfixk0mvdiq",
    content: "Write about an experience at the grocery store.",
  },
  {
    id: "cky8b014d0227bhfiiytvg24h",
    content:
      "Go through a fashion magazine or browse fashion websites online and write about a style you love.",
  },
  {
    id: "cky8b014d0228bhfitiwduhtg",
    content: "Write about coming close to reaching a goal.",
  },
  {
    id: "cky8b014d0229bhfi9fqon050",
    content: "Write a poem or short story that takes place at a bar.",
  },
  {
    id: "cky8b014d0230bhfi3k2ect77",
    content:
      "Write an ode to someone online you’ve met and become friends with.",
  },
  {
    id: "cky8b014d0231bhfi9vvaw9ay",
    content: "Is there someone you admire? Write about those feelings.",
  },
  {
    id: "cky8b014d0232bhfi7kkc4l1f",
    content: "Write from the perspective of a garbage collector.",
  },
  {
    id: "cky8b014d0233bhfiuv3mysux",
    content:
      "Open your mailbox and write something inspired by one of the pieces of mail you received.",
  },
  {
    id: "cky8b014d0234bhfie7j7jlit",
    content: "Write about how you feel after you take a shower.",
  },
  {
    id: "cky8b014d0235bhfisvap45z0",
    content:
      "Write about how you feel when you’re either at a high or low energy level for the day.",
  },
  {
    id: "cky8b014d0236bhfi3pipl8yc",
    content: "Make up a silly rhyming poem using made up words.",
  },
  {
    id: "cky8b014d0237bhfif4ux6qs0",
    content:
      "Use computers or a conversation with tech support you’ve had as inspiration.",
  },
  {
    id: "cky8b014d0238bhfimm5zd637",
    content:
      "Write from the perspective of someone who works at a hotel or staying at a hotel.",
  },
  {
    id: "cky8b014d0239bhfi56g2wyut",
    content:
      "Write about sea creatures and under water life. What’s under the surface of the ocean? What adventures might be waiting?",
  },
  {
    id: "cky8b014d0240bhfi4aggi1m7",
    content: "What’s it like deep in the ocean? How did you get there?",
  },
  {
    id: "cky8b014d0241bhfiykjs1zmd",
    content:
      "Take a few minutes to do some deep breathing relaxation techniques. Once your mind is clear, just write the first few things that you think of.",
  },
  {
    id: "cky8b014d0242bhfi8ys49e8i",
    content:
      "Make up a poem or story of complete lies about yourself or someone else.",
  },
  {
    id: "cky8b014d0243bhfidwvwh5qg",
    content:
      "Look at the recent obituaries online or in the newspaper and imagine the life of someone and write about that person.",
  },
  {
    id: "cky8b014d0244bhfirnyrw97j",
    content:
      "Rummage through your pockets and write about what you keep or find in your pockets.",
  },
  {
    id: "cky8b014d0245bhfigm6qmge2",
    content:
      "Write a cinquain poem, which consists of  lines that do not rhyme.",
  },
  {
    id: "cky8b014d0246bhfipvsjkhf4",
    content: "Write a poem that has every letter of the alphabet in it.",
  },
  {
    id: "cky8b014d0247bhfiz5j1hp7v",
    content: "Write something inspired by a comedian.",
  },
  {
    id: "cky8b014d0248bhfip4asaf0f",
    content: "Write about someone who is unfaithful.",
  },
  {
    id: "cky8b014d0249bhfi2w3pzmc8",
    content: "Give a try to writing a sestina poem.",
  },
  {
    id: "cky8b014d0250bhfifgyrsk33",
    content:
      "Write about witnessing two people get in an argument with each other.",
  },
  {
    id: "cky8b014d0251bhfimkb6i97c",
    content:
      "Facebook, Pinterest, Google, Twitter, etc.) and write a about a post you see there.",
  },
  {
    id: "cky8b014d0252bhfimqcorynd",
    content: "Write about something peaceful and serene.",
  },
  {
    id: "cky8b014d0253bhfiv5fzrhqe",
    content:
      "Go cloud watching for the day and write about what you imagine in the clouds.",
  },
  {
    id: "cky8b014d0254bhfim2mi8n1z",
    content:
      "Take some time to sit on a park bench and write about the sights, scenes, and senses and emotions you experience.",
  },
  {
    id: "cky8b014d0255bhfif7ltiea0",
    content: "Write a sonnet today.",
  },
  {
    id: "cky8b014d0256bhfiheuji9ti",
    content: "Write a poem or story using the words should, would, and could.",
  },
  {
    id: "cky8b014d0257bhfibhiwudr3",
    content: "Write directions on how to do something.",
  },
  {
    id: "cky8b014d0258bhfiwyval6qh",
    content: "Use alliteration in your poem or in a sentence in a story.",
  },
  {
    id: "cky8b014d0259bhfitbtald9r",
    content: "Write about playing a card game.",
  },
  {
    id: "cky8b014d0260bhfidgkqoyre",
    content:
      "Set a timer for  minutes and just write. Don’t worry about it making sense or being perfect.",
  },
  {
    id: "cky8b014d0261bhfij5icfvpf",
    content: "Write about a dancer or a time you remember dancing.",
  },
  {
    id: "cky8b014d0262bhfimfauktzn",
    content:
      "Write a poem or essay that raises awareness for a cause you support.",
  },
  {
    id: "cky8b014d0263bhfig8dio2zs",
    content: "Write about a magician or magic trick.",
  },
  {
    id: "cky8b014d0264bhfiom3vcifl",
    content: "Imagine finding a box. Write about opening it and what’s inside.",
  },
  {
    id: "cky8b014d0265bhfizbuc2mya",
    content: "What is something has impacted you positively in your life?",
  },
  {
    id: "cky8b014d0266bhfilsz25lsm",
    content: "Write from the perspective a forgotten or lost toy.",
  },
  {
    id: "cky8b014d0267bhfiuyww9quo",
    content: "Write about a rock or gemstone meaning.",
  },
  {
    id: "cky8b014d0268bhfincvprpia",
    content:
      "Imagine you can fast forward and rewind your life with a remote control.",
  },
  {
    id: "cky8b014d0269bhfij0kixwx6",
    content:
      "Think of objects, animals, etc. that have symbolic meaning to you. Write about it.",
  },
  {
    id: "cky8b014d0270bhfisq9iphaf",
    content:
      "Write about a time when you saw hope when it seemed like a hopeless situation.",
  },
  {
    id: "cky8b014d0271bhfi20s6tr3a",
    content:
      "“Where there’s smoke, there’s fire.” Use this saying as inspiration to write!",
  },
  {
    id: "cky8b014d0272bhfiuqgxy2br",
    content: "Write about a train and its cargo or passengers.",
  },
  {
    id: "cky8b014d0273bhfir4e4bzdu",
    content: "Write about words you imagine on an office clipboard.",
  },
  {
    id: "cky8b014d0274bhfispgl419v",
    content:
      "Write about being stranded somewhere – an island, a bus stop, etc.",
  },
  {
    id: "cky8b014d0275bhfiusgwake2",
    content:
      "Use a popular quote from a speaker and use it as inspiration for your writing.",
  },
  {
    id: "cky8b014d0276bhfiboua8p0m",
    content:
      "Create a mind map of words, phrases, and ideas that pop into your head or spend some time browsing the many mind maps online. Write a poem, story, or journal entry inspired by the mind map.",
  },
  {
    id: "cky8b014d0277bhfige22y0t8",
    content: "Write about repeating patterns that occur in life.",
  },
  {
    id: "cky8b014d0278bhfi27vq0ewr",
    content: "Write about finding a scrapbook and the memories it contains.",
  },
  {
    id: "cky8b014d0279bhfi1tlfepya",
    content: "Write about finding a cure for an illness.",
  },
  {
    id: "cky8b014d0280bhfikjiswmj8",
    content:
      "Read your email today and look for subject lines that may be good starters for writing inspiration.",
  },
  {
    id: "cky8b014d0281bhfizeb1jevt",
    content: "Write about a wish you have.",
  },
  {
    id: "cky8b014d0282bhfijq0qwo6u",
    content:
      "Spend some time today doodling for about - minutes. Write about the thoughts you had while doodling or create something inspired by your finished doodle.",
  },
  {
    id: "cky8b014d0283bhfitk7oly8l",
    content:
      "Imagine you are in a classroom. What does it say on the chalkboard?",
  },
  {
    id: "cky8b014d0284bhfie4bouhww",
    content:
      "Imagine a situation that’s very sticky, maybe even covered in maple syrup, tape or glue. Write about it!",
  },
  {
    id: "cky8b014d0285bhfi9q7oku1h",
    content:
      "Imagine going somewhere very dark with only a flashlight to guide you.",
  },
  {
    id: "cky8b014d0286bhfiushwq3ld",
    content:
      "Envision yourself traveling to a fictional place, what do you experience in your imaginary journey?",
  },
  {
    id: "cky8b014d0287bhfilwg2fy2l",
    content: "Write about being in a country or rural setting.",
  },
  {
    id: "cky8b014d0288bhfi3e8vk4x0",
    content: "Write about a promise you want to make to yourself and keep.",
  },
  {
    id: "cky8b014d0289bhfiwfge2t1b",
    content:
      "Write a poem that is about a brick wall – whether literal or figurative.",
  },
  {
    id: "cky8b014d0290bhfil6n388eh",
    content: "Write about a time when you had to make a difficult choice.",
  },
  {
    id: "cky8b014d0291bhfic37livih",
    content:
      "Write about a time when you’ve had to repeat yourself or a time when it felt like no one was listening.",
  },
  {
    id: "cky8b014d0292bhfiweuhdtdp",
    content:
      "Write about someone who is not accepted by their peers. (for example, the Ugly Ducking)",
  },
  {
    id: "cky8b014d0293bhfixno07xmk",
    content:
      "Write about a scary (or not-so-scary) monster in your closet or under the bed.",
  },
  {
    id: "cky8b014d0294bhfiooj0wl2w",
    content:
      "Write about something you’ve sacrificed doing to do something else or help another person.",
  },
  {
    id: "cky8b014d0295bhfi1bqw4kk5",
    content: "Create a poem that highlights the beauty in being flawed.",
  },
  {
    id: "cky8b014d0296bhfiqrdjaqh0",
    content: "Write a poem inspired by birthdays.",
  },
  {
    id: "cky8b014d0297bhfi76assfyw",
    content:
      "Make a list of potential poem or story titles and choose one to write from.",
  },
  {
    id: "cky8b014d0298bhfi4v0bxj5n",
    content: "Write about going on a job interview.",
  },
  {
    id: "cky8b014d0299bhfix6rznmar",
    content:
      "Write a poem that will help someone who is sick feel better quick!",
  },
  {
    id: "cky8b014d0300bhfi37wixkxo",
    content: "Write about feeling lost in the crowd.",
  },
  {
    id: "cky8b014d0301bhfizi97e5of",
    content: "Write about a health topic that interests you.",
  },
  {
    id: "cky8b014d0302bhfiwv26e037",
    content: "Write about craving something.",
  },
  {
    id: "cky8b014d0303bhfieymjn7sk",
    content: "Research some common phobias, choose one, and write about it.",
  },
  {
    id: "cky8b014d0304bhfiuxnqcvy9",
    content: "Write about living in the present moment.",
  },
  {
    id: "cky8b014d0305bhfiq6jtakas",
    content:
      "Write about walking down a sidewalk and what you see and experience.",
  },
  {
    id: "cky8b014d0306bhfim91e0ng9",
    content:
      "Write about an epic battle, whether real, fictional or figurative.",
  },
  {
    id: "cky8b014d0307bhfip0mixvej",
    content: "Write about an old house that is abandoned or being renovated.",
  },
  {
    id: "cky8b014d0308bhfilod25179",
    content:
      "Is there a cluttered spot in your home? Go through some of that clutter today and write about what you find or the process of organizing.",
  },
  {
    id: "cky8b014d0309bhfivrt0svex",
    content: "Write about flying a kite.",
  },
  {
    id: "cky8b014d0310bhfib2689eam",
    content:
      "Flip to a random TV channel and write about the first thing that comes on – even if it is an infomercial!",
  },
  {
    id: "cky8b014d0311bhfi69bzjsqz",
    content: "Write an ode to your favorite fruit.",
  },
  {
    id: "cky8b014d0312bhfijz8e5j2g",
    content: "Write about a couple that is separated by distance.",
  },
  {
    id: "cky8b014d0313bhfi810pk146",
    content: "Write about a pair of eyeglasses or someone wearing glasses.",
  },
  {
    id: "cky8b014d0314bhfip4nmr6nj",
    content: "Write about a robot.",
  },
  {
    id: "cky8b014d0315bhfih1x41ls9",
    content: "Write about something you think is just adorable.",
  },
  {
    id: "cky8b014d0316bhfioajx8ld4",
    content:
      "Use a memorable conversation from a favorite movie to inspire your writing.",
  },
  {
    id: "cky8b014d0317bhfi1vbxlwws",
    content: "Write  about doing something effortlessly.",
  },
  {
    id: "cky8b014d0318bhfi2tkjfnsd",
    content: "It is raining cats and dogs)",
  },
  {
    id: "cky8b014d0319bhfi56344udj",
    content:
      "Whether it is the swings or the sandbox or the sliding boards, write about your memories of being on a playground.",
  },
  {
    id: "cky8b014d0320bhfiftnk1wda",
    content: "Write about romantic things partners can do for each other.",
  },
  {
    id: "cky8b014d0321bhfipsygeq37",
    content: "Imagine you are a famous rock star. Write about the experience.",
  },
  {
    id: "cky8b014d0322bhfixt5qzviq",
    content:
      "What’s it like to live a day in the life of a rock star? Imagine your story!",
  },
  {
    id: "cky8b014d0323bhfiu95b262m",
    content:
      "Imagine ordinary objects have come to life. Write about what they do and say.",
  },
  {
    id: "cky8b014d0324bhfiza5rjhi7",
    content:
      "Write about meeting someone on an airplane and a conversation you might have.",
  },
  {
    id: "cky8b014d0325bhfifm9hfusb",
    content:
      "Take some time to peruse your medicine cabinet or the health and beauty aisles at a local store. Write a poem, short story, or journal entry inspired by a product label.",
  },
  {
    id: "cky8b014d0326bhfi7t65pqzs",
    content: "Write about not giving up.",
  },
  {
    id: "cky8b014d0327bhfi1vw2eocb",
    content:
      "Listen to some instrumental music and write a poem that matches the mood, beat, and style of the music.",
  },
  {
    id: "cky8b014e0328bhfial6ylol0",
    content: "Write about having to wait in line.",
  },
  {
    id: "cky8b014e0329bhfivdu535eg",
    content:
      "Do you know your personality type? (There are many free quizzes online) – write about what type of personality traits you have.",
  },
  {
    id: "cky8b014e0330bhfi0zl1qj8v",
    content: "’s or ’s for example)",
  },
  {
    id: "cky8b014e0331bhfix636m7he",
    content: "Write your personal credo of things you believe in.",
  },
  {
    id: "cky8b014e0332bhfifp2q19lp",
    content: "Write about a lost object.",
  },
  {
    id: "cky8b014e0333bhfih5abbik6",
    content: "Write a poem or story that uses dialogue between two people.",
  },
  {
    id: "cky8b014e0334bhfi2mnrcmkx",
    content: "Write about a letter that never made it to its recipient.",
  },
  {
    id: "cky8b014e0335bhfiuz6w6n7h",
    content:
      "Write a poem about the story that is told through someone’s eyes.",
  },
  {
    id: "cky8b014e0336bhfi8rn6eih1",
    content: "Write about something you learned the hard way.",
  },
  {
    id: "cky8b014e0337bhfi4cindylz",
    content: "Write about where you like to go to escape from it all.",
  },
  {
    id: "cky8b014e0338bhfigimsg1o0",
    content: "Write something inspired a favorite food or recipe.",
  },
  {
    id: "cky8b014e0339bhfi8pxge19e",
    content:
      "Go through your file box and pull out old receipts or records…write something inspired by what you find!",
  },
  {
    id: "cky8b014e0340bhfiy9m6x1bi",
    content: "Write about visiting the bank.",
  },
  {
    id: "cky8b014e0341bhfi0pgvc4ic",
    content: "Write about trying to convince someone of something.",
  },
  {
    id: "cky8b014e0342bhfifyb0k3o7",
    content: "Write about something that happened by chance in a positive way.",
  },
  {
    id: "cky8b014e0343bhfiqsrh5o1v",
    content: "Write about how it feels when you can’t focus.",
  },
  {
    id: "cky8b014e0344bhfi8q8mb7tt",
    content: "Write about big business.",
  },
  {
    id: "cky8b014e0345bhfi62jcmlpa",
    content:
      "Go to a dictionary website that has a word of the day and use it in a poem, story or journal entry you write.",
  },
  {
    id: "cky8b014e0346bhfi8dw3uwkx",
    content: "What do you do when you need a pick me up?",
  },
  {
    id: "cky8b014e0347bhfi54pnw8c7",
    content: "Write about a project you started but never completed.",
  },
  {
    id: "cky8b014e0348bhfi2fne2dxz",
    content:
      "Write about a time when someone forgave you or you forgave someone.",
  },
  {
    id: "cky8b014e0349bhfi1g4bkk4u",
    content: "Write about your greatest weakness.",
  },
  {
    id: "cky8b014e0350bhfi0i3bxsud",
    content: "Write about starting a project.",
  },
  {
    id: "cky8b014e0351bhfi8ebxi2gt",
    content: "Think of gears, moving parts, machines.",
  },
  {
    id: "cky8b014e0352bhfiz79x584b",
    content:
      "Write about a random act of kindness you’ve done for someone or someone has done for you, no matter how small or insignificant it may have seemed.",
  },
  {
    id: "cky8b014e0353bhfife3h60d6",
    content:
      "Imagine living in a home underground and use that as inspiration for writing.",
  },
  {
    id: "cky8b014e0354bhfi4g8k3619",
    content:
      "Pick a classic rock love ballad and rewrite it into a story or poem with a similar theme.",
  },
  {
    id: "cky8b014e0355bhfiz40ykz26",
    content: "Write about staying up late at night.",
  },
  {
    id: "cky8b014e0356bhfi3h1f5cgh",
    content: "Write about attraction to something or someone.",
  },
  {
    id: "cky8b014e0357bhfiiles0bqw",
    content: "Write about working with a team towards a common goal.",
  },
  {
    id: "cky8b014e0358bhfirggc12pi",
    content: "Write about the ups and downs in life.",
  },
  {
    id: "cky8b014e0359bhfiqprs9yu8",
    content:
      "Look at some motivational posters online and write a poem or journal entry inspired by your favorite one.",
  },
  {
    id: "cky8b014e0360bhfi7cfn0uco",
    content: "Write about the games people play – figuratively or literally.",
  },
  {
    id: "cky8b014e0361bhfiluzeiutm",
    content:
      "Write about a point in life where things turned for the better or worse.",
  },
  {
    id: "cky8b014e0362bhfi8nlu1ex1",
    content: "Write about a witch’s spell.",
  },
  {
    id: "cky8b014e0363bhfi2mdlt03x",
    content: "Write about the anniversary of a special date.",
  },
  {
    id: "cky8b014e0364bhfi7mzom0ff",
    content: "Be inspired by a casino or lottery ticket.",
  },
  {
    id: "cky8b014e0365bhfi5c07pjns",
    content: "Write about going on a picnic.",
  },
  {
    id: "cky8b014e0366bhfi4um7jphy",
    content: "Write about some random item you might find in a garage.",
  },
  {
    id: "cky8b014e0367bhfi3fswwygq",
    content:
      "Review your week, month, or year in a journal entry or poem format.",
  },
  {
    id: "cky8b014e0368bhfi8zxy2hqh",
    content:
      "Write about a detective searching for clues or solving a mystery.",
  },
  {
    id: "cky8b014e0369bhfiteyv1xqs",
    content:
      "Take your camera for a walk and write based on one of the photographs you take.",
  },
  {
    id: "cky8b014e0370bhfin6iuimo6",
    content: "Write about visiting a family member or friend.",
  },
  {
    id: "cky8b014e0371bhfih7lmzwj9",
    content: "Write about putting trust in someone.",
  },
];

export const getTodaysPrompt = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = Number(today) - Number(start);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  return prompts[dayOfYear % prompts.length];
};
