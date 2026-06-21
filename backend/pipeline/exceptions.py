class UnsupportedFileTypeError(ValueError):
    """Unsupported file format error"""
    pass


class EmptyFileError(ValueError):
    """Empty file or no extractable text error"""
    pass


class LLMConnectionError(ConnectionError):
    """LLM service connection failure error"""
    pass
