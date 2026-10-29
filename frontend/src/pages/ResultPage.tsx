import { useParams } from 'react-router'

// F8에서 채운다
export function ResultPage() {
  const { id } = useParams()
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-12">
      <h1 className="text-2xl font-bold">영상</h1>
      <p className="text-muted">작업 {id}</p>
    </main>
  )
}
