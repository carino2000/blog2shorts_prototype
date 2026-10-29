import { useParams } from 'react-router'
import { ProjectShell } from '../components/ProjectShell'

// F5에서 채운다
export function ScriptPage() {
  const { id = '' } = useParams()
  return (
    <ProjectShell id={id} view="script">
      {(project) => (
        <>
          <h1 className="m-0 text-2xl font-bold">대본 확인</h1>
          <p className="text-muted">상태: {project.status}</p>
        </>
      )}
    </ProjectShell>
  )
}
