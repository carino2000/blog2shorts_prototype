import type { VariantScreens } from '../registry'
import { loadFonts } from '../shared/fonts'
import './cinema.css'
import { Input } from './Input'
import { Processing } from './Processing'
import { Result } from './Result'
import { Scenes } from './Scenes'
import { Script } from './Script'

loadFonts('Gowun+Batang:wght@400;700')

const screens: VariantScreens = { input: Input, processing: Processing, script: Script, scenes: Scenes, result: Result }
export default screens
