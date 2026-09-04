# UI Asset Manifest

Date: 2026-09-02

## Required Brand Assets

| Asset | Use | Source | Notes |
| --- | --- | --- | --- |
| `public/kk_logo.png` | Primary KK Sports logo inside the app shell and auth/system states | Existing local project asset | Used through `components/brand-mark.tsx`; no hotlinking. |
| `public/kk_logo_white_bg.png` | Browser icon and fallback white-background logo treatment | Existing local project asset | Referenced from `app/layout.tsx` metadata. |
| `public/kk-operations-login-source.png` | Generated source image for the sign-in hero | Created with the built-in image generation tool | Kept as the auditable source image. |
| `public/kk-operations-login.jpg` | Optimized production sign-in hero | Derived locally from `public/kk-operations-login-source.png` via `scripts/optimize-login-image.js` | 1568x1003 JPEG for responsive auth layout. |

## Generated Login Image Direction

The sign-in visual is newly generated. It is not hotlinked from the KK Sports storefront CDN.

Generation prompt:

```text
Use case: photorealistic-natural
Asset type: full-bleed sign-in page hero for the KK Sports internal operations portal
Primary request: Create a premium editorial photograph inside a modern Pakistani sports retail stockroom and showroom. A professional store staff member in simple black athletic workwear is checking inventory on a tablet beside neatly arranged cricket bats, cricket balls, badminton and padel rackets, footballs, boxing gloves, running shoes, and compact fitness equipment.
Scene/backdrop: sophisticated real sports retail environment, organized shelves and equipment wall, authentic operational setting rather than a glossy advertisement
Style/medium: realistic commercial editorial photography, natural skin and materials, high-end but believable
Composition/framing: wide 16:10 landscape; main person and strongest equipment grouping on the right half; generous darker negative space on the left for interface copy; scene remains useful when cropped to a tall desktop panel and a shallow mobile masthead
Lighting/mood: controlled natural directional light, confident and professional, crisp detail, subtle depth
Color palette: charcoal black, clean white, restrained warm gold details, small muted teal accents
Constraints: no text, no letters, no numbers, no watermark, no visible brand marks, no third-party logos, no distorted equipment, no dramatic smoke, no neon, no gradient background, no staged victory pose
```

Optimization command:

```bash
node scripts/optimize-login-image.js
```

## Asset Rules For Later Phases

- Do not hotlink storefront product/category images.
- Store any generated or approved product-supporting imagery under `public/` and document it here.
- Use `BrandMark` for portal branding instead of ad hoc logo/image markup.
- Keep product photos inside fixed-ratio containers so page density and scroll position do not shift while images load.

