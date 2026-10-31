// base 시안 = 지금 화면 그대로
import { InputPage } from '../pages/InputPage'
import { ProjectPage } from '../pages/ProjectPage'
import { ResultPage } from '../pages/ResultPage'
import { ScenesPage } from '../pages/ScenesPage'
import { ScriptPage } from '../pages/ScriptPage'
import type { VariantScreens } from './registry'

export const BASE_SCREENS: VariantScreens = {
  input: InputPage,
  processing: ProjectPage,
  script: ScriptPage,
  scenes: ScenesPage,
  result: ResultPage,
}
