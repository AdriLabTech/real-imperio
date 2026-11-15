/** Iconos de marca mínimos (lucide v1 ya no los incluye). Trazo simple, hereda currentColor. */
type P = { size?: number };
const base = (size = 28) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const Instagram = ({ size }: P) => (<svg {...base(size)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" /></svg>);
export const Youtube = ({ size }: P) => (<svg {...base(size)}><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" fill="currentColor" /></svg>);
export const Facebook = ({ size }: P) => (<svg {...base(size)}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8Z" /></svg>);
export const XIcon = ({ size }: P) => (<svg {...base(size)}><path d="M4 4l16 16M20 4 4 20" /></svg>);
export const TikTok = ({ size }: P) => (<svg {...base(size)}><path d="M14 3v12a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.4 2.6 2 4.2 5 4.5" /></svg>);
