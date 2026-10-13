# Marca: Pulso

El sistema se llama **Pulso**. El manual completo está en
[`Pulso-Manual-de-marca.pdf`](./Pulso-Manual-de-marca.pdf): logo y sus
versiones, área de respeto, usos incorrectos, paleta, contraste,
tipografía, estados, tokens, aplicaciones y tono de voz.

## Dónde vive cada cosa en el código

| Qué | Dónde |
|---|---|
| Colores, radio y fuentes (tokens) | `app/globals.css` (único lugar con colores escritos) |
| Carga de tipografías | `app/layout.tsx` (`next/font/google`) |
| Logo en la interfaz | `components/logo.tsx` → `<Logo />` |
| Favicon, ícono iOS, imagen para compartir | `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`, `app/opengraph-image.png` |
| Manifest e íconos de la PWA | `app/manifest.ts`, `public/icon-*.png` |
| Logo en SVG (README, presentaciones) | `public/brand/` |

## Paleta

| Token | HEX | Uso |
|---|---|---|
| `pulso-tinta` | `#0E1013` | Base de la marca, fondo oscuro |
| `pulso-lima` | `#C8F031` | Acento (~12 %): acción principal, estado activo |
| `pulso-grafito` | `#1C1F24` | Superficies oscuras |
| `pulso-niebla` | `#E9EBEE` | Superficies claras |
| `pulso-acero` | `#5B616B` | Texto secundario sobre claro (6,24:1) |
| `pulso-humo` | `#9AA1AB` | Texto secundario sobre oscuro (7,31:1) |
| `pulso-lima-texto` | `#4D6B00` | Acento como texto sobre claro (6,14:1) |
| `pulso-exito` / `pulso-alerta` / `pulso-error` / `pulso-info` | `#1F7A3A` / `#F5A524` / `#C3271C` / `#2563EB` | Estados |

**Nunca** como texto: lima sobre blanco (1,32:1) ni acero sobre tinta (3,05:1).

## Tipografía

Space Grotesk (títulos, 500/700) · Inter (texto e interfaz) · JetBrains Mono (códigos y horarios).

## Tono

Voseo, frases cortas, todo error dice qué hacer. Vacío y sin resultados llevan textos distintos.
