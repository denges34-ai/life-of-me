import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Génère toutes les icônes (Android, iPhone, favicon) à partir de public/logo.svg.
// Le logo est déjà un carré plein avec sa marge de sécurité : on n'ajoute donc aucun bord.
export default defineConfig({
  preset: {
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/logo.svg'],
})
