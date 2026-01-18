const animals = [
  // Mammals - Big Cats
  {
    name: 'Lion',
    image: 'images/lion.jpg',
    sound: 'sounds/lion.mp3',
    imagePrompt: 'Photorealistic male lion with full golden mane, centered in frame, standing majestically on African savanna grassland, warm sunset lighting, sharp focus on face and mane, natural wildlife photography',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Tiger',
    image: 'images/tiger.jpg',
    sound: 'sounds/tiger.mp3',
    imagePrompt: 'Photorealistic Bengal tiger, centered in frame, walking through dense Asian forest with dappled sunlight, orange and black stripes clearly visible, intense gaze, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Asia', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Leopard',
    image: 'images/leopard.jpg',
    sound: 'sounds/leopard.mp3',
    imagePrompt: 'Photorealistic leopard, centered in frame, resting on thick tree branch in African woodland, spotted coat pattern clearly visible, alert expression, soft natural lighting, wildlife photography',
    tags: { biome: 'Forest', geography: 'Africa & Asia', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Cheetah',
    image: 'images/cheetah.jpg',
    sound: 'sounds/cheetah.mp3',
    imagePrompt: 'Photorealistic cheetah, centered in frame, standing alert on African savanna, distinctive black tear marks on face, slender spotted body, golden grassland background, natural wildlife photography',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Jaguar',
    image: 'images/jaguar.jpg',
    sound: 'sounds/jaguar.mp3',
    imagePrompt: 'Photorealistic jaguar, centered in frame, emerging from South American rainforest undergrowth, rosette-patterned golden coat, muscular build, lush green jungle background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'South America', class: 'Mammal', diet: 'Carnivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Snow Leopard',
    image: 'images/snow-leopard.jpg',
    sound: 'sounds/snow-leopard.mp3',
    imagePrompt: 'Photorealistic snow leopard, centered in frame, perched on rocky Himalayan mountain ledge, thick pale grey spotted fur, long fluffy tail, snow-capped peaks in background, natural wildlife photography',
    tags: { biome: 'Mountain', geography: 'Central Asia', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Cougar',
    image: 'images/cougar.jpg',
    sound: 'sounds/cougar.mp3',
    imagePrompt: 'Photorealistic cougar mountain lion, centered in frame, standing on rocky outcrop in North American mountain forest, tawny coat, alert posture, pine trees in background, natural wildlife photography',
    tags: { biome: 'Mountain', geography: 'Americas', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },

  // Mammals - Bears
  {
    name: 'Polar Bear',
    image: 'images/polar-bear.jpg',
    sound: 'sounds/polar-bear.mp3',
    imagePrompt: 'Photorealistic polar bear, centered in frame, standing on Arctic sea ice, thick white fur coat, black nose and eyes, blue arctic ocean and ice floes in background, natural wildlife photography',
    tags: { biome: 'Arctic', geography: 'Arctic', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Grizzly Bear',
    image: 'images/grizzly-bear.jpg',
    sound: 'sounds/grizzly-bear.mp3',
    imagePrompt: 'Photorealistic grizzly bear, centered in frame, standing in shallow river catching salmon, thick brown fur with silver-tipped hairs, powerful build, forest and mountains in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'North America', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Giant Panda',
    image: 'images/giant-panda.jpg',
    sound: 'sounds/giant-panda.mp3',
    imagePrompt: 'Photorealistic giant panda, centered in frame, sitting among bamboo stalks eating bamboo, distinctive black and white fur pattern, round face, misty Chinese mountain forest background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'China', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },

  // Mammals - Canines
  {
    name: 'Gray Wolf',
    image: 'images/gray-wolf.jpg',
    sound: 'sounds/gray-wolf.mp3',
    imagePrompt: 'Photorealistic gray wolf, centered in frame, standing in snowy northern forest, thick grey and white fur coat, piercing yellow eyes, pine trees and snow in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Red Fox',
    image: 'images/red-fox.jpg',
    sound: 'sounds/red-fox.mp3',
    imagePrompt: 'Photorealistic red fox, centered in frame, standing alert in autumn forest, vibrant orange-red fur with white chest, bushy tail with white tip, fallen leaves on ground, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Arctic Fox',
    image: 'images/arctic-fox.jpg',
    sound: 'sounds/arctic-fox.mp3',
    imagePrompt: 'Photorealistic arctic fox in winter coat, centered in frame, standing on snowy tundra, pure white thick fur, small rounded ears, bright eyes, endless white arctic landscape in background, natural wildlife photography',
    tags: { biome: 'Tundra', geography: 'Arctic', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'African Wild Dog',
    image: 'images/african-wild-dog.jpg',
    sound: 'sounds/african-wild-dog.mp3',
    imagePrompt: 'Photorealistic African wild dog, centered in frame, standing on African savanna, distinctive mottled brown black and white coat pattern, large rounded ears, alert expression, grassland background, natural wildlife photography',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Dingo',
    image: 'images/dingo.jpg',
    sound: 'sounds/dingo.mp3',
    imagePrompt: 'Photorealistic dingo, centered in frame, standing in Australian outback desert, sandy golden-brown coat, alert pointed ears, red desert sand and sparse vegetation in background, natural wildlife photography',
    tags: { biome: 'Desert', geography: 'Australia', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },

  // Mammals - Large Herbivores
  {
    name: 'African Elephant',
    image: 'images/african-elephant.jpg',
    sound: 'sounds/african-elephant.mp3',
    imagePrompt: 'Photorealistic African elephant, centered in frame, walking across savanna grassland, large tusks and ears clearly visible, grey wrinkled skin, acacia trees and golden grass in background, natural wildlife photography',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'Asian Elephant',
    image: 'images/asian-elephant.jpg',
    sound: 'sounds/asian-elephant.mp3',
    imagePrompt: 'Photorealistic Asian elephant, centered in frame, standing in tropical forest clearing, smaller ears than African elephant, grey skin, lush green jungle vegetation in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Asia', class: 'Mammal', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'White Rhinoceros',
    image: 'images/white-rhinoceros.jpg',
    sound: 'sounds/white-rhinoceros.mp3',
    imagePrompt: 'Photorealistic white rhinoceros, centered in frame, standing on African grassland, two horns clearly visible, massive grey body, wide square mouth, savanna landscape in background, natural wildlife photography',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Hippopotamus',
    image: 'images/hippopotamus.jpg',
    sound: 'sounds/hippopotamus.mp3',
    imagePrompt: 'Photorealistic hippopotamus, centered in frame, partially submerged in African river, massive head with small ears and large nostrils above water, grey wet skin, riverbank and reeds in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Giraffe',
    image: 'images/giraffe.jpg',
    sound: 'sounds/giraffe.mp3',
    imagePrompt: 'Photorealistic giraffe, centered in frame, standing tall on African savanna, distinctive brown patch pattern on cream coat, long neck, ossicones on head, acacia trees in background, natural wildlife photography',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Zebra',
    image: 'images/zebra.jpg',
    sound: 'sounds/zebra.mp3',
    imagePrompt: 'Photorealistic zebra, centered in frame, standing on African savanna grassland, distinctive black and white striped pattern, mane standing upright, golden grass and blue sky in background, natural wildlife photography',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Bison',
    image: 'images/bison.jpg',
    sound: 'sounds/bison.mp3',
    imagePrompt: 'Photorealistic American bison, centered in frame, standing in North American prairie grassland, massive shaggy brown head and shoulders, horns visible, rolling plains in background, natural wildlife photography',
    tags: { biome: 'Grassland', geography: 'North America', class: 'Mammal', diet: 'Herbivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Moose',
    image: 'images/moose.jpg',
    sound: 'sounds/moose.mp3',
    imagePrompt: 'Photorealistic bull moose, centered in frame, standing in shallow northern lake, massive palmate antlers, long face with overhanging snout, dark brown coat, boreal forest in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Elk',
    image: 'images/elk.jpg',
    sound: 'sounds/elk.mp3',
    imagePrompt: 'Photorealistic bull elk, centered in frame, standing in mountain meadow, large branching antlers, tan body with darker neck mane, Rocky Mountain forest and peaks in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'North America & Asia', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Reindeer',
    image: 'images/reindeer.jpg',
    sound: 'sounds/reindeer.mp3',
    imagePrompt: 'Photorealistic reindeer caribou, centered in frame, standing on Arctic tundra, impressive antlers, thick brown and white winter coat, snow-covered landscape and northern lights in background, natural wildlife photography',
    tags: { biome: 'Tundra', geography: 'Arctic', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },

  // Mammals - Primates
  {
    name: 'Gorilla',
    image: 'images/gorilla.jpg',
    sound: 'sounds/gorilla.mp3',
    imagePrompt: 'Photorealistic silverback mountain gorilla, centered in frame, sitting in African rainforest, silver-grey back visible, powerful build, intelligent dark eyes, lush green vegetation in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Critically Endangered' }
  },
  {
    name: 'Chimpanzee',
    image: 'images/chimpanzee.jpg',
    sound: 'sounds/chimpanzee.mp3',
    imagePrompt: 'Photorealistic chimpanzee, centered in frame, sitting on forest floor in African rainforest, black fur, expressive intelligent face, long arms, dense green jungle vegetation in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Endangered' }
  },
  {
    name: 'Orangutan',
    image: 'images/orangutan.jpg',
    sound: 'sounds/orangutan.mp3',
    imagePrompt: 'Photorealistic Bornean orangutan, centered in frame, hanging from tree branch in Southeast Asian rainforest, long shaggy reddish-orange fur, intelligent face, dense tropical canopy in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Southeast Asia', class: 'Mammal', diet: 'Omnivore', conservation: 'Critically Endangered' }
  },
  {
    name: 'Mandrill',
    image: 'images/mandrill.jpg',
    sound: 'sounds/mandrill.mp3',
    imagePrompt: 'Photorealistic male mandrill, centered in frame, sitting in African rainforest, distinctive bright blue and red facial markings, colorful face clearly visible, dense green jungle in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Ring-tailed Lemur',
    image: 'images/ring-tailed-lemur.jpg',
    sound: 'sounds/ring-tailed-lemur.mp3',
    imagePrompt: 'Photorealistic ring-tailed lemur, centered in frame, sitting on branch in Madagascar forest, distinctive black and white ringed tail raised, grey and white fur, yellow eyes, dry forest in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Madagascar', class: 'Mammal', diet: 'Omnivore', conservation: 'Endangered' }
  },

  // Mammals - Marine
  {
    name: 'Bottlenose Dolphin',
    image: 'images/bottlenose-dolphin.jpg',
    sound: 'sounds/bottlenose-dolphin.mp3',
    imagePrompt: 'Photorealistic bottlenose dolphin, centered in frame, leaping out of crystal clear blue ocean water, sleek grey body, distinctive curved mouth appearing to smile, ocean spray and sunlight, natural wildlife photography',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Orca',
    image: 'images/orca.jpg',
    sound: 'sounds/orca.mp3',
    imagePrompt: 'Photorealistic orca killer whale, centered in frame, surfacing in cold ocean waters, distinctive black and white coloring, tall dorsal fin, white eye patch visible, mountains and coastline in background, natural wildlife photography',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Mammal', diet: 'Carnivore', conservation: 'Data Deficient' }
  },
  {
    name: 'Humpback Whale',
    image: 'images/humpback-whale.jpg',
    sound: 'sounds/humpback-whale.mp3',
    imagePrompt: 'Photorealistic humpback whale, centered in frame, breaching out of deep blue ocean, massive body, long pectoral fins visible, water cascading off body, dramatic ocean spray, natural wildlife photography',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Blue Whale',
    image: 'images/blue-whale.jpg',
    sound: 'sounds/blue-whale.mp3',
    imagePrompt: 'Photorealistic blue whale, centered in frame, swimming just below ocean surface, massive mottled blue-grey body, small dorsal fin, deep blue ocean water, underwater photography with natural lighting',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Sea Otter',
    image: 'images/sea-otter.jpg',
    sound: 'sounds/sea-otter.mp3',
    imagePrompt: 'Photorealistic sea otter, centered in frame, floating on back in Pacific kelp forest waters, thick brown fur, whiskered face, holding sea urchin, kelp fronds visible in clear water, natural wildlife photography',
    tags: { biome: 'Ocean', geography: 'North Pacific', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Walrus',
    image: 'images/walrus.jpg',
    sound: 'sounds/walrus.mp3',
    imagePrompt: 'Photorealistic walrus, centered in frame, resting on Arctic ice floe, long white tusks, whiskered face, wrinkled pinkish-brown skin, icy Arctic waters and ice in background, natural wildlife photography',
    tags: { biome: 'Arctic', geography: 'Arctic', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Manatee',
    image: 'images/manatee.jpg',
    sound: 'sounds/manatee.mp3',
    imagePrompt: 'Photorealistic Florida manatee, centered in frame, swimming in crystal clear spring waters, large grey rounded body, paddle-shaped tail, whiskered face, seagrass and sunbeams in clear water, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'Americas', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },

  // Mammals - Australian
  {
    name: 'Kangaroo',
    image: 'images/kangaroo.jpg',
    sound: 'sounds/kangaroo.mp3',
    imagePrompt: 'Photorealistic red kangaroo, centered in frame, standing upright in Australian outback grassland, powerful hind legs and tail, reddish-brown fur, alert ears, eucalyptus trees in background, natural wildlife photography',
    tags: { biome: 'Grassland', geography: 'Australia', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Koala',
    image: 'images/koala.jpg',
    sound: 'sounds/koala.mp3',
    imagePrompt: 'Photorealistic koala, centered in frame, clinging to eucalyptus tree branch, fluffy grey fur, large round nose, tufted ears, eucalyptus leaves visible, Australian bush in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Australia', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Wombat',
    image: 'images/wombat.jpg',
    sound: 'sounds/wombat.mp3',
    imagePrompt: 'Photorealistic common wombat, centered in frame, walking on Australian forest floor, sturdy compact body, coarse brown-grey fur, short legs, eucalyptus forest in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Australia', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Platypus',
    image: 'images/platypus.jpg',
    sound: 'sounds/platypus.mp3',
    imagePrompt: 'Photorealistic platypus, centered in frame, swimming in clear Australian freshwater stream, duck-like bill, beaver-like tail, brown waterproof fur, underwater view with pebble streambed visible, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'Australia', class: 'Mammal', diet: 'Carnivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Tasmanian Devil',
    image: 'images/tasmanian-devil.jpg',
    sound: 'sounds/tasmanian-devil.mp3',
    imagePrompt: 'Photorealistic Tasmanian devil, centered in frame, standing in Tasmanian forest, stocky black body with white chest patch, powerful jaws, pink ears, native bush in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Tasmania', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },

  // Mammals - Other
  {
    name: 'Red Panda',
    image: 'images/red-panda.jpg',
    sound: 'sounds/red-panda.mp3',
    imagePrompt: 'Photorealistic red panda, centered in frame, walking along tree branch in Himalayan forest, rusty red fur, masked face, bushy ringed tail, misty bamboo forest in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Himalayas', class: 'Mammal', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'Sloth',
    image: 'images/sloth.jpg',
    sound: 'sounds/sloth.mp3',
    imagePrompt: 'Photorealistic three-toed sloth, centered in frame, hanging from branch in Central American rainforest, shaggy brown-grey fur, distinctive face with dark eye patches, green jungle canopy in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Armadillo',
    image: 'images/armadillo.jpg',
    sound: 'sounds/armadillo.mp3',
    imagePrompt: 'Photorealistic nine-banded armadillo, centered in frame, walking on ground in American grassland, distinctive banded armored shell, pointed snout, small eyes, dry grass and soil in background, natural wildlife photography',
    tags: { biome: 'Grassland', geography: 'Americas', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Anteater',
    image: 'images/anteater.jpg',
    sound: 'sounds/anteater.mp3',
    imagePrompt: 'Photorealistic giant anteater, centered in frame, walking across South American grassland, very long snout and tongue, bushy tail, coarse grey-brown fur with black and white stripe, savanna in background, natural wildlife photography',
    tags: { biome: 'Grassland', geography: 'Central & South America', class: 'Mammal', diet: 'Insectivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Pangolin',
    image: 'images/pangolin.jpg',
    sound: 'sounds/pangolin.mp3',
    imagePrompt: 'Photorealistic pangolin, centered in frame, walking on forest floor, distinctive overlapping brown scales covering body, long curved claws, small head, African or Asian forest in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Africa & Asia', class: 'Mammal', diet: 'Insectivore', conservation: 'Critically Endangered' }
  },
  {
    name: 'Hedgehog',
    image: 'images/hedgehog.jpg',
    sound: 'sounds/hedgehog.mp3',
    imagePrompt: 'Photorealistic European hedgehog, centered in frame, walking through garden at dusk, spiny brown coat, pointed snout, small black eyes, fallen leaves and grass in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Europe & Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Raccoon',
    image: 'images/raccoon.jpg',
    sound: 'sounds/raccoon.mp3',
    imagePrompt: 'Photorealistic raccoon, centered in frame, standing by forest stream, distinctive black mask across eyes, grey fur, ringed bushy tail, North American woodland in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'North America', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Skunk',
    image: 'images/skunk.jpg',
    sound: 'sounds/skunk.mp3',
    imagePrompt: 'Photorealistic striped skunk, centered in frame, walking through forest clearing, distinctive black fur with white stripes from head to bushy tail, woodland setting in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Americas', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Badger',
    image: 'images/badger.jpg',
    sound: 'sounds/badger.mp3',
    imagePrompt: 'Photorealistic European badger, centered in frame, emerging from woodland sett at dusk, distinctive black and white striped face, grey body, forest floor with leaves in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Wolverine',
    image: 'images/wolverine.jpg',
    sound: 'sounds/wolverine.mp3',
    imagePrompt: 'Photorealistic wolverine, centered in frame, standing in snowy northern tundra, stocky muscular body, dark brown fur with lighter facial markings, snow-covered landscape in background, natural wildlife photography',
    tags: { biome: 'Tundra', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Meerkat',
    image: 'images/meerkat.jpg',
    sound: 'sounds/meerkat.mp3',
    imagePrompt: 'Photorealistic meerkat, centered in frame, standing upright on hind legs in sentinel pose, tan fur with darker bands, alert expression, Kalahari desert sand and sparse vegetation in background, natural wildlife photography',
    tags: { biome: 'Desert', geography: 'Southern Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Hyena',
    image: 'images/hyena.jpg',
    sound: 'sounds/hyena.mp3',
    imagePrompt: 'Photorealistic spotted hyena, centered in frame, standing on African savanna, spotted tan and brown coat, rounded ears, powerful build, golden grassland at sunset in background, natural wildlife photography',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Fennec Fox',
    image: 'images/fennec-fox.jpg',
    sound: 'sounds/fennec-fox.mp3',
    imagePrompt: 'Photorealistic fennec fox, centered in frame, sitting in Sahara desert, enormous distinctive ears, cream-colored fur, small body, sandy dunes in background, natural wildlife photography',
    tags: { biome: 'Desert', geography: 'North Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Capybara',
    image: 'images/capybara.jpg',
    sound: 'sounds/capybara.mp3',
    imagePrompt: 'Photorealistic capybara, centered in frame, resting at edge of South American wetland, large rodent with brown coarse fur, blunt snout, calm expression, marsh grass and water in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'South America', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Beaver',
    image: 'images/beaver.jpg',
    sound: 'sounds/beaver.mp3',
    imagePrompt: 'Photorealistic North American beaver, centered in frame, sitting on riverbank near dam, glossy brown waterproof fur, large flat paddle tail, prominent orange teeth, pond and lodge in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'North America & Europe', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Aye-aye',
    image: 'images/aye-aye.jpg',
    sound: 'sounds/aye-aye.mp3',
    imagePrompt: 'Photorealistic aye-aye, centered in frame, clinging to branch in Madagascar rainforest at night, large yellow eyes, huge ears, long bony middle finger visible, dark shaggy fur, moonlit forest in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Madagascar', class: 'Mammal', diet: 'Omnivore', conservation: 'Endangered' }
  },

  // Birds
  {
    name: 'Bald Eagle',
    image: 'images/bald-eagle.jpg',
    sound: 'sounds/bald-eagle.mp3',
    imagePrompt: 'Photorealistic bald eagle, centered in frame, perched on branch near water, distinctive white head and tail feathers, dark brown body, sharp yellow beak and eyes, North American forest and lake in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'North America', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Golden Eagle',
    image: 'images/golden-eagle.jpg',
    sound: 'sounds/golden-eagle.mp3',
    imagePrompt: 'Photorealistic golden eagle, centered in frame, soaring with wings spread against mountain backdrop, golden-brown plumage on head and neck, powerful talons visible, rocky mountain peaks in background, natural wildlife photography',
    tags: { biome: 'Mountain', geography: 'Northern Hemisphere', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Peregrine Falcon',
    image: 'images/peregrine-falcon.jpg',
    sound: 'sounds/peregrine-falcon.mp3',
    imagePrompt: 'Photorealistic peregrine falcon, centered in frame, perched on rocky cliff edge, slate-grey back, barred white chest, distinctive dark helmet marking, coastal cliffs in background, natural wildlife photography',
    tags: { biome: 'Various', geography: 'Worldwide', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Great Horned Owl',
    image: 'images/great-horned-owl.jpg',
    sound: 'sounds/great-horned-owl.mp3',
    imagePrompt: 'Photorealistic great horned owl, centered in frame, perched on tree branch at dusk, distinctive ear tufts, large yellow eyes, mottled brown plumage, North American forest in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Americas', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Snowy Owl',
    image: 'images/snowy-owl.jpg',
    sound: 'sounds/snowy-owl.mp3',
    imagePrompt: 'Photorealistic snowy owl, centered in frame, standing on snow-covered Arctic tundra, predominantly white plumage with some dark barring, bright yellow eyes, endless white snowy landscape in background, natural wildlife photography',
    tags: { biome: 'Tundra', geography: 'Arctic', class: 'Bird', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Emperor Penguin',
    image: 'images/emperor-penguin.jpg',
    sound: 'sounds/emperor-penguin.mp3',
    imagePrompt: 'Photorealistic emperor penguin, centered in frame, standing tall on Antarctic ice, black back and head, white front, distinctive yellow-orange ear patches and chest gradient, ice and snow in background, natural wildlife photography',
    tags: { biome: 'Antarctic', geography: 'Antarctica', class: 'Bird', diet: 'Carnivore', conservation: 'Near Threatened' }
  },
  {
    name: 'King Penguin',
    image: 'images/king-penguin.jpg',
    sound: 'sounds/king-penguin.mp3',
    imagePrompt: 'Photorealistic king penguin, centered in frame, standing on sub-Antarctic beach, silvery-grey back, bright orange ear patches and chest, colony and mountains in background, natural wildlife photography',
    tags: { biome: 'Antarctic', geography: 'Sub-Antarctic', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Flamingo',
    image: 'images/flamingo.jpg',
    sound: 'sounds/flamingo.mp3',
    imagePrompt: 'Photorealistic greater flamingo, centered in frame, standing in shallow salt lake, vibrant pink plumage, long curved neck, distinctive downward-bent beak, calm pink-tinted water in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'Americas & Africa', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Peacock',
    image: 'images/peacock.jpg',
    sound: 'sounds/peacock.mp3',
    imagePrompt: 'Photorealistic male Indian peacock, centered in frame, displaying full iridescent tail feathers in fan, brilliant blue neck and chest, eye-spots on tail feathers, Indian forest garden in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'South Asia', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Toucan',
    image: 'images/toucan.jpg',
    sound: 'sounds/toucan.mp3',
    imagePrompt: 'Photorealistic toco toucan, centered in frame, perched on branch in South American rainforest, enormous orange-yellow bill with black tip, black plumage with white throat, lush green canopy in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Macaw',
    image: 'images/macaw.jpg',
    sound: 'sounds/macaw.mp3',
    imagePrompt: 'Photorealistic scarlet macaw, centered in frame, perched on tropical tree branch, brilliant red, yellow and blue plumage, long tail feathers, curved beak, Amazon rainforest canopy in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Bird', diet: 'Herbivore', conservation: 'Varies' }
  },
  {
    name: 'Cockatoo',
    image: 'images/cockatoo.jpg',
    sound: 'sounds/cockatoo.mp3',
    imagePrompt: 'Photorealistic sulphur-crested cockatoo, centered in frame, perched on eucalyptus branch, white plumage, distinctive yellow crest raised, dark beak, Australian bushland in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Australasia', class: 'Bird', diet: 'Herbivore', conservation: 'Varies' }
  },
  {
    name: 'Kookaburra',
    image: 'images/kookaburra.jpg',
    sound: 'sounds/kookaburra.mp3',
    imagePrompt: 'Photorealistic laughing kookaburra, centered in frame, perched on branch in Australian bush, large head with long strong beak, brown and white plumage, blue wing patches, eucalyptus woodland in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Australia', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Hummingbird',
    image: 'images/hummingbird.jpg',
    sound: 'sounds/hummingbird.mp3',
    imagePrompt: 'Photorealistic ruby-throated hummingbird, centered in frame, hovering near flower in garden, iridescent green back, bright red throat gorget, wings frozen in motion, colorful flowers in background, natural wildlife photography',
    tags: { biome: 'Various', geography: 'Americas', class: 'Bird', diet: 'Herbivore', conservation: 'Varies' }
  },
  {
    name: 'Ostrich',
    image: 'images/ostrich.jpg',
    sound: 'sounds/ostrich.mp3',
    imagePrompt: 'Photorealistic common ostrich, centered in frame, standing tall on African savanna, black and white plumage on male, long neck, powerful legs, golden grassland stretching to horizon in background, natural wildlife photography',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Emu',
    image: 'images/emu.jpg',
    sound: 'sounds/emu.mp3',
    imagePrompt: 'Photorealistic emu, centered in frame, standing in Australian outback grassland, shaggy grey-brown plumage, long neck, tall flightless bird, red desert and sparse vegetation in background, natural wildlife photography',
    tags: { biome: 'Grassland', geography: 'Australia', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Cassowary',
    image: 'images/cassowary.jpg',
    sound: 'sounds/cassowary.mp3',
    imagePrompt: 'Photorealistic southern cassowary, centered in frame, standing in Australian rainforest, glossy black plumage, brilliant blue neck and red wattles, large casque on head, dense tropical vegetation in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Australasia', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Pelican',
    image: 'images/pelican.jpg',
    sound: 'sounds/pelican.mp3',
    imagePrompt: 'Photorealistic great white pelican, centered in frame, floating on calm lake water, white plumage, enormous bill with expandable pouch, yellow tinge on breast, wetland reeds in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'Worldwide', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Albatross',
    image: 'images/albatross.jpg',
    sound: 'sounds/albatross.mp3',
    imagePrompt: 'Photorealistic wandering albatross, centered in frame, soaring over Southern Ocean, enormous wingspan, white body with black wing tips, hooked pink bill, dramatic stormy ocean waves in background, natural wildlife photography',
    tags: { biome: 'Ocean', geography: 'Southern Ocean', class: 'Bird', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Puffin',
    image: 'images/puffin.jpg',
    sound: 'sounds/puffin.mp3',
    imagePrompt: 'Photorealistic Atlantic puffin, centered in frame, standing on grassy coastal cliff, colorful triangular red orange and yellow beak, black and white plumage, ocean and cliffs in background, natural wildlife photography',
    tags: { biome: 'Coastal', geography: 'North Atlantic', class: 'Bird', diet: 'Carnivore', conservation: 'Vulnerable' }
  },

  // Reptiles
  {
    name: 'Komodo Dragon',
    image: 'images/komodo-dragon.jpg',
    sound: 'sounds/komodo-dragon.mp3',
    imagePrompt: 'Photorealistic Komodo dragon, centered in frame, walking on Indonesian island beach, massive scaly grey-brown body, forked yellow tongue extended, powerful claws, tropical vegetation in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Indonesia', class: 'Reptile', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Saltwater Crocodile',
    image: 'images/saltwater-crocodile.jpg',
    sound: 'sounds/saltwater-crocodile.mp3',
    imagePrompt: 'Photorealistic saltwater crocodile, centered in frame, resting on muddy riverbank, massive scaled body, powerful jaws with visible teeth, armored skin, Australian mangrove swamp in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'Southeast Asia & Australia', class: 'Reptile', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'American Alligator',
    image: 'images/american-alligator.jpg',
    sound: 'sounds/american-alligator.mp3',
    imagePrompt: 'Photorealistic American alligator, centered in frame, floating in Florida swamp, dark grey-green armored body, broad snout, eyes and nostrils above water, cypress trees and Spanish moss in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'North America', class: 'Reptile', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Green Sea Turtle',
    image: 'images/green-sea-turtle.jpg',
    sound: 'sounds/green-sea-turtle.mp3',
    imagePrompt: 'Photorealistic green sea turtle, centered in frame, swimming gracefully through clear tropical ocean, olive-green shell, paddle-like flippers, serene expression, coral reef and tropical fish in background, underwater wildlife photography',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Reptile', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'Galapagos Tortoise',
    image: 'images/galapagos-tortoise.jpg',
    sound: 'sounds/galapagos-tortoise.mp3',
    imagePrompt: 'Photorealistic Galapagos giant tortoise, centered in frame, walking slowly across volcanic island terrain, massive domed shell, long wrinkled neck extended, ancient wise expression, Galapagos landscape in background, natural wildlife photography',
    tags: { biome: 'Grassland', geography: 'Galapagos Islands', class: 'Reptile', diet: 'Herbivore', conservation: 'Vulnerable' }
  },
  {
    name: 'King Cobra',
    image: 'images/king-cobra.jpg',
    sound: 'sounds/king-cobra.mp3',
    imagePrompt: 'Photorealistic king cobra, centered in frame, raised in defensive hood display, olive-brown scales, distinctive hood pattern, forked tongue extended, Southeast Asian forest floor in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'South Asia', class: 'Reptile', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Green Anaconda',
    image: 'images/green-anaconda.jpg',
    sound: 'sounds/green-anaconda.mp3',
    imagePrompt: 'Photorealistic green anaconda, centered in frame, coiled in shallow Amazon river water, massive olive-green body with dark spots, head above water, South American rainforest swamp in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'South America', class: 'Reptile', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Chameleon',
    image: 'images/chameleon.jpg',
    sound: 'sounds/chameleon.mp3',
    imagePrompt: 'Photorealistic panther chameleon, centered in frame, perched on branch in Madagascar forest, vibrant colorful scales in greens and blues, independently moving eyes, curled tail, tropical vegetation in background, natural wildlife photography',
    tags: { biome: 'Forest', geography: 'Africa & Madagascar', class: 'Reptile', diet: 'Insectivore', conservation: 'Varies' }
  },
  {
    name: 'Iguana',
    image: 'images/iguana.jpg',
    sound: 'sounds/iguana.mp3',
    imagePrompt: 'Photorealistic green iguana, centered in frame, basking on tree branch in Central American rainforest, bright green scales, distinctive spiny crest along back, dewlap visible, lush jungle canopy in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Reptile', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Gila Monster',
    image: 'images/gila-monster.jpg',
    sound: 'sounds/gila-monster.mp3',
    imagePrompt: 'Photorealistic Gila monster, centered in frame, walking on desert rocks, distinctive black and orange-pink beaded scales, stocky body, forked tongue, Sonoran desert landscape with cacti in background, natural wildlife photography',
    tags: { biome: 'Desert', geography: 'North America', class: 'Reptile', diet: 'Carnivore', conservation: 'Near Threatened' }
  },

  // Amphibians
  {
    name: 'Poison Dart Frog',
    image: 'images/poison-dart-frog.jpg',
    sound: 'sounds/poison-dart-frog.mp3',
    imagePrompt: 'Photorealistic blue poison dart frog, centered in frame, sitting on leaf in rainforest, vibrant brilliant blue skin with black spots, small compact body, tropical leaf litter and moss in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Amphibian', diet: 'Insectivore', conservation: 'Varies' }
  },
  {
    name: 'Red-eyed Tree Frog',
    image: 'images/red-eyed-tree-frog.jpg',
    sound: 'sounds/red-eyed-tree-frog.mp3',
    imagePrompt: 'Photorealistic red-eyed tree frog, centered in frame, clinging to leaf in Central American rainforest, brilliant red eyes, vibrant green body with blue and yellow stripes, orange feet, tropical foliage in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'Central America', class: 'Amphibian', diet: 'Insectivore', conservation: 'Least Concern' }
  },
  {
    name: 'Axolotl',
    image: 'images/axolotl.jpg',
    sound: 'sounds/axolotl.mp3',
    imagePrompt: 'Photorealistic axolotl, centered in frame, swimming in clear Mexican lake water, pale pink body with feathery external gills, wide head with small eyes, permanent smile, aquatic vegetation in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'Mexico', class: 'Amphibian', diet: 'Carnivore', conservation: 'Critically Endangered' }
  },
  {
    name: 'Giant Salamander',
    image: 'images/giant-salamander.jpg',
    sound: 'sounds/giant-salamander.mp3',
    imagePrompt: 'Photorealistic Chinese giant salamander, centered in frame, resting on rocks in clear mountain stream, massive wrinkled brown body, small eyes, flat broad head, rocky streambed in cold water in background, natural wildlife photography',
    tags: { biome: 'Wetland', geography: 'China & Japan', class: 'Amphibian', diet: 'Carnivore', conservation: 'Critically Endangered' }
  },

  // Fish
  {
    name: 'Great White Shark',
    image: 'images/great-white-shark.jpg',
    sound: 'sounds/great-white-shark.mp3',
    imagePrompt: 'Photorealistic great white shark, centered in frame, swimming in clear blue ocean, powerful grey body with white underside, distinctive triangular dorsal fin, rows of teeth visible, deep blue water in background, underwater wildlife photography',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Fish', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Whale Shark',
    image: 'images/whale-shark.jpg',
    sound: 'sounds/whale-shark.mp3',
    imagePrompt: 'Photorealistic whale shark, centered in frame, swimming through tropical ocean, massive grey body with distinctive white spots, wide flat head, enormous mouth, sunlight filtering through blue water in background, underwater wildlife photography',
    tags: { biome: 'Ocean', geography: 'Tropical Oceans', class: 'Fish', diet: 'Filter Feeder', conservation: 'Endangered' }
  },
  {
    name: 'Manta Ray',
    image: 'images/manta-ray.jpg',
    sound: 'sounds/manta-ray.mp3',
    imagePrompt: 'Photorealistic giant oceanic manta ray, centered in frame, gliding gracefully through tropical waters, enormous black and white wingspan, cephalic fins extended, sunbeams in blue water in background, underwater wildlife photography',
    tags: { biome: 'Ocean', geography: 'Tropical Oceans', class: 'Fish', diet: 'Filter Feeder', conservation: 'Vulnerable' }
  },
  {
    name: 'Clownfish',
    image: 'images/clownfish.jpg',
    sound: 'sounds/clownfish.mp3',
    imagePrompt: 'Photorealistic clownfish, centered in frame, swimming among sea anemone tentacles on coral reef, bright orange body with white stripes bordered in black, Indo-Pacific coral reef in background, underwater wildlife photography',
    tags: { biome: 'Coral Reef', geography: 'Indo-Pacific', class: 'Fish', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Seahorse',
    image: 'images/seahorse.jpg',
    sound: 'sounds/seahorse.mp3',
    imagePrompt: 'Photorealistic seahorse, centered in frame, holding onto seagrass with curled tail, distinctive horse-like head, textured yellow-brown body, ocean floor with seagrass meadow in background, underwater wildlife photography',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Fish', diet: 'Carnivore', conservation: 'Varies' }
  },
  {
    name: 'Anglerfish',
    image: 'images/anglerfish.jpg',
    sound: 'sounds/anglerfish.mp3',
    imagePrompt: 'Photorealistic deep sea anglerfish, centered in frame, swimming in dark ocean depths, bioluminescent lure glowing from forehead, large mouth with sharp teeth, dark grey body, black deep ocean in background, underwater wildlife photography',
    tags: { biome: 'Deep Ocean', geography: 'Worldwide', class: 'Fish', diet: 'Carnivore', conservation: 'Least Concern' }
  },

  // Invertebrates
  {
    name: 'Giant Pacific Octopus',
    image: 'images/giant-pacific-octopus.jpg',
    sound: 'sounds/giant-pacific-octopus.mp3',
    imagePrompt: 'Photorealistic giant Pacific octopus, centered in frame, crawling over rocky seafloor, reddish-brown mottled skin, eight long tentacles with suckers visible, intelligent eyes, Pacific kelp forest in background, underwater wildlife photography',
    tags: { biome: 'Ocean', geography: 'North Pacific', class: 'Invertebrate', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Monarch Butterfly',
    image: 'images/monarch-butterfly.jpg',
    sound: 'sounds/monarch-butterfly.mp3',
    imagePrompt: 'Photorealistic monarch butterfly, centered in frame, perched on milkweed flower with wings spread, distinctive orange and black wing pattern with white spots, delicate antennae, wildflower meadow in background, natural wildlife photography',
    tags: { biome: 'Various', geography: 'North America', class: 'Invertebrate', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'Honeybee',
    image: 'images/honeybee.jpg',
    sound: 'sounds/honeybee.mp3',
    imagePrompt: 'Photorealistic honeybee, centered in frame, collecting pollen from colorful flower, fuzzy golden-brown body with black stripes, translucent wings, pollen baskets on legs visible, garden flowers in background, macro wildlife photography',
    tags: { biome: 'Various', geography: 'Worldwide', class: 'Invertebrate', diet: 'Herbivore', conservation: 'Data Deficient' }
  },
  {
    name: 'Tarantula',
    image: 'images/tarantula.jpg',
    sound: 'sounds/tarantula.mp3',
    imagePrompt: 'Photorealistic Mexican red-knee tarantula, centered in frame, standing on desert rock, large hairy body with distinctive red-orange knee markings on black legs, multiple eyes visible, desert sand and rocks in background, natural wildlife photography',
    tags: { biome: 'Desert', geography: 'Americas', class: 'Invertebrate', diet: 'Carnivore', conservation: 'Varies' }
  },
  {
    name: 'Emperor Scorpion',
    image: 'images/emperor-scorpion.jpg',
    sound: 'sounds/emperor-scorpion.mp3',
    imagePrompt: 'Photorealistic emperor scorpion, centered in frame, standing on African rainforest floor, large glossy black body, massive pincers, curved tail with stinger raised, leaf litter and forest floor in background, natural wildlife photography',
    tags: { biome: 'Rainforest', geography: 'West Africa', class: 'Invertebrate', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Jellyfish',
    image: 'images/jellyfish.jpg',
    sound: 'sounds/jellyfish.mp3',
    imagePrompt: 'Photorealistic moon jellyfish, centered in frame, floating gracefully in open ocean, translucent bell-shaped body with delicate tentacles, bioluminescent glow, deep blue ocean water in background, underwater wildlife photography',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Invertebrate', diet: 'Carnivore', conservation: 'Least Concern' }
  }
];
