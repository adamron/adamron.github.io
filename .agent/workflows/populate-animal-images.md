---
description: Batch process animal images for the Animal Explorer tool
---

// turbo-all

The goal is to find, evaluate, and download high-quality, centered wildlife images for the animal explorer.

1. **Batch Search**: Use `browser_subagent` to find high-resolution, centered image URLs for a batch of animals (e.g., 5-10 animals from a specific category).
2. **Evaluation**: I will evaluate each image to ensure it is clear, the animal is centered, and it has no distracting watermarks or UI elements.
3. **Download**: Use `curl` or `fetch-animal.js` (modified) to download all images in the batch to `tools/animal-explorer/images/`.
4. **Repeat**: Continue until all animals in `animals.js` have images.
5. **Verify**: Check the final images and the application.
