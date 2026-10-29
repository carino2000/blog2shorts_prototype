import { useParams } from 'react-router'

// F6·F7에서 채운다
export function ScenesPage() {
  const { id } = useParams()
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12">
      <h1 className="text-2xl font-bold">장면 편집</h1>
      <p className="text-muted">작업 {id}</p>
    </main>
  )
}
