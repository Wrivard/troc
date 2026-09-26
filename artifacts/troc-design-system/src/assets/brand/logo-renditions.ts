import dark300 from './troc-dark-300.webp';
import light300 from './troc-light-300.webp';
import darkFull from './troc-dark.webp';
import dark600 from './troc-dark-600.webp';
import dark1200 from './troc-dark-1200.webp';
import lightFull from './troc-light.webp';
import light600 from './troc-light-600.webp';
import light1200 from './troc-light-1200.webp';
import monoFull from './troc-mono.webp';
import mono600 from './troc-mono-600.webp';
import mono1200 from './troc-mono-1200.webp';
import wordmarkFull from './troc-wordmark.webp';
import wordmark600 from './troc-wordmark-600.webp';
import wordmark1200 from './troc-wordmark-1200.webp';
import leafFull from './troc-leaf.webp';
import leaf96 from './troc-leaf-96.webp';
import leaf192 from './troc-leaf-192.webp';

// Lossless encodes/resizes of supplied artwork; PNG originals preserved.
export const logoRenditions = {
dark: {src: darkFull, srcSet: `${dark300} 300w, ${dark600} 600w, ${dark1200} 1200w, ${darkFull} 1976w`, ratio: 1976/372},
light: {src: lightFull, srcSet: `${light300} 300w, ${light600} 600w, ${light1200} 1200w, ${lightFull} 1976w`, ratio: 1976/372},
mono: {src: monoFull, srcSet: `${mono600} 600w, ${mono1200} 1200w, ${monoFull} 1976w`, ratio: 1976/372},
wordmark: {src: wordmarkFull, srcSet: `${wordmark600} 600w, ${wordmark1200} 1200w, ${wordmarkFull} 1630w`, ratio: 1630/338},
leaf: {src: leafFull, srcSet: `${leaf96} 96w, ${leaf192} 192w, ${leafFull} 372w`, ratio: 372/370}
};
