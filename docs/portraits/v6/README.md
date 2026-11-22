# Portraits, round 6

The repository now connects **128 of 143 people**. This round adds **54 portraits**: 30 accepted v5 drawings and 24 recovered or corrected drawings. **15 remain empty**; each has a specific research result in PENDING.md. All 69 missing names from the incoming brief are accounted for.

Open [index.html](index.html) for the offline review gallery. It uses repository-relative public/people assets; the ZIP carries all 128 current WebPs in its people/ folder. No portrait is fetched at build time. Source links open only when clicked.

The source check establishes a named sitter plus relevant professional or historical context. Visual review compares age, hair, eyewear, facial hair, proportions, pose, clothing and readability. It is not automated face recognition or proof of a perfect likeness. Each record explains its limits; New drawings from small/soft references remain label-only, at 84×105. Other new exports are 600×750. Earlier assets retain their original 168×210 or 336×420 dimensions.

Source-photo publication rights for studies remain uncertain. New pose and clothing do not clear copyright. The user authorized collecting reference-only pictures and using studies with uncertain rights recorded. The old Walker after drawing stays held; the connected Walker is a new study. The uncertain Rivière after drawing stays held; its replacement is a study with the uncertainty retained. Existing Colvin and Brus rights decisions are unchanged.

The 1572 Galle engraving of Frisius is accepted under the user's latest instruction. The date remains in provenance without a new public UI note. The disputed Heemskerck painting and famous false Kepler portrait are excluded.

Files: [manifest.json](manifest.json) covers the 69 incoming cases; [inventory.json](inventory.json) covers all 143 names; [prompts.json](prompts.json) contains the exact selected prompt chains and input hashes; [CREDITS.md](CREDITS.md), [PENDING.md](PENDING.md), [STYLE.md](STYLE.md) and CHECKS.json contain review context. Built-in image_gen was used. No API/CLI generation.

The lean ZIP includes one export per connected person and this context. It excludes source photos, scanned PDFs, PNG masters, discarded iterations, software environments, models and cumulative earlier bundles. Those research materials remain privately available outside the repository. Redundant v5 review assets are superseded by this unified record, rather than duplicated in git.

Person names now link to 143 checked biographies, profiles or identifying records. The distinction is recorded in `src/data/person-links.ts` and the review bundle’s `person-links.json`; obscure patent authors are not presented as having a full biography. [Remaining identity evidence](IDENTITIES.md).

The incoming brief started with 74 portraits. Twelve accepted v5 portraits reached main during this work, so this branch adds 42 assets to the current 86; the complete set is 128. The gallery reviews the 69 incoming cases (54 selected, 15 pending). The ZIP also carries the 74 earlier portraits once each, plus `entries.json` for all 128 connections.
