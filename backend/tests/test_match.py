from app.models import Asset, Scene
from app.pipeline import match


def _asset(asset_id: str, origin: str = "blog") -> Asset:
    return Asset(id=asset_id, origin=origin, url=f"/api/assets/{asset_id}", width=500, height=500)


def _scenes(*asset_ids: str | None) -> list[Scene]:
    return [
        Scene(id=f"s{i}", order=i, role="body", text="문구", asset_id=asset_id, motion="none",
              source_block_ids=["b1"], duration_sec=None, subtitles=[])
        for i, asset_id in enumerate(asset_ids, start=1)
    ]


def _ids(scenes: list[Scene]) -> list[str | None]:
    return [scene.asset_id for scene in scenes]


def test_no_images_all_null() -> None:
    assert _ids(match.assign_assets(_scenes("a1", None), [])) == [None, None]
    assert match.needs_upload([]) is True


def test_one_image_repeats() -> None:
    assert _ids(match.assign_assets(_scenes(None, None, None), [_asset("a1")])) == ["a1", "a1", "a1"]
    assert match.needs_upload([_asset("a1")]) is False


def test_fewer_images_than_scenes_cycles_in_order() -> None:
    assets = [_asset("a1"), _asset("a2")]
    assert _ids(match.assign_assets(_scenes(None, None, None, None), assets)) == ["a1", "a2", "a1", "a2"]


def test_keeps_valid_and_prefers_unused() -> None:
    assets = [_asset("a1"), _asset("a2"), _asset("a3")]
    assert _ids(match.assign_assets(_scenes("a1", None, "a99"), assets)) == ["a1", "a2", "a3"]


def test_upload_does_not_clear_needs_upload_but_is_assigned() -> None:
    assets = [_asset("u1", "upload")]
    assert _ids(match.assign_assets(_scenes(None), assets)) == ["u1"]
    assert match.needs_upload(assets) is True
