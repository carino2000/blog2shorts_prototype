import { Link, type LinkProps } from 'react-router'
import { useVariantTo } from '../useVariant'

/** 이동하면서 ?v=시안id를 지키는 Link. 시안 화면의 모든 링크는 이것을 쓴다 */
export function VLink({ to, ...props }: Omit<LinkProps, 'to'> & { to: string }) {
  const vto = useVariantTo()
  return <Link to={vto(to)} {...props} />
}
