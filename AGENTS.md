# Project Rules: THE CHOSE (ONYX V2)

## Power Management (Energy Efficiency)
- **Camera Handling**: Always call `stopTracks()` on the MediaStream as soon as a capture or recording is finished. Never leave the camera sensor active during analysis results.
- **Animations**: Use hardware-accelerated CSS/Motion transforms only when visible. Avoid long-running background animations that consume CPU/GPU.
- **Analysis**: Dim the UI or use static placeholders during heavy processing to reduce display power.

## UI/UX Guidelines
- **Modern Aesthetic**: Maintain the "Luxury Technical" look (Black, White, Gold #c9964a).
- **Communication**: Never make significant UI or structural changes without explicit user confirmation ("ne change rien sans demander").
- **Persona Contextuelle (ONYX/ADAM)**: 
  - L'humour et le second degré sont autorisés **uniquement** dans les sections "Entraînement", "Challenges" et "Jeux".
  - Sur le "Parcours" (Mode Tactique), Adam doit rester strictement professionnel, vétéran, sage et chirurgical. Aucun humour n'est toléré lors des phases de jeu réelles.
