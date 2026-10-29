import { useParams } from 'react-router'

// F4에서 status에 따라 처리 중/대본/장면/결과로 분기한다
export function ProjectPage() {
  const { id } = useParams()
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12">
      <h1 className="text-2xl font-bold">처리 중</h1>
      <p className="text-muted">작업 {id}</p>
    </main>
  )
}
