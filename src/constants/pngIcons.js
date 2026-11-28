// Respect the Vite base path when loading local PNG assets.
export const pngIconUrl = (name) => `${import.meta.env?.BASE_URL ?? '/'}icons/3d/${name}.png`
