import { useParams } from 'react-router'
import { ProjectShell } from '../components/ProjectShell'

// F6·F7에서 채운다
export function ScenesPage() {
  const { id = '' } = useParams()
  return (
    <ProjectShell id={id} view="scenes">
      {(project) => (
        <>
          <h1 className="m-0 text-2xl font-bold">장면 편집</h1>
          <p className="text-muted">상태: {project.status}</p>
        </>
      )}
    </ProjectShell>
  )
}
