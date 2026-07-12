// The committed data, typed. This is the only place the JSON is loaded.

import MACHINE from './base/machine.json'
import MODIFIERS from './base/modifiers.json'
import PHONES from './base/phones.json'
import type { MachineEntry, Modifier, Phone } from './type'

export const phones = PHONES as Phone[]
export const modifiers = MODIFIERS as Modifier[]
export const machineEntries = MACHINE as MachineEntry[]
