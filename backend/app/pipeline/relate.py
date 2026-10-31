"""② 이미지-문단 연결 (코드, LLM 안 씀)."""

from app.models import Block


def link_images(blocks: list[Block]) -> list[Block]:
    """각 image 블록의 linkedBlockIds = 바로 앞 문단 + 바로 뒤 문단. 바로 앞이 heading이면 heading도 넣는다."""
    result = [block.model_copy(deep=True) for block in blocks]
    for index, block in enumerate(result):
        if block.type != "image":
            continue
        before = result[:index]
        linked: list[str] = []
        previous_paragraph = next((item for item in reversed(before) if item.type == "paragraph"), None)
        if previous_paragraph is not None:
            linked.append(previous_paragraph.id)
        previous_text = next((item for item in reversed(before) if item.type != "image"), None)
        if previous_text is not None and previous_text.type == "heading":
            linked.append(previous_text.id)
        next_paragraph = next((item for item in result[index + 1:] if item.type == "paragraph"), None)
        if next_paragraph is not None:
            linked.append(next_paragraph.id)
        block.linked_block_ids = linked
    return result
