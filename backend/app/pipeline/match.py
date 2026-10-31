"""④ 미디어 매칭 보정 (코드)."""

from app.models import Asset, Scene


def assign_assets(scenes: list[Scene], assets: list[Asset]) -> list[Scene]:
    """assetId가 null이거나 없는 ID인 장면에 이미지를 원문 순서대로 돌아가며 배정한다(이미 쓴 이미지는 뒤로).

    블로그 이미지가 먼저, 그다음 업로드 이미지(재생성 때 업로드가 있을 수 있다). 이미지가 없으면 모두 null.
    """
    result = [scene.model_copy(deep=True) for scene in scenes]
    if not assets:
        for scene in result:
            scene.asset_id = None
        return result

    ordered = [asset for asset in assets if asset.origin == "blog"] + [a for a in assets if a.origin != "blog"]
    known = {asset.id for asset in ordered}
    use_count = {asset.id: 0 for asset in ordered}
    for scene in result:
        if scene.asset_id in known:
            use_count[scene.asset_id] += 1
        else:
            scene.asset_id = None
    for scene in result:
        if scene.asset_id is None:
            # min은 같은 값이면 앞의 것을 고르므로 원문 순서가 유지된다
            chosen = min(ordered, key=lambda asset: use_count[asset.id])
            scene.asset_id = chosen.id
            use_count[chosen.id] += 1
    return result


def needs_upload(assets: list[Asset]) -> bool:
    """계약 6-1: 블로그 이미지 0장."""
    return not any(asset.origin == "blog" for asset in assets)
