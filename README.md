# BioAtlas

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Take the BodyParts3D adult male reference apart into **2,234 individually selectable meshes**, explore **15 anatomical systems**, and search **3,432 named concepts**.

Extended from the open-source Human Atlas viewer by ashemag with surface-EMG electrode placements (SENIAM + standard practice, EN/TH), motion-capture marker sets (Plug-in Gait, Helen Hayes, BTS, Rizzoli), and Thai–English language support by Patchara Al-umaree.

After deploying to Vercel, add your live demo link here.

## Explore

- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details.
- Use compact controls and detail panels on mobile.

## Run locally

Requires Node.js 22.13 or newer. No API keys or accounts are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3016. To build the static site, run `npm run build`; the output is in `dist/`.

## Validate

```sh
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-seniam.mjs
node scripts/validate-markers.mjs
node scripts/validate-interactions.mjs
npm run build
```

Validation covers mesh buffers, names and concept membership, EMG placement data (EN/TH completeness, SENIAM source links, local illustrations), marker-set data (schema, bone mapping, skin-snapped positions), nonoverlapping exploded layouts at desktop and mobile aspect ratios, search and inspection contracts, and tap-versus-drag handling. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, and 390×844, 320×568, and 844×390 layouts. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**. It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh. The packaged model contains 2,288,268 triangles and downloads approximately 33 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

Surface EMG placements (`public/data/seniam.json`, 50 muscles: 27 SENIAM + 23 extended standard-practice) are paraphrased English and Thai summaries, each with a source link and, for extended entries, a literature citation. Placement illustrations (`public/images/seniam/`, © SENIAM project) are hosted locally with attribution. Validate with `node scripts/validate-seniam.mjs`.

Motion-capture marker sets (`public/data/markersets.json`: Plug-in Gait lower 16, upper 23, full body 39; Helen Hayes lower 15; BTS Davis Heel 22; BTS Upper Limb 18; Rizzoli foot 32) are paraphrased summaries with per-marker placement guidance. Validate with `node scripts/validate-markers.mjs`.

This is an educational explorer, not a diagnostic or surgical tool.

## How it works

Geometry is merged into batches. Per-structure GPU textures control translation, visibility, and selection, while component geometry supports accurate picking. Exploded layouts pack only the visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

The optional WebMCP tools expose anatomy search and inspection in compatible browsers. The visible interface works without them.

## Rebuilding geometry

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure.

## Deploy

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, and the `dist` output directory. It can also be served by a static host.

## License

Application code is released under the [MIT License](LICENSE) (original viewer © ashemag; modifications © Patchara Al-umaree). **The BodyParts3D anatomy data has its own CC BY 4.0 license**; preserve the attribution in `public/ATTRIBUTION.md` when redistributing it. Reference summaries (SENIAM, Vicon, Helen Hayes/Davis, BTS, Rizzoli, Cram) are paraphrased with source links and citations; SENIAM placement figures remain © SENIAM project / Roessingh Research and Development. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
