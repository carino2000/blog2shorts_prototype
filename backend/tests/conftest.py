import pytest


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line("markers", "external: 실제 외부 API를 부르는 테스트(비용 발생). `-m external`로만 실행")


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    # -m 으로 external을 직접 고르지 않으면 건너뛴다(예산 보호)
    if "external" in (config.option.markexpr or ""):
        return
    skip = pytest.mark.skip(reason="external 테스트는 `pytest -m external`로만 실행")
    for item in items:
        if "external" in item.keywords:
            item.add_marker(skip)
