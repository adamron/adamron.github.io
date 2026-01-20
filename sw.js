const CACHE_NAME = 'tools-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/tools/animal-explorer/index.html',
  '/tools/animal-explorer/images/thumbs/african-elephant.jpg',
  '/tools/animal-explorer/images/thumbs/albatross.jpg',
  '/tools/animal-explorer/images/thumbs/anglerfish.jpg',
  '/tools/animal-explorer/images/thumbs/anteater.jpg',
  '/tools/animal-explorer/images/thumbs/arctic-fox.jpg',
  '/tools/animal-explorer/images/thumbs/armadillo.jpg',
  '/tools/animal-explorer/images/thumbs/asian-elephant.jpg',
  '/tools/animal-explorer/images/thumbs/axolotl.jpg',
  '/tools/animal-explorer/images/thumbs/aye-aye.jpg',
  '/tools/animal-explorer/images/thumbs/badger.jpg',
  '/tools/animal-explorer/images/thumbs/beaver.jpg',
  '/tools/animal-explorer/images/thumbs/bison.jpg',
  '/tools/animal-explorer/images/thumbs/capybara.jpg',
  '/tools/animal-explorer/images/thumbs/cassowary.jpg',
  '/tools/animal-explorer/images/thumbs/chameleon.jpg',
  '/tools/animal-explorer/images/thumbs/cheetah.jpg',
  '/tools/animal-explorer/images/thumbs/chimpanzee.jpg',
  '/tools/animal-explorer/images/thumbs/clownfish.jpg',
  '/tools/animal-explorer/images/thumbs/cockatoo.jpg',
  '/tools/animal-explorer/images/thumbs/cougar.jpg',
  '/tools/animal-explorer/images/thumbs/dingo.jpg',
  '/tools/animal-explorer/images/thumbs/elk.jpg',
  '/tools/animal-explorer/images/thumbs/emu.jpg',
  '/tools/animal-explorer/images/thumbs/flamingo.jpg',
  '/tools/animal-explorer/images/thumbs/giant-panda.jpg',
  '/tools/animal-explorer/images/thumbs/giraffe.jpg',
  '/tools/animal-explorer/images/thumbs/gorilla.jpg',
  '/tools/animal-explorer/images/thumbs/gray-wolf.jpg',
  '/tools/animal-explorer/images/thumbs/grizzly-bear.jpg',
  '/tools/animal-explorer/images/thumbs/hedgehog.jpg',
  '/tools/animal-explorer/images/thumbs/hippopotamus.jpg',
  '/tools/animal-explorer/images/thumbs/hummingbird.jpg',
  '/tools/animal-explorer/images/thumbs/hyena.jpg',
  '/tools/animal-explorer/images/thumbs/iguana.jpg',
  '/tools/animal-explorer/images/thumbs/jaguar.jpg',
  '/tools/animal-explorer/images/thumbs/jellyfish.jpg',
  '/tools/animal-explorer/images/thumbs/kangaroo.jpg',
  '/tools/animal-explorer/images/thumbs/koala.jpg',
  '/tools/animal-explorer/images/thumbs/kookaburra.jpg',
  '/tools/animal-explorer/images/thumbs/leopard.jpg',
  '/tools/animal-explorer/images/thumbs/lion.jpg',
  '/tools/animal-explorer/images/thumbs/macaw.jpg',
  '/tools/animal-explorer/images/thumbs/manatee.jpg',
  '/tools/animal-explorer/images/thumbs/mandrill.jpg',
  '/tools/animal-explorer/images/thumbs/meerkat.jpg',
  '/tools/animal-explorer/images/thumbs/moose.jpg',
  '/tools/animal-explorer/images/thumbs/orangutan.jpg',
  '/tools/animal-explorer/images/thumbs/orca.jpg',
  '/tools/animal-explorer/images/thumbs/ostrich.jpg',
  '/tools/animal-explorer/images/thumbs/owl.jpg',
  '/tools/animal-explorer/images/thumbs/pangolin.jpg',
  '/tools/animal-explorer/images/thumbs/pelican.jpg',
  '/tools/animal-explorer/images/thumbs/penguin.jpg',
  '/tools/animal-explorer/images/thumbs/platypus.jpg',
  '/tools/animal-explorer/images/thumbs/polar-bear.jpg',
  '/tools/animal-explorer/images/thumbs/puffin.jpg',
  '/tools/animal-explorer/images/thumbs/raccoon.jpg',
  '/tools/animal-explorer/images/thumbs/red-fox.jpg',
  '/tools/animal-explorer/images/thumbs/reindeer.jpg',
  '/tools/animal-explorer/images/thumbs/seahorse.jpg',
  '/tools/animal-explorer/images/thumbs/skunk.jpg',
  '/tools/animal-explorer/images/thumbs/sloth.jpg',
  '/tools/animal-explorer/images/thumbs/snow-leopard.jpg',
  '/tools/animal-explorer/images/thumbs/tarantula.jpg',
  '/tools/animal-explorer/images/thumbs/tiger.jpg',
  '/tools/animal-explorer/images/thumbs/toucan.jpg',
  '/tools/animal-explorer/images/thumbs/walrus.jpg',
  '/tools/animal-explorer/images/thumbs/white-rhinoceros.jpg',
  '/tools/animal-explorer/images/thumbs/wolverine.jpg',
  '/tools/animal-explorer/images/thumbs/wombat.jpg',
  '/tools/animal-explorer/images/thumbs/zebra.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});
