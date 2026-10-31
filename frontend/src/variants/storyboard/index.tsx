import type { VariantScreens } from '../registry'
import { loadFonts } from '../shared/fonts'
import './storyboard.css'
import { Input } from './Input'
import { Processing } from './Processing'
import { Result } from './Result'
import { Scenes } from './Scenes'
import { Script } from './Script'

loadFonts('Nanum+Pen+Script')

const screens: VariantScreens = { input: Input, processing: Processing, script: Script, scenes: Scenes, result: Result }
export default screens
