import type { VariantScreens } from '../registry'
import { loadFonts } from '../shared/fonts'
import './broadcast.css'
import { Input } from './Input'
import { Processing } from './Processing'
import { Result } from './Result'
import { Scenes } from './Scenes'
import { Script } from './Script'

loadFonts('Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600')

const screens: VariantScreens = { input: Input, processing: Processing, script: Script, scenes: Scenes, result: Result }
export default screens
