import re
import unicodedata


class TextCleaner:
    """Cleans raw text extracted from documents."""

    def clean(self, text: str) -> str:
        """Runs the full cleaning pipeline in order."""
        if not text:
            return text

        text = self._remove_control_chars(text)
        text = self._fix_encoding(text)
        text = self._filter_noise(text)
        text = self._normalize_whitespace(text)
        return text

    def _remove_control_chars(self, text: str) -> str:
        """Removes non-printable control characters (keeps tab, newline, carriage return)."""
        allowed = {"\t", "\n", "\r"}
        result = []
        for ch in text:
            cat = unicodedata.category(ch)
            if cat.startswith("C") and ch not in allowed:
                continue
            result.append(ch)
        return "".join(result)

    def _normalize_whitespace(self, text: str) -> str:
        """Normalizes whitespace.

        - Strips trailing spaces from each line
        - Collapses consecutive spaces/tabs to a single space
        - Limits consecutive newlines to two
        """
        lines = [line.rstrip() for line in text.split("\n")]
        text = "\n".join(lines)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def _fix_encoding(self, text: str) -> str:
        """Removes broken UTF-8 replacement characters."""
        return text.replace("�", "")

    def _filter_noise(self, text: str) -> str:
        """Removes repeated-symbol noise patterns."""
        # Remove 5+ consecutive identical special characters
        text = re.sub(r"([^\w\s])\1{4,}", "", text)
        # Remove 5+ consecutive identical separator characters (e.g. =====)
        text = re.sub(r"([=\-_\*~#]){5,}", "", text)
        return text
