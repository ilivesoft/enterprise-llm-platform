from pydantic import BaseModel


class PlaygroundMessage(BaseModel):
    role: str
    content: str


class PlaygroundRequest(BaseModel):
    model_id: str
    system_prompt: str = ""
    messages: list[PlaygroundMessage]
    temperature: float = 0.7
    max_tokens: int = 1024
    top_p: float = 1.0
