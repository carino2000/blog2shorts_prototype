import type { VariantScreens } from '../registry'
import { loadFonts } from '../shared/fonts'
import './zine.css'
import { Input } from './Input'
import { Processing } from './Processing'
import { Result } from './Result'
import { Scenes } from './Scenes'
import { Script } from './Script'

loadFonts('Do+Hyeon')

const screens: VariantScreens = { input: Input, processing: Processing, script: Script, scenes: Scenes, result: Result }
export default screens
