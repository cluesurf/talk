import LINT from '@cluesurf/wash/lint'

// `tmp/` is scratch and `host/` is build output; neither is in the
// type-checked program, so type-aware lint would fail to parse them.
export default [...LINT, { ignores: ['tmp/**', 'host/**'] }]
