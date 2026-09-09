# Attribution

## Application code

Original Human Atlas viewer code © ashemag, MIT License (see [LICENSE](../LICENSE)). Modifications — surface-EMG placements, motion-capture marker sets, Thai–English support, UI — © Patchara Al-umaree, also MIT.

## Anatomy data

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimeters/Z-up to meters/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colors. The source contains 2,234 individual OBJ meshes; all remain represented. The combined hierarchy contains 3,432 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

Source OBJ comments mention an older CC BY-SA 2.1 Japan license. The official current database license linked above supersedes that legacy text and explicitly permits redistribution and adaptation under CC BY 4.0.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## Surface EMG placement reference (SENIAM)

Electrode placements in `public/data/seniam.json` are **original paraphrased summaries** written for this project in English and Thai. Placement illustrations in `public/images/seniam/` are the official SENIAM figures, hosted locally for reliability, © SENIAM project / Roessingh Research and Development (http://www.seniam.org/). Each entry links back to its official source page.

- Reference: SENIAM project, Surface EMG for Non-Invasive Assessment of Muscles, Roessingh Research and Development. http://www.seniam.org/
- Key pages: http://seniam.org/sensor_location.htm, http://seniam.org/leg_location.htm, http://www.seniam.org/lowerleg_location.htm, http://seniam.org/arm_location.htm, http://seniam.org/shoulder_location.htm, http://www.seniam.org/back_location.htm
- Book: Hermens et al., European Recommendations for Surface Electromyography (SENIAM 8), ISBN 90-75452-15-2.
- The SENIAM site states no open licence; treat the official protocol as all rights reserved. This repo summarises factual placement landmarks in its own words, hosts the official figures locally with credit and source links back to the official pages. For commercial redistribution, confirm permission with Roessingh Research and Development.
- Viewer dots are projected onto the muscle surface (closest-point) and are illustrative, not measured electrode coordinates. Educational reference only, not a medical device.

## Extended surface EMG placements (non-SENIAM)

Entries in `public/data/seniam.json` tagged `"standard": "extended"` (neck, shoulder, forearm, trunk, thigh and leg muscles beyond the SENIAM set) are original paraphrased summaries of standard clinical surface-EMG practice, principally after Cram JR, Kasman GS, Holtz J, *Cram's Introduction to Surface Electromyography*. No book text, tables, or images are reproduced; each entry carries a literature citation. They follow SENIAM conventions (bipolar, 20 mm inter-electrode distance except small hand muscles, orientation along fibres) and link to the SENIAM general placement procedure. Clearly labelled EXTENDED in the interface; consult the cited literature for authoritative use.

## Motion-capture marker sets (Plug-in Gait, Helen Hayes, BTS, Rizzoli)

Marker sets in `public/data/markersets.json` (Plug-in Gait lower body 16, upper body 23, full body 39; Helen Hayes lower body 15; BTS Davis Heel 22; BTS Upper Limb 18; Rizzoli foot 32) are **original paraphrased summaries** of the Vicon Plug-in Gait model (Vicon Motion Systems), the Helen Hayes/Davis clinical-gait model (Davis et al. 1991; Kadaba et al. 1990), BTS SMART-Clinic protocols (BTS Bioengineering; upper limb after the Modified Rab model, Rab et al. 2002), and the Rizzoli Foot Model (Leardini et al. 2007). No third-party text, tables, or images are reproduced. Dots are computed from BodyParts3D bone bounds and snapped to the body surface; positions marked APPROX lack an exact bone in the atlas. Educational reference only.

## Historical assets (not included in the current release)

Earlier repository revisions included female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: translated native meter/Y-up coordinates onto the stage, coincident vertices welded and source normals averaged, geometry simplified with a 0.2% per-structure relative error bound, and normals quantized. Colors and display systems are curated for this interface. All 888 source meshes are represented, with 1,073 source nodes available as selectable individual or compound concepts.

This is a reference assembly with whole-body surface and selected organs, including female reproductive anatomy. Its skeleton and muscle coverage is partial. It is not a complete model of every human structure or a single-person scan. Eight placenta/umbilical structures are classified under Pregnancy reference and hidden by default.
