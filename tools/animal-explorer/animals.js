const animals = [
  // Mammals - Big Cats
  {
    name: 'Lion',
    image: 'images/lion.jpg',
    sound: 'sounds/lion.mp3',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Tiger',
    image: 'images/tiger.jpg',
    sound: 'sounds/tiger.mp3',
    tags: { biome: 'Forest', geography: 'Asia', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Leopard',
    image: 'images/leopard.jpg',
    sound: 'sounds/leopard.mp3',
    tags: { biome: 'Forest', geography: 'Africa & Asia', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Cheetah',
    image: 'images/cheetah.jpg',
    sound: 'sounds/cheetah.mp3',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Jaguar',
    image: 'images/jaguar.jpg',
    sound: 'sounds/jaguar.mp3',
    tags: { biome: 'Rainforest', geography: 'South America', class: 'Mammal', diet: 'Carnivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Snow Leopard',
    image: 'images/snow-leopard.jpg',
    sound: 'sounds/snow-leopard.mp3',
    tags: { biome: 'Mountain', geography: 'Central Asia', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Cougar',
    image: 'images/cougar.jpg',
    sound: 'sounds/cougar.mp3',
    tags: { biome: 'Mountain', geography: 'Americas', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },

  // Mammals - Bears
  {
    name: 'Polar Bear',
    image: 'images/polar-bear.jpg',
    sound: 'sounds/polar-bear.mp3',
    tags: { biome: 'Arctic', geography: 'Arctic', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Grizzly Bear',
    image: 'images/grizzly-bear.jpg',
    sound: 'sounds/grizzly-bear.mp3',
    tags: { biome: 'Forest', geography: 'North America', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Giant Panda',
    image: 'images/giant-panda.jpg',
    sound: 'sounds/giant-panda.mp3',
    tags: { biome: 'Forest', geography: 'China', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },

  // Mammals - Canines
  {
    name: 'Gray Wolf',
    image: 'images/gray-wolf.jpg',
    sound: 'sounds/gray-wolf.mp3',
    tags: { biome: 'Forest', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Red Fox',
    image: 'images/red-fox.jpg',
    sound: 'sounds/red-fox.mp3',
    tags: { biome: 'Forest', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Arctic Fox',
    image: 'images/arctic-fox.jpg',
    sound: 'sounds/arctic-fox.mp3',
    tags: { biome: 'Tundra', geography: 'Arctic', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'African Wild Dog',
    image: 'images/african-wild-dog.jpg',
    sound: 'sounds/african-wild-dog.mp3',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Dingo',
    image: 'images/dingo.jpg',
    sound: 'sounds/dingo.mp3',
    tags: { biome: 'Desert', geography: 'Australia', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },

  // Mammals - Large Herbivores
  {
    name: 'African Elephant',
    image: 'images/african-elephant.jpg',
    sound: 'sounds/african-elephant.mp3',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'Asian Elephant',
    image: 'images/asian-elephant.jpg',
    sound: 'sounds/asian-elephant.mp3',
    tags: { biome: 'Forest', geography: 'Asia', class: 'Mammal', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'White Rhinoceros',
    image: 'images/white-rhinoceros.jpg',
    sound: 'sounds/white-rhinoceros.mp3',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Hippopotamus',
    image: 'images/hippopotamus.jpg',
    sound: 'sounds/hippopotamus.mp3',
    tags: { biome: 'Wetland', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Giraffe',
    image: 'images/giraffe.jpg',
    sound: 'sounds/giraffe.mp3',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Zebra',
    image: 'images/zebra.jpg',
    sound: 'sounds/zebra.mp3',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Bison',
    image: 'images/bison.jpg',
    sound: 'sounds/bison.mp3',
    tags: { biome: 'Grassland', geography: 'North America', class: 'Mammal', diet: 'Herbivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Moose',
    image: 'images/moose.jpg',
    sound: 'sounds/moose.mp3',
    tags: { biome: 'Forest', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Elk',
    image: 'images/elk.jpg',
    sound: 'sounds/elk.mp3',
    tags: { biome: 'Forest', geography: 'North America & Asia', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Reindeer',
    image: 'images/reindeer.jpg',
    sound: 'sounds/reindeer.mp3',
    tags: { biome: 'Tundra', geography: 'Arctic', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },

  // Mammals - Primates
  {
    name: 'Gorilla',
    image: 'images/gorilla.jpg',
    sound: 'sounds/gorilla.mp3',
    tags: { biome: 'Rainforest', geography: 'Africa', class: 'Mammal', diet: 'Herbivore', conservation: 'Critically Endangered' }
  },
  {
    name: 'Chimpanzee',
    image: 'images/chimpanzee.jpg',
    sound: 'sounds/chimpanzee.mp3',
    tags: { biome: 'Rainforest', geography: 'Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Endangered' }
  },
  {
    name: 'Orangutan',
    image: 'images/orangutan.jpg',
    sound: 'sounds/orangutan.mp3',
    tags: { biome: 'Rainforest', geography: 'Southeast Asia', class: 'Mammal', diet: 'Omnivore', conservation: 'Critically Endangered' }
  },
  {
    name: 'Mandrill',
    image: 'images/mandrill.jpg',
    sound: 'sounds/mandrill.mp3',
    tags: { biome: 'Rainforest', geography: 'Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Ring-tailed Lemur',
    image: 'images/ring-tailed-lemur.jpg',
    sound: 'sounds/ring-tailed-lemur.mp3',
    tags: { biome: 'Forest', geography: 'Madagascar', class: 'Mammal', diet: 'Omnivore', conservation: 'Endangered' }
  },

  // Mammals - Marine
  {
    name: 'Bottlenose Dolphin',
    image: 'images/bottlenose-dolphin.jpg',
    sound: 'sounds/bottlenose-dolphin.mp3',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Orca',
    image: 'images/orca.jpg',
    sound: 'sounds/orca.mp3',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Mammal', diet: 'Carnivore', conservation: 'Data Deficient' }
  },
  {
    name: 'Humpback Whale',
    image: 'images/humpback-whale.jpg',
    sound: 'sounds/humpback-whale.mp3',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Blue Whale',
    image: 'images/blue-whale.jpg',
    sound: 'sounds/blue-whale.mp3',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Sea Otter',
    image: 'images/sea-otter.jpg',
    sound: 'sounds/sea-otter.mp3',
    tags: { biome: 'Ocean', geography: 'North Pacific', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Walrus',
    image: 'images/walrus.jpg',
    sound: 'sounds/walrus.mp3',
    tags: { biome: 'Arctic', geography: 'Arctic', class: 'Mammal', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Manatee',
    image: 'images/manatee.jpg',
    sound: 'sounds/manatee.mp3',
    tags: { biome: 'Wetland', geography: 'Americas', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },

  // Mammals - Australian
  {
    name: 'Kangaroo',
    image: 'images/kangaroo.jpg',
    sound: 'sounds/kangaroo.mp3',
    tags: { biome: 'Grassland', geography: 'Australia', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Koala',
    image: 'images/koala.jpg',
    sound: 'sounds/koala.mp3',
    tags: { biome: 'Forest', geography: 'Australia', class: 'Mammal', diet: 'Herbivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Wombat',
    image: 'images/wombat.jpg',
    sound: 'sounds/wombat.mp3',
    tags: { biome: 'Forest', geography: 'Australia', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Platypus',
    image: 'images/platypus.jpg',
    sound: 'sounds/platypus.mp3',
    tags: { biome: 'Wetland', geography: 'Australia', class: 'Mammal', diet: 'Carnivore', conservation: 'Near Threatened' }
  },
  {
    name: 'Tasmanian Devil',
    image: 'images/tasmanian-devil.jpg',
    sound: 'sounds/tasmanian-devil.mp3',
    tags: { biome: 'Forest', geography: 'Tasmania', class: 'Mammal', diet: 'Carnivore', conservation: 'Endangered' }
  },

  // Mammals - Other
  {
    name: 'Red Panda',
    image: 'images/red-panda.jpg',
    sound: 'sounds/red-panda.mp3',
    tags: { biome: 'Forest', geography: 'Himalayas', class: 'Mammal', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'Sloth',
    image: 'images/sloth.jpg',
    sound: 'sounds/sloth.mp3',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Armadillo',
    image: 'images/armadillo.jpg',
    sound: 'sounds/armadillo.mp3',
    tags: { biome: 'Grassland', geography: 'Americas', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Anteater',
    image: 'images/anteater.jpg',
    sound: 'sounds/anteater.mp3',
    tags: { biome: 'Grassland', geography: 'Central & South America', class: 'Mammal', diet: 'Insectivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Pangolin',
    image: 'images/pangolin.jpg',
    sound: 'sounds/pangolin.mp3',
    tags: { biome: 'Forest', geography: 'Africa & Asia', class: 'Mammal', diet: 'Insectivore', conservation: 'Critically Endangered' }
  },
  {
    name: 'Hedgehog',
    image: 'images/hedgehog.jpg',
    sound: 'sounds/hedgehog.mp3',
    tags: { biome: 'Forest', geography: 'Europe & Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Raccoon',
    image: 'images/raccoon.jpg',
    sound: 'sounds/raccoon.mp3',
    tags: { biome: 'Forest', geography: 'North America', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Skunk',
    image: 'images/skunk.jpg',
    sound: 'sounds/skunk.mp3',
    tags: { biome: 'Forest', geography: 'Americas', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Badger',
    image: 'images/badger.jpg',
    sound: 'sounds/badger.mp3',
    tags: { biome: 'Forest', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Wolverine',
    image: 'images/wolverine.jpg',
    sound: 'sounds/wolverine.mp3',
    tags: { biome: 'Tundra', geography: 'Northern Hemisphere', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Meerkat',
    image: 'images/meerkat.jpg',
    sound: 'sounds/meerkat.mp3',
    tags: { biome: 'Desert', geography: 'Southern Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Hyena',
    image: 'images/hyena.jpg',
    sound: 'sounds/hyena.mp3',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Mammal', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Fennec Fox',
    image: 'images/fennec-fox.jpg',
    sound: 'sounds/fennec-fox.mp3',
    tags: { biome: 'Desert', geography: 'North Africa', class: 'Mammal', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Capybara',
    image: 'images/capybara.jpg',
    sound: 'sounds/capybara.mp3',
    tags: { biome: 'Wetland', geography: 'South America', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Beaver',
    image: 'images/beaver.jpg',
    sound: 'sounds/beaver.mp3',
    tags: { biome: 'Wetland', geography: 'North America & Europe', class: 'Mammal', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Aye-aye',
    image: 'images/aye-aye.jpg',
    sound: 'sounds/aye-aye.mp3',
    tags: { biome: 'Rainforest', geography: 'Madagascar', class: 'Mammal', diet: 'Omnivore', conservation: 'Endangered' }
  },

  // Birds
  {
    name: 'Bald Eagle',
    image: 'images/bald-eagle.jpg',
    sound: 'sounds/bald-eagle.mp3',
    tags: { biome: 'Forest', geography: 'North America', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Golden Eagle',
    image: 'images/golden-eagle.jpg',
    sound: 'sounds/golden-eagle.mp3',
    tags: { biome: 'Mountain', geography: 'Northern Hemisphere', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Peregrine Falcon',
    image: 'images/peregrine-falcon.jpg',
    sound: 'sounds/peregrine-falcon.mp3',
    tags: { biome: 'Various', geography: 'Worldwide', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Great Horned Owl',
    image: 'images/great-horned-owl.jpg',
    sound: 'sounds/great-horned-owl.mp3',
    tags: { biome: 'Forest', geography: 'Americas', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Snowy Owl',
    image: 'images/snowy-owl.jpg',
    sound: 'sounds/snowy-owl.mp3',
    tags: { biome: 'Tundra', geography: 'Arctic', class: 'Bird', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Emperor Penguin',
    image: 'images/emperor-penguin.jpg',
    sound: 'sounds/emperor-penguin.mp3',
    tags: { biome: 'Antarctic', geography: 'Antarctica', class: 'Bird', diet: 'Carnivore', conservation: 'Near Threatened' }
  },
  {
    name: 'King Penguin',
    image: 'images/king-penguin.jpg',
    sound: 'sounds/king-penguin.mp3',
    tags: { biome: 'Antarctic', geography: 'Sub-Antarctic', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Flamingo',
    image: 'images/flamingo.jpg',
    sound: 'sounds/flamingo.mp3',
    tags: { biome: 'Wetland', geography: 'Americas & Africa', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Peacock',
    image: 'images/peacock.jpg',
    sound: 'sounds/peacock.mp3',
    tags: { biome: 'Forest', geography: 'South Asia', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Toucan',
    image: 'images/toucan.jpg',
    sound: 'sounds/toucan.mp3',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Macaw',
    image: 'images/macaw.jpg',
    sound: 'sounds/macaw.mp3',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Bird', diet: 'Herbivore', conservation: 'Varies' }
  },
  {
    name: 'Cockatoo',
    image: 'images/cockatoo.jpg',
    sound: 'sounds/cockatoo.mp3',
    tags: { biome: 'Forest', geography: 'Australasia', class: 'Bird', diet: 'Herbivore', conservation: 'Varies' }
  },
  {
    name: 'Kookaburra',
    image: 'images/kookaburra.jpg',
    sound: 'sounds/kookaburra.mp3',
    tags: { biome: 'Forest', geography: 'Australia', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Hummingbird',
    image: 'images/hummingbird.jpg',
    sound: 'sounds/hummingbird.mp3',
    tags: { biome: 'Various', geography: 'Americas', class: 'Bird', diet: 'Herbivore', conservation: 'Varies' }
  },
  {
    name: 'Ostrich',
    image: 'images/ostrich.jpg',
    sound: 'sounds/ostrich.mp3',
    tags: { biome: 'Savanna', geography: 'Africa', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Emu',
    image: 'images/emu.jpg',
    sound: 'sounds/emu.mp3',
    tags: { biome: 'Grassland', geography: 'Australia', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Cassowary',
    image: 'images/cassowary.jpg',
    sound: 'sounds/cassowary.mp3',
    tags: { biome: 'Rainforest', geography: 'Australasia', class: 'Bird', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Pelican',
    image: 'images/pelican.jpg',
    sound: 'sounds/pelican.mp3',
    tags: { biome: 'Wetland', geography: 'Worldwide', class: 'Bird', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Albatross',
    image: 'images/albatross.jpg',
    sound: 'sounds/albatross.mp3',
    tags: { biome: 'Ocean', geography: 'Southern Ocean', class: 'Bird', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Puffin',
    image: 'images/puffin.jpg',
    sound: 'sounds/puffin.mp3',
    tags: { biome: 'Coastal', geography: 'North Atlantic', class: 'Bird', diet: 'Carnivore', conservation: 'Vulnerable' }
  },

  // Reptiles
  {
    name: 'Komodo Dragon',
    image: 'images/komodo-dragon.jpg',
    sound: 'sounds/komodo-dragon.mp3',
    tags: { biome: 'Forest', geography: 'Indonesia', class: 'Reptile', diet: 'Carnivore', conservation: 'Endangered' }
  },
  {
    name: 'Saltwater Crocodile',
    image: 'images/saltwater-crocodile.jpg',
    sound: 'sounds/saltwater-crocodile.mp3',
    tags: { biome: 'Wetland', geography: 'Southeast Asia & Australia', class: 'Reptile', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'American Alligator',
    image: 'images/american-alligator.jpg',
    sound: 'sounds/american-alligator.mp3',
    tags: { biome: 'Wetland', geography: 'North America', class: 'Reptile', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Green Sea Turtle',
    image: 'images/green-sea-turtle.jpg',
    sound: 'sounds/green-sea-turtle.mp3',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Reptile', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'Galapagos Tortoise',
    image: 'images/galapagos-tortoise.jpg',
    sound: 'sounds/galapagos-tortoise.mp3',
    tags: { biome: 'Grassland', geography: 'Galapagos Islands', class: 'Reptile', diet: 'Herbivore', conservation: 'Vulnerable' }
  },
  {
    name: 'King Cobra',
    image: 'images/king-cobra.jpg',
    sound: 'sounds/king-cobra.mp3',
    tags: { biome: 'Forest', geography: 'South Asia', class: 'Reptile', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Green Anaconda',
    image: 'images/green-anaconda.jpg',
    sound: 'sounds/green-anaconda.mp3',
    tags: { biome: 'Wetland', geography: 'South America', class: 'Reptile', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Chameleon',
    image: 'images/chameleon.jpg',
    sound: 'sounds/chameleon.mp3',
    tags: { biome: 'Forest', geography: 'Africa & Madagascar', class: 'Reptile', diet: 'Insectivore', conservation: 'Varies' }
  },
  {
    name: 'Iguana',
    image: 'images/iguana.jpg',
    sound: 'sounds/iguana.mp3',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Reptile', diet: 'Herbivore', conservation: 'Least Concern' }
  },
  {
    name: 'Gila Monster',
    image: 'images/gila-monster.jpg',
    sound: 'sounds/gila-monster.mp3',
    tags: { biome: 'Desert', geography: 'North America', class: 'Reptile', diet: 'Carnivore', conservation: 'Near Threatened' }
  },

  // Amphibians
  {
    name: 'Poison Dart Frog',
    image: 'images/poison-dart-frog.jpg',
    sound: 'sounds/poison-dart-frog.mp3',
    tags: { biome: 'Rainforest', geography: 'Central & South America', class: 'Amphibian', diet: 'Insectivore', conservation: 'Varies' }
  },
  {
    name: 'Red-eyed Tree Frog',
    image: 'images/red-eyed-tree-frog.jpg',
    sound: 'sounds/red-eyed-tree-frog.mp3',
    tags: { biome: 'Rainforest', geography: 'Central America', class: 'Amphibian', diet: 'Insectivore', conservation: 'Least Concern' }
  },
  {
    name: 'Axolotl',
    image: 'images/axolotl.jpg',
    sound: 'sounds/axolotl.mp3',
    tags: { biome: 'Wetland', geography: 'Mexico', class: 'Amphibian', diet: 'Carnivore', conservation: 'Critically Endangered' }
  },
  {
    name: 'Giant Salamander',
    image: 'images/giant-salamander.jpg',
    sound: 'sounds/giant-salamander.mp3',
    tags: { biome: 'Wetland', geography: 'China & Japan', class: 'Amphibian', diet: 'Carnivore', conservation: 'Critically Endangered' }
  },

  // Fish
  {
    name: 'Great White Shark',
    image: 'images/great-white-shark.jpg',
    sound: 'sounds/great-white-shark.mp3',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Fish', diet: 'Carnivore', conservation: 'Vulnerable' }
  },
  {
    name: 'Whale Shark',
    image: 'images/whale-shark.jpg',
    sound: 'sounds/whale-shark.mp3',
    tags: { biome: 'Ocean', geography: 'Tropical Oceans', class: 'Fish', diet: 'Filter Feeder', conservation: 'Endangered' }
  },
  {
    name: 'Manta Ray',
    image: 'images/manta-ray.jpg',
    sound: 'sounds/manta-ray.mp3',
    tags: { biome: 'Ocean', geography: 'Tropical Oceans', class: 'Fish', diet: 'Filter Feeder', conservation: 'Vulnerable' }
  },
  {
    name: 'Clownfish',
    image: 'images/clownfish.jpg',
    sound: 'sounds/clownfish.mp3',
    tags: { biome: 'Coral Reef', geography: 'Indo-Pacific', class: 'Fish', diet: 'Omnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Seahorse',
    image: 'images/seahorse.jpg',
    sound: 'sounds/seahorse.mp3',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Fish', diet: 'Carnivore', conservation: 'Varies' }
  },
  {
    name: 'Anglerfish',
    image: 'images/anglerfish.jpg',
    sound: 'sounds/anglerfish.mp3',
    tags: { biome: 'Deep Ocean', geography: 'Worldwide', class: 'Fish', diet: 'Carnivore', conservation: 'Least Concern' }
  },

  // Invertebrates
  {
    name: 'Giant Pacific Octopus',
    image: 'images/giant-pacific-octopus.jpg',
    sound: 'sounds/giant-pacific-octopus.mp3',
    tags: { biome: 'Ocean', geography: 'North Pacific', class: 'Invertebrate', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Monarch Butterfly',
    image: 'images/monarch-butterfly.jpg',
    sound: 'sounds/monarch-butterfly.mp3',
    tags: { biome: 'Various', geography: 'North America', class: 'Invertebrate', diet: 'Herbivore', conservation: 'Endangered' }
  },
  {
    name: 'Honeybee',
    image: 'images/honeybee.jpg',
    sound: 'sounds/honeybee.mp3',
    tags: { biome: 'Various', geography: 'Worldwide', class: 'Invertebrate', diet: 'Herbivore', conservation: 'Data Deficient' }
  },
  {
    name: 'Tarantula',
    image: 'images/tarantula.jpg',
    sound: 'sounds/tarantula.mp3',
    tags: { biome: 'Desert', geography: 'Americas', class: 'Invertebrate', diet: 'Carnivore', conservation: 'Varies' }
  },
  {
    name: 'Emperor Scorpion',
    image: 'images/emperor-scorpion.jpg',
    sound: 'sounds/emperor-scorpion.mp3',
    tags: { biome: 'Rainforest', geography: 'West Africa', class: 'Invertebrate', diet: 'Carnivore', conservation: 'Least Concern' }
  },
  {
    name: 'Jellyfish',
    image: 'images/jellyfish.jpg',
    sound: 'sounds/jellyfish.mp3',
    tags: { biome: 'Ocean', geography: 'Worldwide', class: 'Invertebrate', diet: 'Carnivore', conservation: 'Least Concern' }
  }
];
