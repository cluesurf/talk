export type TextList = Record<string, string>

export const m: { d: TextList; u: TextList } = {
  u: {
    grave: '\u0300',
    acute: '\u0301',
    dacute: '\u030B',
    dgrave: '\u030F',
    up: '\u0302',
    down: '\u030C',
    dot: '\u0307',
    ddot: '\u0308',
    ring: '\u030A',
    tilde: '\u0303',
    macron: '\u0304',
    hook: '\u0309',
  },
  d: {
    grave: '\u0316',
    acute: '\u0317',
    ring: '\u0325',
    dot: '\u0323',
    ddot: '\u0324',
    down: '\u032C',
    tilde: '\u0330',
    macron: '\u0331',
    cedilla: '\u0327',
    up: '\u032D',
    hook: '\u0328',
  },
}
